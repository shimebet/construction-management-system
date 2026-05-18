import { useEffect, useState } from 'react';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { safetyApi } from '../../api/safety.api';
import type {
  RiskAssessment,
  SafetyIncident,
  SafetyInspection,
  ToolboxTalk,
} from '../../api/safety.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function SafetyPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [talks, setTalks] = useState<ToolboxTalk[]>([]);
  const [inspections, setInspections] = useState<SafetyInspection[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [incidentForm, setIncidentForm] = useState({
    projectId: 0,
    code: '',
    title: '',
    description: '',
    severity: 'LOW',
    status: 'OPEN',
    incidentDate: '',
    location: '',
    correctiveAction: '',
  });

  const [riskForm, setRiskForm] = useState({
    projectId: 0,
    code: '',
    activity: '',
    hazards: '',
    risks: '',
    controls: '',
    riskLevel: '',
    reviewDate: '',
  });

  const [talkForm, setTalkForm] = useState({
    projectId: 0,
    topic: '',
    talkDate: '',
    attendeesText: '',
    remarks: '',
  });

  const [inspectionForm, setInspectionForm] = useState({
    projectId: 0,
    code: '',
    inspectionDate: '',
    findings: '',
    actions: '',
  });

  async function loadProjects() {
    const data = await projectsApi.findAll();
    setProjects(data);

    if (data.length > 0) {
      await handleProjectChange(String(data[0].id));
    }
  }

  async function loadSafety(projectId: number) {
    try {
      setLoading(true);

      const [incidentData, riskData, talkData, inspectionData] =
        await Promise.all([
          safetyApi.findIncidents(projectId),
          safetyApi.findRiskAssessments(projectId),
          safetyApi.findToolboxTalks(projectId),
          safetyApi.findSafetyInspections(projectId),
        ]);

      setIncidents(incidentData);
      setRisks(riskData);
      setTalks(talkData);
      setInspections(inspectionData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load safety data');
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

    setIncidentForm((prev) => ({ ...prev, projectId }));
    setRiskForm((prev) => ({ ...prev, projectId }));
    setTalkForm((prev) => ({ ...prev, projectId }));
    setInspectionForm((prev) => ({ ...prev, projectId }));

    await loadSafety(projectId);
  }

  async function createIncident(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await safetyApi.createIncident({
        ...incidentForm,
        projectId: Number(incidentForm.projectId),
      });

      setIncidentForm((prev) => ({
        ...prev,
        code: '',
        title: '',
        description: '',
        severity: 'LOW',
        status: 'OPEN',
        incidentDate: '',
        location: '',
        correctiveAction: '',
      }));

      setMessage('Safety incident created successfully');

      if (selectedProjectId) {
        await loadSafety(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  }

  async function createRiskAssessment(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await safetyApi.createRiskAssessment({
        ...riskForm,
        projectId: Number(riskForm.projectId),
        reviewDate: riskForm.reviewDate || undefined,
      });

      setRiskForm((prev) => ({
        ...prev,
        code: '',
        activity: '',
        hazards: '',
        risks: '',
        controls: '',
        riskLevel: '',
        reviewDate: '',
      }));

      setMessage('Risk assessment created successfully');

      if (selectedProjectId) {
        await loadSafety(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to create risk assessment',
      );
    } finally {
      setLoading(false);
    }
  }

  async function createToolboxTalk(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await safetyApi.createToolboxTalk({
        projectId: Number(talkForm.projectId),
        topic: talkForm.topic,
        talkDate: talkForm.talkDate,
        attendees: talkForm.attendeesText
          ? talkForm.attendeesText.split('\n').map((name) => ({ name }))
          : [],
        remarks: talkForm.remarks,
      });

      setTalkForm((prev) => ({
        ...prev,
        topic: '',
        talkDate: '',
        attendeesText: '',
        remarks: '',
      }));

      setMessage('Toolbox talk created successfully');

      if (selectedProjectId) {
        await loadSafety(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to create toolbox talk',
      );
    } finally {
      setLoading(false);
    }
  }

  async function createSafetyInspection(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await safetyApi.createSafetyInspection({
        ...inspectionForm,
        projectId: Number(inspectionForm.projectId),
      });

      setInspectionForm((prev) => ({
        ...prev,
        code: '',
        inspectionDate: '',
        findings: '',
        actions: '',
      }));

      setMessage('Safety inspection created successfully');

      if (selectedProjectId) {
        await loadSafety(Number(selectedProjectId));
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to create safety inspection',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Safety"
        description="Manage incidents, risk assessments, toolbox talks, and safety inspections."
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
          <Card title="Create Incident">
            <form onSubmit={createIncident}>
              <Input
                label="Code"
                value={incidentForm.code}
                onChange={(e) =>
                  setIncidentForm({ ...incidentForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Title"
                value={incidentForm.title}
                onChange={(e) =>
                  setIncidentForm({ ...incidentForm, title: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={incidentForm.description}
                onChange={(value) =>
                  setIncidentForm({ ...incidentForm, description: value })
                }
              />

              <SelectField
                label="Severity"
                value={incidentForm.severity}
                onChange={(value) =>
                  setIncidentForm({ ...incidentForm, severity: value })
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </SelectField>

              <SelectField
                label="Status"
                value={incidentForm.status}
                onChange={(value) =>
                  setIncidentForm({ ...incidentForm, status: value })
                }
              >
                <option value="OPEN">Open</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="CLOSED">Closed</option>
              </SelectField>

              <Input
                label="Incident Date"
                type="date"
                value={incidentForm.incidentDate}
                onChange={(e) =>
                  setIncidentForm({
                    ...incidentForm,
                    incidentDate: e.target.value,
                  })
                }
                required
              />

              <Input
                label="Location"
                value={incidentForm.location}
                onChange={(e) =>
                  setIncidentForm({ ...incidentForm, location: e.target.value })
                }
              />

              <TextareaField
                label="Corrective Action"
                value={incidentForm.correctiveAction}
                onChange={(value) =>
                  setIncidentForm({
                    ...incidentForm,
                    correctiveAction: value,
                  })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Incident
              </Button>
            </form>
          </Card>

          <Card title="Create Risk Assessment">
            <form onSubmit={createRiskAssessment}>
              <Input
                label="Code"
                value={riskForm.code}
                onChange={(e) =>
                  setRiskForm({ ...riskForm, code: e.target.value })
                }
                required
              />

              <Input
                label="Activity"
                value={riskForm.activity}
                onChange={(e) =>
                  setRiskForm({ ...riskForm, activity: e.target.value })
                }
                required
              />

              <TextareaField
                label="Hazards"
                value={riskForm.hazards}
                onChange={(value) =>
                  setRiskForm({ ...riskForm, hazards: value })
                }
              />

              <TextareaField
                label="Risks"
                value={riskForm.risks}
                onChange={(value) =>
                  setRiskForm({ ...riskForm, risks: value })
                }
              />

              <TextareaField
                label="Controls"
                value={riskForm.controls}
                onChange={(value) =>
                  setRiskForm({ ...riskForm, controls: value })
                }
              />

              <Input
                label="Risk Level"
                value={riskForm.riskLevel}
                onChange={(e) =>
                  setRiskForm({ ...riskForm, riskLevel: e.target.value })
                }
              />

              <Input
                label="Review Date"
                type="date"
                value={riskForm.reviewDate}
                onChange={(e) =>
                  setRiskForm({ ...riskForm, reviewDate: e.target.value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Risk Assessment
              </Button>
            </form>
          </Card>

          <Card title="Create Toolbox Talk">
            <form onSubmit={createToolboxTalk}>
              <Input
                label="Topic"
                value={talkForm.topic}
                onChange={(e) =>
                  setTalkForm({ ...talkForm, topic: e.target.value })
                }
                required
              />

              <Input
                label="Talk Date"
                type="date"
                value={talkForm.talkDate}
                onChange={(e) =>
                  setTalkForm({ ...talkForm, talkDate: e.target.value })
                }
                required
              />

              <TextareaField
                label="Attendees - one name per line"
                value={talkForm.attendeesText}
                onChange={(value) =>
                  setTalkForm({ ...talkForm, attendeesText: value })
                }
              />

              <TextareaField
                label="Remarks"
                value={talkForm.remarks}
                onChange={(value) =>
                  setTalkForm({ ...talkForm, remarks: value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Toolbox Talk
              </Button>
            </form>
          </Card>

          <Card title="Create Safety Inspection">
            <form onSubmit={createSafetyInspection}>
              <Input
                label="Code"
                value={inspectionForm.code}
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    code: e.target.value,
                  })
                }
                required
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
                required
              />

              <TextareaField
                label="Findings"
                value={inspectionForm.findings}
                onChange={(value) =>
                  setInspectionForm({ ...inspectionForm, findings: value })
                }
              />

              <TextareaField
                label="Actions"
                value={inspectionForm.actions}
                onChange={(value) =>
                  setInspectionForm({ ...inspectionForm, actions: value })
                }
              />

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Safety Inspection
              </Button>
            </form>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <Card title="Incidents">
            <DataTable<SafetyIncident>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Title', accessor: 'title' },
                { header: 'Severity', accessor: 'severity' },
                { header: 'Status', accessor: 'status' },
                {
                  header: 'Date',
                  accessor: (row) => formatDate(row.incidentDate),
                },
                { header: 'Location', accessor: (row) => row.location || '-' },
              ]}
              data={incidents}
            />
          </Card>

          <Card title="Risk Assessments">
            <DataTable<RiskAssessment>
              columns={[
                { header: 'Code', accessor: 'code' },
                { header: 'Activity', accessor: 'activity' },
                { header: 'Risk Level', accessor: (row) => row.riskLevel || '-' },
                {
                  header: 'Review Date',
                  accessor: (row) => formatDate(row.reviewDate),
                },
              ]}
              data={risks}
            />
          </Card>

          <Card title="Toolbox Talks">
            <DataTable<ToolboxTalk>
              columns={[
                { header: 'Topic', accessor: 'topic' },
                {
                  header: 'Date',
                  accessor: (row) => formatDate(row.talkDate),
                },
                {
                  header: 'Attendees',
                  accessor: (row) => row.attendees?.length ?? 0,
                },
                {
                  header: 'Remarks',
                  accessor: (row) => truncate(row.remarks),
                },
              ]}
              data={talks}
            />
          </Card>

          <Card title="Safety Inspections">
            <DataTable<SafetyInspection>
              columns={[
                { header: 'Code', accessor: 'code' },
                {
                  header: 'Date',
                  accessor: (row) => formatDate(row.inspectionDate),
                },
                {
                  header: 'Findings',
                  accessor: (row) => truncate(row.findings),
                },
                {
                  header: 'Actions',
                  accessor: (row) => truncate(row.actions),
                },
              ]}
              data={inspections}
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