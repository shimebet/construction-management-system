import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  async create(dto: CreateMilestoneDto, userId?: number) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const milestone = await this.db.milestone.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        plannedDate: new Date(dto.plannedDate),
        actualDate: dto.actualDate ? new Date(dto.actualDate) : null,
        status: dto.status ?? 'PLANNED',
      },
      include: {
        project: true,
      },
    });

    await this.auditService.create({
      userId,
      projectId: milestone.projectId,
      action: AuditAction.CREATE,
      module: 'milestones',
      entityName: 'Milestone',
      entityId: String(milestone.id),
      description: `Created milestone ${milestone.code} - ${milestone.name}`,
      newData: milestone,
    });

    return milestone;
  }

  findByProject(projectId: number) {
    return this.db.milestone.findMany({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        plannedDate: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const milestone = await this.db.milestone.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return milestone;
  }

  async update(id: number, dto: UpdateMilestoneDto, userId?: number) {
    const oldMilestone = await this.findOne(id);

    if (dto.projectId) {
      const project = await this.db.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const updatedMilestone = await this.db.milestone.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        actualDate: dto.actualDate ? new Date(dto.actualDate) : undefined,
        status: dto.status,
      },
      include: {
        project: true,
      },
    });

    await this.auditService.create({
      userId,
      projectId: updatedMilestone.projectId,
      action: AuditAction.UPDATE,
      module: 'milestones',
      entityName: 'Milestone',
      entityId: String(id),
      description: `Updated milestone ${updatedMilestone.code} - ${updatedMilestone.name}`,
      oldData: oldMilestone,
      newData: updatedMilestone,
    });

    return updatedMilestone;
  }

  async remove(id: number, userId?: number) {
    const oldMilestone = await this.findOne(id);

    const cancelledMilestone = await this.db.milestone.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        project: true,
      },
    });

    await this.auditService.create({
      userId,
      projectId: oldMilestone.projectId,
      action: AuditAction.DELETE,
      module: 'milestones',
      entityName: 'Milestone',
      entityId: String(id),
      description: `Cancelled milestone ${oldMilestone.code} - ${oldMilestone.name}`,
      oldData: oldMilestone,
      newData: cancelledMilestone,
    });

    return cancelledMilestone;
  }
}