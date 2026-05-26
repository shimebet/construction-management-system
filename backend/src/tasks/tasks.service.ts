import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateTaskDto, userId?: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.validateTaskRelations(dto.projectId, {
      wbsItemId: dto.wbsItemId,
      parentTaskId: dto.parentTaskId,
      assignedToId: dto.assignedToId,
    });

    const task = await this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        wbsItemId: dto.wbsItemId ?? null,
        parentTaskId: dto.parentTaskId ?? null,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? 'NOT_STARTED',
        priority: dto.priority ?? 'MEDIUM',
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : null,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : null,
        actualStart: dto.actualStart ? new Date(dto.actualStart) : null,
        actualEnd: dto.actualEnd ? new Date(dto.actualEnd) : null,
        durationDays: dto.durationDays ?? null,
        progress: dto.progress ?? 0,
        assignedToId: dto.assignedToId ?? null,
        isActive: true,
      },
      include: this.taskInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: task.projectId,
      action: AuditAction.CREATE,
      module: 'tasks',
      entityName: 'Task',
      entityId: String(task.id),
      description: `Created task ${task.code} - ${task.name}`,
      newData: task,
    });

    return task;
  }

  findByProject(projectId: number) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: this.taskInclude(),
      orderBy: [{ plannedStart: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: this.taskInclude(),
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: number, dto: UpdateTaskDto, userId?: number) {
    const oldTask = await this.findOne(id);
    const projectId = dto.projectId ?? oldTask.projectId;

    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    await this.validateTaskRelations(projectId, {
      taskId: id,
      wbsItemId: dto.wbsItemId,
      parentTaskId: dto.parentTaskId,
      assignedToId: dto.assignedToId,
    });

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        wbsItemId: dto.wbsItemId,
        parentTaskId: dto.parentTaskId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
        actualStart: dto.actualStart ? new Date(dto.actualStart) : undefined,
        actualEnd: dto.actualEnd ? new Date(dto.actualEnd) : undefined,
        durationDays: dto.durationDays,
        progress: dto.progress,
        assignedToId: dto.assignedToId,
      },
      include: this.taskInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updatedTask.projectId,
      action: AuditAction.UPDATE,
      module: 'tasks',
      entityName: 'Task',
      entityId: String(id),
      description: `Updated task ${updatedTask.code} - ${updatedTask.name}`,
      oldData: oldTask,
      newData: updatedTask,
    });

    return updatedTask;
  }

  async remove(id: number, userId?: number) {
    const oldTask = await this.findOne(id);

    const deactivatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        isActive: false,
        status: 'CANCELLED',
      },
      include: this.taskInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: oldTask.projectId,
      action: AuditAction.DELETE,
      module: 'tasks',
      entityName: 'Task',
      entityId: String(id),
      description: `Deactivated task ${oldTask.code} - ${oldTask.name}`,
      oldData: oldTask,
      newData: deactivatedTask,
    });

    return deactivatedTask;
  }

  async activate(id: number, userId?: number) {
    const oldTask = await this.findOne(id);

    const activatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        isActive: true,
        status: 'NOT_STARTED',
      },
      include: this.taskInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: oldTask.projectId,
      action: AuditAction.UPDATE,
      module: 'tasks',
      entityName: 'Task',
      entityId: String(id),
      description: `Activated task ${oldTask.code} - ${oldTask.name}`,
      oldData: oldTask,
      newData: activatedTask,
    });

    return activatedTask;
  }

  async createDependency(dto: CreateTaskDependencyDto, userId?: number) {
    if (dto.predecessorId === dto.successorId) {
      throw new BadRequestException('Task cannot depend on itself');
    }

    const predecessor = await this.prisma.task.findUnique({
      where: { id: dto.predecessorId },
    });

    const successor = await this.prisma.task.findUnique({
      where: { id: dto.successorId },
    });

    if (!predecessor || !successor) {
      throw new NotFoundException('Predecessor or successor task not found');
    }

    if (predecessor.projectId !== successor.projectId) {
      throw new BadRequestException('Tasks must belong to the same project');
    }

    const dependency = await this.prisma.taskDependency.create({
      data: {
        predecessorId: dto.predecessorId,
        successorId: dto.successorId,
        type: dto.type ?? 'FINISH_TO_START',
        lagDays: dto.lagDays ?? 0,
      },
      include: {
        predecessor: true,
        successor: true,
      },
    });

    await this.auditService.create({
      userId,
      projectId: predecessor.projectId,
      action: AuditAction.CREATE,
      module: 'tasks',
      entityName: 'TaskDependency',
      entityId: String(dependency.id),
      description: `Created dependency ${predecessor.code} -> ${successor.code}`,
      newData: dependency,
    });

    return dependency;
  }

  async removeDependency(id: number, userId?: number) {
    const dependency = await this.prisma.taskDependency.findUnique({
      where: { id },
      include: {
        predecessor: true,
        successor: true,
      },
    });

    if (!dependency) {
      throw new NotFoundException('Task dependency not found');
    }

    const deleted = await this.prisma.taskDependency.delete({
      where: { id },
    });

    await this.auditService.create({
      userId,
      projectId: dependency.predecessor.projectId,
      action: AuditAction.DELETE,
      module: 'tasks',
      entityName: 'TaskDependency',
      entityId: String(id),
      description: `Deleted dependency ${dependency.predecessor.code} -> ${dependency.successor.code}`,
      oldData: dependency,
      newData: deleted,
    });

    return deleted;
  }

  private async validateTaskRelations(
    projectId: number,
    options: {
      taskId?: number;
      wbsItemId?: number;
      parentTaskId?: number;
      assignedToId?: number;
    },
  ) {
    if (options.wbsItemId) {
      const wbs = await this.prisma.wbsItem.findUnique({
        where: { id: options.wbsItemId },
      });

      if (!wbs || wbs.projectId !== projectId) {
        throw new BadRequestException('Invalid WBS item for this project');
      }
    }

    if (options.parentTaskId) {
      if (options.taskId && options.parentTaskId === options.taskId) {
        throw new BadRequestException('Task cannot be its own parent');
      }

      const parentTask = await this.prisma.task.findUnique({
        where: { id: options.parentTaskId },
      });

      if (!parentTask || parentTask.projectId !== projectId) {
        throw new BadRequestException('Invalid parent task for this project');
      }
    }

    if (options.assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: options.assignedToId },
      });

      if (!user) {
        throw new NotFoundException('Assigned user not found');
      }
    }
  }

  private taskInclude() {
    return {
      project: true,
      wbsItem: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
        },
      },
      parentTask: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      subtasks: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          progress: true,
        },
      },
      predecessors: {
        include: {
          predecessor: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      successors: {
        include: {
          successor: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    };
  }
}