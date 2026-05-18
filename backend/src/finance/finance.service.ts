import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class FinanceService {
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

  private async ensureInvoice(invoiceId?: number) {
    if (!invoiceId) return null;

    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private calculateInvoiceTotal(dto: {
    subtotal?: number;
    taxAmount?: number;
    retentionAmount?: number;
    advanceDeduction?: number;
  }) {
    return (
      Number(dto.subtotal ?? 0) +
      Number(dto.taxAmount ?? 0) -
      Number(dto.retentionAmount ?? 0) -
      Number(dto.advanceDeduction ?? 0)
    );
  }

  async createInvoice(dto: CreateInvoiceDto, userId?: number) {
    await this.ensureProject(dto.projectId);

    const totalAmount = this.calculateInvoiceTotal({
      subtotal: dto.subtotal,
      taxAmount: dto.taxAmount ?? 0,
      retentionAmount: dto.retentionAmount ?? 0,
      advanceDeduction: dto.advanceDeduction ?? 0,
    });

    const invoice = await this.db.invoice.create({
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description ?? null,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        subtotal: dto.subtotal,
        taxAmount: dto.taxAmount ?? 0,
        retentionAmount: dto.retentionAmount ?? 0,
        advanceDeduction: dto.advanceDeduction ?? 0,
        totalAmount,
        status: dto.status ?? 'DRAFT',
      },
      include: this.invoiceInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: invoice.projectId,
      action: AuditAction.CREATE,
      module: 'finance',
      entityName: 'Invoice',
      entityId: String(invoice.id),
      description: `Created invoice ${invoice.code}`,
      newData: invoice,
    });

    return invoice;
  }

  findInvoices(projectId: number) {
    return this.db.invoice.findMany({
      where: { projectId },
      include: this.invoiceInclude(),
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async findInvoice(id: number) {
    const invoice = await this.db.invoice.findUnique({
      where: { id },
      include: this.invoiceInclude(),
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateInvoice(id: number, dto: UpdateInvoiceDto, userId?: number) {
    const oldInvoice = await this.findInvoice(id);

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    const subtotal = dto.subtotal ?? Number(oldInvoice.subtotal);
    const taxAmount = dto.taxAmount ?? Number(oldInvoice.taxAmount);
    const retentionAmount =
      dto.retentionAmount ?? Number(oldInvoice.retentionAmount);
    const advanceDeduction =
      dto.advanceDeduction ?? Number(oldInvoice.advanceDeduction);

    const totalAmount = this.calculateInvoiceTotal({
      subtotal,
      taxAmount,
      retentionAmount,
      advanceDeduction,
    });

    const updated = await this.db.invoice.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        subtotal: dto.subtotal,
        taxAmount: dto.taxAmount,
        retentionAmount: dto.retentionAmount,
        advanceDeduction: dto.advanceDeduction,
        totalAmount,
        status: dto.status,
      },
      include: this.invoiceInclude(),
    });

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'finance',
      entityName: 'Invoice',
      entityId: String(id),
      description: `Updated invoice ${updated.code}`,
      oldData: oldInvoice,
      newData: updated,
    });

    return updated;
  }

  async createPayment(dto: CreatePaymentDto, userId?: number) {
    await this.ensureProject(dto.projectId);
    const invoice = await this.ensureInvoice(dto.invoiceId);

    const payment = await this.db.payment.create({
      data: {
        projectId: dto.projectId,
        invoiceId: dto.invoiceId ?? null,
        code: dto.code,
        type: dto.type ?? 'PROGRESS',
        status: dto.status ?? 'PENDING',
        amount: dto.amount,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : null,
        reference: dto.reference ?? null,
        paidBy: dto.paidBy ?? null,
        paidTo: dto.paidTo ?? null,
        notes: dto.notes ?? null,
      },
      include: this.paymentInclude(),
    });

    if (invoice) {
      await this.updateInvoicePaymentStatus(invoice.id);
    }

    await this.auditService.create({
      userId,
      projectId: payment.projectId,
      action: AuditAction.CREATE,
      module: 'finance',
      entityName: 'Payment',
      entityId: String(payment.id),
      description: `Created payment ${payment.code}`,
      newData: payment,
    });

    return payment;
  }

  findPayments(projectId: number) {
    return this.db.payment.findMany({
      where: { projectId },
      include: this.paymentInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePayment(id: number, dto: UpdatePaymentDto, userId?: number) {
    const oldPayment = await this.db.payment.findUnique({
      where: { id },
      include: this.paymentInclude(),
    });

    if (!oldPayment) {
      throw new NotFoundException('Payment not found');
    }

    if (dto.projectId) {
      await this.ensureProject(dto.projectId);
    }

    if (dto.invoiceId) {
      await this.ensureInvoice(dto.invoiceId);
    }

    const updated = await this.db.payment.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        invoiceId: dto.invoiceId,
        code: dto.code,
        type: dto.type,
        status: dto.status,
        amount: dto.amount,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        reference: dto.reference,
        paidBy: dto.paidBy,
        paidTo: dto.paidTo,
        notes: dto.notes,
      },
      include: this.paymentInclude(),
    });

    if (oldPayment.invoiceId) {
      await this.updateInvoicePaymentStatus(oldPayment.invoiceId);
    }

    if (updated.invoiceId) {
      await this.updateInvoicePaymentStatus(updated.invoiceId);
    }

    await this.auditService.create({
      userId,
      projectId: updated.projectId,
      action: AuditAction.UPDATE,
      module: 'finance',
      entityName: 'Payment',
      entityId: String(id),
      description: `Updated payment ${updated.code}`,
      oldData: oldPayment,
      newData: updated,
    });

    return updated;
  }

  async updateInvoicePaymentStatus(invoiceId: number) {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) return;

    const paidAmount = invoice.payments
      .filter((payment: any) => payment.status === 'COMPLETED')
      .reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);

    const totalAmount = Number(invoice.totalAmount);

    let status = invoice.status;

    if (paidAmount <= 0) {
      status = invoice.status === 'SENT' ? 'SENT' : 'DRAFT';
    } else if (paidAmount < totalAmount) {
      status = 'PARTIALLY_PAID';
    } else {
      status = 'PAID';
    }

    await this.db.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });
  }

  async getCashFlow(projectId: number) {
    await this.ensureProject(projectId);

    const [invoices, payments, expenses] = await Promise.all([
      this.db.invoice.findMany({ where: { projectId } }),
      this.db.payment.findMany({ where: { projectId } }),
      this.db.expense.findMany({ where: { projectId } }),
    ]);

    const invoicedAmount = invoices.reduce(
      (sum: number, item: any) => sum + Number(item.totalAmount),
      0,
    );

    const receivedAmount = payments
      .filter((item: any) => item.status === 'COMPLETED')
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const expenseAmount = expenses.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0,
    );

    const retentionHeld = invoices.reduce(
      (sum: number, item: any) => sum + Number(item.retentionAmount),
      0,
    );

    const advanceDeducted = invoices.reduce(
      (sum: number, item: any) => sum + Number(item.advanceDeduction),
      0,
    );

    return {
      projectId,
      invoicedAmount,
      receivedAmount,
      expenseAmount,
      retentionHeld,
      advanceDeducted,
      netCashFlow: receivedAmount - expenseAmount,
      outstandingReceivable: invoicedAmount - receivedAmount,
    };
  }

  private invoiceInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      payments: true,
    };
  }

  private paymentInclude() {
    return {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      invoice: {
        select: {
          id: true,
          code: true,
          title: true,
          totalAmount: true,
          status: true,
        },
      },
    };
  }
}