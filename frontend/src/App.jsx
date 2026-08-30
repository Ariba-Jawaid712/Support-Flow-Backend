import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { VerifyOTP } from './pages/auth/VerifyOTP';
import { ResetPassword } from './pages/auth/ResetPassword';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CreateRequest } from './pages/customer/CreateRequest';
import { CustomerRequestDetail } from './pages/customer/CustomerRequestDetail';

// Worker Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerRequestDetail } from './pages/worker/WorkerRequestDetail';
import { WorkerProfile } from './pages/worker/WorkerProfile';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminWorkerRequests } from './pages/admin/AdminWorkerRequests';
import { AdminTicketList } from './pages/admin/AdminTicketList';
import { AdminUserList } from './pages/admin/AdminUserList';

// Common
import { NotFound } from './pages/NotFound';

// Protected Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-muted)' }}>
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to respective dashboard if role is not authorized
    if (user.role === 'customer') return <Navigate to="/dashboard" replace />;
    if (user.role === 'worker') return <Navigate to="/worker/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root Router Entrypoint
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-muted)' }}>
        Loading SupportFlow...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'customer') return <Navigate to="/dashboard" replace />;
  if (user.role === 'worker') return <Navigate to="/worker/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <div className="app-container">
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Root / Default */}
                  <Route path="/" element={<RootRedirect />} />

                  {/* Public Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/verify-otp" element={<VerifyOTP />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Customer Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/requests/new"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CreateRequest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/requests/:id"
                    element={
                      <ProtectedRoute allowedRoles={['customer', 'worker', 'admin']}>
                        <CustomerRequestDetail />
                      </ProtectedRoute>
                    }
                  />

                  {/* Worker Routes */}
                  <Route
                    path="/worker/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['worker']}>
                        <WorkerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/worker/requests/:id"
                    element={
                      <ProtectedRoute allowedRoles={['worker']}>
                        <WorkerRequestDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/worker/profile/:id"
                    element={
                      <ProtectedRoute allowedRoles={['customer', 'worker', 'admin']}>
                        <WorkerProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/worker-requests"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminWorkerRequests />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/tickets"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminTicketList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminUserList />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Fallback */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
