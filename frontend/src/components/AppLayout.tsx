import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Bookmark, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { getSavedTendersCount } from '@/lib/api';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUserAuth();

  // Fetch saved tenders count
  useEffect(() => {
    let cancelled = false;
    const loadCount = async () => {
      try {
        const count = await getSavedTendersCount();
        if (!cancelled) {
          setSavedCount(count);
        }
      } catch (err) {
        if (!cancelled) {
          setSavedCount(0);
        }
      }
    };
    loadCount();
    
    // Listen for saved tender updates
    const handleSavedUpdate = () => {
      loadCount();
    };
    window.addEventListener('savedTenderUpdated', handleSavedUpdate);
    
    return () => {
      cancelled = true;
      window.removeEventListener('savedTenderUpdated', handleSavedUpdate);
    };
  }, [location.pathname]); // Refresh when navigating

  const navItems = [
    { path: '/', label: 'Tender Feed', icon: Search },
    { path: '/saved', label: 'Saved Tenders', icon: Bookmark, badge: savedCount !== null ? savedCount : undefined },
    { path: '/profile', label: 'My Profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <img 
                  src="/TenderPulse Logo.PNG" 
                  alt="TenderPulseZA" 
                  className="w-10 h-10 rounded-xl object-contain"
                />
                <div>
                  <h1 className="font-bold text-sidebar-foreground">TenderPulseZA</h1>
                  <p className="text-xs text-sidebar-foreground/60">Your direct line to every SA tender</p>
                </div>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  nav-link
                  ${isActive(item.path) 
                    ? 'nav-link-active' 
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="bg-sidebar-accent/50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">5 New Tenders</p>
                  <p className="text-xs text-sidebar-foreground/60">Match your profile</p>
                </div>
              </div>
            </div>

            <button
              className="nav-link text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full"
              onClick={() => {
                logout();
                setSidebarOpen(false);
                navigate('/login', { replace: true });
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:block">
                <h2 className="font-semibold text-foreground">
                  {navItems.find(item => isActive(item.path))?.label || 'TenderPulseZA'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationsDropdown />
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">TV</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
