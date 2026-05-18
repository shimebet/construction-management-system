import { useEffect, useState } from 'react';
import { documentsApi } from '../../api/documents.api';
import type {
  CreateDocumentPayload,
  DocumentStatus,
  DocumentType,
  ProjectDocument,
} from '../../api/documents.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

const documentTypes: DocumentType[] = [
  'DRAWING',
  'RFI',
  'SUBMITTAL',
  'METHOD_STATEMENT',
  'INSPECTION_REQUEST',
  'CONTRACT',
  'REPORT',
  'OTHER',
];

const documentStatuses: DocumentStatus[] = [
  'WIP',
  'SHARED',
  'PUBLISHED',
  'ARCHIVED',
  'REJECTED',
];

export default function DocumentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [revision, setRevision] = useState('');
  const [versionStatus, setVersionStatus] = useState<DocumentStatus>('WIP');
  const [versionNotes, setVersionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateDocumentPayload>({
    projectId: 0,
    code: '',
    title: '',
    type: 'DRAWING',
    discipline: '',
    originator: '',
    zone: '',
    level: '',
    status: 'WIP',
    currentRevision: '',
    description: '',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadDocuments(projectId: number) {
    try {
      setLoading(true);
      const data = await documentsApi.findByProject(projectId);
      setDocuments(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(
    name: keyof CreateDocumentPayload,
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
    setSelectedDocumentId('');

    setForm((prev) => ({
      ...prev,
      projectId,
    }));

    await loadDocuments(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await documentsApi.create({
        ...form,
        projectId: Number(form.projectId),
      });

      setForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        type: 'DRAWING',
        discipline: '',
        originator: '',
        zone: '',
        level: '',
        status: 'WIP',
        currentRevision: '',
        description: '',
      }));

      setMessage('Document created successfully');

      if (selectedProjectId) {
        await loadDocuments(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create document');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDocumentId || !selectedFile || !revision) {
      setMessage('Select document, file, and revision before upload');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await documentsApi.uploadVersion(Number(selectedDocumentId), {
        file: selectedFile,
        revision,
        status: versionStatus,
        notes: versionNotes,
      });

      setSelectedFile(null);
      setRevision('');
      setVersionStatus('WIP');
      setVersionNotes('');

      const fileInput = document.getElementById(
        'document-file',
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = '';
      }

      setMessage('Document version uploaded successfully');

      if (selectedProjectId) {
        await loadDocuments(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(versionId: number) {
    const token = localStorage.getItem('accessToken');

    fetch(documentsApi.getDownloadUrl(versionId), {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Download failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `document-version-${versionId}`;
        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        setMessage('Failed to download file');
      });
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Manage ISO 19650-style documents, revisions, upload, and secure download."
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
          <Card title="Create Document">
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
                label="Document Code"
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

              <SelectField
                label="Type"
                value={form.type}
                onChange={(value) => updateField('type', value)}
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectField>

              <Input
                label="Discipline"
                value={form.discipline}
                onChange={(e) => updateField('discipline', e.target.value)}
              />

              <Input
                label="Originator"
                value={form.originator}
                onChange={(e) => updateField('originator', e.target.value)}
              />

              <Input
                label="Zone"
                value={form.zone}
                onChange={(e) => updateField('zone', e.target.value)}
              />

              <Input
                label="Level"
                value={form.level}
                onChange={(e) => updateField('level', e.target.value)}
              />

              <SelectField
                label="Status"
                value={form.status ?? 'WIP'}
                onChange={(value) => updateField('status', value)}
              >
                {documentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>

              <Input
                label="Description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Saving...' : 'Create Document'}
              </Button>
            </form>
          </Card>

          <Card title="Upload Version">
            <form onSubmit={handleUpload}>
              <SelectField
                label="Document"
                value={selectedDocumentId}
                onChange={(value) =>
                  setSelectedDocumentId(value ? Number(value) : '')
                }
              >
                <option value="">Select document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.code} - {doc.title}
                  </option>
                ))}
              </SelectField>

              <Input
                label="Revision"
                placeholder="P01"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                required
              />

              <SelectField
                label="Version Status"
                value={versionStatus}
                onChange={(value) => setVersionStatus(value as DocumentStatus)}
              >
                {documentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>

              <Input
                label="Notes"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
              />

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  File
                </label>

                <input
                  id="document-file"
                  type="file"
                  onChange={(e) =>
                    setSelectedFile(e.target.files ? e.target.files[0] : null)
                  }
                />
              </div>

              <Button disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Uploading...' : 'Upload Version'}
              </Button>
            </form>
          </Card>
        </div>

        <Card title="Document List">
          {loading && <p>Loading...</p>}

          <DataTable<ProjectDocument>
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
                header: 'Type',
                accessor: 'type',
              },
              {
                header: 'Status',
                accessor: 'status',
              },
              {
                header: 'Revision',
                accessor: (row) => row.currentRevision || '-',
              },
              {
                header: 'Versions',
                accessor: (row) => row.versions?.length ?? 0,
              },
              {
                header: 'Download Latest',
                accessor: (row) => {
                  const latest = row.versions?.[0];

                  if (!latest) {
                    return '-';
                  }

                  return (
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(latest.id)}
                      style={{ padding: '6px 10px' }}
                    >
                      Download
                    </Button>
                  );
                },
              },
            ]}
            data={documents}
            emptyMessage="No documents found"
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