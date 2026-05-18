import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class ProcurementService {
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

  private async ensureCompany(companyId: number) {
    const company = await this.db.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  private async ensureSupplier(supplierId?: number) {
    if (!supplierId) return null;
    const supplier = await this.db.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  private async ensureMaterial(materialId?: number) {
    if (!materialId) return null;
    const material = await this.db.material.findUnique({ where: { id: materialId } });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async createSupplier(dto: CreateSupplierDto, userId?: number) {
    await this.ensureCompany(dto.companyId);

    const supplier = await this.db.supplier.create({
      data: {
        companyId: dto.companyId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        taxNumber: dto.taxNumber ?? null,
        isActive: dto.isActive ?? true,
      },
      include: {
        company: true,
      },
    });

    await this.auditService.create({
      userId,
      action: AuditAction.CREATE,
      module: 'procurement',
      entityName: 'Supplier',
      entityId: String(supplier.id),
      description: `Created supplier ${supplier.name}`,
      newData: supplier,
    });

    return supplier;
  }

  findSuppliers(companyId: number) {
    return this.db.supplier.findMany({
      where: { companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSupplier(id: number, dto: UpdateSupplierDto, userId?: number) {
    const oldSupplier = await this.db.supplier.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!oldSupplier) throw new NotFoundException('Supplier not found');

    if (dto.companyId) await this.ensureCompany(dto.companyId);

    const updated = await this.db.supplier.update({
      where: { id },
      data: {
        companyId: dto.companyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        taxNumber: dto.taxNumber,
        isActive: dto.isActive,
      },
      include: { company: true },
    });

    await this.auditService.create({
      userId,
      action: AuditAction.UPDATE,
      module: 'procurement',
      entityName: 'Supplier',
      entityId: String(id),
      description: `Updated supplier ${updated.name}`,
      oldData: oldSupplier,
      newData: updated,
    });

    return updated;
  }

  async createPurchaseRequest(dto: CreatePurchaseRequestDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    if (dto.items) {
      for (const item of dto.items) {
        await this.ensureMaterial(item.materialId);
      }
    }

    const request = await this.db.purchaseRequest.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        description: dto.description ?? null,
        status: dto.status ?? 'DRAFT',
        requestedById: userId ?? null,
        requestedDate: dto.requestedDate ? new Date(dto.requestedDate) : new Date(),
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                materialId: item.materialId ?? null,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
              })),
            }
          : undefined,
      },
      include: this.purchaseRequestInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: request.projectId,
      action: AuditAction.CREATE,
      module: 'procurement',
      entityName: 'PurchaseRequest',
      entityId: String(request.id),
      description: `Created purchase request ${request.code}`,
      newData: request,
    });

    return request;
  }

  findPurchaseRequests(projectId: number) {
    return this.db.purchaseRequest.findMany({
      where: { projectId },
      include: this.purchaseRequestInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePurchaseRequest(
    id: number,
    dto: UpdatePurchaseRequestDto,
    userId?: number,
  ) {
    const oldRequest = await this.db.purchaseRequest.findUnique({
      where: { id },
      include: this.purchaseRequestInclude(),
    });

    if (!oldRequest) throw new NotFoundException('Purchase request not found');

    if (dto.projectId) await this.ensureProject(dto.projectId);

    const updated = await this.db.purchaseRequest.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        description: dto.description,
        status: dto.status,
        requestedDate: dto.requestedDate ? new Date(dto.requestedDate) : undefined,
      },
      include: this.purchaseRequestInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'procurement',
      entityName: 'PurchaseRequest',
      entityId: String(id),
      description: `Updated purchase request ${updated.code}`,
      oldData: oldRequest,
      newData: updated,
    });

    return updated;
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, userId?: number) {
    await this.ensureProject(dto.projectId);
    await this.ensureSupplier(dto.supplierId);

    if (dto.items) {
      for (const item of dto.items) {
        await this.ensureMaterial(item.materialId);
      }
    }

    const order = await this.db.purchaseOrder.create({
      data: {
        projectId: dto.projectId,
        supplierId: dto.supplierId ?? null,
        code: dto.code,
        description: dto.description ?? null,
        status: dto.status ?? 'DRAFT',
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        totalAmount: dto.totalAmount ?? null,
        createdById: userId ?? null,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                materialId: item.materialId ?? null,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice ?? null,
                totalPrice:
                  item.totalPrice ??
                  (item.unitPrice ? item.quantity * item.unitPrice : null),
              })),
            }
          : undefined,
      },
      include: this.purchaseOrderInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: order.projectId,
      action: AuditAction.CREATE,
      module: 'procurement',
      entityName: 'PurchaseOrder',
      entityId: String(order.id),
      description: `Created purchase order ${order.code}`,
      newData: order,
    });

    return order;
  }

  findPurchaseOrders(projectId: number) {
    return this.db.purchaseOrder.findMany({
      where: { projectId },
      include: this.purchaseOrderInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePurchaseOrder(
    id: number,
    dto: UpdatePurchaseOrderDto,
    userId?: number,
  ) {
    const oldOrder = await this.db.purchaseOrder.findUnique({
      where: { id },
      include: this.purchaseOrderInclude(),
    });

    if (!oldOrder) throw new NotFoundException('Purchase order not found');

    if (dto.projectId) await this.ensureProject(dto.projectId);
    if (dto.supplierId) await this.ensureSupplier(dto.supplierId);

    const updated = await this.db.purchaseOrder.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        supplierId: dto.supplierId,
        code: dto.code,
        description: dto.description,
        status: dto.status,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
        totalAmount: dto.totalAmount,
      },
      include: this.purchaseOrderInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'procurement',
      entityName: 'PurchaseOrder',
      entityId: String(id),
      description: `Updated purchase order ${updated.code}`,
      oldData: oldOrder,
      newData: updated,
    });

    return updated;
  }

  private purchaseRequestInclude() {
    return {
      project: { select: { id: true, code: true, name: true } },
      requestedBy: { select: { id: true, name: true, email: true, jobTitle: true } },
      items: {
        include: {
          material: true,
        },
      },
    };
  }

  private purchaseOrderInclude() {
    return {
      project: { select: { id: true, code: true, name: true } },
      supplier: true,
      createdBy: { select: { id: true, name: true, email: true, jobTitle: true } },
      items: {
        include: {
          material: true,
        },
      },
    };
  }
}