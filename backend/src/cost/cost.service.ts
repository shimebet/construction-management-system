import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoqItemDto } from './dto/create-boq-item.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateVariationDto } from './dto/create-variation.dto';
import { UpdateBoqItemDto } from './dto/update-boq-item.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateVariationDto } from './dto/update-variation.dto';

@Injectable()
export class CostService {
  private readonly db: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    this.db = prisma as any;
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

  async createBoqItem(dto: CreateBoqItemDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    const totalAmount = dto.quantity * dto.unitRate;

    const item = await this.db.boqItem.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        description: dto.description,
        unit: dto.unit,
        quantity: dto.quantity,
        unitRate: dto.unitRate,
        totalAmount,
      },
      include: this.projectInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: item.projectId,
      action: AuditAction.CREATE,
      module: 'cost',
      entityName: 'BoqItem',
      entityId: String(item.id),
      description: `Created BOQ item ${item.code}`,
      newData: item,
    });

    return item;
  }

  findBoqItems(projectId: number) {
    return this.db.boqItem.findMany({
      where: { projectId },
      include: this.projectInclude(),
      orderBy: { code: 'asc' },
    });
  }

  async updateBoqItem(id: number, dto: UpdateBoqItemDto, userId?: number) {
    const oldItem = await this.db.boqItem.findUnique({
      where: { id },
      include: this.projectInclude(),
    });

    if (!oldItem) {
      throw new NotFoundException('BOQ item not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    const quantity = dto.quantity ?? Number(oldItem.quantity);
    const unitRate = dto.unitRate ?? Number(oldItem.unitRate);

    const updated = await this.db.boqItem.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        description: dto.description,
        unit: dto.unit,
        quantity: dto.quantity,
        unitRate: dto.unitRate,
        totalAmount: quantity * unitRate,
      },
      include: this.projectInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'cost',
      entityName: 'BoqItem',
      entityId: String(id),
      description: `Updated BOQ item ${updated.code}`,
      oldData: oldItem,
      newData: updated,
    });

    return updated;
  }

  async createBudget(dto: CreateBudgetDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    const budget = await this.db.budget.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description ?? null,
        amount: dto.amount,
        status: dto.status ?? 'DRAFT',
      },
      include: this.projectInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: budget.projectId,
      action: AuditAction.CREATE,
      module: 'cost',
      entityName: 'Budget',
      entityId: String(budget.id),
      description: `Created budget ${budget.code}`,
      newData: budget,
    });

    return budget;
  }

  findBudgets(projectId: number) {
    return this.db.budget.findMany({
      where: { projectId },
      include: this.projectInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBudget(id: number, dto: UpdateBudgetDto, userId?: number) {
    const oldBudget = await this.db.budget.findUnique({
      where: { id },
      include: this.projectInclude(),
    });

    if (!oldBudget) {
      throw new NotFoundException('Budget not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    const updated = await this.db.budget.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        status: dto.status,
      },
      include: this.projectInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'cost',
      entityName: 'Budget',
      entityId: String(id),
      description: `Updated budget ${updated.code}`,
      oldData: oldBudget,
      newData: updated,
    });

    return updated;
  }

  async createExpense(dto: CreateExpenseDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    const expense = await this.db.expense.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        description: dto.description,
        type: dto.type ?? 'OTHER',
        amount: dto.amount,
        expenseDate: new Date(dto.expenseDate),
        reference: dto.reference ?? null,
        paidTo: dto.paidTo ?? null,
      },
      include: this.projectInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: expense.projectId,
      action: AuditAction.CREATE,
      module: 'cost',
      entityName: 'Expense',
      entityId: String(expense.id),
      description: `Created expense ${expense.code}`,
      newData: expense,
    });

    return expense;
  }

  findExpenses(projectId: number) {
    return this.db.expense.findMany({
      where: { projectId },
      include: this.projectInclude(),
      orderBy: { expenseDate: 'desc' },
    });
  }

  async updateExpense(id: number, dto: UpdateExpenseDto, userId?: number) {
    const oldExpense = await this.db.expense.findUnique({
      where: { id },
      include: this.projectInclude(),
    });

    if (!oldExpense) {
      throw new NotFoundException('Expense not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    const updated = await this.db.expense.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        description: dto.description,
        type: dto.type,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        reference: dto.reference,
        paidTo: dto.paidTo,
      },
      include: this.projectInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'cost',
      entityName: 'Expense',
      entityId: String(id),
      description: `Updated expense ${updated.code}`,
      oldData: oldExpense,
      newData: updated,
    });

    return updated;
  }

  async createVariation(dto: CreateVariationDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    const variation = await this.db.variation.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        status: dto.status ?? 'DRAFT',
        submittedAt: dto.status === 'SUBMITTED' ? new Date() : null,
        approvedAt: dto.status === 'APPROVED' ? new Date() : null,
      },
      include: this.projectInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: variation.projectId,
      action: AuditAction.CREATE,
      module: 'cost',
      entityName: 'Variation',
      entityId: String(variation.id),
      description: `Created variation ${variation.code}`,
      newData: variation,
    });

    return variation;
  }

  findVariations(projectId: number) {
    return this.db.variation.findMany({
      where: { projectId },
      include: this.projectInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVariation(id: number, dto: UpdateVariationDto, userId?: number) {
    const oldVariation = await this.db.variation.findUnique({
      where: { id },
      include: this.projectInclude(),
    });

    if (!oldVariation) {
      throw new NotFoundException('Variation not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    const updated = await this.db.variation.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        status: dto.status,
        submittedAt: dto.status === 'SUBMITTED' ? new Date() : undefined,
        approvedAt: dto.status === 'APPROVED' ? new Date() : undefined,
      },
      include: this.projectInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'cost',
      entityName: 'Variation',
      entityId: String(id),
      description: `Updated variation ${updated.code}`,
      oldData: oldVariation,
      newData: updated,
    });

    return updated;
  }

  async getProjectCostSummary(projectId: number) {
    await this.ensureProject(projectId);

    const [boqItems, budgets, expenses, variations] = await Promise.all([
      this.db.boqItem.findMany({ where: { projectId } }),
      this.db.budget.findMany({ where: { projectId } }),
      this.db.expense.findMany({ where: { projectId } }),
      this.db.variation.findMany({ where: { projectId } }),
    ]);

    const boqTotal = boqItems.reduce(
      (sum: number, item: any) => sum + Number(item.totalAmount),
      0,
    );

    const budgetTotal = budgets.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0,
    );

    const expenseTotal = expenses.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0,
    );

    const approvedVariationTotal = variations
      .filter((item: any) => item.status === 'APPROVED')
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const revisedBudget = budgetTotal + approvedVariationTotal;

    return {
      projectId,
      boqTotal,
      budgetTotal,
      approvedVariationTotal,
      revisedBudget,
      actualCost: expenseTotal,
      remainingBudget: revisedBudget - expenseTotal,
      costPerformancePercent:
        revisedBudget > 0
          ? Number(((expenseTotal / revisedBudget) * 100).toFixed(2))
          : 0,
    };
  }

  private projectInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    };
  }
}