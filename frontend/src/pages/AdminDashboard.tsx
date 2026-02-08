import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminStatCards from '@/components/admin/AdminStatCards';
import BackfillTool from '@/components/admin/BackfillTool';
import ErrorLogTable from '@/components/admin/ErrorLogTable';
import IngestionHistory from '@/components/admin/IngestionHistory';
import type { AdminStats, IngestionError } from '@/data/mockAdminData';
import { fetchAdminStats, fetchAdminErrors, fetchIngestionHistory, AdminIngestionRun } from '@/lib/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [errors, setErrors] = useState<IngestionError[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<AdminIngestionRun[]>([]);
  const [autoSync, setAutoSync] = useState(true);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState(15);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [s, e, h] = await Promise.all([
          fetchAdminStats(),
          fetchAdminErrors(),
          fetchIngestionHistory(),
        ]);
        if (!cancelled) {
          setStats(s);
          setErrors(e);
          setHistory(h);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage('Failed to load admin stats from backend');
        }
      }
    };

    // initial load
    load();

    // hydrate settings from localStorage
    try {
      const raw = window.localStorage.getItem('tenderlink-admin-settings');
      if (raw) {
        const parsed = JSON.parse(raw) as { autoSync?: boolean; syncInterval?: string };
        if (typeof parsed.autoSync === 'boolean') setAutoSync(parsed.autoSync);
        if (parsed.syncInterval) setSyncIntervalMinutes(parseInt(parsed.syncInterval, 10) || 15);
      }
    } catch {
      // ignore
    }

    // listen for settings changes
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as { autoSync?: boolean; syncInterval?: string };
      if (typeof detail?.autoSync === 'boolean') setAutoSync(detail.autoSync);
      if (detail?.syncInterval) setSyncIntervalMinutes(parseInt(detail.syncInterval, 10) || 15);
    };
    window.addEventListener('adminSettingsChanged', handler);
    return () => {
      cancelled = true;
      window.removeEventListener('adminSettingsChanged', handler);
    };
  }, []);

  // Polling based on autoSync + syncInterval
  useEffect(() => {
    if (!autoSync) return;

    let cancelled = false;
    const intervalMs = Math.max(syncIntervalMinutes, 1) * 60 * 1000;

    const poll = async () => {
      try {
        const [s, e, h] = await Promise.all([
          fetchAdminStats(),
          fetchAdminErrors(),
          fetchIngestionHistory(),
        ]);
        if (!cancelled) {
          setStats(s);
          setErrors(e);
          setHistory(h);
        }
      } catch {
        // ignore errors during background polling
      }
    };

    const id = window.setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [autoSync, syncIntervalMinutes]);

  return (
    <AdminLayout>
        {/* Page Title */}
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-foreground">Ingestion Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor OCDS data ingestion from National Treasury API
          </p>
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {/* KPI Stats */}
        {stats && <AdminStatCards stats={stats} />}

        {/* Backfill Tool + Ingestion History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BackfillTool />
          </div>
          <div className="lg:col-span-1">
            <IngestionHistory runs={history} />
          </div>
        </div>

        {/* Error Log */}
        <ErrorLogTable errors={errors} />
    </AdminLayout>
  );
};

export default AdminDashboard;
