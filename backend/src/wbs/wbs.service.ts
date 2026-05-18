import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWbsItemDto } from './dto/create-wbs-item.dto';
import { UpdateWbsItemDto } from './dto/update-wbs-item.dto';

@Injectable()
export class WbsService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  async create(dto: CreateWbsItemDto, userId?: number) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.parentId) {
      const parent = await this.db.wbsItem.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.projectId !== dto.projectId) {
        throw new BadRequestException('Invalid parent WBS item');
      }
    }

    const wbsItem = await this.db.wbsItem.create({
      data: {
        projectId: dto.projectId,
        parentId: dto.parentId ?? null,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: this.wbsInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: dto.projectId,
      action: AuditAction.CREATE,
      module: 'wbs',
      entityName: 'WbsItem',
      entityId: String(wbsItem.id),
      description: `Created WBS item ${wbsItem.code} - ${wbsItem.name}`,
      newData: wbsItem,
    });

    return wbsItem;
  }

  findByProject(projectId: number) {
    return this.db.wbsItem.findMany({
      where: { projectId },
      include: this.wbsInclude(),
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: number) {
    const wbsItem = await this.db.wbsItem.findUnique({
      where: { id },
      include: {
        project: true,
        parent: true,
        children: true,
        tasks: true,
      },
    });

    if (!wbsItem) {
      throw new NotFoundException('WBS item not found');
    }

    return wbsItem;
  }

  async update(id: number, dto: UpdateWbsItemDto, userId?: number) {
    const oldWbsItem = await this.findOne(id);

    const projectId = dto.projectId ?? oldWbsItem.projectId;

    if (dto.projectId) {
      const project = await this.db.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('WBS item cannot be its own parent');
      }

      const parent = await this.db.wbsItem.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.projectId !== projectId) {
        throw new BadRequestException('Invalid parent WBS item');
      }
    }

    const updatedWbsItem = await this.db.wbsItem.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        parentId: dto.parentId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder,
      },
      include: this.wbsInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updatedWbsItem.projectId,
      action: AuditAction.UPDATE,
      module: 'wbs',
      entityName: 'WbsItem',
      entityId: String(id),
      description: `Updated WBS item ${updatedWbsItem.code} - ${updatedWbsItem.name}`,
      oldData: oldWbsItem,
      newData: updatedWbsItem,
    });

    return updatedWbsItem;
  }

  async remove(id: number, userId?: number) {
    const oldWbsItem = await this.findOne(id);

    const childCount = await this.db.wbsItem.count({
      where: { parentId: id },
    });

    if (childCount > 0) {
      throw new BadRequestException(
        'Cannot delete WBS item with child WBS items',
      );
    }

    const taskCount = await this.db.task.count({
      where: { wbsItemId: id },
    });

    if (taskCount > 0) {
      throw new BadRequestException('Cannot delete WBS item with linked tasks');
    }

    const deleted = await this.db.wbsItem.delete({
      where: { id },
    });

    await this.auditService.create({
      userId,
      projectId: oldWbsItem.projectId,
      action: AuditAction.DELETE,
      module: 'wbs',
      entityName: 'WbsItem',
      entityId: String(id),
      description: `Deleted WBS item ${oldWbsItem.code} - ${oldWbsItem.name}`,
      oldData: oldWbsItem,
      newData: deleted,
    });

    return deleted;
  }

  private wbsInclude() {
    return {
      parent: true,
      children: true,
      tasks: true,
    };
  }
}