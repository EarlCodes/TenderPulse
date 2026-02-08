import { Navigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '@/contexts/UserAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useUserAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signup" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

