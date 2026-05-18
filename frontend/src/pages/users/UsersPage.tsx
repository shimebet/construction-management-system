import { useEffect, useState } from 'react';
import { companiesApi } from '../../api/companies.api';
import type { Company } from '../../api/companies.api';
import { projectsApi } from '../../api/projects.api';
import type { Project } from '../../api/projects.api';
import { settingsApi } from '../../api/settings.api';
import type { Role } from '../../api/settings.api';
import { usersApi } from '../../api/users.api';
import type { User } from '../../api/users.api';
import { Button, Card, DataTable, PageHeader } from '../../components/ui';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [companyForm, setCompanyForm] = useState({
    companyId: '',
    userId: '',
    roleId: '',
    status: 'ACTIVE',
  });

  const [projectForm, setProjectForm] = useState({
    projectId: '',
    userId: '',
    roleId: '',
    status: 'ACTIVE',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setMessage('');

      const [userData, companyData, projectData, roleData] = await Promise.all([
        usersApi.findAll(),
        companiesApi.findAll(),
        projectsApi.findAll(),
        settingsApi.findRoles(),
      ]);

      setUsers(userData);
      setCompanies(companyData);
      setProjects(projectData);
      setRoles(roleData);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to load users data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function assignCompanyUser(e: React.FormEvent) {
    e.preventDefault();

    if (!companyForm.companyId || !companyForm.userId || !companyForm.roleId) {
      setMessage('Select company, user, and role first');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await usersApi.assignToCompany(Number(companyForm.companyId), {
        userId: Number(companyForm.userId),
        roleId: Number(companyForm.roleId),
        status: companyForm.status as 'ACTIVE' | 'INACTIVE',
      });

      setCompanyForm({
        companyId: '',
        userId: '',
        roleId: '',
        status: 'ACTIVE',
      });

      setMessage('User assigned to company successfully');
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to assign user to company',
      );
    } finally {
      setLoading(false);
    }
  }

  async function assignProjectUser(e: React.FormEvent) {
    e.preventDefault();

    if (!projectForm.projectId || !projectForm.userId || !projectForm.roleId) {
      setMessage('Select project, user, and role first');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await usersApi.assignToProject(Number(projectForm.projectId), {
        userId: Number(projectForm.userId),
        roleId: Number(projectForm.roleId),
        status: projectForm.status as 'ACTIVE' | 'INACTIVE',
      });

      setProjectForm({
        projectId: '',
        userId: '',
        roleId: '',
        status: 'ACTIVE',
      });

      setMessage('User assigned to project successfully');
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to assign user to project',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users Management"
        description="List system users and assign users to companies or projects with roles."
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

      {loading && <p>Loading users...</p>}

      <div className="module-grid">
        <div className="module-sidebar">
          <Card title="Assign User to Company">
            <form onSubmit={assignCompanyUser}>
              <SelectField
                label="Company"
                value={companyForm.companyId}
                onChange={(value) =>
                  setCompanyForm({ ...companyForm, companyId: value })
                }
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="User"
                value={companyForm.userId}
                onChange={(value) =>
                  setCompanyForm({ ...companyForm, userId: value })
                }
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Role"
                value={companyForm.roleId}
                onChange={(value) =>
                  setCompanyForm({ ...companyForm, roleId: value })
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
                label="Status"
                value={companyForm.status}
                onChange={(value) =>
                  setCompanyForm({ ...companyForm, status: value })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </SelectField>

              <Button disabled={loading} style={{ width: '100%' }}>
                Assign to Company
              </Button>
            </form>
          </Card>

          <Card title="Assign User to Project">
            <form onSubmit={assignProjectUser}>
              <SelectField
                label="Project"
                value={projectForm.projectId}
                onChange={(value) =>
                  setProjectForm({ ...projectForm, projectId: value })
                }
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="User"
                value={projectForm.userId}
                onChange={(value) =>
                  setProjectForm({ ...projectForm, userId: value })
                }
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Role"
                value={projectForm.roleId}
                onChange={(value) =>
                  setProjectForm({ ...projectForm, roleId: value })
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
                label="Status"
                value={projectForm.status}
                onChange={(value) =>
                  setProjectForm({ ...projectForm, status: value })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </SelectField>

              <Button disabled={loading} style={{ width: '100%' }}>
                Assign to Project
              </Button>
            </form>
          </Card>
        </div>

        <div className="module-content">
          <Card title="User List">
            <DataTable<User>
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
                  header: 'Email',
                  accessor: 'email',
                },
                {
                  header: 'Phone',
                  accessor: (row) => row.phone || '-',
                },
                {
                  header: 'Job Title',
                  accessor: (row) => row.jobTitle || '-',
                },
                {
                  header: 'Status',
                  accessor: 'status',
                },
              ]}
              data={users}
              emptyMessage="No users found"
            />
          </Card>

          <Card title="Available Roles">
            <DataTable<Role>
              columns={[
                {
                  header: 'ID',
                  accessor: (row) => `#${row.id}`,
                },
                {
                  header: 'Role',
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
              ]}
              data={roles}
              emptyMessage="No roles found"
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