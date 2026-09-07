import { BarChart3 } from 'lucide-react';
import TelemetryStats from '../components/admin/TelemetryStats';

export default function AdminTelemetryPage() {
  return (
    <div className="page-content-full">
      <div className="topbar">
        <BarChart3 size={16} style={{ color: 'var(--color-primary)' }} />
        <div>
          <div className="topbar-title">System Telemetry</div>
          <div className="topbar-subtitle">Live server health &amp; fleet statistics</div>
        </div>
      </div>
      <div className="page-content">
        <TelemetryStats />
      </div>
    </div>
  );
}
