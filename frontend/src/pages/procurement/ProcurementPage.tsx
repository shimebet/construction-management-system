import { useEffect, useState } from 'react';
import { companiesApi } from '../../api/companies.api';
import type { Company } from '../../api/companies.api';
import { procurementApi } from '../../api/procurement.api';
import type {
  PurchaseOrder,
  PurchaseRequest,
  Supplier,
} from '../../api/procurement.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function ProcurementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [supplierForm, setSupplierForm] = useState({
    companyId: 0,
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
  });

  const [prForm, setPrForm] = useState({
    projectId: 0,
    code: '',
    description: '',
    status: 'DRAFT',
    itemDescription: '',
    quantity: 1,
    unit: '',
  });

  const [poForm, setPoForm] = useState({
    projectId: 0,
    supplierId: '',
    code: '',
    description: '',
    status: 'DRAFT',
    orderDate: '',
    itemDescription: '',
    quantity: 1,
    unit: '',
    unitPrice: 0,
    totalAmount: 0,
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

  async function loadSuppliers(companyId: number) {
    const data = await procurementApi.findSuppliers(companyId);
    setSuppliers(data);
  }

  async function loadProcurement(projectId: number) {
    try {
      setLoading(true);

      const [prData, poData] = await Promise.all([
        procurementApi.findPurchaseRequests(projectId),
        procurementApi.findPurchaseOrders(projectId),
      ]);

      setPurchaseRequests(prData);
      setPurchaseOrders(poData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load procurement data');
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

    setSupplierForm((prev) => ({
      ...prev,
      companyId,
    }));

    await loadSuppliers(companyId);
  }

  async function handleProjectChange(value: string) {
    const projectId = Number(value);

    setSelectedProjectId(projectId);

    setPrForm((prev) => ({
      ...prev,
      projectId,
    }));

    setPoForm((prev) => ({
      ...prev,
      projectId,
    }));

    await loadProcurement(projectId);
  }

  async function createSupplier(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await procurementApi.createSupplier({
        ...supplierForm,
        companyId: Number(supplierForm.companyId),
      });

      setSupplierForm((prev) => ({
        ...prev,
        name: '',
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
      }));

      setMessage('Supplier created successfully');

      if (selectedCompanyId) {
        await loadSuppliers(Number(selectedCompanyId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create supplier');
    } finally {
      setLoading(false);
    }
  }

  async function createPurchaseRequest(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await procurementApi.createPurchaseRequest({
        projectId: Number(prForm.projectId),
        code: prForm.code,
        description: prForm.description,
        status: prForm.status,
        items: [
          {
            description: prForm.itemDescription,
            quantity: Number(prForm.quantity),
            unit: prForm.unit,
          },
        ],
      });

      setPrForm((prev) => ({
        ...prev,
        code: '',
        description: '',
        status: 'DRAFT',
        itemDescription: '',
        quantity: 1,
        unit: '',
      }));

      setMessage('Purchase request created successfully');

      if (selectedProjectId) {
        await loadProcurement(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to create purchase request',
      );
    } finally {
      setLoading(false);
    }
  }

  async function createPurchaseOrder(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      const quantity = Number(poForm.quantity);
      const unitPrice = Number(poForm.unitPrice);
      const totalPrice = quantity * unitPrice;

      await procurementApi.createPurchaseOrder({
        projectId: Number(poForm.projectId),
        supplierId: poForm.supplierId ? Number(poForm.supplierId) : undefined,
        code: poForm.code,
        description: poForm.description,
        status: poForm.status,
        orderDate: poForm.orderDate || undefined,
        totalAmount: poForm.totalAmount || totalPrice,
        items: [
          {
            description: poForm.itemDescription,
            quantity,
            unit: poForm.unit,
            unitPrice,
            totalPrice,
          },
        ],
      });

      setPoForm((prev) => ({
        ...prev,
        supplierId: '',
        code: '',
        description: '',
        status: 'DRAFT',
        orderDate: '',
        itemDescription: '',
        quantity: 1,
        unit: '',
        unitPrice: 0,
        totalAmount: 0,
      }));

      setMessage('Purchase order created successfully');

      if (selectedProjectId) {
        await loadProcurement(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Procurement"
        description="Manage suppliers, purchase requests, and purchase orders."
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
          <Card title="Create Supplier">
            <form onSubmit={createSupplier}>
              <SelectField
                label="Company"
                value={supplierForm.companyId}
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
                label="Supplier Name"
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, name: e.target.value })
                }
                required
              />

              <Input
                label="Email"
                type="email"
                value={supplierForm.email}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, email: e.target.value })
                }
              />

              <Input
                label="Phone"
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, phone: e.target.value })
                }
              />

              <Input
                label="Address"
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, address: e.target.value })
                }
              />

              <Input
                label="Tax Number"
                value={supplierForm.taxNumber}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, taxNumber: e.target.value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Supplier
              </Button>
            </form>
          </Card>

          <Card title="Create Purchase Request">
            <form onSubmit={createPurchaseRequest}>
              <SelectField
                label="Project"
                value={prForm.projectId}
                onChange={handleProjectChange}
              >
                <option value={0}>Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </SelectField>

              <Input
                label="PR Code"
                value={prForm.code}
                onChange={(e) => setPrForm({ ...prForm, code: e.target.value })}
                required
              />

              <TextareaField
                label="Description"
                value={prForm.description}
                onChange={(value) => setPrForm({ ...prForm, description: value })}
              />

              <Input
                label="Item Description"
                value={prForm.itemDescription}
                onChange={(e) =>
                  setPrForm({ ...prForm, itemDescription: e.target.value })
                }
                required
              />

              <Input
                label="Quantity"
                type="number"
                value={prForm.quantity}
                onChange={(e) =>
                  setPrForm({ ...prForm, quantity: Number(e.target.value) })
                }
              />

              <Input
                label="Unit"
                value={prForm.unit}
                onChange={(e) => setPrForm({ ...prForm, unit: e.target.value })}
                required
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Purchase Request
              </Button>
            </form>
          </Card>

          <Card title="Create Purchase Order">
            <form onSubmit={createPurchaseOrder}>
              <SelectField
                label="Project"
                value={poForm.projectId}
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
                label="Supplier"
                value={poForm.supplierId}
                onChange={(value) =>
                  setPoForm({ ...poForm, supplierId: value })
                }
              >
                <option value="">No supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </SelectField>

              <Input
                label="PO Code"
                value={poForm.code}
                onChange={(e) => setPoForm({ ...poForm, code: e.target.value })}
                required
              />

              <Input
                label="Order Date"
                type="date"
                value={poForm.orderDate}
                onChange={(e) =>
                  setPoForm({ ...poForm, orderDate: e.target.value })
                }
              />

              <TextareaField
                label="Description"
                value={poForm.description}
                onChange={(value) => setPoForm({ ...poForm, description: value })}
              />

              <Input
                label="Item Description"
                value={poForm.itemDescription}
                onChange={(e) =>
                  setPoForm({ ...poForm, itemDescription: e.target.value })
                }
                required
              />

              <Input
                label="Quantity"
                type="number"
                value={poForm.quantity}
                onChange={(e) =>
                  setPoForm({ ...poForm, quantity: Number(e.target.value) })
                }
              />

              <Input
                label="Unit"
                value={poForm.unit}
                onChange={(e) => setPoForm({ ...poForm, unit: e.target.value })}
                required
              />

              <Input
                label="Unit Price"
                type="number"
                value={poForm.unitPrice}
                onChange={(e) =>
                  setPoForm({ ...poForm, unitPrice: Number(e.target.value) })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Purchase Order
              </Button>
            </form>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <Card title="Suppliers">
            <DataTable<Supplier>
              columns={[
                { header: 'Name', accessor: 'name' },
                { header: 'Email', accessor: (row) => row.email || '-' },
                { header: 'Phone', accessor: (row) => row.phone || '-' },
                { header: 'Status', accessor: (row) => row.isActive ? 'Active' : 'Inactive' },
              ]}
              data={suppliers}
            />
          </Card>

          <Card title="Purchase Requests">
            <DataTable<PurchaseRequest>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Description',
                  accessor: (row) => truncate(row.description),
                },
                {
                  header: 'Items',
                  accessor: (row) => row.items?.length ?? 0,
                },
              ]}
              data={purchaseRequests}
            />
          </Card>

          <Card title="Purchase Orders">
            <DataTable<PurchaseOrder>
              columns={[
                { header: 'Code', accessor: 'code' },
                {
                  header: 'Supplier',
                  accessor: (row) => row.supplier?.name || '-',
                },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Total',
                  accessor: (row) =>
                    row.totalAmount ? Number(row.totalAmount).toLocaleString() : '-',
                },
                {
                  header: 'Date',
                  accessor: (row) => formatDate(row.orderDate),
                },
              ]}
              data={purchaseOrders}
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