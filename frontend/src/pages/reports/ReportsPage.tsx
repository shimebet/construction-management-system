import { useEffect, useState } from 'react';
import { reportsApi } from '../../api/reports.api';
import type { Project } from '../../api/projects.api';
import { Button, Card, DataTable, PageHeader } from '../../components/ui';

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [dashboardReport, setDashboardReport] = useState<any>(null);
  const [projectReport, setProjectReport] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadInitialData() {
    try {
      setLoading(true);

      const [projectData, dashboardData] = await Promise.all([
        reportsApi.getProjects(),
        reportsApi.getDashboardReport(),
      ]);

      setProjects(projectData);
      setDashboardReport(dashboardData);

      if (projectData.length > 0) {
        setSelectedProjectId(projectData[0].id);
        await loadProjectReport(projectData[0].id);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectReport(projectId: number) {
    try {
      setLoading(true);
      const data = await reportsApi.getProjectReport(projectId);
      setProjectReport(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load project report');
    } finally {
      setLoading(false);
    }
  }

  function exportJson() {
    const data = {
      dashboardReport,
      projectReport,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'buildpro-report.json';
    link.click();

    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="View executive summaries, project performance, cost, finance, and operational reports."
        actionLabel="Export JSON"
        onAction={exportJson}
      />

      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
          }}
        >
          {message}
        </div>
      )}

      {loading && <p>Loading reports...</p>}

      <div className="module-grid">
        <div className="module-sidebar">
          <Card title="Report Filters">
            <SelectField
              label="Project"
              value={selectedProjectId}
              onChange={async (value) => {
                const projectId = Number(value);
                setSelectedProjectId(projectId);
                await loadProjectReport(projectId);
              }}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </SelectField>

            <Button
              style={{ width: '100%' }}
              onClick={() =>
                selectedProjectId && loadProjectReport(Number(selectedProjectId))
              }
            >
              Refresh Report
            </Button>
          </Card>

          <Card title="System Summary">
            {dashboardReport ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <ReportItem label="Companies" value={dashboardReport.companies} />
                <ReportItem label="Projects" value={dashboardReport.projects} />
                <ReportItem label="Open RFIs" value={dashboardReport.openRfis} />
                <ReportItem
                  label="Pending Approvals"
                  value={dashboardReport.pendingApprovals}
                />
                <ReportItem
                  label="Safety Incidents"
                  value={dashboardReport.safetyIncidents}
                />
                <ReportItem label="Documents" value={dashboardReport.documents} />
              </div>
            ) : (
              <p>No dashboard report loaded</p>
            )}
          </Card>
        </div>

        <div className="module-content">
          <Card title="Project Cost Report">
            {projectReport?.costSummary ? (
              <DataTable<any>
                columns={[
                  { header: 'Metric', accessor: 'metric' },
                  { header: 'Value', accessor: (row) => money(row.value) },
                ]}
                data={[
                  {
                    metric: 'BOQ Total',
                    value: projectReport.costSummary.boqTotal,
                  },
                  {
                    metric: 'Budget Total',
                    value: projectReport.costSummary.budgetTotal,
                  },
                  {
                    metric: 'Approved Variations',
                    value: projectReport.costSummary.approvedVariationTotal,
                  },
                  {
                    metric: 'Revised Budget',
                    value: projectReport.costSummary.revisedBudget,
                  },
                  {
                    metric: 'Actual Cost',
                    value: projectReport.costSummary.actualCost,
                  },
                  {
                    metric: 'Remaining Budget',
                    value: projectReport.costSummary.remainingBudget,
                  },
                ]}
              />
            ) : (
              <p>No project cost report available</p>
            )}
          </Card>

          <Card title="Project Cash Flow Report">
            {projectReport?.cashFlow ? (
              <DataTable<any>
                columns={[
                  { header: 'Metric', accessor: 'metric' },
                  { header: 'Value', accessor: (row) => money(row.value) },
                ]}
                data={[
                  {
                    metric: 'Invoiced Amount',
                    value: projectReport.cashFlow.invoicedAmount,
                  },
                  {
                    metric: 'Received Amount',
                    value: projectReport.cashFlow.receivedAmount,
                  },
                  {
                    metric: 'Expense Amount',
                    value: projectReport.cashFlow.expenseAmount,
                  },
                  {
                    metric: 'Retention Held',
                    value: projectReport.cashFlow.retentionHeld,
                  },
                  {
                    metric: 'Advance Deducted',
                    value: projectReport.cashFlow.advanceDeducted,
                  },
                  {
                    metric: 'Net Cash Flow',
                    value: projectReport.cashFlow.netCashFlow,
                  },
                  {
                    metric: 'Outstanding Receivable',
                    value: projectReport.cashFlow.outstandingReceivable,
                  },
                ]}
              />
            ) : (
              <p>No project cash flow report available</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReportItem({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: 8,
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
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

function money(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '-';

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}