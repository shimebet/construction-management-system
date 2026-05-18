import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { CreateRiskAssessmentDto } from './dto/create-risk-assessment.dto';
import { UpdateRiskAssessmentDto } from './dto/update-risk-assessment.dto';
import { CreateToolboxTalkDto } from './dto/create-toolbox-talk.dto';
import { UpdateToolboxTalkDto } from './dto/update-toolbox-talk.dto';
import { CreateSafetyInspectionDto } from './dto/create-safety-inspection.dto';
import { UpdateSafetyInspectionDto } from './dto/update-safety-inspection.dto';

@Injectable()
export class SafetyService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  private async ensureProject(projectId: number) {
    const project = await this.db.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async ensureUser(userId?: number, label = 'User') {
    if (!userId) return null;

    const user = await this.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`${label} not found`);
    }

    return user;
  }

  async createIncident(dto: CreateIncidentDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    const incident = await this.db.safetyIncident.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        severity: dto.severity ?? 'LOW',
        status: dto.status ?? 'OPEN',
        incidentDate: new Date(dto.incidentDate),
        location: dto.location ?? null,
        reporterId: userId ?? null,
        correctiveAction: dto.correctiveAction ?? null,
        closedAt: dto.status === 'CLOSED' ? new Date() : null,
      },
      include: this.incidentInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: incident.projectId,
      action: AuditAction.CREATE,
      module: 'safety',
      entityName: 'SafetyIncident',
      entityId: String(incident.id),
      description: `Created safety incident ${incident.code}`,
      newData: incident,
    });

    return incident;
  }

  findIncidents(projectId: number) {
    return this.db.safetyIncident.findMany({
      where: { projectId },
      include: this.incidentInclude(),
      orderBy: { incidentDate: 'desc' },
    });
  }

  async updateIncident(id: number, dto: UpdateIncidentDto, userId?: number) {
    const oldIncident = await this.db.safetyIncident.findUnique({
      where: { id },
      include: this.incidentInclude(),
    });

    if (!oldIncident) {
      throw new NotFoundException('Safety incident not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    const updated = await this.db.safetyIncident.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: dto.status,
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
        location: dto.location,
        correctiveAction: dto.correctiveAction,
        closedAt: dto.status === 'CLOSED' ? new Date() : undefined,
      },
      include: this.incidentInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'safety',
      entityName: 'SafetyIncident',
      entityId: String(id),
      description: `Updated safety incident ${updated.code}`,
      oldData: oldIncident,
      newData: updated,
    });

    return updated;
  }

  async createRiskAssessment(dto: CreateRiskAssessmentDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    const riskAssessment = await this.db.riskAssessment.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        activity: dto.activity,
        hazards: dto.hazards,
        risks: dto.risks,
        controls: dto.controls ?? null,
        riskLevel: dto.riskLevel ?? null,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : null,
      },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    await this.auditService.create({
      userId,
      projectId: riskAssessment.projectId,
      action: AuditAction.CREATE,
      module: 'safety',
      entityName: 'RiskAssessment',
      entityId: String(riskAssessment.id),
      description: `Created risk assessment ${riskAssessment.code}`,
      newData: riskAssessment,
    });

    return riskAssessment;
  }

  findRiskAssessments(projectId: number) {
    return this.db.riskAssessment.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRiskAssessment(
    id: number,
    dto: UpdateRiskAssessmentDto,
    userId?: number,
  ) {
    const oldRiskAssessment = await this.db.riskAssessment.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!oldRiskAssessment) {
      throw new NotFoundException('Risk assessment not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    const updated = await this.db.riskAssessment.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        activity: dto.activity,
        hazards: dto.hazards,
        risks: dto.risks,
        controls: dto.controls,
        riskLevel: dto.riskLevel,
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'safety',
      entityName: 'RiskAssessment',
      entityId: String(id),
      description: `Updated risk assessment ${updated.code}`,
      oldData: oldRiskAssessment,
      newData: updated,
    });

    return updated;
  }

  async createToolboxTalk(dto: CreateToolboxTalkDto, userId?: number) {
    await this.ensureProject(dto.projectId);
    await this.ensureUser(dto.leaderId, 'Toolbox talk leader');

    const talk = await this.db.toolboxTalk.create({
      data: {
        projectId: dto.projectId,
        topic: dto.topic,
        talkDate: new Date(dto.talkDate),
        attendees: dto.attendees ?? [],
        leaderId: dto.leaderId ?? userId ?? null,
        remarks: dto.remarks ?? null,
      },
      include: this.toolboxTalkInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: talk.projectId,
      action: AuditAction.CREATE,
      module: 'safety',
      entityName: 'ToolboxTalk',
      entityId: String(talk.id),
      description: `Created toolbox talk ${talk.topic}`,
      newData: talk,
    });

    return talk;
  }

  findToolboxTalks(projectId: number) {
    return this.db.toolboxTalk.findMany({
      where: { projectId },
      include: this.toolboxTalkInclude(),
      orderBy: { talkDate: 'desc' },
    });
  }

  async updateToolboxTalk(id: number, dto: UpdateToolboxTalkDto, userId?: number) {
    const oldTalk = await this.db.toolboxTalk.findUnique({
      where: { id },
      include: this.toolboxTalkInclude(),
    });

    if (!oldTalk) {
      throw new NotFoundException('Toolbox talk not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    await this.ensureUser(dto.leaderId, 'Toolbox talk leader');

    const updated = await this.db.toolboxTalk.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        topic: dto.topic,
        talkDate: dto.talkDate ? new Date(dto.talkDate) : undefined,
        attendees: dto.attendees,
        leaderId: dto.leaderId,
        remarks: dto.remarks,
      },
      include: this.toolboxTalkInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'safety',
      entityName: 'ToolboxTalk',
      entityId: String(id),
      description: `Updated toolbox talk ${updated.topic}`,
      oldData: oldTalk,
      newData: updated,
    });

    return updated;
  }

  async createSafetyInspection(dto: CreateSafetyInspectionDto, userId?: number) {
    await this.ensureProject(dto.projectId);
    await this.ensureUser(dto.inspectorId, 'Safety inspector');

    const inspection = await this.db.safetyInspection.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        inspectionDate: new Date(dto.inspectionDate),
        findings: dto.findings ?? null,
        actions: dto.actions ?? null,
        inspectorId: dto.inspectorId ?? userId ?? null,
      },
      include: this.safetyInspectionInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: inspection.projectId,
      action: AuditAction.CREATE,
      module: 'safety',
      entityName: 'SafetyInspection',
      entityId: String(inspection.id),
      description: `Created safety inspection ${inspection.code}`,
      newData: inspection,
    });

    return inspection;
  }

  findSafetyInspections(projectId: number) {
    return this.db.safetyInspection.findMany({
      where: { projectId },
      include: this.safetyInspectionInclude(),
      orderBy: { inspectionDate: 'desc' },
    });
  }

  async updateSafetyInspection(
    id: number,
    dto: UpdateSafetyInspectionDto,
    userId?: number,
  ) {
    const oldInspection = await this.db.safetyInspection.findUnique({
      where: { id },
      include: this.safetyInspectionInclude(),
    });

    if (!oldInspection) {
      throw new NotFoundException('Safety inspection not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    await this.ensureUser(dto.inspectorId, 'Safety inspector');

    const updated = await this.db.safetyInspection.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        inspectionDate: dto.inspectionDate
          ? new Date(dto.inspectionDate)
          : undefined,
        findings: dto.findings,
        actions: dto.actions,
        inspectorId: dto.inspectorId,
      },
      include: this.safetyInspectionInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'safety',
      entityName: 'SafetyInspection',
      entityId: String(id),
      description: `Updated safety inspection ${updated.code}`,
      oldData: oldInspection,
      newData: updated,
    });

    return updated;
  }

  private incidentInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
        },
      },
    };
  }

  private toolboxTalkInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      leader: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
        },
      },
    };
  }

  private safetyInspectionInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      inspector: {
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