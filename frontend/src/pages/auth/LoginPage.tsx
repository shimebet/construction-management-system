import { useState } from 'react';
import { authApi } from '../../api/auth.api';

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

      const data = await authApi.login({
        email,
        password,
      });

      localStorage.setItem('accessToken', data.accessToken);

      setMessage('Login successful');
      window.location.href = '/dashboard';
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto' }}>
      <h1>BuildPro IMS Login</h1>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            style={{ width: '100%', padding: 10 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            style={{ width: '100%', padding: 10 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
        </div>

        <button disabled={loading} style={{ padding: 10, width: '100%' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}