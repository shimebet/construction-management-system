import { useEffect, useState } from 'react';
import { companiesApi } from '../../api/companies.api';
import type { Company } from '../../api/companies.api';
import { inventoryApi } from '../../api/inventory.api';
import type {
  InventoryTransaction,
  Material,
  ProjectStock,
} from '../../api/inventory.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function InventoryPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [stock, setStock] = useState<ProjectStock[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [materialForm, setMaterialForm] = useState({
    companyId: 0,
    code: '',
    name: '',
    unit: '',
    description: '',
    minStock: '',
  });

  const [transactionForm, setTransactionForm] = useState({
    projectId: 0,
    materialId: '',
    type: 'RECEIVE',
    quantity: 1,
    unit: '',
    reference: '',
    notes: '',
  });

  async function loadInitialData() {
    const [companyData, projectData] = await Promise.all([
      companiesApi.findAll(),
      projectsApi.findAll(),
    ]);

    setCompanies(companyData);
    setProjects(projectData);

    if (companyData.length > 0) {
      await handleCompanyChange(String(companyData[0].id));
    }

    if (projectData.length > 0) {
      await handleProjectChange(String(projectData[0].id));
    }
  }

  async function loadMaterials(companyId: number) {
    const data = await inventoryApi.findMaterials(companyId);
    setMaterials(data);
  }

  async function loadInventory(projectId: number) {
    try {
      setLoading(true);

      const [transactionData, stockData] = await Promise.all([
        inventoryApi.findTransactionsByProject(projectId),
        inventoryApi.getProjectStock(projectId),
      ]);

      setTransactions(transactionData);
      setStock(stockData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  async function handleCompanyChange(value: string) {
    const companyId = Number(value);

    setSelectedCompanyId(companyId);

    setMaterialForm((prev) => ({
      ...prev,
      companyId,
    }));

    await loadMaterials(companyId);
  }

  async function handleProjectChange(value: string) {
    const projectId = Number(value);

    setSelectedProjectId(projectId);

    setTransactionForm((prev) => ({
      ...prev,
      projectId,
    }));

    await loadInventory(projectId);
  }

  async function createMaterial(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await inventoryApi.createMaterial({
        companyId: Number(materialForm.companyId),
        code: materialForm.code,
        name: materialForm.name,
        unit: materialForm.unit,
        description: materialForm.description,
        minStock: materialForm.minStock
          ? Number(materialForm.minStock)
          : undefined,
      });

      setMaterialForm((prev) => ({
        ...prev,
        code: '',
        name: '',
        unit: '',
        description: '',
        minStock: '',
      }));

      setMessage('Material created successfully');

      if (selectedCompanyId) {
        await loadMaterials(Number(selectedCompanyId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create material');
    } finally {
      setLoading(false);
    }
  }

  async function createTransaction(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await inventoryApi.createTransaction({
        projectId: Number(transactionForm.projectId),
        materialId: Number(transactionForm.materialId),
        type: transactionForm.type,
        quantity: Number(transactionForm.quantity),
        unit: transactionForm.unit,
        reference: transactionForm.reference,
        notes: transactionForm.notes,
      });

      setTransactionForm((prev) => ({
        ...prev,
        materialId: '',
        type: 'RECEIVE',
        quantity: 1,
        unit: '',
        reference: '',
        notes: '',
      }));

      setMessage('Inventory transaction created successfully');

      if (selectedProjectId) {
        await loadInventory(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to create inventory transaction',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage materials, stock movements, project balances, and low-stock alerts."
      />

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

        <div className="module-grid">
       <div className="module-sidebar">
          <Card title="Create Material">
            <form onSubmit={createMaterial}>
              <SelectField
                label="Company"
                value={materialForm.companyId}
                onChange={handleCompanyChange}
              >
                <option value={0}>Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </SelectField>

              <Input
                label="Material Code"
                value={materialForm.code}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Material Name"
                value={materialForm.name}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, name: e.target.value })
                }
                required
              />

              <Input
                label="Unit"
                value={materialForm.unit}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, unit: e.target.value })
                }
                required
              />

              <Input
                label="Minimum Stock"
                type="number"
                value={materialForm.minStock}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, minStock: e.target.value })
                }
              />

              <TextareaField
                label="Description"
                value={materialForm.description}
                onChange={(value) =>
                  setMaterialForm({ ...materialForm, description: value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Material
              </Button>
            </form>
          </Card>

          <Card title="Create Stock Transaction">
            <form onSubmit={createTransaction}>
              <SelectField
                label="Project"
                value={transactionForm.projectId}
                onChange={handleProjectChange}
              >
                <option value={0}>Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Material"
                value={transactionForm.materialId}
                onChange={(value) => {
                  const selected = materials.find(
                    (material) => material.id === Number(value),
                  );

                  setTransactionForm({
                    ...transactionForm,
                    materialId: value,
                    unit: selected?.unit ?? transactionForm.unit,
                  });
                }}
              >
                <option value="">Select material</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.code} - {material.name}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Transaction Type"
                value={transactionForm.type}
                onChange={(value) =>
                  setTransactionForm({ ...transactionForm, type: value })
                }
              >
                <option value="RECEIVE">Receive</option>
                <option value="ISSUE">Issue</option>
                <option value="RETURN">Return</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </SelectField>

              <Input
                label="Quantity"
                type="number"
                value={transactionForm.quantity}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    quantity: Number(e.target.value),
                  })
                }
                required
              />

              <Input
                label="Unit"
                value={transactionForm.unit}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    unit: e.target.value,
                  })
                }
                required
              />

              <Input
                label="Reference"
                value={transactionForm.reference}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    reference: e.target.value,
                  })
                }
              />

              <TextareaField
                label="Notes"
                value={transactionForm.notes}
                onChange={(value) =>
                  setTransactionForm({ ...transactionForm, notes: value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Transaction
              </Button>
            </form>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <Card title="Materials">
            <DataTable<Material>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Name', accessor: 'name' },
                { header: 'Unit', accessor: 'unit' },
                {
                  header: 'Min Stock',
                  accessor: (row) => row.minStock ?? '-',
                },
              ]}
              data={materials}
              emptyMessage="No materials found"
            />
          </Card>

          <Card title="Project Stock Balance">
            <DataTable<ProjectStock>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Material', accessor: 'name' },
                { header: 'Unit', accessor: 'unit' },
                { header: 'Received', accessor: 'received' },
                { header: 'Issued', accessor: 'issued' },
                { header: 'Returned', accessor: 'returned' },
                { header: 'Adjusted', accessor: 'adjusted' },
                { header: 'Balance', accessor: 'balance' },
                {
                  header: 'Status',
                  accessor: (row) => (row.isLowStock ? 'Low Stock' : 'OK'),
                },
              ]}
              data={stock}
              emptyMessage="No stock records found"
            />
          </Card>

          <Card title="Transactions">
            <DataTable<InventoryTransaction>
              columns={[
                {
                  header: 'Date',
                  accessor: (row) => formatDate(row.createdAt),
                },
                {
                  header: 'Material',
                  accessor: (row) => row.material?.name || row.materialId,
                },
                { header: 'Type', accessor: 'type' },
                {
                  header: 'Quantity',
                  accessor: (row) => `${Number(row.quantity)} ${row.unit}`,
                },
                {
                  header: 'Reference',
                  accessor: (row) => row.reference || '-',
                },
                {
                  header: 'Notes',
                  accessor: (row) => truncate(row.notes),
                },
              ]}
              data={transactions}
              emptyMessage="No transactions found"
            />
          </Card>
        </div>
      </div>
    </div>
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

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function truncate(value?: string | null) {
  if (!value) return '-';
  return value.length > 50 ? `${value.slice(0, 50)}...` : value;
}