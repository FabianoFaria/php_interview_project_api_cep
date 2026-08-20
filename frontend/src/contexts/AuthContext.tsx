import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authService from '../services/authService';
import { clearToken, getToken, setToken as persistToken } from '../services/tokenStorage';
import type { LoginPayload, RegisterPayload, User } from '../types/Auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokenAtual = getToken();

    if (!tokenAtual) {
      setLoading(false);
      return;
    }

    authService
      .me()
      .then(setUser)
      .catch(() => {
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(payload: LoginPayload) {
    const { user: usuarioLogado, token: novoToken } = await authService.login(payload);

    persistToken(novoToken);
    setTokenState(novoToken);
    setUser(usuarioLogado);
  }

  async function register(payload: RegisterPayload) {
    const { user: usuarioCriado, token: novoToken } = await authService.register(payload);

    persistToken(novoToken);
    setTokenState(novoToken);
    setUser(usuarioCriado);
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: user !== null, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}
