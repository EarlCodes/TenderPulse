import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loginAdmin } from '@/lib/api';

interface AdminUser {
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
}

interface AdminAuthContextType {
  isAdmin: boolean;
  adminUser: AdminUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_AUTH_STORAGE_KEY = 'tenderlink-admin-auth';

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Hydrate admin auth state from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        token?: string;
        user?: { email: string; first_name?: string; last_name?: string; is_superuser?: boolean; is_staff?: boolean };
      };
      if (parsed.token && parsed.user) {
        setIsAdmin(true);
        setAdminUser({
          email: parsed.user.email,
          name: `${parsed.user.first_name || ''} ${parsed.user.last_name || ''}`.trim() || parsed.user.email,
          role: parsed.user.is_superuser ? 'super_admin' : 'admin',
        });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await loginAdmin({ email, password });

      setIsAdmin(true);
      setAdminUser({
        email: res.user.email,
        name: `${res.user.first_name || ''} ${res.user.last_name || ''}`.trim() || res.user.email,
        role: 'admin', // backend enforces staff/superuser; could inspect flags if exposed
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Admin login failed' };
    }
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminUser(null);
    try {
      window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, adminUser, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
