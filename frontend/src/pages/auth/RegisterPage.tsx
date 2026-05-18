import { useState } from 'react';
import { authApi } from '../../api/auth.api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    jobTitle: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(name: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');

      await authApi.register(form);

      setMessage('Registration successful. You can login now.');
      window.location.href = '/login';
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <h1>Create Account</h1>

      <form onSubmit={handleRegister}>
        <input
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
          placeholder="Name"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
        />

        <input
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
        />

        <input
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
        />

        <input
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
        />

        <input
          style={{ width: '100%', padding: 10, marginBottom: 10 }}
          placeholder="Job Title"
          value={form.jobTitle}
          onChange={(e) => updateField('jobTitle', e.target.value)}
        />

        <button disabled={loading} style={{ padding: 10, width: '100%' }}>
          {loading ? 'Creating...' : 'Register'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}