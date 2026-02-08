import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import AdminHeader from '@/components/admin/AdminHeader';
import { LayoutDashboard, Users } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card/60">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground tracking-wide">
            Admin Navigation
          </h2>
          <p className="text-xs text-muted-foreground">Manage ingestion and suppliers</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Ingestion Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/suppliers"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <Users className="h-4 w-4" />
            <span>Suppliers</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

