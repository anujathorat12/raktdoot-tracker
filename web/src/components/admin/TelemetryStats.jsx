import { useState, useEffect, useRef } from 'react';
import { Activity, Users, Truck, AlertTriangle, Database, Wifi, RefreshCw, Cpu, MemoryStick } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

function MetricCard({ icon: Icon, label, value, sub, color = 'var(--color-primary)' }) {
  return (
    <div className="metric-card">
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="metric-value" style={{ color }}>{value}</div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function TelemetryStats() {
  const { connected } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/telemetry');
      setStats(res.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, 10000); // auto-refresh every 10s
    return () => clearInterval(intervalRef.current);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-default)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!stats) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Unable to load telemetry.</div>;

  const heapUsedMb = stats.memory ? (stats.memory.heapUsed / 1024 / 1024).toFixed(1) : '—';
  const heapTotalMb = stats.memory ? (stats.memory.heapTotal / 1024 / 1024).toFixed(1) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
            </span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--color-success)' : 'var(--color-danger)', boxShadow: connected ? '0 0 8px var(--color-success)' : 'none' }} />
          </div>
        </div>
        <button id="btn-refresh-telemetry" className="btn btn-secondary btn-sm" onClick={fetchStats}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Primary metrics */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-3)' }}>Fleet & Operations</div>
        <div className="telemetry-grid">
          <MetricCard icon={Wifi} label="Socket Clients" value={stats.sockets} sub="Live connections" color="var(--color-accent)" />
          <MetricCard icon={Truck} label="Active Drivers" value={stats.activeDrivers} sub={`of ${stats.totalDrivers} total`} color="var(--color-success)" />
          <MetricCard icon={AlertTriangle} label="Open Issues" value={stats.openIssues} sub={`${stats.resolvedIssues} resolved`} color={stats.openIssues > 0 ? 'var(--color-danger)' : 'var(--color-success)'} />
        </div>
      </div>

      {/* System metrics */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-3)' }}>System Health</div>
        <div className="telemetry-grid">
          <MetricCard icon={Activity} label="Uptime" value={formatUptime(stats.uptime)} sub="Server running" color="var(--color-primary-light)" />
          <MetricCard icon={Users} label="Total Users" value={stats.totalUsers} sub={`${stats.totalDrivers} drivers`} color="var(--color-primary)" />
          <MetricCard icon={Database} label="Location Updates" value={stats.totalLocationUpdates.toLocaleString()} sub="Historical records" color="var(--color-warning)" />
        </div>
      </div>

      {/* Memory bar */}
      {stats.memory && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={14} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Memory Usage</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>
              {heapUsedMb} MB / {heapTotalMb} MB
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-overlay)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((stats.memory.heapUsed / stats.memory.heapTotal) * 100, 100)}%`,
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
              borderRadius: 4,
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            {[
              { label: 'Heap Used', value: formatBytes(stats.memory.heapUsed) },
              { label: 'Heap Total', value: formatBytes(stats.memory.heapTotal) },
              { label: 'RSS', value: formatBytes(stats.memory.rss) },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
