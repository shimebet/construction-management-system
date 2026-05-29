import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmittalDto } from './dto/create-submittal.dto';
import { ReviewSubmittalDto } from './dto/review-submittal.dto';
import { UpdateSubmittalDto } from './dto/update-submittal.dto';

const allowedStatuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'APPROVED_WITH_COMMENTS',
  'REJECTED',
  'REVISE_AND_RESUBMIT',
];

const allowedReviewStatuses = [
  'UNDER_REVIEW',
  'APPROVED',
  'APPROVED_WITH_COMMENTS',
  'REJECTED',
  'REVISE_AND_RESUBMIT',
];

@Injectable()
export class SubmittalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateSubmittalDto, userId?: number) {
    const projectId = Number(dto.projectId);
    if (!projectId) throw new BadRequestException('Project is required');

    await this.validateProject(projectId);

    if (dto.reviewerId) {
      await this.validateUser(Number(dto.reviewerId), 'Reviewer not found');
    }

    if (dto.documentId) {
      await this.validateDocument(Number(dto.documentId), projectId);
    }

    const code = this.requiredText(dto.code, 'Submittal code').toUpperCase();

    const duplicate = await this.prisma.submittal.findFirst({
      where: { projectId, code },
      select: { id: true },
    });

    if (duplicate) {
      throw new BadRequestException(
        'Submittal code already exists for this project',
      );
    }

