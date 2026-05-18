import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  async create(dto: CreateDocumentDto, userId?: number) {
    const project = await this.db.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const document = await this.db.document.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        type: dto.type,
        discipline: dto.discipline ?? null,
        originator: dto.originator ?? null,
        zone: dto.zone ?? null,
        level: dto.level ?? null,
        status: dto.status ?? 'WIP',
        currentRevision: dto.currentRevision ?? null,
        description: dto.description ?? null,
      },
      include: this.documentInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: document.projectId,
      action: AuditAction.CREATE,
      module: 'documents',
      entityName: 'Document',
      entityId: String(document.id),
      description: `Created document ${document.code} - ${document.title}`,
      newData: document,
    });

    return document;
  }

  findByProject(projectId: number) {
    return this.db.document.findMany({
      where: { projectId },
      include: this.documentInclude(),
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: number) {
    const document = await this.db.document.findUnique({
      where: { id },
      include: this.documentInclude(),
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async update(id: number, dto: UpdateDocumentDto, userId?: number) {
    const oldDocument = await this.findOne(id);

    if (dto.projectId) {
      const project = await this.db.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const updated = await this.db.document.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        type: dto.type,
        discipline: dto.discipline,
        originator: dto.originator,
        zone: dto.zone,
        level: dto.level,
        status: dto.status,
        currentRevision: dto.currentRevision,
        description: dto.description,
      },
      include: this.documentInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'documents',
      entityName: 'Document',
      entityId: String(id),
      description: `Updated document ${updated.code} - ${updated.title}`,
      oldData: oldDocument,
      newData: updated,
    });

    return updated;
  }

  async archive(id: number, userId?: number) {
    const oldDocument = await this.findOne(id);

    const archived = await this.db.document.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
      include: this.documentInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: archived.projectId,
      action: AuditAction.UPDATE,
      module: 'documents',
      entityName: 'Document',
      entityId: String(id),
      description: `Archived document ${archived.code}`,
      oldData: oldDocument,
      newData: archived,
    });

    return archived;
  }

  async createVersion(dto: CreateDocumentVersionDto, userId?: number) {
    const document = await this.findOne(dto.documentId);

    const version = await this.db.documentVersion.create({
      data: {
        documentId: dto.documentId,
        revision: dto.revision,
        status: dto.status ?? 'WIP',
        fileName: dto.fileName,
        filePath: dto.filePath,
        fileSize: dto.fileSize ?? null,
        mimeType: dto.mimeType ?? null,
        uploadedById: userId ?? null,
        notes: dto.notes ?? null,
      },
      include: {
        document: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
      },
    });

    await this.db.document.update({
      where: { id: dto.documentId },
      data: {
        currentRevision: dto.revision,
        status: dto.status ?? document.status,
      },
    });

    await this.auditService.create({
      userId,
      projectId: document.projectId,
      action: AuditAction.CREATE,
      module: 'documents',
      entityName: 'DocumentVersion',
      entityId: String(version.id),
      description: `Uploaded revision ${dto.revision} for document ${document.code}`,
      newData: version,
    });

    return version;
  }

  async findVersions(documentId: number) {
    await this.findOne(documentId);

    return this.db.documentVersion.findMany({
      where: { documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async changeStatus(id: number, status: string, userId?: number) {
    const oldDocument = await this.findOne(id);

    const allowed = ['WIP', 'SHARED', 'PUBLISHED', 'ARCHIVED', 'REJECTED'];

    if (!allowed.includes(status)) {
      throw new BadRequestException('Invalid document status');
    }

    const updated = await this.db.document.update({
      where: { id },
      data: { status },
      include: this.documentInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'documents',
      entityName: 'Document',
      entityId: String(id),
      description: `Changed document ${updated.code} status to ${status}`,
      oldData: oldDocument,
      newData: updated,
    });

    return updated;
  }
async findVersion(id: number) {
  const version = await this.db.documentVersion.findUnique({
    where: { id },
    include: {
      document: true,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!version) {
    throw new NotFoundException('Document version not found');
  }

  return version;
}
  private documentInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      versions: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
            },
          },
        },
      },
    };
  }
}