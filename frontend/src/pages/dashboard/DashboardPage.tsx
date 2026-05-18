import { Card, DataTable, PageHeader } from '../../components/ui';

type RecentActivity = {
  module: string;
  action: string;
  status: string;
};

const stats = [
  {
    title: 'Active Projects',
    value: '0',
    description: 'Projects currently in progress',
  },
  {
    title: 'Open RFIs',
    value: '0',
    description: 'Requests waiting for response',
  },
  {
    title: 'Pending Approvals',
    value: '0',
    description: 'Items awaiting approval',
  },
  {
    title: 'Safety Incidents',
    value: '0',
    description: 'Open safety records',
  },
];

const recentActivities: RecentActivity[] = [
  {
    module: 'Projects',
    action: 'Project dashboard initialized',
    status: 'Ready',
  },
  {
    module: 'Documents',
    action: 'Document control module available',
    status: 'Ready',
  },
  {
    module: 'Quality',
    action: 'Inspection and NCR workflow available',
    status: 'Ready',
  },
  {
    module: 'Finance',
    action: 'Invoice and payment workflow available',
    status: 'Ready',
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to BuildPro IMS Construction Integrated Management System."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {stats.map((item) => (
          <Card key={item.title}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
              {item.title}
            </p>

            <h2 style={{ margin: '10px 0', fontSize: 32 }}>{item.value}</h2>

            <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
              {item.description}
            </p>
          </Card>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
        }}
      >
        <Card title="Recent Activities">
          <DataTable<RecentActivity>
            columns={[
              {
                header: 'Module',
                accessor: 'module',
              },
              {
                header: 'Action',
                accessor: 'action',
              },
              {
                header: 'Status',
                accessor: 'status',
              },
            ]}
            data={recentActivities}
          />
        </Card>

        <Card title="System Status">
          <div style={{ display: 'grid', gap: 12 }}>
            <StatusItem label="Backend API" status="Connected" />
            <StatusItem label="Authentication" status="Enabled" />
            <StatusItem label="Document Upload" status="Ready" />
            <StatusItem label="Audit Logging" status="Active" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
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
      <strong style={{ color: '#16a34a' }}>{status}</strong>
    </div>
  );
}