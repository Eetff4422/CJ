import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@domain/entities/User';
import { Permission, hasPermission } from '@domain/entities/Role';
import { storage } from '@infrastructure/persistence/LocalStorageAdapter';
import { container } from '@infrastructure/container';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'current_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const session = storage.get<{ userId: string }>(SESSION_KEY);
      if (session?.userId) {
        const u = await container.authRepository.findById(session.userId);
        if (u && u.isActive) setUser(u);
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await container.loginUseCase.execute({ email, password });
    if (result.success && result.user) {
      setUser(result.user);
      storage.set(SESSION_KEY, { userId: result.user.id });
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  const logout = async () => {
    if (user) await container.logoutUseCase.execute(user);
    setUser(null);
    storage.remove(SESSION_KEY);
  };

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
