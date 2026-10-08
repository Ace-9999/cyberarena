import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const applyAuth = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // On boot (or token change), hydrate the user from the server.
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient.get('/me')
      .then(res => { if (!cancelled) setUser(res.user); })
      .catch(err => { if (!cancelled && (err.status === 401 || err.status === 404)) logout(); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, logout]);

  const login = async (username, password) => {
    const res = await apiClient.post('/login', { username, password });
    applyAuth(res.token, res.user);
    return res.user;
  };

  const register = async (username, password) => {
    const res = await apiClient.post('/register', { username, password });
    applyAuth(res.token, res.user);
    return res.user;
  };

  const updateProfile = async (data) => {
    const res = await apiClient.put('/profile', data);
    setUser(res.user);
    return res.user;
  };

  const refreshUser = useCallback(async () => {
    const res = await apiClient.get('/me');
    setUser(res.user);
    return res.user;
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
