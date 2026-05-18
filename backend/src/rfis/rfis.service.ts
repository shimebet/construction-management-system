import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { RespondRfiDto } from './dto/respond-rfi.dto';
import { UpdateRfiDto } from './dto/update-rfi.dto';

@Injectable()
export class RfisService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  async create(dto: CreateRfiDto, userId?: number) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.assignedToId) {
      const user = await this.db.user.findUnique({
        where: { id: dto.assignedToId },
      });

      if (!user) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    const rfi = await this.db.rfi.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        question: dto.question,
        status: dto.status ?? 'OPEN',
        priority: dto.priority ?? 'MEDIUM',
        assignedToId: dto.assignedToId ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: userId ?? null,
      },
      include: this.rfiInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: rfi.projectId,
      action: AuditAction.CREATE,
      module: 'rfis',
      entityName: 'RFI',
      entityId: String(rfi.id),
      description: `Created RFI ${rfi.code}`,
      newData: rfi,
    });

    return rfi;
  }

  findByProject(projectId: number) {
    return this.db.rfi.findMany({
      where: { projectId },
      include: this.rfiInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const rfi = await this.db.rfi.findUnique({
      where: { id },
      include: this.rfiInclude(),
    });

    if (!rfi) {
      throw new NotFoundException('RFI not found');
    }

    return rfi;
  }

  async update(id: number, dto: UpdateRfiDto, userId?: number) {
    const oldRfi = await this.findOne(id);

    const updated = await this.db.rfi.update({
      where: { id },
      data: {
        code: dto.code,
        title: dto.title,
        question: dto.question,
        priority: dto.priority,
        status: dto.status,
        assignedToId: dto.assignedToId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: this.rfiInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'rfis',
      entityName: 'RFI',
      entityId: String(id),
      description: `Updated RFI ${updated.code}`,
      oldData: oldRfi,
      newData: updated,
    });

    return updated;
  }

  async respond(id: number, dto: RespondRfiDto, userId?: number) {
    const oldRfi = await this.findOne(id);

    if (
      oldRfi.status === 'CLOSED' ||
      oldRfi.status === 'REJECTED'
    ) {
      throw new BadRequestException(
        'Cannot respond to closed/rejected RFI',
      );
    }

    const updated = await this.db.rfi.update({
      where: { id },
      data: {
        response: dto.response,
        answeredAt: new Date(),
        status: dto.status ?? 'ANSWERED',
      },
      include: this.rfiInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'rfis',
      entityName: 'RFI',
      entityId: String(id),
      description: `Responded to RFI ${updated.code}`,
      oldData: oldRfi,
      newData: updated,
    });

    return updated;
  }

  async close(id: number, userId?: number) {
    const oldRfi = await this.findOne(id);

    const updated = await this.db.rfi.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
      include: this.rfiInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'rfis',
      entityName: 'RFI',
      entityId: String(id),
      description: `Closed RFI ${updated.code}`,
      oldData: oldRfi,
      newData: updated,
    });

    return updated;
  }

  private rfiInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
        },
      },

      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
        },
      },
    };
  }
}