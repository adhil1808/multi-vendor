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
  
  if (loading) return null; // Wait for auth to resolve
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
          <Route path="/setup-admin" element={<AdminSetup />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<RoleBasedHome />} />
            
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

            <Route path="/customer" element={<CustomerApp />} />

            <Route path="/customer/profile" element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
