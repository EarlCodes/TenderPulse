import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { UserAuthProvider } from "@/contexts/UserAuthContext";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import TenderFeed from "./pages/TenderFeed";
import TenderDetail from "./pages/TenderDetail";
import SupplierProfile from "./pages/SupplierProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSuppliers from "./pages/AdminSuppliers";
import AdminLogin from "./pages/AdminLogin";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import SavedTenders from "./pages/SavedTenders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminAuthProvider>
        <UserAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public auth routes */}
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />

              {/* Business User Routes (protected) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <TenderFeed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tender/:id"
                element={
                  <ProtectedRoute>
                    <TenderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saved"
                element={
                  <ProtectedRoute>
                    <SavedTenders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <SupplierProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              
              {/* Admin Routes - Protected */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                } 
              />
              <Route 
                path="/admin/suppliers" 
                element={
                  <ProtectedAdminRoute>
                    <AdminSuppliers />
                  </ProtectedAdminRoute>
                } 
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UserAuthProvider>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
