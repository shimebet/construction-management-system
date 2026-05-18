import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { CreateNcrDto } from './dto/create-ncr.dto';
import { UpdateNcrDto } from './dto/update-ncr.dto';

@Injectable()
export class QualityService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  private async ensureProject(projectId: number) {
    const project = await this.db.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async createChecklist(dto: CreateChecklistDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    const checklist = await this.db.qualityChecklist.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description ?? null,
        items: dto.items ?? [],
      },
      include: { project: true, inspections: true },
    });

    await this.auditService.create({
      userId,
      projectId: checklist.projectId,
      action: AuditAction.CREATE,
      module: 'quality',
      entityName: 'QualityChecklist',
      entityId: String(checklist.id),
      description: `Created quality checklist ${checklist.code}`,
      newData: checklist,
    });

    return checklist;
  }

  findChecklists(projectId: number) {
    return this.db.qualityChecklist.findMany({
      where: { projectId },
      include: { inspections: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateChecklist(id: number, dto: UpdateChecklistDto, userId?: number) {
    const oldChecklist = await this.db.qualityChecklist.findUnique({ where: { id } });
    if (!oldChecklist) throw new NotFoundException('Quality checklist not found');

    const updated = await this.db.qualityChecklist.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        items: dto.items,
      },
      include: { project: true, inspections: true },
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'quality',
      entityName: 'QualityChecklist',
      entityId: String(id),
      description: `Updated quality checklist ${updated.code}`,
      oldData: oldChecklist,
      newData: updated,
    });

    return updated;
  }

  async createInspection(dto: CreateInspectionDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    if (dto.checklistId) {
      const checklist = await this.db.qualityChecklist.findUnique({
        where: { id: dto.checklistId },
      });

      if (!checklist || checklist.projectId !== dto.projectId) {
        throw new BadRequestException('Invalid checklist for this project');
      }
    }

    if (dto.inspectorId) {
      const user = await this.db.user.findUnique({ where: { id: dto.inspectorId } });
      if (!user) throw new NotFoundException('Inspector not found');
    }

    const inspection = await this.db.inspection.create({
      data: {
        projectId: dto.projectId,
        checklistId: dto.checklistId ?? null,
        code: dto.code,
        title: dto.title,
        location: dto.location ?? null,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : null,
        status: dto.status ?? 'PLANNED',
        result: dto.result ?? null,
        createdById: userId ?? null,
        inspectorId: dto.inspectorId ?? null,
      },
      include: this.inspectionInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: inspection.projectId,
      action: AuditAction.CREATE,
      module: 'quality',
      entityName: 'Inspection',
      entityId: String(inspection.id),
      description: `Created inspection ${inspection.code}`,
      newData: inspection,
    });

    return inspection;
  }

  findInspections(projectId: number) {
    return this.db.inspection.findMany({
      where: { projectId },
      include: this.inspectionInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateInspection(id: number, dto: UpdateInspectionDto, userId?: number) {
    const oldInspection = await this.db.inspection.findUnique({
      where: { id },
      include: this.inspectionInclude(),
    });

    if (!oldInspection) throw new NotFoundException('Inspection not found');

    const updated = await this.db.inspection.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        checklistId: dto.checklistId,
        code: dto.code,
        title: dto.title,
        location: dto.location,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : undefined,
        status: dto.status,
        result: dto.result,
        inspectorId: dto.inspectorId,
      },
      include: this.inspectionInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'quality',
      entityName: 'Inspection',
      entityId: String(id),
      description: `Updated inspection ${updated.code}`,
      oldData: oldInspection,
      newData: updated,
    });

    return updated;
  }

  async createNcr(dto: CreateNcrDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    if (dto.assignedToId) {
      const user = await this.db.user.findUnique({ where: { id: dto.assignedToId } });
      if (!user) throw new NotFoundException('Assigned user not found');
    }

    const ncr = await this.db.ncrReport.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? 'OPEN',
        correctiveAction: dto.correctiveAction ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: userId ?? null,
        assignedToId: dto.assignedToId ?? null,
      },
      include: this.ncrInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: ncr.projectId,
      action: AuditAction.CREATE,
      module: 'quality',
      entityName: 'NcrReport',
      entityId: String(ncr.id),
      description: `Created NCR ${ncr.code}`,
      newData: ncr,
    });

    return ncr;
  }

  findNcrs(projectId: number) {
    return this.db.ncrReport.findMany({
      where: { projectId },
      include: this.ncrInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateNcr(id: number, dto: UpdateNcrDto, userId?: number) {
    const oldNcr = await this.db.ncrReport.findUnique({
      where: { id },
      include: this.ncrInclude(),
    });

    if (!oldNcr) throw new NotFoundException('NCR not found');

    const updated = await this.db.ncrReport.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        correctiveAction: dto.correctiveAction,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        closedAt: dto.status === 'CLOSED' ? new Date() : undefined,
        assignedToId: dto.assignedToId,
      },
      include: this.ncrInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'quality',
      entityName: 'NcrReport',
      entityId: String(id),
      description: `Updated NCR ${updated.code}`,
      oldData: oldNcr,
      newData: updated,
    });

    return updated;
  }

  private inspectionInclude() {
    return {
      project: { select: { id: true, code: true, name: true } },
      checklist: true,
      createdBy: { select: { id: true, name: true, email: true, jobTitle: true } },
      inspector: { select: { id: true, name: true, email: true, jobTitle: true } },
    };
  }

  private ncrInclude() {
    return {
      project: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true, jobTitle: true } },
      assignedTo: { select: { id: true, name: true, email: true, jobTitle: true } },
    };
  }
}