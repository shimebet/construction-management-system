import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmittalDto } from './dto/create-submittal.dto';
import { ReviewSubmittalDto } from './dto/review-submittal.dto';
import { UpdateSubmittalDto } from './dto/update-submittal.dto';

@Injectable()
export class SubmittalsService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  async create(dto: CreateSubmittalDto, userId?: number) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.reviewerId) {
      const reviewer = await this.db.user.findUnique({
        where: { id: dto.reviewerId },
      });

      if (!reviewer) {
        throw new NotFoundException('Reviewer not found');
      }
    }

    if (dto.documentId) {
      const document = await this.db.document.findUnique({
        where: { id: dto.documentId },
      });

      if (!document || document.projectId !== dto.projectId) {
        throw new BadRequestException('Invalid document for this project');
      }
    }

    const submittal = await this.db.submittal.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description ?? null,
        status: dto.status ?? 'DRAFT',
        revision: dto.revision ?? null,
        submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: userId ?? null,
        reviewerId: dto.reviewerId ?? null,
        documentId: dto.documentId ?? null,
      },
      include: this.submittalInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: submittal.projectId,
      action: AuditAction.CREATE,
      module: 'submittals',
      entityName: 'Submittal',
      entityId: String(submittal.id),
      description: `Created submittal ${submittal.code}`,
      newData: submittal,
    });

    return submittal;
  }

  findByProject(projectId: number) {
    return this.db.submittal.findMany({
      where: { projectId },
      include: this.submittalInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const submittal = await this.db.submittal.findUnique({
      where: { id },
      include: this.submittalInclude(),
    });

    if (!submittal) {
      throw new NotFoundException('Submittal not found');
    }

    return submittal;
  }

  async update(id: number, dto: UpdateSubmittalDto, userId?: number) {
    const oldSubmittal = await this.findOne(id);

    if (dto.reviewerId) {
      const reviewer = await this.db.user.findUnique({
        where: { id: dto.reviewerId },
      });

      if (!reviewer) {
        throw new NotFoundException('Reviewer not found');
      }
    }

    if (dto.documentId) {
      const document = await this.db.document.findUnique({
        where: { id: dto.documentId },
      });

      const projectId = dto.projectId ?? oldSubmittal.projectId;

      if (!document || document.projectId !== projectId) {
        throw new BadRequestException('Invalid document for this project');
      }
    }

    const updated = await this.db.submittal.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        revision: dto.revision,
        submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        reviewerId: dto.reviewerId,
        documentId: dto.documentId,
      },
      include: this.submittalInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'submittals',
      entityName: 'Submittal',
      entityId: String(id),
      description: `Updated submittal ${updated.code}`,
      oldData: oldSubmittal,
      newData: updated,
    });

    return updated;
  }

  async submit(id: number, userId?: number) {
    const oldSubmittal = await this.findOne(id);

    if (oldSubmittal.status !== 'DRAFT') {
      throw new BadRequestException('Only draft submittals can be submitted');
    }

    const updated = await this.db.submittal.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: this.submittalInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'submittals',
      entityName: 'Submittal',
      entityId: String(id),
      description: `Submitted submittal ${updated.code}`,
      oldData: oldSubmittal,
      newData: updated,
    });

    return updated;
  }

  async review(id: number, dto: ReviewSubmittalDto, userId?: number) {
    const oldSubmittal = await this.findOne(id);

    const allowedStatuses = [
      'UNDER_REVIEW',
      'APPROVED',
      'APPROVED_WITH_COMMENTS',
      'REJECTED',
      'REVISE_AND_RESUBMIT',
    ];

    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException('Invalid review status');
    }

    const updated = await this.db.submittal.update({
      where: { id },
      data: {
        status: dto.status,
        closedAt:
          dto.status === 'APPROVED' ||
          dto.status === 'APPROVED_WITH_COMMENTS' ||
          dto.status === 'REJECTED'
            ? new Date()
            : undefined,
      },
      include: this.submittalInclude(),
    });

    await this.db.approval.create({
      data: {
        projectId: updated.projectId,
        userId: userId ?? null,
        status:
          dto.status === 'APPROVED' || dto.status === 'APPROVED_WITH_COMMENTS'
            ? 'APPROVED'
            : dto.status === 'REJECTED'
              ? 'REJECTED'
              : 'RETURNED',
        module: 'submittals',
        entityName: 'Submittal',
        entityId: updated.id,
        submittalId: updated.id,
        comments: dto.comments ?? null,
        approvedAt:
          dto.status === 'APPROVED' || dto.status === 'APPROVED_WITH_COMMENTS'
            ? new Date()
            : null,
      },
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action:
        dto.status === 'APPROVED' || dto.status === 'APPROVED_WITH_COMMENTS'
          ? AuditAction.APPROVE
          : dto.status === 'REJECTED'
            ? AuditAction.REJECT
            : AuditAction.UPDATE,
      module: 'submittals',
      entityName: 'Submittal',
      entityId: String(id),
      description: `Reviewed submittal ${updated.code} as ${dto.status}`,
      oldData: oldSubmittal,
      newData: updated,
    });

    return updated;
  }

  async close(id: number, userId?: number) {
    const oldSubmittal = await this.findOne(id);

    const updated = await this.db.submittal.update({
      where: { id },
      data: {
        closedAt: new Date(),
      },
      include: this.submittalInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'submittals',
      entityName: 'Submittal',
      entityId: String(id),
      description: `Closed submittal ${updated.code}`,
      oldData: oldSubmittal,
      newData: updated,
    });

    return updated;
  }

  private submittalInclude() {
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
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
        },
      },
      document: true,
      approvals: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    };
  }
}