    const submittal = await this.prisma.submittal.create({
      data: {
        projectId,
        code,
        title: this.requiredText(dto.title, 'Title'),
        description: this.nullIfEmpty(dto.description),
        status: this.normalizeStatus(dto.status ?? 'DRAFT'),
        revision: this.nullIfEmpty(dto.revision)?.toUpperCase() ?? null,
        submittedAt: dto.submittedAt
          ? this.normalizeDate(dto.submittedAt)
          : null,
        dueDate: dto.dueDate ? this.normalizeDate(dto.dueDate) : null,
        createdById: userId ?? null,
        reviewerId: dto.reviewerId ? Number(dto.reviewerId) : null,
        documentId: dto.documentId ? Number(dto.documentId) : null,
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

  async findByProject(projectId: number) {
    await this.validateProject(projectId);

    return this.prisma.submittal.findMany({
      where: { projectId },
      include: this.submittalInclude(),
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: number) {
    const submittal = await this.prisma.submittal.findUnique({
      where: { id },
      include: this.submittalInclude(),
    });

    if (!submittal) throw new NotFoundException('Submittal not found');

    return submittal;
  }

  async update(id: number, dto: UpdateSubmittalDto, userId?: number) {
    const oldSubmittal = await this.findOne(id);

    if (oldSubmittal.closedAt) {
      throw new BadRequestException(
        'Closed submittal cannot be edited. Reopen it first.',
      );
    }

    const projectId = dto.projectId
      ? Number(dto.projectId)
      : oldSubmittal.projectId;

    if (dto.projectId) await this.validateProject(projectId);

    if (dto.reviewerId) {
      await this.validateUser(Number(dto.reviewerId), 'Reviewer not found');
    }

    if (dto.documentId) {
      await this.validateDocument(Number(dto.documentId), projectId);
    }

    const nextCode = dto.code
      ? this.requiredText(dto.code, 'Submittal code').toUpperCase()
      : oldSubmittal.code;

    if (dto.code || dto.projectId) {
      const duplicate = await this.prisma.submittal.findFirst({
        where: {
          projectId,
          code: nextCode,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Submittal code already exists for this project',
        );
      }
    }

    const updated = await this.prisma.submittal.update({
      where: { id },
      data: {
        projectId: dto.projectId ? projectId : undefined,
        code: dto.code !== undefined ? nextCode : undefined,
        title:
          dto.title !== undefined
            ? this.requiredText(dto.title, 'Title')
            : undefined,
        description:
          dto.description !== undefined
            ? this.nullIfEmpty(dto.description)
            : undefined,
        status:
          dto.status !== undefined
            ? this.normalizeStatus(dto.status)
            : undefined,
        revision:
          dto.revision !== undefined
            ? this.nullIfEmpty(dto.revision)?.toUpperCase() ?? null
            : undefined,
        submittedAt:
          dto.submittedAt !== undefined
            ? dto.submittedAt
              ? this.normalizeDate(dto.submittedAt)
              : null
            : undefined,
        dueDate:
          dto.dueDate !== undefined
            ? dto.dueDate
              ? this.normalizeDate(dto.dueDate)
              : null
            : undefined,
        reviewerId:
          dto.reviewerId !== undefined
            ? dto.reviewerId
              ? Number(dto.reviewerId)
              : null
            : undefined,
        documentId:
          dto.documentId !== undefined
            ? dto.documentId
              ? Number(dto.documentId)
              : null
            : undefined,
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

    if (oldSubmittal.closedAt) {
      throw new BadRequestException('Closed submittal cannot be submitted');
    }

    if (
      oldSubmittal.status !== 'DRAFT' &&
      oldSubmittal.status !== 'REVISE_AND_RESUBMIT'
    ) {
      throw new BadRequestException(
        'Only draft or revise-and-resubmit submittals can be submitted',
      );
    }

    const updated = await this.prisma.submittal.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        closedAt: null,
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

    if (oldSubmittal.closedAt) {
      throw new BadRequestException('Closed submittal cannot be reviewed');
    }

    const reviewStatus = this.normalizeReviewStatus(dto.status);

    const closeOnReview = [
      'APPROVED',
      'APPROVED_WITH_COMMENTS',
      'REJECTED',
    ].includes(reviewStatus);

    const updated = await this.prisma.submittal.update({
      where: { id },
      data: {
        status: reviewStatus,
        closedAt: closeOnReview ? new Date() : null,
      },
      include: this.submittalInclude(),
    });

    await this.prisma.approval.create({
      data: {
        projectId: updated.projectId,
        userId: userId ?? null,
        status:
          reviewStatus === 'APPROVED' ||
          reviewStatus === 'APPROVED_WITH_COMMENTS'
            ? 'APPROVED'
            : reviewStatus === 'REJECTED'
              ? 'REJECTED'
              : 'RETURNED',
        module: 'submittals',
        entityName: 'Submittal',
        entityId: updated.id,
        submittalId: updated.id,
        comments: this.nullIfEmpty(dto.comments),
        approvedAt:
          reviewStatus === 'APPROVED' ||
          reviewStatus === 'APPROVED_WITH_COMMENTS'
            ? new Date()
            : null,
      },
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action:
        reviewStatus === 'APPROVED' ||
        reviewStatus === 'APPROVED_WITH_COMMENTS'
          ? AuditAction.APPROVE
          : reviewStatus === 'REJECTED'
            ? AuditAction.REJECT
            : AuditAction.UPDATE,
      module: 'submittals',
      entityName: 'Submittal',
      entityId: String(id),
      description: `Reviewed submittal ${updated.code} as ${reviewStatus}`,
      oldData: oldSubmittal,
      newData: updated,
    });

    return updated;
  }

  async close(id: number, userId?: number) {
    const oldSubmittal = await this.findOne(id);

    if (oldSubmittal.closedAt) {
      throw new BadRequestException('Submittal is already closed');
    }

    const updated = await this.prisma.submittal.update({
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

  async reopen(id: number, userId?: number) {
    const oldSubmittal = await this.findOne(id);

    if (!oldSubmittal.closedAt) {
      throw new BadRequestException('Only closed submittals can be reopened');
    }

    const updated = await this.prisma.submittal.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        closedAt: null,
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
      description: `Reopened submittal ${updated.code}`,
      oldData: oldSubmittal,
      newData: updated,
    });

    return updated;
  }

  async remove(id: number, userId?: number) {
    const oldSubmittal = await this.findOne(id);

    if (oldSubmittal.closedAt) {
      throw new BadRequestException('Closed submittal cannot be deleted');
    }

    const deleted = await this.prisma.submittal.delete({
      where: { id },
    });

    await this.auditService.create({
      userId,
      projectId: oldSubmittal.projectId,
      action: AuditAction.DELETE,
      module: 'submittals',
      entityName: 'Submittal',
      entityId: String(id),
      description: `Deleted submittal ${oldSubmittal.code}`,
      oldData: oldSubmittal,
      newData: deleted,
    });

    return deleted;
  }

  private submittalInclude(): Prisma.SubmittalInclude {
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
      document: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
      approvals: {
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
    };
  }

  private async validateProject(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) throw new NotFoundException('Project not found');
  }

  private async validateUser(id: number, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) throw new NotFoundException(message);
  }

  private async validateDocument(documentId: number, projectId: number) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!document || document.projectId !== projectId) {
      throw new BadRequestException('Invalid document for this project');
    }
  }

  private normalizeStatus(status: string) {
    const value = String(status || '').trim().toUpperCase();

    if (!allowedStatuses.includes(value)) {
      throw new BadRequestException('Invalid submittal status');
    }

    return value as any;
  }

  private normalizeReviewStatus(status: string) {
    const value = String(status || '').trim().toUpperCase();

    if (!allowedReviewStatuses.includes(value)) {
      throw new BadRequestException('Invalid review status');
    }

    return value as any;
  }

  private normalizeDate(value: string | Date) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    date.setHours(0, 0, 0, 0);
    return date;
  }

  private requiredText(value: unknown, label: string) {
    const text = String(value ?? '').trim();

    if (!text) {
      throw new BadRequestException(`${label} is required`);
    }

    return text;
  }

  private nullIfEmpty(value?: string | null) {
    if (value === undefined || value === null) return null;

    const text = String(value).trim();
    return text || null;
  }
}