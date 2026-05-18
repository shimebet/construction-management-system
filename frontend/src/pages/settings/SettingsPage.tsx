import { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settings.api';
import type { Permission, Role } from '../../api/settings.api';
import { Button, Card, DataTable, Input, PageHeader } from '../../components/ui';

export default function SettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | ''>(
    '',
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    isSystem: false,
  });

  async function loadSettings() {
    try {
      setLoading(true);

      const [roleData, permissionData] = await Promise.all([
        settingsApi.findRoles(),
        settingsApi.findPermissions(),
      ]);

      setRoles(roleData);
      setPermissions(permissionData);

      if (roleData.length > 0 && !selectedRoleId) {
        setSelectedRoleId(roleData[0].id);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function createRole(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await settingsApi.createRole({
        name: roleForm.name,
        description: roleForm.description,
        isSystem: roleForm.isSystem,
      });

      setRoleForm({
        name: '',
        description: '',
        isSystem: false,
      });

      setMessage('Role created successfully');
      await loadSettings();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  }

  async function assignPermission(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedRoleId || !selectedPermissionId) {
      setMessage('Select role and permission first');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await settingsApi.assignPermission(
        Number(selectedRoleId),
        Number(selectedPermissionId),
      );

      setSelectedPermissionId('');
      setMessage('Permission assigned successfully');
      await loadSettings();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to assign permission');
    } finally {
      setLoading(false);
    }
  }

  async function removePermission(roleId: number, permissionId: number) {
    const confirmed = window.confirm('Remove this permission from role?');

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');

      await settingsApi.removePermission(roleId, permissionId);

      setMessage('Permission removed successfully');
      await loadSettings();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to remove permission');
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = roles.find((role) => role.id === Number(selectedRoleId));

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage roles, permissions, RBAC access control, and system configuration."
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

      {loading && <p>Loading settings...</p>}

      <div className="module-grid">
        <div className="module-sidebar">
          <Card title="Create Role">
            <form onSubmit={createRole}>
              <Input
                label="Role Name"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, name: e.target.value })
                }
                required
              />

              <TextareaField
                label="Description"
                value={roleForm.description}
                onChange={(value) =>
                  setRoleForm({ ...roleForm, description: value })
                }
              />

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={roleForm.isSystem}
                  onChange={(e) =>
                    setRoleForm({
                      ...roleForm,
                      isSystem: e.target.checked,
                    })
                  }
                />
                System Role
              </label>

              <Button disabled={loading} style={{ width: '100%' }}>
                Create Role
              </Button>
            </form>
          </Card>

          <Card title="Assign Permission">
            <form onSubmit={assignPermission}>
              <SelectField
                label="Role"
                value={selectedRoleId}
                onChange={(value) =>
                  setSelectedRoleId(value ? Number(value) : '')
                }
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Permission"
                value={selectedPermissionId}
                onChange={(value) =>
                  setSelectedPermissionId(value ? Number(value) : '')
                }
              >
                <option value="">Select permission</option>
                {permissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.module}:{permission.action}
                  </option>
                ))}
              </SelectField>

              <Button disabled={loading} style={{ width: '100%' }}>
                Assign Permission
              </Button>
            </form>
          </Card>

          <Card title="System Info">
            <InfoItem label="Application" value="BuildPro IMS" />
            <InfoItem label="Frontend" value="React + TypeScript" />
            <InfoItem label="Backend" value="NestJS + Prisma" />
            <InfoItem label="Database" value="MySQL" />
            <InfoItem label="Authentication" value="JWT" />
            <InfoItem label="Authorization" value="RBAC" />
          </Card>
        </div>

        <div className="module-content">
          <Card title="Roles">
            <DataTable<Role>
              columns={[
                {
                  header: 'ID',
                  accessor: (row) => `#${row.id}`,
                },
                {
                  header: 'Name',
                  accessor: 'name',
                },
                {
                  header: 'Description',
                  accessor: (row) => row.description || '-',
                },
                {
                  header: 'System',
                  accessor: (row) => (row.isSystem ? 'Yes' : 'No'),
                },
                {
                  header: 'Permissions',
                  accessor: (row) => row.rolePermissions?.length ?? 0,
                },
              ]}
              data={roles}
              emptyMessage="No roles found"
            />
          </Card>

          <Card title="Permissions">
            <DataTable<Permission>
              columns={[
                {
                  header: 'ID',
                  accessor: (row) => `#${row.id}`,
                },
                {
                  header: 'Module',
                  accessor: 'module',
                },
                {
                  header: 'Action',
                  accessor: 'action',
                },
                {
                  header: 'Description',
                  accessor: (row) => row.description || '-',
                },
              ]}
              data={permissions}
              emptyMessage="No permissions found"
            />
          </Card>

          <Card
            title={
              selectedRole
                ? `Permissions for ${selectedRole.name}`
                : 'Selected Role Permissions'
            }
          >
            <DataTable<any>
              columns={[
                {
                  header: 'Module',
                  accessor: (row) => row.permission?.module || '-',
                },
                {
                  header: 'Action',
                  accessor: (row) => row.permission?.action || '-',
                },
                {
                  header: 'Description',
                  accessor: (row) => row.permission?.description || '-',
                },
                {
                  header: 'Actions',
                  accessor: (row) =>
                    selectedRole ? (
                      <Button
                        variant="danger"
                        onClick={() =>
                          removePermission(
                            selectedRole.id,
                            row.permissionId,
                          )
                        }
                        style={{ padding: '6px 10px' }}
                      >
                        Remove
                      </Button>
                    ) : (
                      '-'
                    ),
                },
              ]}
              data={selectedRole?.rolePermissions ?? []}
              emptyMessage="No permissions assigned to this role"
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
        rows={3}
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