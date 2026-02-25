import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { ErrorState, LoadingState } from "../components/Status";
import { Modal } from "../components/ui/Modal";
import { adminApi, auditApi, vendedoresAdminApi } from "../api/endpoints";

type Tab = "users" | "audit" | "vendedores";

export default function AdminPage() {
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [vendedoresError, setVendedoresError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    usuario: "",
    password: "",
    nombre: "",
    email: "",
    role: "user",
    status: 1,
  });

  const [auditFilters, setAuditFilters] = useState({
    entity: "",
    entity_id: "",
    action: "",
    actor: "",
    date_from: "",
    date_to: "",
    q: "",
  });

  const [showCreateVendedor, setShowCreateVendedor] = useState(false);
  const [newVendedor, setNewVendedor] = useState({
    apellidonombre: "",
    estado: 1,
  });
  const [editingVendedor, setEditingVendedor] = useState<any | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Error al cargar usuarios";
      setUsersError(msg);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadLogs = async (filters = auditFilters) => {
    setLoadingLogs(true);
    setLogsError(null);
    try {
      const data = await auditApi.getLogs(filters);
      setLogs(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Error al cargar auditoría";
      setLogsError(msg);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadVendedores = async () => {
    setLoadingVendedores(true);
    setVendedoresError(null);
    try {
      const data = await vendedoresAdminApi.getAll();
      setVendedores(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Error al cargar vendedores";
      setVendedoresError(msg);
    } finally {
      setLoadingVendedores(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "audit") {
      const nextFilters = {
        entity: params.get("entity") || "",
        entity_id: params.get("entity_id") || "",
        action: params.get("action") || "",
        actor: params.get("actor") || "",
        date_from: params.get("date_from") || "",
        date_to: params.get("date_to") || "",
        q: params.get("q") || "",
      };
      setTab("audit");
      setAuditFilters(nextFilters);
      loadLogs(nextFilters);
    }
  }, [location.search]);

  const handleCreateUser = async () => {
    await adminApi.createUser(newUser);
    setShowCreate(false);
    setNewUser({
      usuario: "",
      password: "",
      nombre: "",
      email: "",
      role: "user",
      status: 1,
    });
    loadUsers();
  };

  const handleToggleStatus = async (id: number, status: number) => {
    await adminApi.setUserStatus(id, status === 1 ? 0 : 1);
    loadUsers();
  };

  const handleToggleRole = async (id: number, role: string) => {
    await adminApi.setUserRole(id, role === "admin" ? "user" : "admin");
    loadUsers();
  };

  const handleCreateVendedor = async () => {
    await vendedoresAdminApi.create(newVendedor);
    setShowCreateVendedor(false);
    setNewVendedor({ apellidonombre: "", estado: 1 });
    loadVendedores();
  };

  const handleUpdateVendedor = async () => {
    if (!editingVendedor) return;
    await vendedoresAdminApi.update(
      editingVendedor.idvendedor,
      editingVendedor.apellidonombre,
    );
    setEditingVendedor(null);
    loadVendedores();
  };

  const handleToggleVendedorStatus = async (id: number, estado: number) => {
    await vendedoresAdminApi.setStatus(id, estado === 1 ? 0 : 1);
    loadVendedores();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 page-shell">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <div className="flex gap-2">
            <button
              className={`ghost-button ${tab === "users" ? "border-green-500 text-green-600" : ""}`}
              onClick={() => setTab("users")}
            >
              Usuarios
            </button>
            <button
              className={`ghost-button ${tab === "audit" ? "border-green-500 text-green-600" : ""}`}
              onClick={() => {
                setTab("audit");
                loadLogs();
              }}
            >
              Auditoría
            </button>
            <button
              className={`ghost-button ${tab === "vendedores" ? "border-green-500 text-green-600" : ""}`}
              onClick={() => {
                setTab("vendedores");
                loadVendedores();
              }}
            >
              Vendedores
            </button>
          </div>
        </div>

        {tab === "users" && (
          <div className="panel pad h-screen">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Usuarios</h2>
              <button
                className="action-button"
                onClick={() => setShowCreate(true)}
              >
                Crear usuario
              </button>
            </div>

            {loadingUsers ? (
              <LoadingState />
            ) : usersError ? (
              <ErrorState message={usersError} />
            ) : (
              <div className="table-shell">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.iduser} className="border-b">
                        <td className="px-4 py-3 text-sm">{u.usuario}</td>
                        <td className="px-4 py-3 text-sm">{u.nombre}</td>
                        <td className="px-4 py-3 text-sm">{u.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="chip bg-blue-100 text-blue-800">
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`chip ${u.status === 1 || u.estado === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                          >
                            {(u.status ?? u.estado) === 1 ? "Activo" : "Baja"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <button
                            className="text-green-600 hover:text-green-800 mr-3"
                            onClick={() => handleToggleRole(u.iduser, u.role)}
                          >
                            Cambiar rol
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() =>
                              handleToggleStatus(u.iduser, u.status ?? u.estado)
                            }
                          >
                            {(u.status ?? u.estado) === 1
                              ? "Dar de baja"
                              : "Dar de alta"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "audit" && (
          <div className="panel pad">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-4">
              <input
                className="input-sleek"
                placeholder="Entidad"
                value={auditFilters.entity}
                onChange={(e) =>
                  setAuditFilters({ ...auditFilters, entity: e.target.value })
                }
              />
              <input
                className="input-sleek"
                placeholder="ID"
                value={auditFilters.entity_id}
                onChange={(e) =>
                  setAuditFilters({
                    ...auditFilters,
                    entity_id: e.target.value,
                  })
                }
              />
              <input
                className="input-sleek"
                placeholder="Acción"
                value={auditFilters.action}
                onChange={(e) =>
                  setAuditFilters({ ...auditFilters, action: e.target.value })
                }
              />
              <input
                className="input-sleek"
                placeholder="Usuario"
                value={auditFilters.actor}
                onChange={(e) =>
                  setAuditFilters({ ...auditFilters, actor: e.target.value })
                }
              />
              <input
                className="input-sleek"
                type="date"
                value={auditFilters.date_from}
                onChange={(e) =>
                  setAuditFilters({
                    ...auditFilters,
                    date_from: e.target.value,
                  })
                }
              />
              <input
                className="input-sleek"
                type="date"
                value={auditFilters.date_to}
                onChange={(e) =>
                  setAuditFilters({ ...auditFilters, date_to: e.target.value })
                }
              />
              <button className="action-button" onClick={() => loadLogs()}>
                Filtrar
              </button>
            </div>

            {loadingLogs ? (
              <LoadingState />
            ) : logsError ? (
              <ErrorState message={logsError} />
            ) : (
              <div className="table-shell">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Acción
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Entidad
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-b">
                        <td className="px-4 py-3 text-sm">{l.created_at}</td>
                        <td className="px-4 py-3 text-sm">
                          {l.actor_username}
                        </td>
                        <td className="px-4 py-3 text-sm">{l.action}</td>
                        <td className="px-4 py-3 text-sm">{l.entity}</td>
                        <td className="px-4 py-3 text-sm">{l.entity_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "vendedores" && (
          <div className="panel pad">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Vendedores</h2>
              <button
                className="action-button"
                onClick={() => setShowCreateVendedor(true)}
              >
                Crear vendedor
              </button>
            </div>

            {loadingVendedores ? (
              <LoadingState />
            ) : vendedoresError ? (
              <ErrorState message={vendedoresError} />
            ) : (
              <div className="table-shell">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendedores.map((v) => (
                      <tr key={v.idvendedor} className="border-b">
                        <td className="px-4 py-3 text-sm">
                          {v.apellidonombre}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`chip ${v.estado === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {v.estado === 1 ? "Activo" : "Baja"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <button
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            onClick={() => setEditingVendedor({ ...v })}
                          >
                            Editar
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() =>
                              handleToggleVendedorStatus(v.idvendedor, v.estado)
                            }
                          >
                            {v.estado === 1 ? "Dar de baja" : "Dar de alta"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showCreate && (
          <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} className="max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Crear usuario</h2>
              <div className="space-y-3">
                <input
                  className="input-sleek w-full"
                  placeholder="Usuario"
                  value={newUser.usuario}
                  onChange={(e) =>
                    setNewUser({ ...newUser, usuario: e.target.value })
                  }
                />
                <input
                  className="input-sleek w-full"
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
                <input
                  className="input-sleek w-full"
                  placeholder="Nombre"
                  value={newUser.nombre}
                  onChange={(e) =>
                    setNewUser({ ...newUser, nombre: e.target.value })
                  }
                />
                <input
                  className="input-sleek w-full"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
                <select
                  className="input-sleek w-full"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="action-button flex-1"
                  onClick={handleCreateUser}
                >
                  Crear
                </button>
                <button
                  className="ghost-button flex-1"
                  onClick={() => setShowCreate(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showCreateVendedor && (
          <Modal isOpen={showCreateVendedor} onClose={() => setShowCreateVendedor(false)} className="max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Crear vendedor</h2>
              <div className="space-y-3">
                <input
                  className="input-sleek w-full"
                  placeholder="Apellido y Nombre"
                  value={newVendedor.apellidonombre}
                  onChange={(e) =>
                    setNewVendedor({
                      ...newVendedor,
                      apellidonombre: e.target.value,
                    })
                  }
                />
                <select
                  className="input-sleek w-full"
                  value={newVendedor.estado}
                  onChange={(e) =>
                    setNewVendedor({
                      ...newVendedor,
                      estado: Number(e.target.value),
                    })
                  }
                >
                  <option value={1}>Activo</option>
                  <option value={0}>Baja</option>
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="action-button flex-1"
                  onClick={handleCreateVendedor}
                >
                  Crear
                </button>
                <button
                  className="ghost-button flex-1"
                  onClick={() => setShowCreateVendedor(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>
        )}

        {editingVendedor && (
          <Modal isOpen={!!editingVendedor} onClose={() => setEditingVendedor(null)} className="max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Editar vendedor</h2>
              <div className="space-y-3">
                <input
                  className="input-sleek w-full"
                  placeholder="Apellido y Nombre"
                  value={editingVendedor.apellidonombre}
                  onChange={(e) =>
                    setEditingVendedor({
                      ...editingVendedor,
                      apellidonombre: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="action-button flex-1"
                  onClick={handleUpdateVendedor}
                >
                  Guardar
                </button>
                <button
                  className="ghost-button flex-1"
                  onClick={() => setEditingVendedor(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
