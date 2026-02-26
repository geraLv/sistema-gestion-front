import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";

interface RoleRouteProps {
  role: "admin" | "vendedor";
  children: ReactNode;
  redirectTo?: string;
}

export default function RoleRoute({ role, children, redirectTo = "/mis-ventas" }: RoleRouteProps) {
  const { usuario } = useAuthStore();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.role !== role) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
