import { Users } from 'lucide-react';
import UserManagementTable from '../components/admin/UserManagementTable';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';

export default function AdminUsersPage() {
  const { t } = useLanguage();

  return (
    <div className="page-content-full">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Users size={16} style={{ color: 'var(--color-primary)' }} />
          <div>
            <div className="topbar-title">{t.userMgmtTitle}</div>
            <div className="topbar-subtitle">{t.userMgmtSubtitle}</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <LanguageToggle />
        </div>
      </div>
      <div className="page-content">
        <UserManagementTable />
      </div>
    </div>
  );
}
