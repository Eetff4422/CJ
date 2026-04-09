import { ReactNode } from 'react';
import { useAuth } from '@ui/contexts/AuthContext';
import { ROLES } from '@domain/entities/Role';
import { useNavigate } from 'react-router-dom';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-gabon-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center font-bold text-lg">
              S
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">SGCJ-Gabon</div>
              <div className="text-xs text-white/70">
                Système de Gestion du Casier Judiciaire
              </div>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{user.fullName}</div>
                <div className="text-xs text-white/70">{ROLES[user.role].label}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>

      <footer className="bg-slate-100 border-t border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-6 text-xs text-slate-500 text-center">
          République Gabonaise · Ministère de la Justice · MVP de présentation ·
          Esno Poly Services
        </div>
      </footer>
    </div>
  );
}
