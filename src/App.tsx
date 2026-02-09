import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClientesPage from "./pages/ClientesPage";
import SolicitudesPage from "./pages/SolicitudesPage";
import CuotasPage from "./pages/CuotasPage";
import AdelantosPage from "./pages/AdelantosPage";
import ImpresionesPage from "./pages/ImpresionesPage";
import AdminPage from "./pages/AdminPage";
import MonitorPage from "./pages/MonitorPage";
import { authApi } from "./api/endpoints";
import useAuthStore from "./stores/authStore";

function App() {
  const { token, usuario, setUsuario, logout, setIsLoading } = useAuthStore();

  useEffect(() => {
    const hydrateUser = async () => {
      if (!token || usuario) return;
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
      }
    };

    hydrateUser();
  }, [token, usuario, setUsuario, logout, setIsLoading]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* Placeholder para otras rutas */}
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <ClientesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <ProtectedRoute>
              <SolicitudesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cuotas"
          element={
            <ProtectedRoute>
              <CuotasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adelantos"
          element={
            <ProtectedRoute>
              <AdelantosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/impresiones"
          element={
            <ProtectedRoute>
              <ImpresionesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor"
          element={
            <ProtectedRoute>
              <MonitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
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
