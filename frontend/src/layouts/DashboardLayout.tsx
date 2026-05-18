import { NavLink, Outlet } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Companies', path: '/companies' },
  { label: 'Projects', path: '/projects' },
  { label: 'WBS', path: '/wbs' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Schedules', path: '/schedules' },
  { label: 'Daily Reports', path: '/daily-reports' },
  { label: 'Documents', path: '/documents' },
  { label: 'RFIs', path: '/rfis' },
  { label: 'Submittals', path: '/submittals' },
  { label: 'Approvals', path: '/approvals' },
  { label: 'Quality', path: '/quality' },
  { label: 'Safety', path: '/safety' },
  { label: 'Procurement', path: '/procurement' },
  { label: 'Inventory', path: '/inventory' },
  { label: 'Cost', path: '/cost' },
  { label: 'Finance', path: '/finance' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' },
];

export default function DashboardLayout() {
  function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f8' }}>
      <aside
        style={{
          width: 260,
          background: '#111827',
          color: '#fff',
          padding: 20,
          position: 'fixed',
          top: 0,
          bottom: 0,
          overflowY: 'auto',
        }}
      >
        <h2 style={{ marginBottom: 4 }}>BuildPro IMS</h2>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
          Construction Management
        </p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                padding: '10px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                color: isActive ? '#111827' : '#d1d5db',
                background: isActive ? '#f9fafb' : 'transparent',
                fontWeight: isActive ? 700 : 500,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: 24,
            width: '100%',
            padding: 10,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </aside>

      <main style={{ marginLeft: 260, flex: 1 }}>
        <header
          style={{
            height: 64,
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
          }}
        >
          <strong>BuildPro IMS Dashboard</strong>
        </header>

        <section style={{ padding: 24 }}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}