import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import { authApi } from "../api/endpoints";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setToken, setUsuario, setIsLoading, setError, isLoading } =
    useAuthStore();
  const [usuario, setUsuarioInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setErrorLocal] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const accessCodeRequired =
    typeof import.meta.env.VITE_DEMO_ACCESS_CODE === "string" &&
    import.meta.env.VITE_DEMO_ACCESS_CODE.trim().length > 0;
  const [accessOk, setAccessOk] = useState(
    sessionStorage.getItem("demo_access_ok") === "true",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal("");
    setIsLoading(true);

    try {
      const response = await authApi.login(usuario, password);
      console.log(response);
      if (response.data.success && response.data?.token) {
        const userData: any = response.data.userData;
        setToken(response.data.token);
        setUsuario(
          userData
            ? {
                id: userData.id || userData.iduser,
                usuario: userData.usuario,
                nombre: userData.nombre || "",
                email: userData.email,
                role: userData.role,
                status: userData.status ?? userData.estado,
              }
            : null,
        );
        navigate("/");
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Error al iniciar sesión";
      setErrorLocal(errorMsg);
      setError(errorMsg);
      console.error("Login error:", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError("");
    const expected = String(import.meta.env.VITE_DEMO_ACCESS_CODE || "").trim();
    if (!accessCodeRequired || accessCode.trim() === expected) {
      sessionStorage.setItem("demo_access_ok", "true");
      setAccessOk(true);
      return;
    }
    setAccessError("Código inválido");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="panel pad border border-slate-200 shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-3 mb-6">
            <img src="/public/favicon.ico" alt="logo" className="h-12 w-auto" />
            <div>
              <div className="text-lg font-semibold text-slate-900">
                Crédito Gestión
              </div>
              <div className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Acceso
              </div>
            </div>
          </div>
          <div className="h-[2px] w-16 bg-green-500 mb-6" />

          {accessCodeRequired && !accessOk && (
            <>
              {accessError && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                  {accessError}
                </div>
              )}
              <form onSubmit={handleAccess} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Código de acceso
                  </label>
                  <input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full input-sleek"
                    required
                  />
                </div>
                <button className="w-full action-button" type="submit">
                  Continuar
                </button>
              </form>
            </>
          )}

          {(!accessCodeRequired || accessOk) && (
            <>
              {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuarioInput(e.target.value)}
                    className="w-full input-sleek"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input-sleek"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full action-button disabled:opacity-50"
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
