import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { notificationsApi } from '../api/notifications.api';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Companies', path: '/companies', icon: '🏢' },
  { label: 'Users', path: '/users', icon: '👥' },
  { label: 'Projects', path: '/projects', icon: '🏗️' },
  { label: 'WBS', path: '/wbs', icon: '🧩' },
  { label: 'Tasks', path: '/tasks', icon: '✅' },
  { label: 'Milestones', path: '/milestones', icon: '🎯' },
  { label: 'Schedules', path: '/schedules', icon: '📅' },
  { label: 'Daily Reports', path: '/daily-reports', icon: '📝' },
  { label: 'Documents', path: '/documents', icon: '📁' },
  { label: 'RFIs', path: '/rfis', icon: '❓' },
  { label: 'Submittals', path: '/submittals', icon: '📤' },
  { label: 'Approvals', path: '/approvals', icon: '✔️' },
  { label: 'Quality', path: '/quality', icon: '🛡️' },
  { label: 'Safety', path: '/safety', icon: '⛑️' },
  { label: 'Procurement', path: '/procurement', icon: '🛒' },
  { label: 'Inventory', path: '/inventory', icon: '📦' },
  { label: 'Cost', path: '/cost', icon: '💰' },
  { label: 'Finance', path: '/finance', icon: '🏦' },
  { label: 'Reports', path: '/reports', icon: '📈' },
  { label: 'Notifications', path: '/notifications', icon: '🔔' },
  { label: 'Audit Logs', path: '/audit-logs', icon: '🧾' },
  { label: 'Profile', path: '/profile', icon: '👤' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

type TokenPayload = {
  sub?: number;
  email?: string;
  name?: string;
};

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<TokenPayload | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch {
      setUser(null);
    }

    async function loadUnreadNotifications() {
      try {
        const notifications = await notificationsApi.findMine();
        setUnreadCount(
          notifications.filter((notification) => !notification.isRead).length,
        );
      } catch {
        setUnreadCount(0);
      }
    }

    loadUnreadNotifications();
  }, []);

  function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  const userName = user?.name || user?.email || 'User';
  const initials = getInitials(userName);

  return (
    <div
      className={
        sidebarCollapsed ? 'app-shell sidebar-collapsed-shell' : 'app-shell'
      }
    >
      <aside className={sidebarCollapsed ? 'sidebar collapsed' : 'sidebar'}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-icon">B</span>

            <div className="sidebar-logo-text">
              <h2>BuildPro IMS</h2>
              <p>Construction Management</p>
            </div>
          </div>

          <button
            className="sidebar-collapse-button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={logout}>
            <span className="sidebar-icon">⏻</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-sidebar-toggle"
              onClick={() => setSidebarCollapsed((value) => !value)}
              aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              ☰
            </button>

            <div>
              <strong>BuildPro IMS</strong>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
                Enterprise Construction Integrated Management System
              </p>
            </div>
          </div>

          <div className="topbar-actions">
            <Link to="/notifications" className="topbar-icon-button">
              🔔
              {unreadCount > 0 && (
                <span className="topbar-badge">{unreadCount}</span>
              )}
            </Link>

            <Link to="/profile" className="profile-shortcut">
              <span className="profile-avatar">{initials}</span>

              <span className="profile-text">
                <strong>{userName}</strong>
                <small>View profile</small>
              </span>
            </Link>

            <button className="topbar-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(/[ @.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}