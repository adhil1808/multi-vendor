import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import CustomerApp from './pages/CustomerApp';
import CustomerProfile from './pages/CustomerProfile';
import DeliveryDashboard from './pages/DeliveryDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const RoleBasedHome = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'SUPER_ADMIN': return <Navigate to="/superadmin" replace />;
    case 'MERCHANT': return <Navigate to="/merchant" replace />;
    case 'DELIVERY_BOY': return <Navigate to="/delivery" replace />;
    case 'CUSTOMER': return <Navigate to="/customer" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
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

            <Route path="/customer" element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerApp />
              </ProtectedRoute>
            } />

            <Route path="/customer/profile" element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
