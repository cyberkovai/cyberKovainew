import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, adminLogout } from '../api/client.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [twoFactor, setTwoFactor] = useState({ enabled: false });
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('ck_admin_token');
      if (!token) {
        setUser(null);
        setTwoFactor({ enabled: false });
        return;
      }

      const data = await getCurrentUser();
      if (data && data.success && data.user) {
        setUser(data.user);
        setTwoFactor(data.two_factor || { enabled: false });
      } else {
        localStorage.removeItem('ck_admin_token');
        setUser(null);
        setTwoFactor({ enabled: false });
      }
    } catch (err) {
      localStorage.removeItem('ck_admin_token');
      setUser(null);
      setTwoFactor({ enabled: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData, token, twoFactorData) => {
    if (token) localStorage.setItem('ck_admin_token', token);
    setUser(userData || null);
    if (twoFactorData) setTwoFactor(twoFactorData);
  };

  const logout = async () => {
    try {
      await adminLogout();
    } catch (e) {}
    localStorage.removeItem('ck_admin_token');
    setUser(null);
    setTwoFactor({ enabled: false });
  };

  return (
    <AuthContext.Provider value={{ user, twoFactor, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

