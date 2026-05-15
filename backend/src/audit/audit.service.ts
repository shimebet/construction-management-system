import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        projectId: dto.projectId,
        action: dto.action,
        module: dto.module,
        entityName: dto.entityName,
        entityId: dto.entityId,
        description: dto.description,
        oldData: dto.oldData,
        newData: dto.newData,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });
  }

  findAll() {
    return this.prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });
  }

  findByProject(projectId: number) {
    return this.prisma.auditLog.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findByUser(userId: number) {
    return this.prisma.auditLog.findMany({
      where: { userId },
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
        createdAt: 'desc',
      },
    });
  }
}