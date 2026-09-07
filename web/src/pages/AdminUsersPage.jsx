import { Users } from 'lucide-react';
import UserManagementTable from '../components/admin/UserManagementTable';

export default function AdminUsersPage() {
  return (
    <div className="page-content-full">
      <div className="topbar">
        <Users size={16} style={{ color: 'var(--color-primary)' }} />
        <div>
          <div className="topbar-title">User Management</div>
          <div className="topbar-subtitle">Manage drivers, managers, and admin accounts</div>
        </div>
      </div>
      <div className="page-content">
        <UserManagementTable />
      </div>
    </div>
  );
}
