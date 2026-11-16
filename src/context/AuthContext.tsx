/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contexto Centralizado de Autenticação e Sessão - Consolida Frontend
 * Em conformidade com SCRUM-12 e SCRUM-10.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, LoginResult, ChangePasswordPayload } from '../types/auth';
import { authService } from '../services/authService';
import { setAuthToken, registerUnauthorizedHandler } from '../services/apiClient';

const TOKEN_STORAGE_KEY = 'consolida_auth_token';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProvisionalPassword: boolean;
  sessionExpiredMessage: string | null;
  isAdmin: boolean;
  isPasswordChangeModalOpen: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: (reason?: string) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<{ success: boolean; message?: string }>;
  hasRole: (role: string) => boolean;
  clearSessionExpiredMessage: () => void;
  openPasswordChangeModal: () => void;
  closePasswordChangeModal: () => void;
}

export interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  initialToken?: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialUser = null,
  initialToken = null,
}) => {
  const [token, setTokenState] = useState<string | null>(() => {
    if (initialToken) return initialToken;
    if (initialUser) return 'active-session-token';
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(() => !initialUser && Boolean(token));
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState<boolean>(
    () => Boolean(initialUser?.requiresPasswordChange)
  );

  // Define se o usuário está sob restrição de senha provisória
  const isProvisionalPassword = Boolean(user?.requiresPasswordChange);

  const saveToken = (newToken: string | null) => {
    setTokenState(newToken);
    setAuthToken(newToken);
    try {
      if (newToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Falhas no storage não interrompem a aplicação
    }
  };

  const logout = useCallback(async (reason?: string) => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch {
      // Limpeza forçada
    } finally {
      saveToken(null);
      setUser(null);
      if (reason) {
        setSessionExpiredMessage(reason);
      }
    }
  }, [token]);

  // Intercepta respostas 401 da API e desloga automaticamente com mensagem
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout('Sua sessão expirou');
    });
  }, [logout]);

  // Restauração de sessão ao carregar
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (initialUser) {
        return;
      }

      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      setAuthToken(token);
      try {
        const userData = await authService.getMe();
        if (isMounted) {
          setUser(userData);
          if (userData.requiresPasswordChange) {
            setIsPasswordChangeModalOpen(true);
          }
        }
      } catch {
        if (isMounted) {
          saveToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [token, initialUser]);

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setSessionExpiredMessage(null);
    const result = await authService.login(credentials);

    if (result.token) {
      saveToken(result.token);
    }

    if (result.user) {
      setUser(result.user);
      if (result.user.requiresPasswordChange || result.requiresPasswordChange) {
        setIsPasswordChangeModalOpen(true);
      }
    } else if (result.token) {
      try {
        const userData = await authService.getMe();
        setUser(userData);
        if (userData.requiresPasswordChange) {
          setIsPasswordChangeModalOpen(true);
        }
      } catch {
        setUser({
          id: 'user-auth',
          name: credentials.email.split('@')[0],
          email: credentials.email,
          roles: ['VIEWER'],
          status: 'ACTIVE',
        });
      }
    }

    return result;
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    const res = await authService.changePassword(payload);
    if (res.success) {
      setUser((prev) => (prev ? { ...prev, requiresPasswordChange: false } : prev));
      setIsPasswordChangeModalOpen(false);
    }
    return res;
  };

  const hasRole = (roleToCheck: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.map((r) => r.toUpperCase()).includes(roleToCheck.toUpperCase());
  };

  const isAdmin = hasRole('ADMIN');

  const clearSessionExpiredMessage = () => {
    setSessionExpiredMessage(null);
  };

  const openPasswordChangeModal = () => {
    setIsPasswordChangeModalOpen(true);
  };

  const closePasswordChangeModal = () => {
    if (!isProvisionalPassword) {
      setIsPasswordChangeModalOpen(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        isProvisionalPassword,
        sessionExpiredMessage,
        isAdmin,
        isPasswordChangeModalOpen,
        login,
        logout,
        changePassword,
        hasRole,
        clearSessionExpiredMessage,
        openPasswordChangeModal,
        closePasswordChangeModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
};
