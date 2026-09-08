import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

export default function AppShell() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="main-body">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}

