import { useEffect, useState } from 'react';
import { Button, Card, PageHeader } from '../../components/ui';

type TokenPayload = {
  sub?: number;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
};

export default function ProfilePage() {
  const [payload, setPayload] = useState<TokenPayload | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return;
    }

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      setPayload(tokenPayload);
    } catch {
      setPayload(null);
    }
  }, []);

  function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        description="View logged-in user session information and manage logout."
      />

      <div className="module-grid">
        <div className="module-sidebar">
          <Card title="Session Actions">
            <Button variant="danger" onClick={logout} style={{ width: '100%' }}>
              Logout
            </Button>
          </Card>

          <Card title="Session Status">
            <InfoItem
              label="Authenticated"
              value={localStorage.getItem('accessToken') ? 'Yes' : 'No'}
            />

            <InfoItem
              label="Token Expiry"
              value={payload?.exp ? formatTimestamp(payload.exp) : '-'}
            />

            <InfoItem
              label="Issued At"
              value={payload?.iat ? formatTimestamp(payload.iat) : '-'}
            />
          </Card>
        </div>

        <div className="module-content">
          <Card title="User Information">
            <InfoItem label="User ID" value={payload?.sub ? String(payload.sub) : '-'} />
            <InfoItem label="Email" value={payload?.email || '-'} />
            <InfoItem label="Name" value={payload?.name || '-'} />
          </Card>

          <Card title="Raw Token Payload">
            <pre
              style={{
                background: '#111827',
                color: '#e5e7eb',
                padding: 16,
                borderRadius: 8,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(payload, null, 2)}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: 8,
        marginBottom: 8,
      }}
    >
      <span>{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

function formatTimestamp(value: number) {
  return new Date(value * 1000).toLocaleString();
}