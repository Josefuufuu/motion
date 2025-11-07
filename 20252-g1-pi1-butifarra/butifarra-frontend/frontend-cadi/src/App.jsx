import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "./context/AuthContext.jsx";

// --- IMPORTACIONES COMBINADAS ---
import HomeBeneficiary from "./pages/HomeBeneficiary.jsx";
import AdminHomePage from "./pages/AdminHomePage.jsx";
import CreateActivity from "./pages/CreateActivity.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import AdminFormInscripcion from "./pages/AdminFormInscripcion.jsx";
import AdminReport from "./pages/AdminReport.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import GestionCadiPage from "./pages/GestionCadiPage.jsx";
import TorneosPage from "./pages/TorneosPage.jsx";
import PsuVoluntariadosPage from "./pages/PsuVoluntariadosPage.jsx";
import CitasPsicologicasPage from "./pages/CitasPsicologicasPage.jsx";
import ReportesPage from "./pages/ReportesPage.jsx";
import ActivitiesCalendar from "./pages/ActivitiesCalendar.jsx";
import PersonalCalendar from "./pages/PersonalCalendar.jsx";
import ActivityListPage from "./pages/ActivityListPage.jsx";
import ActivityDetailPage from "./pages/ActivityDetailPage.jsx";
import AdminTorneosPage from "./pages/AdminTorneosPage.jsx";

// --- COMPONENTE DE ERROR 404 ---
function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h1>404</h1>
      <p>Página no encontrada.</p>
    </div>
  );
}

// --- RUTA PRIVADA ---
export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node,
};

// --- RUTA SOLO PARA ADMIN ---
export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin()) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        <Navigate to="/inicio" replace />
      </div>
    );
  }

  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node,
};

// --- RUTA SOLO PARA BENEFICIARIOS ---
export function BeneficiaryRoute({ children }) {
  const { user, loading, isBeneficiary } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isBeneficiary()) {
    return <Navigate to="/admin/home" replace />;
  }

  return children;
}

BeneficiaryRoute.propTypes = {
  children: PropTypes.node,
};

// --- REDIRECCIÓN SEGÚN SESIÓN Y ROL ---
function LandingRedirect() {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir a la página correspondiente según el rol
  if (isAdmin()) {
    return <Navigate to="/admin/home" replace />;
  }

  return <Navigate to="/inicio" replace />;
}

// --- APP PRINCIPAL ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rutas de beneficiario */}
        <Route path="/" element={<LandingRedirect />} />
        <Route
          path="/inicio"
          element={(
            <PrivateRoute>
              <HomeBeneficiary />
            </PrivateRoute>
          )}
        />
        <Route
          path="/HomeBeneficiary"
          element={(
            <PrivateRoute>
              <HomeBeneficiary />
            </PrivateRoute>
          )}
        />
        <Route
          path="/gestion-cadi"
          element={(
            <AdminRoute>
              <GestionCadiPage />
            </AdminRoute>
          )}
        />
        <Route
          path="/torneos"
          element={(
            <PrivateRoute>
              <TorneosPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/psu"
          element={(
            <PrivateRoute>
              <PsuVoluntariadosPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/citas"
          element={(
            <PrivateRoute>
              <CitasPsicologicasPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/reportes"
          element={(
            <PrivateRoute>
              <ReportesPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/calendario"
          element={(
            <PrivateRoute>
              <ActivitiesCalendar />
            </PrivateRoute>
          )}
        />
        <Route
          path="/mi-calendario"
          element={(
            <PrivateRoute>
              <PersonalCalendar />
            </PrivateRoute>
          )}
        />

        {/* Rutas de actividades - Crear solo para admins */}
        <Route
          path="/actividades"
          element={(
            <PrivateRoute>
              <ActivityListPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/actividades/:id"
          element={(
            <PrivateRoute>
              <ActivityDetailPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/actividades/crear"
          element={(
            <AdminRoute>
              <CreateActivity />
            </AdminRoute>
          )}
        />

        {/* Rutas de administrador - Solo para admins */}
        <Route
          path="/admin/reports"
          element={(
            <AdminRoute>
              <AdminReport />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/home"
          element={(
            <AdminRoute>
              <AdminHomePage />
            </AdminRoute>
          )}
        />
        <Route
          path="/perfil"
          element={(
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/admin/form-inscripcion"
          element={(
            <AdminRoute>
              <AdminFormInscripcion />
            </AdminRoute>
          )}
        />
        <Route
          path="/admin/torneos"
          element={(
            <AdminRoute>
              <AdminTorneosPage />
            </AdminRoute>
          )}
        />

        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
