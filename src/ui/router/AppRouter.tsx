import { RoleId, ROLES } from '@domain/entities/Role';
import { ProtectedRoute } from '@ui/components/ProtectedRoute';
import { AuthProvider, useAuth } from '@ui/contexts/AuthContext';
import { LoginPage } from '@ui/pages/LoginPage';
import { AdminAccountProfilePage } from '@ui/pages/admin/AdminAccountProfilePage';
import { AdminPage } from '@ui/pages/admin/AdminPage';
import { AgentCasierPage } from '@ui/pages/agent-casier/AgentCasierPage';
import { AgentPenitentiairePage } from '@ui/pages/agent-penitentiaire/AgentPenitentiairePage';
import { CitizenProfilePage } from '@ui/pages/agent-penitentiaire/CitizenProfilePage';
import { CitizenDashboardPage } from '@ui/pages/citizen/CitizenDashboardPage';
import { NewBulletinRequestPage } from '@ui/pages/citizen/NewBulletinRequestPage';
import { PaymentPage } from '@ui/pages/citizen/PaymentPage';
import { RegisterCitizenPage } from '@ui/pages/citizen/RegisterCitizenPage';
import { DgDashboardPage } from '@ui/pages/dg/DgDashboardPage';
import { PublicVerifyPage } from '@ui/pages/public/PublicVerifyPage';
import { SuperviseurCasierPage } from '@ui/pages/superviseur-casier/SuperviseurCasierPage';
import { SuperviseurCondamnationsPage } from '@ui/pages/superviseur-condamnations/SuperviseurCondamnationsPage';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gabon-primary">
        Chargement…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLES[user.role].homeRoute} replace />;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function AppRouter() {
  return (
    <BrowserRouter basename={BASE || '/'}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterCitizenPage />} />
          <Route path="/verifier/:code" element={<PublicVerifyPage />} />

          {/* Citizen */}
          <Route
            path="/citoyen"
            element={
              <ProtectedRoute allowedRoles={[RoleId.CITIZEN]}>
                <CitizenDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citoyen/nouvelle-demande"
            element={
              <ProtectedRoute allowedRoles={[RoleId.CITIZEN]}>
                <NewBulletinRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citoyen/paiement/:bulletinId"
            element={
              <ProtectedRoute allowedRoles={[RoleId.CITIZEN]}>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          {/* Agent casier */}
          <Route
            path="/agent-casier"
            element={
              <ProtectedRoute allowedRoles={[RoleId.AGENT_CASIER]}>
                <AgentCasierPage />
              </ProtectedRoute>
            }
          />

          {/* Superviseur casier */}
          <Route
            path="/superviseur-casier"
            element={
              <ProtectedRoute allowedRoles={[RoleId.SUPERVISEUR_CASIER]}>
                <SuperviseurCasierPage />
              </ProtectedRoute>
            }
          />

          {/* DG */}
          <Route
            path="/dg"
            element={
              <ProtectedRoute allowedRoles={[RoleId.DIRECTEUR_GENERAL]}>
                <DgDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Agent pénitentiaire */}
          {/* Agent pénitentiaire */}
<Route
  path="/agent-penitentiaire"
  element={
    <ProtectedRoute allowedRoles={[RoleId.AGENT_PENITENTIAIRE]}>
      <AgentPenitentiairePage />
    </ProtectedRoute>
  }
/>
<Route
  path="/agent-penitentiaire/citoyen/:citizenId"
  element={
    <ProtectedRoute allowedRoles={[RoleId.AGENT_PENITENTIAIRE]}>
      <CitizenProfilePage />
    </ProtectedRoute>
  }
/>

{/* Superviseur condamnations */}
          {/* Superviseur condamnations */}
          <Route
            path="/superviseur-condamnations"
            element={
              <ProtectedRoute allowedRoles={[RoleId.SUPERVISEUR_CONDAMNATIONS]}>
                <SuperviseurCondamnationsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin technique */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[RoleId.ADMIN_TECHNIQUE]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
  path="/admin/compte/:userId"
  element={
    <ProtectedRoute allowedRoles={[RoleId.ADMIN_TECHNIQUE]}>
      <AdminAccountProfilePage />
    </ProtectedRoute>
  }
/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
