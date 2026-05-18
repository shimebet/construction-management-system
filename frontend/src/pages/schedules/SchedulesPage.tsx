import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { schedulesApi } from '../../api/schedules.api';
import type {
  CreateBaselinePayload,
  ScheduleBaseline,
} from '../../api/schedules.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function SchedulesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [baselines, setBaselines] = useState<ScheduleBaseline[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateBaselinePayload>({
    projectId: 0,
    name: '',
    version: '',
    description: '',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadBaselines(projectId: number) {
    try {
      setLoading(true);
      const data = await schedulesApi.findByProject(projectId);
      setBaselines(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load baselines');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(
    name: keyof CreateBaselinePayload,
    value: string | number,
  ) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleProjectChange(value: string) {
    const projectId = Number(value);

    setSelectedProjectId(projectId);

    setForm((prev) => ({
      ...prev,
      projectId,
    }));

    await loadBaselines(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await schedulesApi.createBaseline({
        ...form,
        projectId: Number(form.projectId),
      });

      setForm((prev) => ({
        ...prev,
        name: '',
        version: '',
        description: '',
      }));

      setMessage('Schedule baseline created successfully');

      if (selectedProjectId) {
        await loadBaselines(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to create schedule baseline',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    const confirmed = window.confirm('Approve this schedule baseline?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await schedulesApi.approveBaseline(id);
      setMessage('Schedule baseline approved successfully');

      if (selectedProjectId) {
        await loadBaselines(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to approve schedule baseline',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Delete this schedule baseline?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await schedulesApi.removeBaseline(id);
      setMessage('Schedule baseline deleted successfully');

      if (selectedProjectId) {
        await loadBaselines(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to delete schedule baseline',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Schedule Baselines"
        description="Create, approve, and manage project schedule baseline snapshots."
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
        <Card title="Create Baseline">
          <form onSubmit={handleCreate}>
            <SelectField
              label="Project"
              value={form.projectId}
              onChange={(value) => handleProjectChange(value)}
            >
              <option value={0}>Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </SelectField>

            <Input
              label="Baseline Name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />

            <Input
              label="Version"
              placeholder="BL-001"
              value={form.version}
              onChange={(e) => updateField('version', e.target.value)}
              required
            />

            <Input
              label="Description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />

            <Button disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Create Baseline'}
            </Button>
          </form>
        </Card>

        <Card title="Baseline List">
          {loading && <p>Loading...</p>}

          <DataTable<ScheduleBaseline>
            columns={[
              {
                header: 'Version',
                accessor: 'version',
              },
              {
                header: 'Name',
                accessor: 'name',
              },
              {
                header: 'Status',
                accessor: 'status',
              },
              {
                header: 'Tasks',
                accessor: (row) => row.items?.length ?? 0,
              },
              {
                header: 'Approved At',
                accessor: (row) => formatDate(row.approvedAt),
              },
              {
                header: 'Created',
                accessor: (row) => formatDate(row.createdAt),
              },
              {
                header: 'Actions',
                accessor: (row) => (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {row.status !== 'APPROVED' && (
                      <Button
                        onClick={() => handleApprove(row.id)}
                        style={{ padding: '6px 10px' }}
                      >
                        Approve
                      </Button>
                    )}

                    {row.status !== 'APPROVED' && (
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(row.id)}
                        style={{ padding: '6px 10px' }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={baselines}
            emptyMessage="No schedule baselines found"
          />
        </Card>
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

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}