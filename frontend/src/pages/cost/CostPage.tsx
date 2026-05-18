import { useEffect, useState } from 'react';
import { costApi } from '../../api/cost.api';
import type {
  BoqItem,
  Budget,
  CostSummary,
  Expense,
  Variation,
} from '../../api/cost.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function CostPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [boqForm, setBoqForm] = useState({
    projectId: 0,
    code: '',
    description: '',
    unit: '',
    quantity: 1,
    unitRate: 0,
  });

  const [budgetForm, setBudgetForm] = useState({
    projectId: 0,
    code: '',
    title: '',
    description: '',
    amount: 0,
    status: 'DRAFT',
  });

  const [expenseForm, setExpenseForm] = useState({
    projectId: 0,
    code: '',
    description: '',
    type: 'OTHER',
    amount: 0,
    expenseDate: '',
    reference: '',
    paidTo: '',
  });

  const [variationForm, setVariationForm] = useState({
    projectId: 0,
    code: '',
    title: '',
    description: '',
    amount: 0,
    status: 'DRAFT',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadCost(projectId: number) {
    try {
      setLoading(true);

      const [boqData, budgetData, expenseData, variationData, summaryData] =
        await Promise.all([
          costApi.findBoqItems(projectId),
          costApi.findBudgets(projectId),
          costApi.findExpenses(projectId),
          costApi.findVariations(projectId),
          costApi.getSummary(projectId),
        ]);

      setBoqItems(boqData);
      setBudgets(budgetData);
      setExpenses(expenseData);
      setVariations(variationData);
      setSummary(summaryData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load cost data');
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

    setBoqForm((prev) => ({ ...prev, projectId }));
    setBudgetForm((prev) => ({ ...prev, projectId }));
    setExpenseForm((prev) => ({ ...prev, projectId }));
    setVariationForm((prev) => ({ ...prev, projectId }));

    await loadCost(projectId);
  }

  async function createBoqItem(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await costApi.createBoqItem({
        projectId: Number(boqForm.projectId),
        code: boqForm.code,
        description: boqForm.description,
        unit: boqForm.unit,
        quantity: Number(boqForm.quantity),
        unitRate: Number(boqForm.unitRate),
      });

      setBoqForm((prev) => ({
        ...prev,
        code: '',
        description: '',
        unit: '',
        quantity: 1,
        unitRate: 0,
      }));

      setMessage('BOQ item created successfully');

      if (selectedProjectId) {
        await loadCost(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create BOQ item');
    } finally {
      setLoading(false);
    }
  }

  async function createBudget(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await costApi.createBudget({
        projectId: Number(budgetForm.projectId),
        code: budgetForm.code,
        title: budgetForm.title,
        description: budgetForm.description,
        amount: Number(budgetForm.amount),
        status: budgetForm.status,
      });

      setBudgetForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        description: '',
        amount: 0,
        status: 'DRAFT',
      }));

      setMessage('Budget created successfully');

      if (selectedProjectId) {
        await loadCost(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  }

  async function createExpense(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await costApi.createExpense({
        projectId: Number(expenseForm.projectId),
        code: expenseForm.code,
        description: expenseForm.description,
        type: expenseForm.type,
        amount: Number(expenseForm.amount),
        expenseDate: expenseForm.expenseDate,
        reference: expenseForm.reference,
        paidTo: expenseForm.paidTo,
      });

      setExpenseForm((prev) => ({
        ...prev,
        code: '',
        description: '',
        type: 'OTHER',
        amount: 0,
        expenseDate: '',
        reference: '',
        paidTo: '',
      }));

      setMessage('Expense created successfully');

      if (selectedProjectId) {
        await loadCost(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  }

  async function createVariation(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await costApi.createVariation({
        projectId: Number(variationForm.projectId),
        code: variationForm.code,
        title: variationForm.title,
        description: variationForm.description,
        amount: Number(variationForm.amount),
        status: variationForm.status,
      });

      setVariationForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        description: '',
        amount: 0,
        status: 'DRAFT',
      }));

      setMessage('Variation created successfully');

      if (selectedProjectId) {
        await loadCost(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create variation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Cost Management"
        description="Manage BOQ, budgets, expenses, variations, and cost performance."
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

      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <SummaryCard title="BOQ Total" value={summary.boqTotal} />
          <SummaryCard title="Budget Total" value={summary.budgetTotal} />
          <SummaryCard
            title="Approved Variations"
            value={summary.approvedVariationTotal}
          />
          <SummaryCard title="Revised Budget" value={summary.revisedBudget} />
          <SummaryCard title="Actual Cost" value={summary.actualCost} />
          <SummaryCard
            title="Remaining Budget"
            value={summary.remainingBudget}
          />
          <SummaryCard
            title="Cost Performance"
            value={`${summary.costPerformancePercent}%`}
          />
        </div>
      )}

        <div className="module-grid">
       <div className="module-sidebar">

          <Card title="Create BOQ Item">
            <form onSubmit={createBoqItem}>
              <Input
                label="BOQ Code"
                value={boqForm.code}
                onChange={(e) =>
                  setBoqForm({ ...boqForm, code: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={boqForm.description}
                onChange={(value) =>
                  setBoqForm({ ...boqForm, description: value })
                }
              />

              <Input
                label="Unit"
                value={boqForm.unit}
                onChange={(e) =>
                  setBoqForm({ ...boqForm, unit: e.target.value })
                }
                required
              />

              <Input
                label="Quantity"
                type="number"
                value={boqForm.quantity}
                onChange={(e) =>
                  setBoqForm({ ...boqForm, quantity: Number(e.target.value) })
                }
              />

              <Input
                label="Unit Rate"
                type="number"
                value={boqForm.unitRate}
                onChange={(e) =>
                  setBoqForm({ ...boqForm, unitRate: Number(e.target.value) })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create BOQ Item
              </Button>
            </form>
          </Card>

          <Card title="Create Budget">
            <form onSubmit={createBudget}>
              <Input
                label="Budget Code"
                value={budgetForm.code}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Title"
                value={budgetForm.title}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, title: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={budgetForm.description}
                onChange={(value) =>
                  setBudgetForm({ ...budgetForm, description: value })
                }
              />

              <Input
                label="Amount"
                type="number"
                value={budgetForm.amount}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    amount: Number(e.target.value),
                  })
                }
              />

              <SelectField
                label="Status"
                value={budgetForm.status}
                onChange={(value) =>
                  setBudgetForm({ ...budgetForm, status: value })
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </SelectField>

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Budget
              </Button>
            </form>
          </Card>

          <Card title="Create Expense">
            <form onSubmit={createExpense}>
              <Input
                label="Expense Code"
                value={expenseForm.code}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, code: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={expenseForm.description}
                onChange={(value) =>
                  setExpenseForm({ ...expenseForm, description: value })
                }
              />

              <SelectField
                label="Type"
                value={expenseForm.type}
                onChange={(value) =>
                  setExpenseForm({ ...expenseForm, type: value })
                }
              >
                <option value="MATERIAL">Material</option>
                <option value="LABOR">Labor</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="SUBCONTRACTOR">Subcontractor</option>
                <option value="GENERAL">General</option>
                <option value="OTHER">Other</option>
              </SelectField>

              <Input
                label="Amount"
                type="number"
                value={expenseForm.amount}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    amount: Number(e.target.value),
                  })
                }
              />

              <Input
                label="Expense Date"
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    expenseDate: e.target.value,
                  })
                }
                required
              />

              <Input
                label="Reference"
                value={expenseForm.reference}
                onChange={(e) =>
                  setExpenseForm({
                    ...expenseForm,
                    reference: e.target.value,
                  })
                }
              />

              <Input
                label="Paid To"
                value={expenseForm.paidTo}
                onChange={(e) =>
                  setExpenseForm({ ...expenseForm, paidTo: e.target.value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Expense
              </Button>
            </form>
          </Card>

          <Card title="Create Variation">
            <form onSubmit={createVariation}>
              <Input
                label="Variation Code"
                value={variationForm.code}
                onChange={(e) =>
                  setVariationForm({ ...variationForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Title"
                value={variationForm.title}
                onChange={(e) =>
                  setVariationForm({ ...variationForm, title: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={variationForm.description}
                onChange={(value) =>
                  setVariationForm({ ...variationForm, description: value })
                }
              />

              <Input
                label="Amount"
                type="number"
                value={variationForm.amount}
                onChange={(e) =>
                  setVariationForm({
                    ...variationForm,
                    amount: Number(e.target.value),
                  })
                }
              />

              <SelectField
                label="Status"
                value={variationForm.status}
                onChange={(value) =>
                  setVariationForm({ ...variationForm, status: value })
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </SelectField>

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Variation
              </Button>
            </form>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <Card title="BOQ Items">
            <DataTable<BoqItem>
              columns={[
                { header: 'Code', accessor: 'code' },
                {
                  header: 'Description',
                  accessor: (row) => truncate(row.description),
                },
                { header: 'Unit', accessor: 'unit' },
                {
                  header: 'Qty',
                  accessor: (row) => Number(row.quantity),
                },
                {
                  header: 'Rate',
                  accessor: (row) => money(row.unitRate),
                },
                {
                  header: 'Total',
                  accessor: (row) => money(row.totalAmount),
                },
              ]}
              data={boqItems}
            />
          </Card>

          <Card title="Budgets">
            <DataTable<Budget>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Title', accessor: 'title' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Amount',
                  accessor: (row) => money(row.amount),
                },
              ]}
              data={budgets}
            />
          </Card>

          <Card title="Expenses">
            <DataTable<Expense>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Type', accessor: 'type' },
                {
                  header: 'Amount',
                  accessor: (row) => money(row.amount),
                },
                {
                  header: 'Date',
                  accessor: (row) => formatDate(row.expenseDate),
                },
                {
                  header: 'Paid To',
                  accessor: (row) => row.paidTo || '-',
                },
              ]}
              data={expenses}
            />
          </Card>

          <Card title="Variations">
            <DataTable<Variation>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Title', accessor: 'title' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Amount',
                  accessor: (row) => money(row.amount),
                },
                {
                  header: 'Approved At',
                  accessor: (row) => formatDate(row.approvedAt),
                },
              ]}
              data={variations}
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

function truncate(value?: string | null) {
  if (!value) return '-';
  return value.length > 50 ? `${value.slice(0, 50)}...` : value;
}