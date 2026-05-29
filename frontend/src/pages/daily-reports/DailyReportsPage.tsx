import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Edit,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

import { dailyReportsApi } from '../../api/daily-reports.api';
import type {
  CreateDailyReportPayload,
  DailyReport,
} from '../../api/daily-reports.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

type DailyReportForm = CreateDailyReportPayload;

type ReportMode = 'create' | 'edit';

const emptyForm: DailyReportForm = {
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
};

export default function DailyReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [mode, setMode] = useState<ReportMode>('create');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<DailyReportForm>(emptyForm);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === Number(selectedProjectId)),
    [projects, selectedProjectId],
  );

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return reports;

    return reports.filter((report) => {
      return (
        String(report.weather || '').toLowerCase().includes(keyword) ||
        String(report.workCompleted || '').toLowerCase().includes(keyword) ||
        String(report.issues || '').toLowerCase().includes(keyword) ||
        String(report.delays || '').toLowerCase().includes(keyword) ||
        String(report.remarks || '').toLowerCase().includes(keyword) ||
        String(report.preparedBy?.name || '').toLowerCase().includes(keyword)
      );
    });
  }, [reports, search]);

  const reportFileName = useMemo(() => {
    const projectCode = selectedProject?.code || 'project';
    const date = new Date().toISOString().slice(0, 10);
    return `buildpro-daily-reports-${projectCode}-${date}`;
  }, [selectedProject]);

  const isSuccess = message.toLowerCase().includes('successfully');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      setMessage('');

      const data = await projectsApi.findAll();
      setProjects(data);

      if (data.length > 0) {
        await handleProjectChange(String(data[0].id));
      }
    } catch (error: any) {
      setMessage(getErrorMessage(error, 'Failed to load projects'));
    } finally {
      setLoading(false);
    }
  }

  async function loadReports(projectId: number) {
    if (!projectId) {
      setReports([]);
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const data = await dailyReportsApi.findByProject(projectId);
      setReports(data);
    } catch (error: any) {
      setMessage(getErrorMessage(error, 'Failed to load daily reports'));
    } finally {
      setLoading(false);
    }
  }

  async function handleProjectChange(value: string) {
    const projectId = Number(value);

    setSelectedProjectId(projectId || '');
    setSelectedReport(null);
    setEditingReport(null);
    setMode('create');

    setForm({
      ...emptyForm,
      projectId,
    });

    if (projectId) {
      await loadReports(projectId);
    } else {
      setReports([]);
    }
  }

  function updateField(
    name: keyof DailyReportForm,
    value: string | number | string[],
  ) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm() {
    if (!form.projectId) return 'Project is required';
    if (!form.reportDate) return 'Report date is required';
    if (Number(form.manpowerCount ?? 0) < 0) {
      return 'Manpower count cannot be negative';
    }
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const payload: CreateDailyReportPayload = {
        ...form,
        projectId: Number(form.projectId),
        manpowerCount: Number(form.manpowerCount ?? 0),
        weather: form.weather?.trim() || '',
        equipmentUsed: form.equipmentUsed?.trim() || '',
        workCompleted: form.workCompleted?.trim() || '',
        materialReceived: form.materialReceived?.trim() || '',
        issues: form.issues?.trim() || '',
        delays: form.delays?.trim() || '',
        remarks: form.remarks?.trim() || '',
      };

      if (mode === 'edit' && editingReport) {
        await dailyReportsApi.update(editingReport.id, payload);
        setMessage('Daily report updated successfully');
      } else {
        await dailyReportsApi.create(payload);
        setMessage('Daily report created successfully');
      }

      resetForm(Number(form.projectId));
      await loadReports(Number(form.projectId));
    } catch (error: any) {
      setMessage(
        getErrorMessage(
          error,
          mode === 'edit'
            ? 'Failed to update daily report'
            : 'Failed to create daily report',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm(projectId = Number(selectedProjectId || 0)) {
    setMode('create');
    setEditingReport(null);
    setForm({
      ...emptyForm,
      projectId,
    });
  }

  function handleView(report: DailyReport) {
    setSelectedReport(report);
  }

  function handleEdit(report: DailyReport) {
    setMode('edit');
    setEditingReport(report);
    setSelectedReport(null);

    setForm({
      projectId: report.projectId,
      reportDate: toDateInputValue(report.reportDate),
      weather: report.weather || '',
      manpowerCount: report.manpowerCount ?? 0,
      equipmentUsed: report.equipmentUsed || '',
      workCompleted: report.workCompleted || '',
      materialReceived: report.materialReceived || '',
      sitePhotos: report.sitePhotos || [],
      issues: report.issues || '',
      delays: report.delays || '',
      remarks: report.remarks || '',
    });
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Delete this daily report? This action will be recorded in the audit log.');
    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');

      await dailyReportsApi.remove(id);
      setMessage('Daily report deleted successfully');

      if (selectedProjectId) {
        await loadReports(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(getErrorMessage(error, 'Failed to delete daily report'));
    } finally {
      setLoading(false);
    }
  }

  function buildExportData() {
    return {
      project: selectedProject
        ? {
            id: selectedProject.id,
            code: selectedProject.code,
            name: selectedProject.name,
          }
        : null,
      reports,
      exportedAt: new Date().toISOString(),
    };
  }

  function downloadFile(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    downloadFile(
      JSON.stringify(buildExportData(), null, 2),
      `${reportFileName}.json`,
      'application/json;charset=utf-8',
    );
  }

  function exportCsv() {
    const rows = [
      [
        'Date',
        'Project',
        'Weather',
        'Manpower',
        'Equipment Used',
        'Work Completed',
        'Material Received',
        'Issues',
        'Delays',
        'Remarks',
        'Prepared By',
      ],
      ...reports.map((report) => [
        formatDate(report.reportDate),
        `${report.project?.code || selectedProject?.code || ''} - ${report.project?.name || selectedProject?.name || ''}`,
        report.weather || '',
        report.manpowerCount ?? 0,
        report.equipmentUsed || '',
        report.workCompleted || '',
        report.materialReceived || '',
        report.issues || '',
        report.delays || '',
        report.remarks || '',
        report.preparedBy?.name || '',
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    downloadFile(csv, `${reportFileName}.csv`, 'text/csv;charset=utf-8');
  }

  function exportPdf() {
    const element = document.getElementById('daily-reports-printable');

    if (!element) {
      setMessage('Printable daily report section not found');
      return;
    }

    html2pdf()
      .set({
        margin: 10,
        filename: `${reportFileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      })
      .from(element)
      .save();
  }

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        description="Record, review, edit, export, and audit daily site reports."
      />

      {message && <Alert type={isSuccess ? 'success' : 'error'}>{message}</Alert>}

      <div style={summaryGridStyle}>
        <MetricCard label="Total Reports" value={reports.length} />
        <MetricCard label="Selected Project" value={selectedProject?.code || '-'} />
        <MetricCard label="Total Manpower" value={reports.reduce((sum, item) => sum + Number(item.manpowerCount || 0), 0)} />
        <MetricCard label="Reports With Issues" value={reports.filter((item) => Boolean(item.issues)).length} />
      </div>

      <div style={actionBarStyle}>
        <IconActionButton title="Download JSON" onClick={exportJson}>
          <FileJson size={16} /> JSON
        </IconActionButton>
        <IconActionButton title="Download CSV" onClick={exportCsv}>
          <FileSpreadsheet size={16} /> CSV
        </IconActionButton>
        <IconActionButton title="Download PDF" onClick={exportPdf}>
          <FileText size={16} /> PDF
        </IconActionButton>
        <IconActionButton title="Refresh" onClick={() => selectedProjectId && loadReports(Number(selectedProjectId))}>
          <RefreshCcw size={16} /> Refresh
        </IconActionButton>
      </div>

      <div className="module-grid">
        <Card title={mode === 'edit' ? `Edit Daily Report: ${formatDate(editingReport?.reportDate)}` : 'Create Daily Report'}>
          <form onSubmit={handleSubmit}>
            <SelectField label="Project" value={form.projectId} onChange={handleProjectChange}>
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
              onChange={(event) => updateField('reportDate', event.target.value)}
              required
            />

            <Input
              label="Weather"
              value={form.weather}
              onChange={(event) => updateField('weather', event.target.value)}
              placeholder="Sunny, cloudy, rainy..."
            />

            <Input
              label="Manpower Count"
              type="number"
              min={0}
              value={form.manpowerCount ?? 0}
              onChange={(event) => updateField('manpowerCount', Number(event.target.value))}
            />

            <TextareaField label="Equipment Used" value={form.equipmentUsed ?? ''} onChange={(value) => updateField('equipmentUsed', value)} />
            <TextareaField label="Work Completed" value={form.workCompleted ?? ''} onChange={(value) => updateField('workCompleted', value)} />
            <TextareaField label="Material Received" value={form.materialReceived ?? ''} onChange={(value) => updateField('materialReceived', value)} />
            <TextareaField label="Issues" value={form.issues ?? ''} onChange={(value) => updateField('issues', value)} />
            <TextareaField label="Delays" value={form.delays ?? ''} onChange={(value) => updateField('delays', value)} />
            <TextareaField label="Remarks" value={form.remarks ?? ''} onChange={(value) => updateField('remarks', value)} />

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Button disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Report'}
              </Button>

              {mode === 'edit' && (
                <Button type="button" variant="secondary" onClick={() => resetForm()}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card title="Daily Report Register">
          <div style={toolbarStyle}>
            <Input
              label="Search"
              placeholder="Search weather, work, issues, delays..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {loading && <p>Loading...</p>}

          <div id="daily-reports-printable">
            <DataTable<DailyReport>
              columns={[
                { header: 'Date', accessor: (row) => formatDate(row.reportDate) },
                { header: 'Weather', accessor: (row) => row.weather || '-' },
                { header: 'Manpower', accessor: 'manpowerCount' },
                { header: 'Work Completed', accessor: (row) => truncate(row.workCompleted) },
                { header: 'Issues', accessor: (row) => truncate(row.issues) },
                { header: 'Delays', accessor: (row) => truncate(row.delays) },
                { header: 'Prepared By', accessor: (row) => row.preparedBy?.name || '-' },
                {
                  header: 'Actions',
                  accessor: (row) => (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <IconOnlyButton title="View" onClick={() => handleView(row)}>
                        <Eye size={15} />
                      </IconOnlyButton>
                      <IconOnlyButton title="Edit" onClick={() => handleEdit(row)}>
                        <Edit size={15} />
                      </IconOnlyButton>
                      <IconOnlyButton title="Delete" onClick={() => handleDelete(row.id)} color="#dc2626">
                        <Trash2 size={15} />
                      </IconOnlyButton>
                    </div>
                  ),
                },
              ]}
              data={filteredReports}
              emptyMessage="No daily reports found"
            />
          </div>
        </Card>
      </div>

      {selectedReport && (
        <DailyReportDetailsModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}

function DailyReportDetailsModal({ report, onClose }: { report: DailyReport; onClose: () => void }) {
  return (
    <div style={modalOverlayStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <h2 style={{ margin: 0 }}>Daily Report - {formatDate(report.reportDate)}</h2>
          <Button type="button" variant="secondary" onClick={onClose}>
            <X size={15} /> Close
          </Button>
        </div>

        <div style={detailsGridStyle}>
          <Detail label="Project" value={report.project ? `${report.project.code} - ${report.project.name}` : '-'} />
          <Detail label="Prepared By" value={report.preparedBy?.name || '-'} />
          <Detail label="Weather" value={report.weather || '-'} />
          <Detail label="Manpower" value={String(report.manpowerCount ?? 0)} />
          <Detail label="Equipment Used" value={report.equipmentUsed || '-'} wide />
          <Detail label="Work Completed" value={report.workCompleted || '-'} wide />
          <Detail label="Material Received" value={report.materialReceived || '-'} wide />
          <Detail label="Issues" value={report.issues || '-'} wide />
          <Detail label="Delays" value={report.delays || '-'} wide />
          <Detail label="Remarks" value={report.remarks || '-'} wide />
        </div>
      </div>
    </div>
  );
}

function Alert({ type, children }: { type: 'success' | 'error'; children: React.ReactNode }) {
  const success = type === 'success';

  return (
    <div
      role="alert"
      style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        fontWeight: 600,
        background: success ? '#dcfce7' : '#fee2e2',
        color: success ? '#166534' : '#991b1b',
        border: success ? '1px solid #86efac' : '1px solid #fca5a5',
      }}
    >
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={metricCardStyle}>
      <div style={{ color: '#64748b', fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function IconActionButton({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button type="button" title={title} onClick={onClick} style={iconActionButtonStyle}>
      {children}
    </button>
  );
}

function IconOnlyButton({
  children,
  title,
  onClick,
  color,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button type="button" title={title} onClick={onClick} style={{ ...iconOnlyButtonStyle, color: color || '#334155' }}>
      {children}
    </button>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string | number; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={fieldStyle}>
        {children}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600, whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function truncate(value?: string | null) {
  if (!value) return '-';
  return value.length > 42 ? `${value.slice(0, 42)}...` : value;
}

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 16,
};

const metricCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
};

const actionBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 16,
};

const toolbarStyle: React.CSSProperties = {
  marginBottom: 16,
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
};

const iconActionButtonStyle: React.CSSProperties = {
  minHeight: 38,
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid #dbe3ef',
  background: '#fff',
  color: '#1e293b',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
  fontWeight: 700,
};

const iconOnlyButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 24,
};

const modalStyle: React.CSSProperties = {
  width: 'min(820px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: '#fff',
  borderRadius: 14,
  padding: 24,
  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
};

const detailsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
  marginTop: 20,
};
