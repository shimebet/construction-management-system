import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { rfisApi } from '../../api/rfis.api';
import type { CreateRfiPayload, Rfi } from '../../api/rfis.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function RfisPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [rfis, setRfis] = useState<Rfi[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedRfiId, setSelectedRfiId] = useState<number | ''>('');
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('ANSWERED');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateRfiPayload>({
    projectId: 0,
    code: '',
    title: '',
    question: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    dueDate: '',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadRfis(projectId: number) {
    try {
      setLoading(true);
      const data = await rfisApi.findByProject(projectId);
      setRfis(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load RFIs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(name: keyof CreateRfiPayload, value: string | number) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleProjectChange(value: string) {
    const projectId = Number(value);

    setSelectedProjectId(projectId);
    setSelectedRfiId('');

    setForm((prev) => ({
      ...prev,
      projectId,
    }));

    await loadRfis(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await rfisApi.create({
        ...form,
        projectId: Number(form.projectId),
        dueDate: form.dueDate || undefined,
      });

      setForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        question: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        dueDate: '',
      }));

      setMessage('RFI created successfully');

      if (selectedProjectId) {
        await loadRfis(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create RFI');
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedRfiId || !responseText) {
      setMessage('Select RFI and enter response');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await rfisApi.respond(Number(selectedRfiId), {
        response: responseText,
        status: responseStatus,
      });

      setSelectedRfiId('');
      setResponseText('');
      setResponseStatus('ANSWERED');

      setMessage('RFI response saved successfully');

      if (selectedProjectId) {
        await loadRfis(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to respond to RFI');
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(id: number) {
    const confirmed = window.confirm('Close this RFI?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await rfisApi.close(id);
      setMessage('RFI closed successfully');

      if (selectedProjectId) {
        await loadRfis(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to close RFI');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="RFIs"
        description="Manage Requests For Information, responses, priorities, and due dates."
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
          <Card title="Create RFI">
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
                label="RFI Code"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value)}
                required
              />

              <Input
                label="Title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
              />

              <TextareaField
                label="Question"
                value={form.question}
                onChange={(value) => updateField('question', value)}
              />

              <SelectField
                label="Priority"
                value={form.priority ?? 'MEDIUM'}
                onChange={(value) => updateField('priority', value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </SelectField>

              <SelectField
                label="Status"
                value={form.status ?? 'OPEN'}
                onChange={(value) => updateField('status', value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="OPEN">Open</option>
                <option value="ANSWERED">Answered</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
              </SelectField>

              <Input
                label="Due Date"
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : 'Create RFI'}
              </Button>
            </form>
          </Card>

          <Card title="Respond to RFI">
            <form onSubmit={handleRespond}>
              <SelectField
                label="RFI"
                value={selectedRfiId}
                onChange={(value) =>
                  setSelectedRfiId(value ? Number(value) : '')
                }
              >
                <option value="">Select RFI</option>
                {rfis
                  .filter((rfi) => rfi.status !== 'CLOSED')
                  .map((rfi) => (
                    <option key={rfi.id} value={rfi.id}>
                      {rfi.code} - {rfi.title}
                    </option>
                  ))}
              </SelectField>

              <TextareaField
                label="Response"
                value={responseText}
                onChange={setResponseText}
              />

              <SelectField
                label="Response Status"
                value={responseStatus}
                onChange={setResponseStatus}
              >
                <option value="ANSWERED">Answered</option>
                <option value="REJECTED">Rejected</option>
              </SelectField>

              <Button disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : 'Submit Response'}
              </Button>
            </form>
          </Card>
        </div>

        <Card title="RFI List">
          {loading && <p>Loading...</p>}

          <DataTable<Rfi>
            columns={[
              {
                header: 'Code',
                accessor: 'code',
              },
              {
                header: 'Title',
                accessor: 'title',
              },
              {
                header: 'Priority',
                accessor: 'priority',
              },
              {
                header: 'Status',
                accessor: 'status',
              },
              {
                header: 'Due Date',
                accessor: (row) => formatDate(row.dueDate),
              },
              {
                header: 'Question',
                accessor: (row) => truncate(row.question),
              },
              {
                header: 'Response',
                accessor: (row) => truncate(row.response),
              },
              {
                header: 'Actions',
                accessor: (row) =>
                  row.status !== 'CLOSED' ? (
                    <Button
                      variant="secondary"
                      onClick={() => handleClose(row.id)}
                      style={{ padding: '6px 10px' }}
                    >
                      Close
                    </Button>
                  ) : (
                    '-'
                  ),
              },
            ]}
            data={rfis}
            emptyMessage="No RFIs found"
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
        rows={4}
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