import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';

@Injectable()
export class ApprovalsService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  async create(dto: CreateApprovalDto, currentUserId?: number) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.userId) {
      const user = await this.db.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('Approval user not found');
      }
    }

    const approval = await this.db.approval.create({
      data: {
        projectId: dto.projectId,
        userId: dto.userId ?? currentUserId ?? null,
        status: dto.status ?? 'PENDING',
        module: dto.module,
        entityName: dto.entityName,
        entityId: dto.entityId,
        rfiId: dto.rfiId ?? null,
        submittalId: dto.submittalId ?? null,
        comments: dto.comments ?? null,
        approvedAt:
          dto.status === 'APPROVED' || dto.status === 'REJECTED'
            ? new Date()
            : null,
      },
      include: this.approvalInclude(),
    });

    await this.auditService.create({
      userId: currentUserId,
      projectId: approval.projectId,
      action: AuditAction.CREATE,
      module: 'approvals',
      entityName: 'Approval',
      entityId: String(approval.id),
      description: `Created approval for ${approval.module}:${approval.entityName}:${approval.entityId}`,
      newData: approval,
    });

    return approval;
  }

  findByProject(projectId: number) {
    return this.db.approval.findMany({
      where: { projectId },
      include: this.approvalInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findByEntity(module: string, entityName: string, entityId: number) {
    return this.db.approval.findMany({
      where: {
        module,
        entityName,
        entityId,
      },
      include: this.approvalInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findPendingByUser(userId: number) {
    return this.db.approval.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: this.approvalInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const approval = await this.db.approval.findUnique({
      where: { id },
      include: this.approvalInclude(),
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    return approval;
  }

  async review(id: number, dto: ReviewApprovalDto, currentUserId?: number) {
    const oldApproval = await this.findOne(id);

    if (oldApproval.status !== 'PENDING') {
      throw new BadRequestException('Only pending approvals can be reviewed');
    }

    if (!['APPROVED', 'REJECTED', 'RETURNED'].includes(dto.status)) {
      throw new BadRequestException('Invalid review status');
    }

    const updated = await this.db.approval.update({
      where: { id },
      data: {
        status: dto.status,
        userId: currentUserId ?? oldApproval.userId,
        comments: dto.comments,
        approvedAt: dto.status === 'APPROVED' ? new Date() : null,
      },
      include: this.approvalInclude(),
    });

    await this.auditService.create({
      userId: currentUserId,
      projectId: updated.projectId,
      action:
        dto.status === 'APPROVED'
          ? AuditAction.APPROVE
          : dto.status === 'REJECTED'
            ? AuditAction.REJECT
            : AuditAction.UPDATE,
      module: 'approvals',
      entityName: 'Approval',
      entityId: String(id),
      description: `Reviewed approval ${id} as ${dto.status}`,
      oldData: oldApproval,
      newData: updated,
    });

    return updated;
  }

  async cancel(id: number, currentUserId?: number) {
    const oldApproval = await this.findOne(id);

    if (oldApproval.status !== 'PENDING') {
      throw new BadRequestException('Only pending approvals can be cancelled');
    }

    const updated = await this.db.approval.update({
      where: { id },
      data: {
        status: 'RETURNED',
        comments: 'Approval cancelled/returned',
      },
      include: this.approvalInclude(),
    });

    await this.auditService.create({
      userId: currentUserId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'approvals',
      entityName: 'Approval',
      entityId: String(id),
      description: `Cancelled approval ${id}`,
      oldData: oldApproval,
      newData: updated,
    });

    return updated;
  }

  private approvalInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
        },
      },
      rfi: true,
      submittal: true,
    };
  }
}