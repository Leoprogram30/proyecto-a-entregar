import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = api.getCurrentUser();
    if (current) {
      setUser(current);
    } else {
      // Por defecto iniciar con la docente de Agro para facilitar la evaluación inmediata
      const defaultUser = {
        id: 4,
        nombre: 'Estela',
        apellido: 'Copetti',
        dni: '44444444',
        email: 'docente.agro@ipem349.edu.ar',
        rol: 'docente',
        cargo_descripcion: 'Docente de Producción Vegetal y Agroecología',
        estado: 'aprobado'
      };
      setUser(defaultUser);
      localStorage.setItem('ipem349_current_user', JSON.stringify(defaultUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const loggedUser = await api.login(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (formData) => {
    return await api.register(formData);
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  // Selector rápido de roles para facilitar la demostración académica
  const switchDemoRole = async (targetRole) => {
    const users = await api.getAllUsers();
    const found = users.find(u => u.rol === targetRole && u.estado === 'aprobado');
    if (found) {
      setUser(found);
      localStorage.setItem('ipem349_current_user', JSON.stringify(found));
      localStorage.setItem('ipem349_token', `demo-token-${found.id}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
