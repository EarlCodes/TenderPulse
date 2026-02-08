import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { fetchAdminErrors, fetchIngestionHistory, AdminIngestionRun } from '@/lib/api';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'error' | 'warning' | 'success' | 'info';
}

const AdminNotificationsDropdown = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [errors, runs] = await Promise.all([
          fetchAdminErrors(),
          fetchIngestionHistory(),
        ]);

        if (cancelled) return;

        const now = new Date();

        const errorNotifications: AdminNotification[] = errors.slice(0, 10).map((err, idx) => {
          const ts = new Date(err.timestamp);
          const diffMinutes = Math.max(
            1,
            Math.round((now.getTime() - ts.getTime()) / 60000),
          );
          return {
            id: `err-${idx}`,
            title: 'Ingestion Error',
            message: err.message,
            time: `${diffMinutes} min ago`,
            read: false,
            type: 'error',
          };
        });

        const runNotifications: AdminNotification[] = runs.slice(0, 5).map(run => ({
          id: `run-${run.id}`,
          title: run.success ? 'Ingestion Completed' : 'Ingestion Failed',
          message: run.details || `Items ingested: ${run.items_ingested}, failed: ${run.items_failed}`,
          time: new Date(run.started_at).toLocaleTimeString('en-ZA', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          read: !run.success,
          type: run.success ? 'success' : 'warning',
        }));

        setNotifications([...errorNotifications, ...runNotifications]);
      } catch {
        // leave notifications empty on failure
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeStyles = (type: AdminNotification['type']) => {
    switch (type) {
      case 'error':
        return { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'success':
        return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' };
      case 'info':
        return { icon: Info, color: 'text-primary', bg: 'bg-primary/10' };
      default:
        return { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">System Alerts</h4>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mb-2 text-success opacity-50" />
              <p className="text-sm">All systems operational</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const typeStyles = getTypeStyles(notification.type);
                const IconComponent = typeStyles.icon;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg ${typeStyles.bg} flex items-center justify-center shrink-0`}>
                        <IconComponent className={`h-4 w-4 ${typeStyles.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </span>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-sm text-muted-foreground">
            View all system alerts
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotificationsDropdown;
