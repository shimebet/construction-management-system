import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { tasksApi } from '../../api/tasks.api';
import type { CreateTaskPayload, Task } from '../../api/tasks.api';
import { wbsApi } from '../../api/wbs.api';
import type { WbsItem } from '../../api/wbs.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [wbsItems, setWbsItems] = useState<WbsItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<CreateTaskPayload>({
    projectId: 0,
    wbsItemId: null,
    parentTaskId: null,
    code: '',
    name: '',
    description: '',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    plannedStart: '',
    plannedEnd: '',
    durationDays: undefined,
    progress: 0,
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

      const [wbsData, taskData] = await Promise.all([
        wbsApi.findByProject(projectId),
        tasksApi.findByProject(projectId),
      ]);

      setWbsItems(wbsData);
      setTasks(taskData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load project tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(
    name: keyof CreateTaskPayload,
    value: string | number | null | undefined,
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
      wbsItemId: null,
      parentTaskId: null,
    }));

    await loadProjectData(projectId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await tasksApi.create({
        ...form,
        projectId: Number(form.projectId),
        wbsItemId: form.wbsItemId ? Number(form.wbsItemId) : null,
        parentTaskId: form.parentTaskId ? Number(form.parentTaskId) : null,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        progress: form.progress ? Number(form.progress) : 0,
      });

      setForm((prev) => ({
        ...prev,
        wbsItemId: null,
        parentTaskId: null,
        code: '',
        name: '',
        description: '',
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        plannedStart: '',
        plannedEnd: '',
        durationDays: undefined,
        progress: 0,
      }));

      setMessage('Task created successfully');

      if (selectedProjectId) {
        await loadProjectData(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Cancel this task?');

    if (!confirmed) return;

    try {
      setLoading(true);
      await tasksApi.remove(id);
      setMessage('Task cancelled successfully');

      if (selectedProjectId) {
        await loadProjectData(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to cancel task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Create and manage project tasks, WBS links, dates, progress, and priorities."
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

        <Card title="Create Task">
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

            <SelectField
              label="WBS Item"
              value={form.wbsItemId ?? ''}
              onChange={(value) =>
                updateField('wbsItemId', value ? Number(value) : null)
              }
            >
              <option value="">No WBS item</option>
              {wbsItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Parent Task"
              value={form.parentTaskId ?? ''}
              onChange={(value) =>
                updateField('parentTaskId', value ? Number(value) : null)
              }
            >
              <option value="">No parent task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.code} - {task.name}
                </option>
              ))}
            </SelectField>

            <Input
              label="Task Code"
              value={form.code}
              onChange={(e) => updateField('code', e.target.value)}
              required
            />

            <Input
              label="Task Name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />

            <Input
              label="Description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />

            <SelectField
              label="Status"
              value={form.status ?? 'NOT_STARTED'}
              onChange={(value) => updateField('status', value)}
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </SelectField>

            <SelectField
              label="Priority"
              value={form.priority ?? 'MEDIUM'}
              onChange={(value) => updateField('priority', value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </SelectField>

            <Input
              label="Planned Start"
              type="date"
              value={form.plannedStart}
              onChange={(e) => updateField('plannedStart', e.target.value)}
            />

            <Input
              label="Planned End"
              type="date"
              value={form.plannedEnd}
              onChange={(e) => updateField('plannedEnd', e.target.value)}
            />

            <Input
              label="Duration Days"
              type="number"
              value={form.durationDays ?? ''}
              onChange={(e) =>
                updateField(
                  'durationDays',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />

            <Input
              label="Progress %"
              type="number"
              min={0}
              max={100}
              value={form.progress ?? 0}
              onChange={(e) => updateField('progress', Number(e.target.value))}
            />

            <Button disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Saving...' : 'Create Task'}
            </Button>
          </form>
        </Card>

        <Card title="Task List">
          {loading && <p>Loading...</p>}

          <DataTable<Task>
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
                header: 'WBS',
                accessor: (row) =>
                  row.wbsItem ? `${row.wbsItem.code} - ${row.wbsItem.name}` : '-',
              },
              {
                header: 'Status',
                accessor: 'status',
              },
              {
                header: 'Priority',
                accessor: 'priority',
              },
              {
                header: 'Progress',
                accessor: (row) => `${Number(row.progress)}%`,
              },
              {
                header: 'Planned Dates',
                accessor: (row) =>
                  `${formatDate(row.plannedStart)} → ${formatDate(row.plannedEnd)}`,
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
            data={tasks}
            emptyMessage="No tasks found"
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