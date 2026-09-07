import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@delivery.com', password: 'admin123', role: 'admin' },
  { label: 'Manager', email: 'manager@delivery.com', password: 'manager123', role: 'manager' },
  { label: 'Driver 1', email: 'driver1@delivery.com', password: 'driver123', role: 'driver' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('delivery_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('delivery_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token: t, user: u } = data.data;
      localStorage.setItem('delivery_token', t);
      localStorage.setItem('delivery_user', JSON.stringify(u));
      setToken(t);
      setUser(u);
      return u;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    setToken(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, clearError, demoAccounts: DEMO_ACCOUNTS }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
