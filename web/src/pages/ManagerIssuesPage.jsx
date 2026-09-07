import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import IssueFeed from '../components/manager/IssueFeed';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function ManagerIssuesPage() {
  const { setIssues } = useSocket();

  // Load historical issues on mount
  useEffect(() => {
    api.get('/issues?limit=100')
      .then(r => setIssues(r.data.data))
      .catch(console.error);
  }, [setIssues]);

  return (
    <div className="page-content-full">
      <div className="topbar">
        <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
        <div>
          <div className="topbar-title">Issues Feed</div>
          <div className="topbar-subtitle">Live incident reports from drivers</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <IssueFeed />
      </div>
    </div>
  );
}
