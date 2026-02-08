import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { SupplierProfile } from '@/types/tender';
import { fetchAdminSuppliers, updateAdminSupplier } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, PauseCircle, PlayCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Derived overview stats
  const totalSuppliers = suppliers.length;
  const pausedSuppliers = suppliers.filter(s => s.isPaused).length;
  const activeSuppliers = totalSuppliers - pausedSuppliers;
  const emailEnabled = suppliers.filter(s => s.emailNotifications).length;

  const load = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const data = await fetchAdminSuppliers(searchTerm);
      setSuppliers(data);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search.trim() || undefined);
  };

  const toggleNotification = async (id: string, field: keyof SupplierProfile) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;
    const nextValue = !supplier[field] as boolean;

    setSavingId(id);
    try {
      const updated = await updateAdminSupplier(id, { [field]: nextValue } as any);
      setSuppliers(prev => prev.map(s => (s.id === id ? updated : s)));
      toast.success('Supplier updated');
    } catch {
      toast.error('Failed to update supplier');
    } finally {
      setSavingId(null);
    }
  };

  const togglePaused = async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;

    const nextValue = !supplier.isPaused;
    setSavingId(id);
    try {
      const updated = await updateAdminSupplier(id, { isPaused: nextValue } as any);
      setSuppliers(prev => prev.map(s => (s.id === id ? updated : s)));
      toast.success(nextValue ? 'Supplier paused' : 'Supplier resumed');
    } catch {
      toast.error('Failed to update supplier status');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suppliers</h2>
          <p className="text-muted-foreground">
            Overview of all supplier profiles with controls to pause, resume and adjust notifications.
          </p>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Total Suppliers
            </p>
            <p className="text-2xl font-bold text-foreground">{totalSuppliers}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Active
            </p>
            <p className="text-2xl font-bold text-foreground">{activeSuppliers}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Paused
            </p>
            <p className="text-2xl font-bold text-foreground">{pausedSuppliers}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Email Alerts Enabled
            </p>
            <p className="text-2xl font-bold text-foreground">{emailEnabled}</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, email, or province"
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Supplier Profiles</h3>
              <p className="text-xs text-muted-foreground">
                {suppliers.length} suppliers loaded
              </p>
            </div>
            {loading && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Loading…
              </Badge>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Status</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Value Range</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map(s => (
                  <TableRow key={s.id} className={s.isPaused ? 'opacity-60' : ''}>
                    <TableCell>
                      {s.isPaused ? (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                          Paused
                        </Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success border-success/20 text-xs">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {s.companyName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Reg: {s.registrationNumber || '—'} · BBBEE: {s.bbbeeLevel || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{s.email}</span>
                        <span className="text-xs text-muted-foreground">{s.phone || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {s.city || '—'}, {s.province || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        R {s.minValue.toLocaleString()} – R {s.maxValue.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant={s.emailNotifications ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleNotification(s.id, 'emailNotifications')}
                        >
                          Email
                        </Badge>
                        <Badge
                          variant={s.smsNotifications ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleNotification(s.id, 'smsNotifications')}
                        >
                          SMS
                        </Badge>
                        <Badge
                          variant={s.whatsappNotifications ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleNotification(s.id, 'whatsappNotifications')}
                        >
                          WhatsApp
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 gap-1 text-xs"
                        disabled={savingId === s.id}
                        onClick={() => togglePaused(s.id)}
                      >
                        {s.isPaused ? (
                          <>
                            <PlayCircle className="h-3 w-3" />
                            Resume
                          </>
                        ) : (
                          <>
                            <PauseCircle className="h-3 w-3" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() =>
                          toast.info(
                            `Created: ${new Date(s.createdAt).toLocaleString('en-ZA')} · Last updated: ${new Date(
                              s.updatedAt,
                            ).toLocaleString('en-ZA')}`,
                          )
                        }
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {suppliers.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSuppliers;

