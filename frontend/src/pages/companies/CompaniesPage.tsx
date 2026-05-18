import { useEffect, useState } from 'react';
import { companiesApi } from '../../api/companies.api';
import type {
  Company,
  CreateCompanyPayload,
} from '../../api/companies.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateCompanyPayload>({
    name: '',
    legalName: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
  });

  async function loadCompanies() {
    try {
      setLoading(true);
      const data = await companiesApi.findAll();
      setCompanies(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  function updateField(name: keyof CreateCompanyPayload, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await companiesApi.create(form);

      setForm({
        name: '',
        legalName: '',
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
        currency: 'USD',
        timezone: 'UTC',
        language: 'en',
      });

      setMessage('Company created successfully');
      await loadCompanies();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Deactivate this company?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await companiesApi.remove(id);
      setMessage('Company deactivated successfully');
      await loadCompanies();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to deactivate company');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Manage construction companies, clients, consultants, and contractors."
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <Card title="Create Company">
          <form onSubmit={handleCreate}>
            <Input
              label="Company Name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />

            <Input
              label="Legal Name"
              value={form.legalName}
              onChange={(e) => updateField('legalName', e.target.value)}
            />

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />

            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />

            <Input
              label="Address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
            />

            <Input
              label="Tax Number"
              value={form.taxNumber}
              onChange={(e) => updateField('taxNumber', e.target.value)}
            />

            <Input
              label="Currency"
              value={form.currency}
              onChange={(e) => updateField('currency', e.target.value)}
            />

            <Button disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Create Company'}
            </Button>
          </form>
        </Card>

        <Card title="Company List">
          {loading && <p>Loading...</p>}

          <DataTable<Company>
            columns={[
              {
                header: 'Name',
                accessor: 'name',
              },
              {
                header: 'Email',
                accessor: (row) => row.email || '-',
              },
              {
                header: 'Phone',
                accessor: (row) => row.phone || '-',
              },
              {
                header: 'Currency',
                accessor: 'currency',
              },
              {
                header: 'Status',
                accessor: (row) => (row.isActive ? 'Active' : 'Inactive'),
              },
              {
                header: 'Actions',
                accessor: (row) => (
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(row.id)}
                    style={{ padding: '6px 10px' }}
                  >
                    Deactivate
                  </Button>
                ),
              },
            ]}
            data={companies}
            emptyMessage="No companies found"
          />
        </Card>
      </div>
    </div>
  );
}