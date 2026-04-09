// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { authAPI, getToken, setToken, removeToken } from '../services/api';

export const AuthContext  = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const data = await authAPI.getMe();
          setUser(data.data);
        } catch {
          removeToken();
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    setToken(data.token);
    setUser(data.data);
    localStorage.setItem('user', JSON.stringify(data.data));
    return data;
  };

  const register = async (fullName, email, password) => {
    const data = await authAPI.register(fullName, email, password);
    setToken(data.token);
    setUser(data.data);
    localStorage.setItem('user', JSON.stringify(data.data));
    return data;
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
