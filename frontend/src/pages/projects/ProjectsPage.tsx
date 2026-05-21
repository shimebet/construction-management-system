import { useEffect, useState } from 'react';

import { companiesApi } from '../../api/companies.api';
import type { Company } from '../../api/companies.api';

import { projectsApi } from '../../api/projects.api';
import type { CreateProjectPayload, Project } from '../../api/projects.api';

import PermissionGuard from '../../components/auth/PermissionGuard';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function ProjectsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateProjectPayload>({
    companyId: 0,
    code: '',
    name: '',
    description: '',
    clientName: '',
    location: '',
    startDate: '',
    endDate: '',
    budget: undefined,
    currency: 'USD',
    status: 'PLANNING',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    await Promise.all([loadCompanies(), loadProjects()]);
  }

  async function loadCompanies() {
    try {
      const data = await companiesApi.findAll();
      setCompanies(data);

      if (data.length > 0) {
        setForm((prev) => ({
          ...prev,
          companyId: prev.companyId || data[0].id,
        }));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load companies');
    }
  }

  async function loadProjects(companyId?: number) {
    try {
      setLoading(true);
      const data = await projectsApi.findAll(companyId);
      setProjects(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    name: keyof CreateProjectPayload,
    value: string | number | undefined,
  ) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleFilter(companyIdValue: string) {
    if (!companyIdValue) {
      setSelectedCompanyId('');
      await loadProjects();
      return;
    }

    const companyId = Number(companyIdValue);
    setSelectedCompanyId(companyId);
    await loadProjects(companyId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await projectsApi.create({
        ...form,
        companyId: Number(form.companyId),
        budget: form.budget ? Number(form.budget) : undefined,
      });

      setForm((prev) => ({
        ...prev,
        code: '',
        name: '',
        description: '',
        clientName: '',
        location: '',
        startDate: '',
        endDate: '',
        budget: undefined,
        currency: 'USD',
        status: 'PLANNING',
      }));

      setMessage('Project created successfully');

      await loadProjects(
        selectedCompanyId ? Number(selectedCompanyId) : undefined,
      );
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Cancel this project?');

    if (!confirmed) return;

    try {
      setLoading(true);

      await projectsApi.remove(id);

      setMessage('Project cancelled successfully');

      await loadProjects(
        selectedCompanyId ? Number(selectedCompanyId) : undefined,
      );
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to cancel project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage construction projects and link them to companies."
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
          <PermissionGuard permissions={['projects:create']}>
            <Card title="Create Project">
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Company
                  </label>

                  <select
                    value={form.companyId}
                    onChange={(e) =>
                      updateField('companyId', Number(e.target.value))
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #d1d5db',
                    }}
                  >
                    <option value={0}>Select company</option>

                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Project Code"
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value)}
                  required
                />

                <Input
                  label="Project Name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />

                <Input
                  label="Client Name"
                  value={form.clientName}
                  onChange={(e) => updateField('clientName', e.target.value)}
                />

                <Input
                  label="Location"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />

                <Input
                  label="Start Date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />

                <Input
                  label="End Date"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                />

                <Input
                  label="Budget"
                  type="number"
                  value={form.budget ?? ''}
                  onChange={(e) =>
                    updateField(
                      'budget',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />

                <Input
                  label="Currency"
                  value={form.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                />

                <Button disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Saving...' : 'Create Project'}
                </Button>
              </form>
            </Card>
          </PermissionGuard>
        </div>

        <div className="module-content">
          <Card title="Project List">
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Filter by Company
              </label>

              <select
                value={selectedCompanyId}
                onChange={(e) => handleFilter(e.target.value)}
                style={{
                  width: 260,
                  maxWidth: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              >
                <option value="">All companies</option>

                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {loading && <p>Loading...</p>}

            <DataTable<Project>
              columns={[
                {
                  header: 'Code',
                  accessor: 'code',
                },
                {
                  header: 'Name',
                  accessor: 'name',
                },
                {
                  header: 'Company',
                  accessor: (row) => row.company?.name || row.companyId,
                },
                {
                  header: 'Client',
                  accessor: (row) => row.clientName || '-',
                },
                {
                  header: 'Location',
                  accessor: (row) => row.location || '-',
                },
                {
                  header: 'Budget',
                  accessor: (row) =>
                    row.budget
                      ? `${row.currency} ${Number(row.budget).toLocaleString()}`
                      : '-',
                },
                {
                  header: 'Status',
                  accessor: 'status',
                },
                {
                  header: 'Actions',
                  accessor: (row) => (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <PermissionGuard permissions={['projects:update']}>
                        <Button
                          variant="secondary"
                          style={{ padding: '6px 10px' }}
                        >
                          Edit
                        </Button>
                      </PermissionGuard>

                      <PermissionGuard permissions={['projects:delete']}>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(row.id)}
                          style={{ padding: '6px 10px' }}
                        >
                          Cancel
                        </Button>
                      </PermissionGuard>
                    </div>
                  ),
                },
              ]}
              data={projects}
              emptyMessage="No projects found"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}