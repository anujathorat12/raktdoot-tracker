import { BarChart3 } from 'lucide-react';
import TelemetryStats from '../components/admin/TelemetryStats';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';

export default function AdminTelemetryPage() {
  const { t } = useLanguage();

  return (
    <div className="page-content-full">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BarChart3 size={16} style={{ color: 'var(--color-primary)' }} />
          <div>
            <div className="topbar-title">{t.telemetryTitle}</div>
            <div className="topbar-subtitle">{t.telemetrySubtitle}</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <LanguageToggle />
        </div>
      </div>
      <div className="page-content">
        <TelemetryStats />
      </div>
    </div>
  );
}
