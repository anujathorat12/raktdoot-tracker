import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Eye, EyeOff, Zap, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loading, error, clearError, demoAccounts } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalErr('');
    if (!email || !password) { setLocalErr('Please enter email and password.'); return; }
    try {
      await login(email, password);
    } catch (_) {}
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    clearError(); setLocalErr('');
  };

  const displayError = error || localErr;

  return (
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card animate-slide-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">🚚</div>
        </div>
        <h1 className="login-title">Delivery Tracker</h1>
        <p className="login-sub">Real-time fleet management & tracking platform</p>

        {/* Demo accounts */}
        <div className="demo-accounts">
          <div className="demo-label">⚡ Quick Demo Login</div>
          {demoAccounts.map((acc) => (
            <div key={acc.email} className="demo-account" onClick={() => fillDemo(acc)}>
              <div className="demo-account-info">
                <span className="demo-account-email">{acc.label} — {acc.email}</span>
                <span className="demo-account-pass">{acc.password}</span>
              </div>
              <button className="btn btn-secondary btn-sm demo-fill-btn">Fill</button>
            </div>
          ))}
        </div>

        {/* Error */}
        {displayError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 'var(--space-4)', color: 'var(--color-danger)', fontSize: '13px' }}>
            {displayError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-email"
                className="input"
                style={{ paddingLeft: 36 }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-password"
                className="input"
                style={{ paddingLeft: 36, paddingRight: 44 }}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setShowPass(v => !v)}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: 'var(--space-2)' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                Signing in...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={15} /> Sign In
              </span>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: '11px', color: 'var(--text-muted)' }}>
          🔒 Secured with JWT authentication · Role-based access control
        </p>
      </div>
    </div>
  );
}
