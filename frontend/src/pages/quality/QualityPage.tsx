import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { qualityApi } from '../../api/quality.api';
import type {
  Inspection,
  NcrReport,
  QualityChecklist,
} from '../../api/quality.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function QualityPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [checklists, setChecklists] = useState<QualityChecklist[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [ncrs, setNcrs] = useState<NcrReport[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [checklistForm, setChecklistForm] = useState({
    projectId: 0,
    code: '',
    title: '',
    description: '',
    itemsText: '',
  });

  const [inspectionForm, setInspectionForm] = useState({
    projectId: 0,
    checklistId: '',
    code: '',
    title: '',
    location: '',
    inspectionDate: '',
    status: 'PLANNED',
    result: '',
  });

  const [ncrForm, setNcrForm] = useState({
    projectId: 0,
    code: '',
    title: '',
    description: '',
    status: 'OPEN',
    correctiveAction: '',
    dueDate: '',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadQuality(projectId: number) {
    try {
      setLoading(true);

      const [checklistData, inspectionData, ncrData] = await Promise.all([
        qualityApi.findChecklists(projectId),
        qualityApi.findInspections(projectId),
        qualityApi.findNcrs(projectId),
      ]);

      setChecklists(checklistData);
      setInspections(inspectionData);
      setNcrs(ncrData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load quality data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleProjectChange(value: string) {
    const projectId = Number(value);

    setSelectedProjectId(projectId);

    setChecklistForm((prev) => ({ ...prev, projectId }));
    setInspectionForm((prev) => ({ ...prev, projectId }));
    setNcrForm((prev) => ({ ...prev, projectId }));

    await loadQuality(projectId);
  }

  async function createChecklist(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await qualityApi.createChecklist({
        projectId: checklistForm.projectId,
        code: checklistForm.code,
        title: checklistForm.title,
        description: checklistForm.description,
        items: checklistForm.itemsText
          ? checklistForm.itemsText.split('\n').map((item) => ({
              item,
              required: true,
            }))
          : [],
      });

      setChecklistForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        description: '',
        itemsText: '',
      }));

      setMessage('Checklist created successfully');

      if (selectedProjectId) await loadQuality(Number(selectedProjectId));
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create checklist');
    } finally {
      setLoading(false);
    }
  }

  async function createInspection(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await qualityApi.createInspection({
        projectId: inspectionForm.projectId,
        checklistId: inspectionForm.checklistId
          ? Number(inspectionForm.checklistId)
          : undefined,
        code: inspectionForm.code,
        title: inspectionForm.title,
        location: inspectionForm.location,
        inspectionDate: inspectionForm.inspectionDate || undefined,
        status: inspectionForm.status,
        result: inspectionForm.result,
      });

      setInspectionForm((prev) => ({
        ...prev,
        checklistId: '',
        code: '',
        title: '',
        location: '',
        inspectionDate: '',
        status: 'PLANNED',
        result: '',
      }));

      setMessage('Inspection created successfully');

      if (selectedProjectId) await loadQuality(Number(selectedProjectId));
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create inspection');
    } finally {
      setLoading(false);
    }
  }

  async function createNcr(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await qualityApi.createNcr({
        projectId: ncrForm.projectId,
        code: ncrForm.code,
        title: ncrForm.title,
        description: ncrForm.description,
        status: ncrForm.status,
        correctiveAction: ncrForm.correctiveAction,
        dueDate: ncrForm.dueDate || undefined,
      });

      setNcrForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        description: '',
        status: 'OPEN',
        correctiveAction: '',
        dueDate: '',
      }));

      setMessage('NCR created successfully');

      if (selectedProjectId) await loadQuality(Number(selectedProjectId));
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create NCR');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Quality"
        description="Manage quality checklists, inspections, NCRs, and corrective actions."
      />

      <SelectField
        label="Project"
        value={selectedProjectId}
        onChange={handleProjectChange}
      >
        <option value="">Select project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.code} - {project.name}
          </option>
        ))}
      </SelectField>

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
          <Card title="Create Checklist">
            <form onSubmit={createChecklist}>
              <Input
                label="Code"
                value={checklistForm.code}
                onChange={(e) =>
                  setChecklistForm({ ...checklistForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Title"
                value={checklistForm.title}
                onChange={(e) =>
                  setChecklistForm({ ...checklistForm, title: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={checklistForm.description}
                onChange={(value) =>
                  setChecklistForm({ ...checklistForm, description: value })
                }
              />

              <TextareaField
                label="Checklist Items - one item per line"
                value={checklistForm.itemsText}
                onChange={(value) =>
                  setChecklistForm({ ...checklistForm, itemsText: value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Checklist
              </Button>
            </form>
          </Card>

          <Card title="Create Inspection">
            <form onSubmit={createInspection}>
              <SelectField
                label="Checklist"
                value={inspectionForm.checklistId}
                onChange={(value) =>
                  setInspectionForm({ ...inspectionForm, checklistId: value })
                }
              >
                <option value="">No checklist</option>
                {checklists.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.title}
                  </option>
                ))}
              </SelectField>

              <Input
                label="Code"
                value={inspectionForm.code}
                onChange={(e) =>
                  setInspectionForm({ ...inspectionForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Title"
                value={inspectionForm.title}
                onChange={(e) =>
                  setInspectionForm({ ...inspectionForm, title: e.target.value })
                }
                required
              />

              <Input
                label="Location"
                value={inspectionForm.location}
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    location: e.target.value,
                  })
                }
              />

              <Input
                label="Inspection Date"
                type="date"
                value={inspectionForm.inspectionDate}
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    inspectionDate: e.target.value,
                  })
                }
              />

              <SelectField
                label="Status"
                value={inspectionForm.status}
                onChange={(value) =>
                  setInspectionForm({ ...inspectionForm, status: value })
                }
              >
                <option value="PLANNED">Planned</option>
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </SelectField>

              <TextareaField
                label="Result"
                value={inspectionForm.result}
                onChange={(value) =>
                  setInspectionForm({ ...inspectionForm, result: value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Inspection
              </Button>
            </form>
          </Card>

          <Card title="Create NCR">
            <form onSubmit={createNcr}>
              <Input
                label="Code"
                value={ncrForm.code}
                onChange={(e) =>
                  setNcrForm({ ...ncrForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Title"
                value={ncrForm.title}
                onChange={(e) =>
                  setNcrForm({ ...ncrForm, title: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={ncrForm.description}
                onChange={(value) =>
                  setNcrForm({ ...ncrForm, description: value })
                }
              />

              <SelectField
                label="Status"
                value={ncrForm.status}
                onChange={(value) =>
                  setNcrForm({ ...ncrForm, status: value })
                }
              >
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CLOSED">Closed</option>
              </SelectField>

              <TextareaField
                label="Corrective Action"
                value={ncrForm.correctiveAction}
                onChange={(value) =>
                  setNcrForm({ ...ncrForm, correctiveAction: value })
                }
              />

              <Input
                label="Due Date"
                type="date"
                value={ncrForm.dueDate}
                onChange={(e) =>
                  setNcrForm({ ...ncrForm, dueDate: e.target.value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create NCR
              </Button>
            </form>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <Card title="Checklists">
            <DataTable<QualityChecklist>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Title', accessor: 'title' },
                {
                  header: 'Items',
                  accessor: (row) => row.items?.length ?? 0,
                },
              ]}
              data={checklists}
            />
          </Card>

          <Card title="Inspections">
            <DataTable<Inspection>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Title', accessor: 'title' },
                { header: 'Location', accessor: (row) => row.location || '-' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Date',
                  accessor: (row) => formatDate(row.inspectionDate),
                },
              ]}
              data={inspections}
            />
          </Card>

          <Card title="NCRs">
            <DataTable<NcrReport>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Title', accessor: 'title' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Due Date',
                  accessor: (row) => formatDate(row.dueDate),
                },
                {
                  header: 'Corrective Action',
                  accessor: (row) => truncate(row.correctiveAction),
                },
              ]}
              data={ncrs}
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