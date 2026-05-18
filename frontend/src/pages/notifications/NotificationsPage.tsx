import { useEffect, useState } from 'react';
import { notificationsApi } from '../../api/notifications.api';
import type { NotificationItem } from '../../api/notifications.api';
import { Button, Card, DataTable, PageHeader } from '../../components/ui';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadNotifications() {
    try {
      setLoading(true);
      setMessage('');

      const data = await notificationsApi.findMine();
      setNotifications(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    try {
      setLoading(true);
      await notificationsApi.markAsRead(id);
      await loadNotifications();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to mark notification as read');
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      setLoading(true);
      await notificationsApi.markAllAsRead();
      await loadNotifications();
      setMessage('All notifications marked as read');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="View project alerts, approvals, reminders, deadlines, and system messages."
        actionLabel="Mark All As Read"
        onAction={markAllAsRead}
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

      {loading && <p>Loading notifications...</p>}

      <div className="module-grid">
        <div className="module-sidebar">
          <Card title="Notification Summary">
            <InfoItem label="Total" value={String(notifications.length)} />
            <InfoItem label="Unread" value={String(unreadCount)} />
            <InfoItem
              label="Read"
              value={String(notifications.length - unreadCount)}
            />
          </Card>

          <Card title="Notification Types">
            <InfoItem label="INFO" value={countType(notifications, 'INFO')} />
            <InfoItem label="SUCCESS" value={countType(notifications, 'SUCCESS')} />
            <InfoItem label="WARNING" value={countType(notifications, 'WARNING')} />
            <InfoItem label="ERROR" value={countType(notifications, 'ERROR')} />
            <InfoItem label="APPROVAL" value={countType(notifications, 'APPROVAL')} />
            <InfoItem label="DEADLINE" value={countType(notifications, 'DEADLINE')} />
          </Card>
        </div>

        <div className="module-content">
          <Card title="Notification List">
            <DataTable<NotificationItem>
              columns={[
                {
                  header: 'Date',
                  accessor: (row) => formatDateTime(row.createdAt),
                },
                {
                  header: 'Type',
                  accessor: 'type',
                },
                {
                  header: 'Title',
                  accessor: 'title',
                },
                {
                  header: 'Message',
                  accessor: (row) => truncate(row.message),
                },
                {
                  header: 'Project',
                  accessor: (row) => row.project?.name || row.projectId || '-',
                },
                {
                  header: 'Status',
                  accessor: (row) => (row.isRead ? 'Read' : 'Unread'),
                },
                {
                  header: 'Action',
                  accessor: (row) =>
                    row.isRead ? (
                      '-'
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => markAsRead(row.id)}
                        style={{ padding: '6px 10px' }}
                      >
                        Mark Read
                      </Button>
                    ),
                },
              ]}
              data={notifications}
              emptyMessage="No notifications found"
            />
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
      <strong>{value}</strong>
    </div>
  );
}

function countType(items: NotificationItem[], type: string) {
  return String(items.filter((item) => item.type === type).length);
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function truncate(value?: string | null) {
  if (!value) return '-';
  return value.length > 70 ? `${value.slice(0, 70)}...` : value;
}