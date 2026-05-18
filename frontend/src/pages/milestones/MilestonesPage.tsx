import { useEffect, useState } from 'react';
import { milestonesApi } from '../../api/milestones.api';
import type {
  CreateMilestonePayload,
  Milestone,
} from '../../api/milestones.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function MilestonesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateMilestonePayload>({
    projectId: 0,
    code: '',
    name: '',
    description: '',
    plannedDate: '',
    actualDate: '',
    status: 'PLANNED',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadMilestones(projectId: number) {
    try {
      setLoading(true);
      const data = await milestonesApi.findByProject(projectId);
      setMilestones(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(
    name: keyof CreateMilestonePayload,
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

    await loadMilestones(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await milestonesApi.create({
        ...form,
        projectId: Number(form.projectId),
        actualDate: form.actualDate || undefined,
      });

      setForm((prev) => ({
        ...prev,
        code: '',
        name: '',
        description: '',
        plannedDate: '',
        actualDate: '',
        status: 'PLANNED',
      }));

      setMessage('Milestone created successfully');

      if (selectedProjectId) {
        await loadMilestones(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create milestone');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Cancel this milestone?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await milestonesApi.remove(id);
      setMessage('Milestone cancelled successfully');

      if (selectedProjectId) {
        await loadMilestones(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to cancel milestone');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Milestones"
        description="Track critical project milestones, planned dates, actual dates, and status."
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
        <Card title="Create Milestone">
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
              label="Milestone Code"
              value={form.code}
              onChange={(e) => updateField('code', e.target.value)}
              required
            />

            <Input
              label="Milestone Name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />

            <Input
              label="Description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />

            <Input
              label="Planned Date"
              type="date"
              value={form.plannedDate}
              onChange={(e) => updateField('plannedDate', e.target.value)}
              required
            />

            <Input
              label="Actual Date"
              type="date"
              value={form.actualDate}
              onChange={(e) => updateField('actualDate', e.target.value)}
            />

            <SelectField
              label="Status"
              value={form.status ?? 'PLANNED'}
              onChange={(value) => updateField('status', value)}
            >
              <option value="PLANNED">Planned</option>
              <option value="ACHIEVED">Achieved</option>
              <option value="DELAYED">Delayed</option>
              <option value="CANCELLED">Cancelled</option>
            </SelectField>

            <Button disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Create Milestone'}
            </Button>
          </form>
        </Card>

        <Card title="Milestone List">
          {loading && <p>Loading...</p>}

          <DataTable<Milestone>
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
                header: 'Planned',
                accessor: (row) => formatDate(row.plannedDate),
              },
              {
                header: 'Actual',
                accessor: (row) => formatDate(row.actualDate),
              },
              {
                header: 'Status',
                accessor: 'status',
              },
              {
                header: 'Description',
                accessor: (row) => row.description || '-',
              },
              {
                header: 'Actions',
                accessor: (row) => (
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(row.id)}
                    style={{ padding: '6px 10px' }}
                  >
                    Cancel
                  </Button>
                ),
              },
            ]}
            data={milestones}
            emptyMessage="No milestones found"
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