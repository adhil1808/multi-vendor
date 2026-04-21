import React, { createContext, useContext, useState } from 'react';
import { authService } from './mockDB';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const u = await authService.login(email, password);
      setUser(u);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserProfile = async (data) => {
      const updatedUser = await authService.updateProfile(user.id, data);
      setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserProfile, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
