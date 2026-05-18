import { useEffect, useState } from 'react';
import { documentsApi } from '../../api/documents.api';
import type { ProjectDocument } from '../../api/documents.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { submittalsApi } from '../../api/submittals.api';
import type {
  CreateSubmittalPayload,
  Submittal,
} from '../../api/submittals.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

const submittalStatuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'APPROVED_WITH_COMMENTS',
  'REJECTED',
  'REVISE_AND_RESUBMIT',
];

export default function SubmittalsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedSubmittalId, setSelectedSubmittalId] = useState<number | ''>('');
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewComments, setReviewComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateSubmittalPayload>({
    projectId: 0,
    code: '',
    title: '',
    description: '',
    status: 'DRAFT',
    revision: '',
    dueDate: '',
    documentId: undefined,
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadProjectData(projectId: number) {
    try {
      setLoading(true);

      const [submittalData, documentData] = await Promise.all([
        submittalsApi.findByProject(projectId),
        documentsApi.findByProject(projectId),
      ]);

      setSubmittals(submittalData);
      setDocuments(documentData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load submittals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(
    name: keyof CreateSubmittalPayload,
    value: string | number | undefined,
  ) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleProjectChange(value: string) {
    const projectId = Number(value);

    setSelectedProjectId(projectId);
    setSelectedSubmittalId('');

    setForm((prev) => ({
      ...prev,
      projectId,
      documentId: undefined,
    }));

    await loadProjectData(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await submittalsApi.create({
        ...form,
        projectId: Number(form.projectId),
        documentId: form.documentId ? Number(form.documentId) : undefined,
        dueDate: form.dueDate || undefined,
      });

      setForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        description: '',
        status: 'DRAFT',
        revision: '',
        dueDate: '',
        documentId: undefined,
      }));

      setMessage('Submittal created successfully');

      if (selectedProjectId) {
        await loadProjectData(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create submittal');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(id: number) {
    try {
      setLoading(true);
      await submittalsApi.submit(id);
      setMessage('Submittal submitted successfully');

      if (selectedProjectId) {
        await loadProjectData(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to submit submittal');
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSubmittalId) {
      setMessage('Select submittal before review');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await submittalsApi.review(Number(selectedSubmittalId), {
        status: reviewStatus,
        comments: reviewComments,
      });

      setSelectedSubmittalId('');
      setReviewStatus('APPROVED');
      setReviewComments('');

      setMessage('Submittal reviewed successfully');

      if (selectedProjectId) {
        await loadProjectData(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to review submittal');
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(id: number) {
    const confirmed = window.confirm('Close this submittal?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await submittalsApi.close(id);
      setMessage('Submittal closed successfully');

      if (selectedProjectId) {
        await loadProjectData(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to close submittal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Submittals"
        description="Manage shop drawings, material approvals, method statements, and technical submissions."
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
          <Card title="Create Submittal">
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
                label="Submittal Code"
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
                label="Description"
                value={form.description ?? ''}
                onChange={(value) => updateField('description', value)}
              />

              <Input
                label="Revision"
                value={form.revision ?? ''}
                onChange={(e) => updateField('revision', e.target.value)}
              />

              <Input
                label="Due Date"
                type="date"
                value={form.dueDate ?? ''}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />

              <SelectField
                label="Status"
                value={form.status ?? 'DRAFT'}
                onChange={(value) => updateField('status', value)}
              >
                {submittalStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Linked Document"
                value={form.documentId ?? ''}
                onChange={(value) =>
                  updateField('documentId', value ? Number(value) : undefined)
                }
              >
                <option value="">No linked document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.code} - {doc.title}
                  </option>
                ))}
              </SelectField>

              <Button disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : 'Create Submittal'}
              </Button>
            </form>
          </Card>

          <Card title="Review Submittal">
            <form onSubmit={handleReview}>
              <SelectField
                label="Submittal"
                value={selectedSubmittalId}
                onChange={(value) =>
                  setSelectedSubmittalId(value ? Number(value) : '')
                }
              >
                <option value="">Select submittal</option>
                {submittals.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.title}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Review Status"
                value={reviewStatus}
                onChange={setReviewStatus}
              >
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="APPROVED_WITH_COMMENTS">
                  Approved With Comments
                </option>
                <option value="REJECTED">Rejected</option>
                <option value="REVISE_AND_RESUBMIT">Revise and Resubmit</option>
              </SelectField>

              <TextareaField
                label="Comments"
                value={reviewComments}
                onChange={setReviewComments}
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : 'Save Review'}
              </Button>
            </form>
          </Card>
        </div>

        <Card title="Submittal List">
          {loading && <p>Loading...</p>}

          <DataTable<Submittal>
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
                header: 'Revision',
                accessor: (row) => row.revision || '-',
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
                header: 'Document',
                accessor: (row) =>
                  row.document ? `${row.document.code}` : '-',
              },
              {
                header: 'Actions',
                accessor: (row) => (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {row.status === 'DRAFT' && (
                      <Button
                        onClick={() => handleSubmit(row.id)}
                        style={{ padding: '6px 10px' }}
                      >
                        Submit
                      </Button>
                    )}

                    {!row.closedAt && (
                      <Button
                        variant="secondary"
                        onClick={() => handleClose(row.id)}
                        style={{ padding: '6px 10px' }}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={submittals}
            emptyMessage="No submittals found"
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