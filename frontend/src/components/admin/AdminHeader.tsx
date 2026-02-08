import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, LogOut } from 'lucide-react';
import AdminNotificationsDropdown from '@/components/admin/AdminNotificationsDropdown';
import AdminSettingsDropdown from '@/components/admin/AdminSettingsDropdown';

const AdminHeader = () => {
  const { adminUser, logout } = useAdminAuth();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-4">
          <img 
            src="/TenderPulse Logo.PNG" 
            alt="TenderPulseZA" 
            className="w-10 h-10 rounded-xl object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-foreground">TenderPulseZA Admin</h1>
            <p className="text-xs text-muted-foreground">System Administration Dashboard</p>
          </div>
        </div>

        {/* Right: User Info and Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <AdminNotificationsDropdown />

          {/* Settings */}
          <AdminSettingsDropdown />

          {/* Divider */}
          <div className="w-px h-8 bg-border" />

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{adminUser?.name}</p>
              <p className="text-xs text-muted-foreground">{adminUser?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              {adminUser?.name?.charAt(0) || 'A'}
            </div>
            <Badge variant="outline" className="hidden md:flex border-amber-500/30 text-amber-600 bg-amber-500/10">
              {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>

          {/* Logout Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
