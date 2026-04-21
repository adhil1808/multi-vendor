import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Utensils } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('password');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(identifier, password);
    navigate('/'); // App.jsx will reroute conditionally
  };

  const autofill = (mail) => setIdentifier(mail);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }} className="animate-fade-in">
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Utensils size={32} />
        </div>
        <h2 style={{ marginBottom: '8px' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Sign in to access your dashboard</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: 'red', background: '#fee2e2', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>{error}</div>}
          
          <input 
            type="text" 
            placeholder="Email Address or Restaurant ID" 
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Demo Accounts (pass: password)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => autofill('admin@app.com')}>Super Admin</button>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => autofill('pizza@app.com')}>Merchant</button>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => autofill('bob@app.com')}>Delivery Boy</button>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => autofill('customer@app.com')}>Customer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
