import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

const allowedDocumentStatuses = ['WIP', 'SHARED', 'PUBLISHED', 'ARCHIVED', 'REJECTED'];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateDocumentDto, userId?: number) {
    const projectId = Number(dto.projectId);
    if (!projectId) throw new BadRequestException('Project is required');

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const code = this.requiredText(dto.code, 'Document code').toUpperCase();
    const title = this.requiredText(dto.title, 'Title');

    const duplicate = await this.prisma.document.findFirst({
      where: { projectId, code },
      select: { id: true },
    });

    if (duplicate) {
      throw new BadRequestException('Document code already exists for this project');
    }

    const document = await this.prisma.document.create({
      data: {
        projectId,
        code,
        title,
        type: dto.type,
        discipline: this.nullIfEmpty(dto.discipline),
        originator: this.nullIfEmpty(dto.originator),
        zone: this.nullIfEmpty(dto.zone),
        level: this.nullIfEmpty(dto.level),
        status: this.normalizeStatus(dto.status ?? 'WIP'),
        currentRevision: this.nullIfEmpty(dto.currentRevision),
        description: this.nullIfEmpty(dto.description),
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

  async findByProject(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.document.findMany({
      where: { projectId },
      include: this.documentInclude(),
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: number) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: this.documentInclude(),
    });

    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async update(id: number, dto: UpdateDocumentDto, userId?: number) {
    const oldDocument = await this.findOne(id);

    const nextProjectId = dto.projectId ? Number(dto.projectId) : oldDocument.projectId;

    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({ where: { id: nextProjectId } });
      if (!project) throw new NotFoundException('Project not found');
    }

    const nextCode = dto.code ? this.requiredText(dto.code, 'Document code').toUpperCase() : oldDocument.code;

    if (dto.code || dto.projectId) {
      const duplicate = await this.prisma.document.findFirst({
        where: {
          projectId: nextProjectId,
          code: nextCode,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new BadRequestException('Document code already exists for this project');
      }
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        projectId: dto.projectId ? nextProjectId : undefined,
        code: dto.code !== undefined ? nextCode : undefined,
        title: dto.title !== undefined ? this.requiredText(dto.title, 'Title') : undefined,
        type: dto.type,
        discipline: dto.discipline !== undefined ? this.nullIfEmpty(dto.discipline) : undefined,
        originator: dto.originator !== undefined ? this.nullIfEmpty(dto.originator) : undefined,
        zone: dto.zone !== undefined ? this.nullIfEmpty(dto.zone) : undefined,
        level: dto.level !== undefined ? this.nullIfEmpty(dto.level) : undefined,
        status: dto.status !== undefined ? this.normalizeStatus(dto.status) : undefined,
        currentRevision: dto.currentRevision !== undefined ? this.nullIfEmpty(dto.currentRevision) : undefined,
        description: dto.description !== undefined ? this.nullIfEmpty(dto.description) : undefined,
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

    const archived = await this.prisma.document.update({
      where: { id },
      data: { status: 'ARCHIVED' },
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
    const revision = this.requiredText(dto.revision, 'Revision').toUpperCase();

    const duplicate = await this.prisma.documentVersion.findFirst({
      where: { documentId: dto.documentId, revision },
      select: { id: true },
    });

    if (duplicate) {
      throw new BadRequestException('Revision already exists for this document');
    }

    const version = await this.prisma.documentVersion.create({
      data: {
        documentId: dto.documentId,
        revision,
        status: this.normalizeStatus(dto.status ?? 'WIP'),
        fileName: this.requiredText(dto.fileName, 'File name'),
        filePath: this.requiredText(dto.filePath, 'File path'),
        fileSize: dto.fileSize ?? null,
        mimeType: dto.mimeType ?? null,
        uploadedById: userId ?? null,
        notes: this.nullIfEmpty(dto.notes),
      },
      include: {
        document: true,
        uploadedBy: {
          select: { id: true, name: true, email: true, jobTitle: true },
        },
      },
    });

    await this.prisma.document.update({
      where: { id: dto.documentId },
      data: {
        currentRevision: revision,
        status: this.normalizeStatus(dto.status ?? document.status),
      },
    });

    await this.auditService.create({
      userId,
      projectId: document.projectId,
      action: AuditAction.CREATE,
      module: 'documents',
      entityName: 'DocumentVersion',
      entityId: String(version.id),
      description: `Uploaded revision ${revision} for document ${document.code}`,
      newData: version,
    });

    return version;
  }

  async findVersions(documentId: number) {
    await this.findOne(documentId);

    return this.prisma.documentVersion.findMany({
      where: { documentId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, jobTitle: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findVersion(id: number) {
    const version = await this.prisma.documentVersion.findUnique({
      where: { id },
      include: {
        document: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!version) throw new NotFoundException('Document version not found');
    return version;
  }

  async changeStatus(id: number, status: string, userId?: number) {
    const oldDocument = await this.findOne(id);
    const nextStatus = this.normalizeStatus(status);

    const updated = await this.prisma.document.update({
      where: { id },
      data: { status: nextStatus },
      include: this.documentInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'documents',
      entityName: 'Document',
      entityId: String(id),
      description: `Changed document ${updated.code} status to ${nextStatus}`,
      oldData: oldDocument,
      newData: updated,
    });

    return updated;
  }

  private documentInclude(): Prisma.DocumentInclude {
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
          createdAt: 'desc' as const,
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

  private normalizeStatus(status: string) {
    const nextStatus = String(status || '').trim().toUpperCase();
    if (!allowedDocumentStatuses.includes(nextStatus)) {
      throw new BadRequestException('Invalid document status');
    }
    return nextStatus as any;
  }

  private requiredText(value: unknown, label: string) {
    const text = String(value ?? '').trim();
    if (!text) throw new BadRequestException(`${label} is required`);
    return text;
  }

  private nullIfEmpty(value?: string | null) {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text || null;
  }
}