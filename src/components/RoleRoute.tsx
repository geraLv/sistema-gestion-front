import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";

interface RoleRouteProps {
  role: "admin" | "user";
  children: ReactNode;
}

export default function RoleRoute({ role, children }: RoleRouteProps) {
  const { usuario } = useAuthStore();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
