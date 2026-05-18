import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBaselineDto } from './dto/create-baseline.dto';
import { UpdateBaselineDto } from './dto/update-baseline.dto';

@Injectable()
export class SchedulesService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  async createBaseline(dto: CreateBaselineDto, userId?: number) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const tasks = await this.db.task.findMany({
      where: { projectId: dto.projectId },
    });

    if (tasks.length === 0) {
      throw new BadRequestException('Cannot create baseline without tasks');
    }

    const baseline = await this.db.scheduleBaseline.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        version: dto.version,
        description: dto.description ?? null,
        status: 'DRAFT',
        items: {
          create: tasks.map((task: any) => ({
            taskId: task.id,
            plannedStart: task.plannedStart,
            plannedEnd: task.plannedEnd,
            durationDays: task.durationDays,
          })),
        },
      },
      include: {
        project: true,
        items: {
          include: {
            task: true,
          },
        },
      },
    });

    await this.auditService.create({
      userId,
      projectId: baseline.projectId,
      action: AuditAction.CREATE,
      module: 'schedules',
      entityName: 'ScheduleBaseline',
      entityId: String(baseline.id),
      description: `Created schedule baseline ${baseline.version}`,
      newData: baseline,
    });

    return baseline;
  }

  findByProject(projectId: number) {
    return this.db.scheduleBaseline.findMany({
      where: { projectId },
      include: {
        items: {
          include: {
            task: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
                plannedStart: true,
                plannedEnd: true,
                actualStart: true,
                actualEnd: true,
                progress: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const baseline = await this.db.scheduleBaseline.findUnique({
      where: { id },
      include: {
        project: true,
        items: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!baseline) {
      throw new NotFoundException('Schedule baseline not found');
    }

    return baseline;
  }

  async updateBaseline(id: number, dto: UpdateBaselineDto, userId?: number) {
    const oldBaseline = await this.findOne(id);

    if (oldBaseline.status === 'APPROVED') {
      throw new BadRequestException('Approved baseline cannot be edited');
    }

    const updated = await this.db.scheduleBaseline.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        name: dto.name,
        version: dto.version,
        description: dto.description,
      },
      include: {
        items: true,
      },
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'schedules',
      entityName: 'ScheduleBaseline',
      entityId: String(id),
      description: `Updated schedule baseline ${updated.version}`,
      oldData: oldBaseline,
      newData: updated,
    });

    return updated;
  }

  async approveBaseline(id: number, userId?: number) {
    const oldBaseline = await this.findOne(id);

    await this.db.scheduleBaseline.updateMany({
      where: {
        projectId: oldBaseline.projectId,
        status: 'APPROVED',
      },
      data: {
        status: 'SUPERSEDED',
      },
    });

    const approved = await this.db.scheduleBaseline.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
      include: {
        items: {
          include: {
            task: true,
          },
        },
      },
    });

    await this.auditService.create({
      userId,
      projectId: approved.projectId,
      action: AuditAction.APPROVE,
      module: 'schedules',
      entityName: 'ScheduleBaseline',
      entityId: String(id),
      description: `Approved schedule baseline ${approved.version}`,
      oldData: oldBaseline,
      newData: approved,
    });

    return approved;
  }

  async removeBaseline(id: number, userId?: number) {
    const oldBaseline = await this.findOne(id);

    if (oldBaseline.status === 'APPROVED') {
      throw new BadRequestException('Approved baseline cannot be deleted');
    }

    const deleted = await this.db.scheduleBaseline.delete({
      where: { id },
    });

    await this.auditService.create({
      userId,
      projectId: oldBaseline.projectId,
      action: AuditAction.DELETE,
      module: 'schedules',
      entityName: 'ScheduleBaseline',
      entityId: String(id),
      description: `Deleted schedule baseline ${oldBaseline.version}`,
      oldData: oldBaseline,
      newData: deleted,
    });

    return deleted;
  }
}