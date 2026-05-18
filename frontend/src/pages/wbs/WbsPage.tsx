import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { wbsApi } from '../../api/wbs.api';
import type { CreateWbsPayload, WbsItem } from '../../api/wbs.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function WbsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [wbsItems, setWbsItems] = useState<WbsItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateWbsPayload>({
    projectId: 0,
    parentId: null,
    code: '',
    name: '',
    description: '',
    sortOrder: 0,
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      setSelectedProjectId(data[0].id);
      setForm((prev) => ({
        ...prev,
        projectId: data[0].id,
      }));
      await loadWbs(data[0].id);
    }
  }

  async function loadWbs(projectId: number) {
    try {
      setLoading(true);
      const data = await wbsApi.findByProject(projectId);
      setWbsItems(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load WBS items');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(
    name: keyof CreateWbsPayload,
    value: string | number | null,
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
      parentId: null,
    }));

    await loadWbs(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await wbsApi.create({
        ...form,
        projectId: Number(form.projectId),
        parentId: form.parentId ? Number(form.parentId) : null,
        sortOrder: Number(form.sortOrder ?? 0),
      });

      setForm((prev) => ({
        ...prev,
        parentId: null,
        code: '',
        name: '',
        description: '',
        sortOrder: 0,
      }));

      setMessage('WBS item created successfully');

      if (selectedProjectId) {
        await loadWbs(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create WBS item');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Delete this WBS item?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await wbsApi.remove(id);
      setMessage('WBS item deleted successfully');

      if (selectedProjectId) {
        await loadWbs(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to delete WBS item');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="WBS"
        description="Manage Work Breakdown Structure hierarchy and project scope."
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
        <Card title="Create WBS Item">
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Project
              </label>

              <select
                value={form.projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              >
                <option value={0}>Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Parent WBS
              </label>

              <select
                value={form.parentId ?? ''}
                onChange={(e) =>
                  updateField(
                    'parentId',
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              >
                <option value="">No parent</option>
                {wbsItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="WBS Code"
              value={form.code}
              onChange={(e) => updateField('code', e.target.value)}
              required
            />

            <Input
              label="WBS Name"
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
              label="Sort Order"
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) => updateField('sortOrder', Number(e.target.value))}
            />

            <Button disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Create WBS Item'}
            </Button>
          </form>
        </Card>

        <Card title="WBS List">
          {loading && <p>Loading...</p>}

          <DataTable<WbsItem>
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
                header: 'Parent',
                accessor: (row) => row.parent?.code || '-',
              },
              {
                header: 'Sort',
                accessor: 'sortOrder',
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
                    Delete
                  </Button>
                ),
              },
            ]}
            data={wbsItems}
            emptyMessage="No WBS items found"
          />
        </Card>
      </div>
    </div>
  );
}