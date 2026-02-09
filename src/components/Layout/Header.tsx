import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

export default function Header() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();

  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-config-open");
    setConfigOpen(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-config-open", String(configOpen));
  }, [configOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    [
      "block w-full",
      "px-6 py-4", // padding como la imagen (alto y aireado)
      "text-[13px] uppercase tracking-[0.22em]", // tipografía finita + espaciado
      "text-gray-800",
      "hover:bg-black/0", // sin hover fuerte, como la imagen
      isActive ? "font-semibold" : "font-normal",
    ].join(" ");

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/public/pic11.jpg" alt="logo" className="h-20 w-auto" />
            <Link to="/" className="text-lg font-semibold text-gray-800">
              Crédito Gestión
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {usuario && (
              <span className="text-sm text-gray-700">{usuario.nombre}</span>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar for md+ */}
      <aside className="hidden md:flex gap-8 flex-col w-1/5 fixed inset-y-0 left-0 z-40 h-screen bg-[#f5f6f6] border-r border-gray-200 shadow-[0_10px_25px_rgba(15,23,42,0.08)]">
        {/* Title */}
        <div className="px-6 pt-7 pb-6 bg-linear-to-r from-white via-white to-[#f5f6f6]">
          <div className="flex items-center gap-3">
            <img src="/public/favicon.ico" alt="logo" className="h-16 w-auto" />
            <div className="text-[18px] font-semibold text-gray-900">
              Crédito Gestión
            </div>
          </div>
          {/* underline green (corto) */}
          <div className="mt-3 h-[2px] w-16 bg-green-500" />
        </div>

        {/* Nav */}
        <nav className="flex items-center flex-col h-full w-4/5">
          <ul className="flex flex-col gap-6">
            {/* helper: separator like image */}
            <li className="border-b  align-text-bottom border-gray-200/80">
              <NavLink to="/" className={navItemClass}>
                INICIO
              </NavLink>
            </li>

            <li className="border-b border-gray-200/80">
              <NavLink to="/monitor" className={navItemClass}>
                MONITOR DE SOLICITUD
              </NavLink>
            </li>

            <li className="border-b border-gray-200/80">
              <NavLink to="/clientes" className={navItemClass}>
                CLIENTES
              </NavLink>
            </li>

            <li className="border-b border-gray-200/80">
              <NavLink to="/solicitudes" className={navItemClass}>
                SOLICITUDES
              </NavLink>
            </li>

            <li className="border-b border-gray-200/80">
              <NavLink to="/cuotas" className={navItemClass}>
                CUOTAS
              </NavLink>
            </li>

            <li className="border-b border-gray-200/80">
              <NavLink to="/impresiones" className={navItemClass}>
                IMPRESIONES
              </NavLink>
            </li>

            {usuario?.role === "admin" && (
              <li className="border-b border-gray-200/80">
                <NavLink to="/admin" className={navItemClass}>
                  ADMIN
                </NavLink>
              </li>
            )}

            {/* “espacio” + línea tenue antes de Configuraciones (como la imagen) */}
            <li className="px-6">
              <div className="h-6" />
              <div className="border-b border-gray-200/80" />
              <div className="h-6" />
            </li>

            {/* CONFIGURACIONES row */}
            {/* <li className="border-b border-gray-200/80">
              <button
                type="button"
                onClick={() => setConfigOpen((v) => !v)}
                className={[
                  "w-full flex items-center justify-between",
                  "px-6 py-4",
                  "text-[11px] uppercase tracking-[0.22em]",
                  "text-gray-800",
                  "font-normal",
                ].join(" ")}
              >
                <span>CONFIGURACIONES</span>
                <svg
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    configOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {configOpen && (
                <div className="bg-[#f1f2f2] border-t border-gray-200/80">
                  <NavLink
                    to="/configuraciones/usuarios"
                    className={({ isActive }) =>
                      [
                        "block w-full",
                        "px-10 py-3",
                        "text-[11px] uppercase tracking-[0.22em]",
                        "text-gray-700",
                        isActive
                          ? "font-semibold text-gray-900"
                          : "font-normal",
                      ].join(" ")
                    }
                  >
                    USUARIOS
                  </NavLink>
                  <div className="border-b border-gray-200/80" />
                  <NavLink
                    to="/configuraciones/parametros"
                    className={({ isActive }) =>
                      [
                        "block w-full",
                        "px-10 py-3",
                        "text-[11px] uppercase tracking-[0.22em]",
                        "text-gray-700",
                        isActive
                          ? "font-semibold text-gray-900"
                          : "font-normal",
                      ].join(" ")
                    }
                  >
                    PARÁMETROS
                  </NavLink>
                </div>
              )}
            </li> */}

            {/* SALIR */}
            <li className="border-b border-gray-200/80 justify-end">
              <button
                onClick={handleLogout}
                className={[
                  "w-full text-left",
                  "px-6 py-4",
                  "text-[11px] uppercase tracking-[0.22em]",
                  "text-gray-800 font-normal",
                ].join(" ")}
              >
                SALIR
              </button>
            </li>
          </ul>
        </nav>

        {/* Bottom section like image */}
        <div className="px-6 pb-10">
          {/* mucho espacio antes de la línea verde */}
          <div className="h-16" />
          <div className="h-[2px] w-full bg-green-500" />
          <div className="mt-10 text-[11px] text-gray-400 leading-6">
            <div>© Desarrollado por Sofgen Formosa</div>
            <div>(370)4-053205</div>
          </div>
        </div>
      </aside>
    </>
  );
}
