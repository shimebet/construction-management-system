import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';

@Injectable()
export class DailyReportsService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  async create(dto: CreateDailyReportDto, userId?: number) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const reportDate = new Date(dto.reportDate);

    const existing = await this.db.dailyReport.findFirst({
      where: {
        projectId: dto.projectId,
        reportDate,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Daily report already exists for this project and date',
      );
    }

    const report = await this.db.dailyReport.create({
      data: {
        projectId: dto.projectId,
        reportDate,
        weather: dto.weather ?? null,
        manpowerCount: dto.manpowerCount ?? 0,
        equipmentUsed: dto.equipmentUsed ?? null,
        workCompleted: dto.workCompleted ?? null,
        materialReceived: dto.materialReceived ?? null,
        sitePhotos: dto.sitePhotos ?? [],
        issues: dto.issues ?? null,
        delays: dto.delays ?? null,
        remarks: dto.remarks ?? null,
        preparedById: userId ?? null,
      },
      include: this.reportInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: report.projectId,
      action: AuditAction.CREATE,
      module: 'daily_reports',
      entityName: 'DailyReport',
      entityId: String(report.id),
      description: `Created daily report for ${report.reportDate.toISOString().slice(0, 10)}`,
      newData: report,
    });

    return report;
  }

  findByProject(projectId: number) {
    return this.db.dailyReport.findMany({
      where: { projectId },
      include: this.reportInclude(),
      orderBy: {
        reportDate: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const report = await this.db.dailyReport.findUnique({
      where: { id },
      include: this.reportInclude(),
    });

    if (!report) {
      throw new NotFoundException('Daily report not found');
    }

    return report;
  }

  async update(id: number, dto: UpdateDailyReportDto, userId?: number) {
    const oldReport = await this.findOne(id);

    if (dto.projectId) {
      const project = await this.db.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const updated = await this.db.dailyReport.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        reportDate: dto.reportDate ? new Date(dto.reportDate) : undefined,
        weather: dto.weather,
        manpowerCount: dto.manpowerCount,
        equipmentUsed: dto.equipmentUsed,
        workCompleted: dto.workCompleted,
        materialReceived: dto.materialReceived,
        sitePhotos: dto.sitePhotos,
        issues: dto.issues,
        delays: dto.delays,
        remarks: dto.remarks,
      },
      include: this.reportInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'daily_reports',
      entityName: 'DailyReport',
      entityId: String(id),
      description: `Updated daily report for ${updated.reportDate.toISOString().slice(0, 10)}`,
      oldData: oldReport,
      newData: updated,
    });

    return updated;
  }

  async remove(id: number, userId?: number) {
    const oldReport = await this.findOne(id);

    const deleted = await this.db.dailyReport.delete({
      where: { id },
    });

    await this.auditService.create({
      userId,
      projectId: oldReport.projectId,
      action: AuditAction.DELETE,
      module: 'daily_reports',
      entityName: 'DailyReport',
      entityId: String(id),
      description: `Deleted daily report for ${oldReport.reportDate.toISOString().slice(0, 10)}`,
      oldData: oldReport,
      newData: deleted,
    });

    return deleted;
  }

  private reportInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      preparedBy: {
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