import { useEffect, useState } from 'react';
import { dailyReportsApi } from '../../api/daily-reports.api';
import type {
  CreateDailyReportPayload,
  DailyReport,
} from '../../api/daily-reports.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function DailyReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateDailyReportPayload>({
    projectId: 0,
    reportDate: '',
    weather: '',
    manpowerCount: 0,
    equipmentUsed: '',
    workCompleted: '',
    materialReceived: '',
    sitePhotos: [],
    issues: '',
    delays: '',
    remarks: '',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadReports(projectId: number) {
    try {
      setLoading(true);
      const data = await dailyReportsApi.findByProject(projectId);
      setReports(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(
    name: keyof CreateDailyReportPayload,
    value: string | number | string[],
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

    await loadReports(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await dailyReportsApi.create({
        ...form,
        projectId: Number(form.projectId),
        manpowerCount: Number(form.manpowerCount ?? 0),
      });

      setForm((prev) => ({
        ...prev,
        reportDate: '',
        weather: '',
        manpowerCount: 0,
        equipmentUsed: '',
        workCompleted: '',
        materialReceived: '',
        sitePhotos: [],
        issues: '',
        delays: '',
        remarks: '',
      }));

      setMessage('Daily report created successfully');

      if (selectedProjectId) {
        await loadReports(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create daily report');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Delete this daily report?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await dailyReportsApi.remove(id);
      setMessage('Daily report deleted successfully');

      if (selectedProjectId) {
        await loadReports(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete daily report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        description="Record site daily reports including weather, manpower, work progress, delays, and remarks."
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
        <Card title="Create Daily Report">
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
              label="Report Date"
              type="date"
              value={form.reportDate}
              onChange={(e) => updateField('reportDate', e.target.value)}
              required
            />

            <Input
              label="Weather"
              value={form.weather}
              onChange={(e) => updateField('weather', e.target.value)}
            />

            <Input
              label="Manpower Count"
              type="number"
              value={form.manpowerCount ?? 0}
              onChange={(e) =>
                updateField('manpowerCount', Number(e.target.value))
              }
            />

            <TextareaField
              label="Equipment Used"
              value={form.equipmentUsed ?? ''}
              onChange={(value) => updateField('equipmentUsed', value)}
            />

            <TextareaField
              label="Work Completed"
              value={form.workCompleted ?? ''}
              onChange={(value) => updateField('workCompleted', value)}
            />

            <TextareaField
              label="Material Received"
              value={form.materialReceived ?? ''}
              onChange={(value) => updateField('materialReceived', value)}
            />

            <TextareaField
              label="Issues"
              value={form.issues ?? ''}
              onChange={(value) => updateField('issues', value)}
            />

            <TextareaField
              label="Delays"
              value={form.delays ?? ''}
              onChange={(value) => updateField('delays', value)}
            />

            <TextareaField
              label="Remarks"
              value={form.remarks ?? ''}
              onChange={(value) => updateField('remarks', value)}
            />

            <Button disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Create Report'}
            </Button>
          </form>
        </Card>

        <Card title="Daily Report List">
          {loading && <p>Loading...</p>}

          <DataTable<DailyReport>
            columns={[
              {
                header: 'Date',
                accessor: (row) => formatDate(row.reportDate),
              },
              {
                header: 'Weather',
                accessor: (row) => row.weather || '-',
              },
              {
                header: 'Manpower',
                accessor: 'manpowerCount',
              },
              {
                header: 'Work Completed',
                accessor: (row) => truncate(row.workCompleted),
              },
              {
                header: 'Issues',
                accessor: (row) => truncate(row.issues),
              },
              {
                header: 'Delays',
                accessor: (row) => truncate(row.delays),
              },
              {
                header: 'Prepared By',
                accessor: (row) => row.preparedBy?.name || '-',
              },
              {
                header: 'Actions',
                accessor: (row) => (
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(row.id)}
                    style={{ padding: '6px 10px' }}
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            data={reports}
            emptyMessage="No daily reports found"
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
  return value.length > 40 ? `${value.slice(0, 40)}...` : value;
}