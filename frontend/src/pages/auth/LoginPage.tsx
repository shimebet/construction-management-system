import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { Button, Input } from '../../components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@buildpro.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      const data = await authApi.login({ email, password });

      localStorage.setItem('accessToken', data.accessToken);
      window.location.href = '/dashboard';
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>BuildPro IMS</h1>
          <p>Construction Integrated Management System</p>
        </div>

        <h2>Sign in</h2>
        <p className="auth-muted">Access your project dashboard.</p>

        {message && <div className="auth-error">{message}</div>}

        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="auth-footer">
          Do not have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}