import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClientesPage from "./pages/ClientesPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import CuotasPage from "./pages/CuotasPage";
import AdelantosPage from "./pages/AdelantosPage";
import ImpresionesPage from "./pages/ImpresionesPage";
import AdminPage from "./pages/AdminPage";
import MonitorPage from "./pages/MonitorPage";
import MisVentasPage from "./pages/MisVentasPage";
import { authApi } from "./api/endpoints";
import useAuthStore from "./stores/authStore";

function HomeRedirect() {
  const { usuario } = useAuthStore();
  if (usuario?.role === "admin") {
    return <DashboardPage />;
  }
  return <Navigate to="/mis-ventas" replace />;
}

function App() {
  const { setUsuario, logout, setIsLoading, setHasHydrated, hasHydrated } =
    useAuthStore();

  useEffect(() => {
    // Only hydrate once on mount, not on every usuario change
    if (hasHydrated) return;

    const hydrateUser = async () => {
      try {
        setIsLoading(true);
        const response: any = await authApi.getCurrentUser();
        const data = response?.data || response;
        const user = data?.userData || data;
        if (user) {
          setUsuario(user);
        }
      } catch (err) {
        logout();
      } finally {
        setIsLoading(false);
        setHasHydrated(true);
      }
    };

    hydrateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Ruta raíz: admin → Dashboard, vendedor → /mis-ventas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
        />

        {/* Dashboard personal del vendedor */}
        <Route
          path="/mis-ventas"
          element={
            <ProtectedRoute>
              <MisVentasPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas solo para administradores */}
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <ClientesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <SolicitudesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cuotas"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <CuotasPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/adelantos"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdelantosPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/impresiones"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <ImpresionesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <MonitorPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute role="admin">
                <AdminPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
