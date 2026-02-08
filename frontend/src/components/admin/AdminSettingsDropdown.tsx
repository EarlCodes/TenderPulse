import { useEffect, useState } from 'react';
import { Settings, Database, Clock, Bell, Shield, RefreshCw, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const SETTINGS_STORAGE_KEY = 'tenderlink-admin-settings';

const AdminSettingsDropdown = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: '15',
    errorAlerts: true,
    queueAlerts: true,
    maintenanceMode: false,
    debugMode: false,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSettings(prev => ({ ...prev, ...parsed }));
    } catch {
      // ignore
    }
  }, []);

  const persist = (next: typeof settings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('adminSettingsChanged', { detail: next }));
      } catch {
        // ignore
      }
      return next;
    });
    toast.success(`Setting updated: ${key}`);
  };

  const handleIntervalChange = (value: string) => {
    setSettings(prev => {
      const next = { ...prev, syncInterval: value };
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('adminSettingsChanged', { detail: next }));
      } catch {
        // ignore
      }
      return next;
    });
    toast.success(`Sync interval updated to ${value} minutes`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Admin Settings</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Configure system behavior</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Sync Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <RefreshCw className="h-4 w-4 text-primary" />
              Synchronization
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Auto-sync</Label>
                <p className="text-xs text-muted-foreground">Automatically fetch new data</p>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={() => handleToggle('autoSync')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Sync Interval</Label>
                <p className="text-xs text-muted-foreground">How often to check for updates</p>
              </div>
              <Select value={settings.syncInterval} onValueChange={handleIntervalChange}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Alert Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bell className="h-4 w-4 text-primary" />
              Alerts
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Error Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified on ingestion errors</p>
              </div>
              <Switch
                checked={settings.errorAlerts}
                onCheckedChange={() => handleToggle('errorAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Queue Alerts</Label>
                <p className="text-xs text-muted-foreground">Alert when queue exceeds threshold</p>
              </div>
              <Switch
                checked={settings.queueAlerts}
                onCheckedChange={() => handleToggle('queueAlerts')}
              />
            </div>
          </div>

          <Separator />

          {/* System Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Server className="h-4 w-4 text-primary" />
              System
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm text-amber-600">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">Pause all ingestion jobs</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={() => handleToggle('maintenanceMode')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Debug Mode</Label>
                <p className="text-xs text-muted-foreground">Enable verbose logging</p>
              </div>
              <Switch
                checked={settings.debugMode}
                onCheckedChange={() => handleToggle('debugMode')}
              />
            </div>
          </div>
        </div>

        <Separator />
        <div className="p-3 bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="h-3 w-3" />
            <span>Last config sync: 2 minutes ago</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdminSettingsDropdown;
