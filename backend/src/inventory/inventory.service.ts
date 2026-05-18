import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class InventoryService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
  }

  private async ensureCompany(companyId: number) {
    const company = await this.db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  private async ensureProject(projectId: number) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async ensureMaterial(materialId: number) {
    const material = await this.db.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async createMaterial(dto: CreateMaterialDto, userId?: number) {
    await this.ensureCompany(dto.companyId);

    const material = await this.db.material.create({
      data: {
        companyId: dto.companyId,
        code: dto.code,
        name: dto.name,
        unit: dto.unit,
        description: dto.description ?? null,
        minStock: dto.minStock ?? null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.auditService.create({
      userId,
      action: AuditAction.CREATE,
      module: 'inventory',
      entityName: 'Material',
      entityId: String(material.id),
      description: `Created material ${material.code} - ${material.name}`,
      newData: material,
    });

    return material;
  }

  findMaterials(companyId: number) {
    return this.db.material.findMany({
      where: { companyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findMaterial(id: number) {
    const material = await this.db.material.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        inventoryTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
          include: {
            project: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async updateMaterial(id: number, dto: UpdateMaterialDto, userId?: number) {
    const oldMaterial = await this.findMaterial(id);

    if (dto.companyId) {
      await this.ensureCompany(dto.companyId);
    }

    const updated = await this.db.material.update({
      where: { id },
      data: {
        companyId: dto.companyId,
        code: dto.code,
        name: dto.name,
        unit: dto.unit,
        description: dto.description,
        minStock: dto.minStock,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.auditService.create({
      userId,
      action: AuditAction.UPDATE,
      module: 'inventory',
      entityName: 'Material',
      entityId: String(id),
      description: `Updated material ${updated.code} - ${updated.name}`,
      oldData: oldMaterial,
      newData: updated,
    });

    return updated;
  }

  async createTransaction(
    dto: CreateInventoryTransactionDto,
    userId?: number,
  ) {
    await this.ensureProject(dto.projectId);
    await this.ensureMaterial(dto.materialId);

    const transaction = await this.db.inventoryTransaction.create({
      data: {
        projectId: dto.projectId,
        materialId: dto.materialId,
        type: dto.type,
        quantity: dto.quantity,
        unit: dto.unit,
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
        performedById: userId ?? null,
      },
      include: this.transactionInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: transaction.projectId,
      action: AuditAction.CREATE,
      module: 'inventory',
      entityName: 'InventoryTransaction',
      entityId: String(transaction.id),
      description: `${transaction.type} material ${transaction.material.code}`,
      newData: transaction,
    });

    return transaction;
  }

  findTransactionsByProject(projectId: number) {
    return this.db.inventoryTransaction.findMany({
      where: { projectId },
      include: this.transactionInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findTransactionsByMaterial(materialId: number) {
    return this.db.inventoryTransaction.findMany({
      where: { materialId },
      include: this.transactionInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getProjectStock(projectId: number) {
    await this.ensureProject(projectId);

    const transactions = await this.db.inventoryTransaction.findMany({
      where: { projectId },
      include: {
        material: true,
      },
    });

    const stockMap = new Map<number, any>();

    for (const tx of transactions) {
      const materialId = tx.materialId;

      if (!stockMap.has(materialId)) {
        stockMap.set(materialId, {
          materialId,
          code: tx.material.code,
          name: tx.material.name,
          unit: tx.material.unit,
          minStock: tx.material.minStock,
          received: 0,
          issued: 0,
          returned: 0,
          adjusted: 0,
          balance: 0,
        });
      }

      const stock = stockMap.get(materialId);
      const quantity = Number(tx.quantity);

      if (tx.type === 'RECEIVE') {
        stock.received += quantity;
        stock.balance += quantity;
      }

      if (tx.type === 'ISSUE') {
        stock.issued += quantity;
        stock.balance -= quantity;
      }

      if (tx.type === 'RETURN') {
        stock.returned += quantity;
        stock.balance += quantity;
      }

      if (tx.type === 'ADJUSTMENT') {
        stock.adjusted += quantity;
        stock.balance += quantity;
      }
    }

    return Array.from(stockMap.values()).map((stock) => ({
      ...stock,
      isLowStock:
        stock.minStock !== null && stock.minStock !== undefined
          ? stock.balance <= Number(stock.minStock)
          : false,
    }));
  }

  private transactionInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      material: true,
      performedBy: {
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