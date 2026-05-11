import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
          <h1 style={{ color: 'var(--primary)' }}>Oops! Something went wrong.</h1>
          <p style={{ color: 'var(--text-secondary)' }}>We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => window.location.reload()}>Refresh App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const NotFound = () => (
  <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
    <h1 style={{ fontSize: '64px', color: 'var(--primary)', marginBottom: '16px' }}>404</h1>
    <h2 style={{ marginBottom: '24px' }}>Page Not Found</h2>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>The page you are looking for doesn't exist or has been moved.</p>
    <Navigate to="/" className="btn btn-primary">Go to Home</Navigate>
  </div>
);
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import CustomerApp from './pages/CustomerApp';
import CustomerProfile from './pages/CustomerProfile';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminSetup from './pages/AdminSetup';
import Signup from './pages/Signup';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleBasedHome = () => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '24px' }}>Fooddiees...</div>
    </div>
  );
  if (!user) return <CustomerApp />;

  switch (user.role) {
    case 'SUPER_ADMIN': return <Navigate to="/superadmin" replace />;
    case 'MERCHANT': return <Navigate to="/merchant" replace />;
    case 'DELIVERY_BOY': return <Navigate to="/delivery" replace />;
    case 'CUSTOMER': return <CustomerApp />;
    default: return <CustomerApp />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/setup-admin" element={<AdminSetup />} />
          
          <Route path="/" element={<RoleBasedHome />} />
          <Route path="/customer" element={<CustomerApp />} />
          <Route path="/customer/profile" element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerProfile />
            </ProtectedRoute>
          } />

          <Route element={<Layout />}>
            <Route path="/superadmin" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/merchant" element={
              <ProtectedRoute allowedRoles={['MERCHANT']}>
                <MerchantDashboard />
              </ProtectedRoute>
            } />

            <Route path="/delivery" element={
              <ProtectedRoute allowedRoles={['DELIVERY_BOY']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
