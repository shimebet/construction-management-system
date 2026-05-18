import { useEffect, useState } from 'react';
import { financeApi } from '../../api/finance.api';
import type {
  CashFlowSummary,
  Invoice,
  Payment,
} from '../../api/finance.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function FinancePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowSummary | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [invoiceForm, setInvoiceForm] = useState({
    projectId: 0,
    code: '',
    title: '',
    description: '',
    invoiceDate: '',
    dueDate: '',
    subtotal: 0,
    taxAmount: 0,
    retentionAmount: 0,
    advanceDeduction: 0,
    status: 'DRAFT',
  });

  const [paymentForm, setPaymentForm] = useState({
    projectId: 0,
    invoiceId: '',
    code: '',
    type: 'PROGRESS',
    status: 'PENDING',
    amount: 0,
    paymentDate: '',
    reference: '',
    paidBy: '',
    paidTo: '',
    notes: '',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadFinance(projectId: number) {
    try {
      setLoading(true);

      const [invoiceData, paymentData, cashFlowData] = await Promise.all([
        financeApi.findInvoices(projectId),
        financeApi.findPayments(projectId),
        financeApi.getCashFlow(projectId),
      ]);

      setInvoices(invoiceData);
      setPayments(paymentData);
      setCashFlow(cashFlowData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleProjectChange(value: string) {
    const projectId = Number(value);

    setSelectedProjectId(projectId);

    setInvoiceForm((prev) => ({
      ...prev,
      projectId,
    }));

    setPaymentForm((prev) => ({
      ...prev,
      projectId,
      invoiceId: '',
    }));

    await loadFinance(projectId);
  }

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await financeApi.createInvoice({
        projectId: Number(invoiceForm.projectId),
        code: invoiceForm.code,
        title: invoiceForm.title,
        description: invoiceForm.description,
        invoiceDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate || undefined,
        subtotal: Number(invoiceForm.subtotal),
        taxAmount: Number(invoiceForm.taxAmount),
        retentionAmount: Number(invoiceForm.retentionAmount),
        advanceDeduction: Number(invoiceForm.advanceDeduction),
        status: invoiceForm.status,
      });

      setInvoiceForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        description: '',
        invoiceDate: '',
        dueDate: '',
        subtotal: 0,
        taxAmount: 0,
        retentionAmount: 0,
        advanceDeduction: 0,
        status: 'DRAFT',
      }));

      setMessage('Invoice created successfully');

      if (selectedProjectId) {
        await loadFinance(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  }

  async function createPayment(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await financeApi.createPayment({
        projectId: Number(paymentForm.projectId),
        invoiceId: paymentForm.invoiceId
          ? Number(paymentForm.invoiceId)
          : undefined,
        code: paymentForm.code,
        type: paymentForm.type,
        status: paymentForm.status,
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate || undefined,
        reference: paymentForm.reference,
        paidBy: paymentForm.paidBy,
        paidTo: paymentForm.paidTo,
        notes: paymentForm.notes,
      });

      setPaymentForm((prev) => ({
        ...prev,
        invoiceId: '',
        code: '',
        type: 'PROGRESS',
        status: 'PENDING',
        amount: 0,
        paymentDate: '',
        reference: '',
        paidBy: '',
        paidTo: '',
        notes: '',
      }));

      setMessage('Payment created successfully');

      if (selectedProjectId) {
        await loadFinance(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Finance"
        description="Manage invoices, payments, retention, advances, and cash flow."
      />

      <SelectField
        label="Project"
        value={selectedProjectId}
        onChange={handleProjectChange}
      >
        <option value="">Select project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.code} - {project.name}
          </option>
        ))}
      </SelectField>

      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        >
          {message}
        </div>
      )}

      {cashFlow && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <SummaryCard title="Invoiced" value={cashFlow.invoicedAmount} />
          <SummaryCard title="Received" value={cashFlow.receivedAmount} />
          <SummaryCard title="Expenses" value={cashFlow.expenseAmount} />
          <SummaryCard title="Retention Held" value={cashFlow.retentionHeld} />
          <SummaryCard title="Advance Deducted" value={cashFlow.advanceDeducted} />
          <SummaryCard title="Net Cash Flow" value={cashFlow.netCashFlow} />
          <SummaryCard
            title="Outstanding"
            value={cashFlow.outstandingReceivable}
          />
        </div>
      )}

        <div className="module-grid">
       <div className="module-sidebar">
          <Card title="Create Invoice">
            <form onSubmit={createInvoice}>
              <Input
                label="Invoice Code"
                value={invoiceForm.code}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Title"
                value={invoiceForm.title}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, title: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={invoiceForm.description}
                onChange={(value) =>
                  setInvoiceForm({ ...invoiceForm, description: value })
                }
              />

              <Input
                label="Invoice Date"
                type="date"
                value={invoiceForm.invoiceDate}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    invoiceDate: e.target.value,
                  })
                }
                required
              />

              <Input
                label="Due Date"
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                }
              />

              <Input
                label="Subtotal"
                type="number"
                value={invoiceForm.subtotal}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    subtotal: Number(e.target.value),
                  })
                }
              />

              <Input
                label="Tax Amount"
                type="number"
                value={invoiceForm.taxAmount}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    taxAmount: Number(e.target.value),
                  })
                }
              />

              <Input
                label="Retention Amount"
                type="number"
                value={invoiceForm.retentionAmount}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    retentionAmount: Number(e.target.value),
                  })
                }
              />

              <Input
                label="Advance Deduction"
                type="number"
                value={invoiceForm.advanceDeduction}
                onChange={(e) =>
                  setInvoiceForm({
                    ...invoiceForm,
                    advanceDeduction: Number(e.target.value),
                  })
                }
              />

              <SelectField
                label="Status"
                value={invoiceForm.status}
                onChange={(value) =>
                  setInvoiceForm({ ...invoiceForm, status: value })
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </SelectField>

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Invoice
              </Button>
            </form>
          </Card>

          <Card title="Create Payment">
            <form onSubmit={createPayment}>
              <SelectField
                label="Invoice"
                value={paymentForm.invoiceId}
                onChange={(value) =>
                  setPaymentForm({ ...paymentForm, invoiceId: value })
                }
              >
                <option value="">No invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.code} - {invoice.title}
                  </option>
                ))}
              </SelectField>

              <Input
                label="Payment Code"
                value={paymentForm.code}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, code: e.target.value })
                }
                required
              />

              <SelectField
                label="Type"
                value={paymentForm.type}
                onChange={(value) =>
                  setPaymentForm({ ...paymentForm, type: value })
                }
              >
                <option value="ADVANCE">Advance</option>
                <option value="PROGRESS">Progress</option>
                <option value="RETENTION">Retention</option>
                <option value="FINAL">Final</option>
                <option value="OTHER">Other</option>
              </SelectField>

              <SelectField
                label="Status"
                value={paymentForm.status}
                onChange={(value) =>
                  setPaymentForm({ ...paymentForm, status: value })
                }
              >
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </SelectField>

              <Input
                label="Amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    amount: Number(e.target.value),
                  })
                }
              />

              <Input
                label="Payment Date"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    paymentDate: e.target.value,
                  })
                }
              />

              <Input
                label="Reference"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    reference: e.target.value,
                  })
                }
              />

              <Input
                label="Paid By"
                value={paymentForm.paidBy}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paidBy: e.target.value })
                }
              />

              <Input
                label="Paid To"
                value={paymentForm.paidTo}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paidTo: e.target.value })
                }
              />

              <TextareaField
                label="Notes"
                value={paymentForm.notes}
                onChange={(value) =>
                  setPaymentForm({ ...paymentForm, notes: value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Payment
              </Button>
            </form>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <Card title="Invoices">
            <DataTable<Invoice>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Title', accessor: 'title' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Invoice Date',
                  accessor: (row) => formatDate(row.invoiceDate),
                },
                {
                  header: 'Due Date',
                  accessor: (row) => formatDate(row.dueDate),
                },
                {
                  header: 'Total',
                  accessor: (row) => money(row.totalAmount),
                },
                {
                  header: 'Payments',
                  accessor: (row) => row.payments?.length ?? 0,
                },
              ]}
              data={invoices}
            />
          </Card>

          <Card title="Payments">
            <DataTable<Payment>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Type', accessor: 'type' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Amount',
                  accessor: (row) => money(row.amount),
                },
                {
                  header: 'Payment Date',
                  accessor: (row) => formatDate(row.paymentDate),
                },
                {
                  header: 'Invoice',
                  accessor: (row) => row.invoice?.code || '-',
                },
                {
                  header: 'Reference',
                  accessor: (row) => row.reference || '-',
                },
              ]}
              data={payments}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <Card>
      <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>{title}</p>
      <h3 style={{ margin: '8px 0 0' }}>
        {typeof value === 'number' ? money(value) : value}
      </h3>
    </Card>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
        }}
      >
        {children}
      </select>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          resize: 'vertical',
        }}
      />
    </div>
  );
}

function money(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}