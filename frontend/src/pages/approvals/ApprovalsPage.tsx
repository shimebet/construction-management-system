import { useEffect, useState } from 'react';
import { approvalsApi } from '../../api/approvals.api';
import type {
  Approval,
  CreateApprovalPayload,
} from '../../api/approvals.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function ApprovalsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | ''>('');
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewComments, setReviewComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateApprovalPayload>({
    projectId: 0,
    status: 'PENDING',
    module: '',
    entityName: '',
    entityId: 0,
    comments: '',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadApprovals(projectId: number) {
    try {
      setLoading(true);
      const data = await approvalsApi.findByProject(projectId);
      setApprovals(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(
    name: keyof CreateApprovalPayload,
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
    setSelectedApprovalId('');

    setForm((prev) => ({
      ...prev,
      projectId,
    }));

    await loadApprovals(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await approvalsApi.create({
        ...form,
        projectId: Number(form.projectId),
        entityId: Number(form.entityId),
      });

      setForm((prev) => ({
        ...prev,
        status: 'PENDING',
        module: '',
        entityName: '',
        entityId: 0,
        comments: '',
      }));

      setMessage('Approval created successfully');

      if (selectedProjectId) {
        await loadApprovals(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create approval');
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedApprovalId) {
      setMessage('Select approval first');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await approvalsApi.review(Number(selectedApprovalId), {
        status: reviewStatus,
        comments: reviewComments,
      });

      setSelectedApprovalId('');
      setReviewStatus('APPROVED');
      setReviewComments('');

      setMessage('Approval reviewed successfully');

      if (selectedProjectId) {
        await loadApprovals(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to review approval');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: number) {
    const confirmed = window.confirm('Cancel/return this approval?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await approvalsApi.cancel(id);
      setMessage('Approval cancelled successfully');

      if (selectedProjectId) {
        await loadApprovals(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to cancel approval');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Create, review, approve, reject, and return workflow approvals."
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
        

          <Card title="Create Approval">
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
                label="Module"
                placeholder="submittals"
                value={form.module}
                onChange={(e) => updateField('module', e.target.value)}
                required
              />

              <Input
                label="Entity Name"
                placeholder="Submittal"
                value={form.entityName}
                onChange={(e) => updateField('entityName', e.target.value)}
                required
              />

              <Input
                label="Entity ID"
                type="number"
                value={form.entityId || ''}
                onChange={(e) => updateField('entityId', Number(e.target.value))}
                required
              />

              <SelectField
                label="Status"
                value={form.status ?? 'PENDING'}
                onChange={(value) => updateField('status', value)}
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="RETURNED">Returned</option>
              </SelectField>

              <TextareaField
                label="Comments"
                value={form.comments ?? ''}
                onChange={(value) => updateField('comments', value)}
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : 'Create Approval'}
              </Button>
            </form>
          </Card>

          <Card title="Review Approval">
            <form onSubmit={handleReview}>
              <SelectField
                label="Approval"
                value={selectedApprovalId}
                onChange={(value) =>
                  setSelectedApprovalId(value ? Number(value) : '')
                }
              >
                <option value="">Select approval</option>
                {approvals
                  .filter((approval) => approval.status === 'PENDING')
                  .map((approval) => (
                    <option key={approval.id} value={approval.id}>
                      #{approval.id} - {approval.module}:{approval.entityName}:
                      {approval.entityId}
                    </option>
                  ))}
              </SelectField>

              <SelectField
                label="Review Status"
                value={reviewStatus}
                onChange={setReviewStatus}
              >
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="RETURNED">Returned</option>
              </SelectField>

              <TextareaField
                label="Review Comments"
                value={reviewComments}
                onChange={setReviewComments}
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : 'Save Review'}
              </Button>
            </form>
          </Card>
        </div>

        <Card title="Approval List">
          {loading && <p>Loading...</p>}

          <DataTable<Approval>
            columns={[
              {
                header: 'ID',
                accessor: (row) => `#${row.id}`,
              },
              {
                header: 'Module',
                accessor: 'module',
              },
              {
                header: 'Entity',
                accessor: (row) => `${row.entityName} #${row.entityId}`,
              },
              {
                header: 'Status',
                accessor: 'status',
              },
              {
                header: 'Reviewer',
                accessor: (row) => row.user?.name || '-',
              },
              {
                header: 'Approved At',
                accessor: (row) => formatDate(row.approvedAt),
              },
              {
                header: 'Comments',
                accessor: (row) => truncate(row.comments),
              },
              {
                header: 'Actions',
                accessor: (row) =>
                  row.status === 'PENDING' ? (
                    <Button
                      variant="secondary"
                      onClick={() => handleCancel(row.id)}
                      style={{ padding: '6px 10px' }}
                    >
                      Cancel
                    </Button>
                  ) : (
                    '-'
                  ),
              },
            ]}
            data={approvals}
            emptyMessage="No approvals found"
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