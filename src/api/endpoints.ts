import apiClient from "./client";
import type {
  ApiResponse,
  Usuario,
  Cliente,
  Solicitud,
  Cuota,
  Adelanto,
  Localidad,
  Vendedor,
  Producto,
} from "../types";

// Autenticación
export const authApi = {
  login: (usuario: string, password: string) =>
    apiClient.post<ApiResponse<{ token: string; userData: Usuario }>>(
      "/auth/login",
      { usuario, password },
    ),

  validateToken: () =>
    apiClient.post<ApiResponse<Usuario>>("/auth/validate-token", {}),

  getCurrentUser: () => apiClient.get<ApiResponse<Usuario>>("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/auth/change-password", { currentPassword, newPassword }),

  logout: () => apiClient.post("/auth/logout", {}),
};

// Clientes
export const clientesApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Cliente[]>>("/clientes");
    console.log("cliente:", response);
    return response.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Cliente>>(
      `/clientes/${id}`,
    );
    return response.data || null;
  },

  search: async (q: string) => {
    const response = await apiClient.get<ApiResponse<Cliente[]>>(
      "/clientes/search",
      {
        params: { q },
      },
    );
    return response.data || [];
  },

  create: async (data: Partial<Cliente>) => {
    const response = await apiClient.post<ApiResponse<Cliente>>(
      "/clientes",
      data,
    );
    return response.data;
  },

  update: async (id: number, data: Partial<Cliente>) => {
    const response = await apiClient.post<ApiResponse<Cliente>>("/clientes", {
      ...data,
      idcliente: id,
    });
    return response.data;
  },
};

// Localidades
export const localidadesApi = {
  getAll: async () => {
    const response =
      await apiClient.get<ApiResponse<Localidad[]>>("/localidades");
    return response.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Localidad>>(
      `/localidades/${id}`,
    );
    return response.data || null;
  },

  search: async (q: string) => {
    const response = await apiClient.get<ApiResponse<Localidad[]>>(
      "/localidades/search",
      {
        params: { q },
      },
    );
    return response.data || [];
  },
};

// Solicitudes
export const solicitudesApi = {
  getAll: async (filtro?: string) => {
    const response = await apiClient.get<ApiResponse<Solicitud[]>>(
      "/solicitudes",
      {
        params: { filtro },
      },
    );
    console.log("solicitudaes:", response);
    return response.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Solicitud>>(
      `/solicitudes/${id}`,
    );
    return response.data || null;
  },

  getByNro: async (nro: string) => {
    const response = await apiClient.get<ApiResponse<Solicitud>>(
      `/solicitudes/nro/${nro}`,
    );
    return response.data || null;
  },

  create: async (data: Partial<Solicitud>) => {
    const response = await apiClient.post<ApiResponse<Solicitud>>(
      "/solicitudes",
      data,
    );
    return response.data;
  },

  update: async (id: number, data: Partial<Solicitud>) => {
    const response = await apiClient.put<ApiResponse<Solicitud>>(
      `/solicitudes/${id}`,
      data,
    );
    return response.data;
  },

  updateObservaciones: async (nro: string, observaciones: string) => {
    const response = await apiClient.put(`/solicitudes/${nro}/observaciones`, {
      observaciones,
    });
    return response.data;
  },

  getCuotas: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Cuota[]>>(
      `/solicitudes/${id}/cuotas`,
    );
    return response.data || [];
  },

  addCuotas: async (id: number, cantCuotas: number) => {
    const response = await apiClient.post<ApiResponse<Cuota[]>>(
      `/solicitudes/${id}/cuotas`,
      {
        cantCuotas,
      },
    );
    return response.data || [];
  },
};

// Cuotas
export const cuotasApi = {
  getAll: async (filtro?: string) => {
    const response = await apiClient.get<ApiResponse<Cuota[]>>("/cuotas", {
      params: { filtro },
    });
    console.log("cuotas:", response);
    return response.data.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Cuota>>(`/cuotas/${id}`);
    return response.data.data || null;
  },

  getForSolicitud: async (idsolicitud: number) => {
    const response = await apiClient.get<ApiResponse<Cuota[]>>(
      `/cuotas/solicitud/${idsolicitud}`,
    );
    return response.data.data || [];
  },

  pagar: async (idcuota: number) => {
    const response = await apiClient.post("/cuotas/pagar", { idcuota });
    return response.data;
  },

  pagarMultiples: async (idcuotas: number[]) => {
    const response = await apiClient.post("/cuotas/pagar-multiples", {
      idcuotas,
    });
    return response.data;
  },

  updateImporte: async (id: number, importe: number) => {
    const response = await apiClient.put(`/cuotas/${id}/importe`, { importe });
    return response.data;
  },
};

// Adelantos
export const adelantosApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Adelanto[]>>("/adelantos");
    return response.data.data || [];
  },

  getForSolicitud: async (idsolicitud: number) => {
    const response = await apiClient.get<ApiResponse<Adelanto[]>>(
      `/adelantos/${idsolicitud}`,
    );
    return response.data.data || [];
  },

  create: async (idsolicitud: number, adelantoimporte: number) => {
    const response = await apiClient.post<ApiResponse<Adelanto>>("/adelantos", {
      idsolicitud,
      adelantoimporte,
    });
    return response.data.data;
  },
};

// Vendedores
export const vendedoresApi = {
  getAll: async () => {
    const response =
      await apiClient.get<ApiResponse<Vendedor[]>>("/vendedores");
    return response.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Vendedor>>(
      `/vendedores/${id}`,
    );
    return response.data || null;
  },

  getActivos: async () => {
    const response = await apiClient.get<ApiResponse<Vendedor[]>>(
      "/vendedores/activos",
    );
    return response.data || [];
  },

  search: async (q: string) => {
    const response = await apiClient.get<ApiResponse<Vendedor[]>>(
      "/vendedores/search",
      {
        params: { q },
      },
    );
    return response.data || [];
  },
};

// Productos
export const productosApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Producto[]>>("/productos");
    return response.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Producto>>(
      `/productos/${id}`,
    );
    return response.data || null;
  },

  getActivos: async () => {
    const response =
      await apiClient.get<ApiResponse<Producto[]>>("/productos/activos");
    return response.data || [];
  },

  search: async (q: string) => {
    const response = await apiClient.get<ApiResponse<Producto[]>>(
      "/productos/search",
      {
        params: { q },
      },
    );
    return response.data || [];
  },
};

// Admin
export const adminApi = {
  getUsers: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>("/admin/users");
    console.log("users", response);
    return response.data.data || [];
  },
  createUser: async (payload: {
    usuario: string;
    password: string;
    nombre?: string;
    email?: string;
    role?: string;
    status?: number;
  }) => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/admin/users",
      payload,
    );
    return response.data.data;
  },
  updateUser: async (
    id: number,
    payload: { usuario?: string; nombre?: string; email?: string },
  ) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/users/${id}`,
      payload,
    );
    return response.data.data;
  },
  setUserStatus: async (id: number, status: number) => {
    console.log(status);
    const response = await apiClient.patch(`/admin/users/${id}/status`, {
      status,
    });
    return response.data;
  },
  setUserRole: async (id: number, role: string) => {
    const response = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },
};

export const auditApi = {
  getLogs: async (params: {
    entity?: string;
    action?: string;
    actor?: string;
    date_from?: string;
    date_to?: string;
    q?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<any[]>>("/admin/audit", {
      params,
    });
    return response.data.data || [];
  },
};

export const vendedoresAdminApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>(
      "/admin/vendedores",
    );
    return response.data.data || [];
  },
  create: async (payload: { apellidonombre: string; estado?: number }) => {
    const response = await apiClient.post<ApiResponse<any>>(
      "/admin/vendedores",
      payload,
    );
    return response.data.data;
  },
  update: async (id: number, apellidonombre: string) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `/admin/vendedores/${id}`,
      { apellidonombre },
    );
    return response.data.data;
  },
  setStatus: async (id: number, estado: number) => {
    const response = await apiClient.patch(
      `/admin/vendedores/${id}/status`,
      { estado },
    );
    return response.data;
  },
};

// Reportes
export const reportesApi = {
  reciboCuota: async (idcuota: number) => {
    const response = await apiClient.post(
      "/reportes/recibos/cuota",
      { idcuota },
      { responseType: "blob" },
    );
    return response.data as Blob;
  },

  recibosMes: async (mes?: string, localidadId?: number) => {
    const response = await apiClient.get("/reportes/recibos/mes", {
      params: { mes: mes || undefined, localidadId: localidadId || undefined },
      responseType: "blob",
    });
    console.log("recibos-mes", response);
    return response.data as Blob;
  },

  recibosMesPosterior: async () => {
    const response = await apiClient.get("/reportes/recibos/mes-posterior", {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  recibosMesPorLocalidad: async (localidadId: number, mes?: string) => {
    const response = await apiClient.get(
      "/reportes/recibos/mes-por-localidad",
      {
        params: { localidadId, mes: mes || undefined },
        responseType: "blob",
      },
    );
    return response.data as Blob;
  },

  recibosMesPosteriorPorLocalidad: async (localidadId: number) => {
    const response = await apiClient.get(
      "/reportes/recibos/mes-posterior-por-localidad",
      {
        params: { localidadId },
        responseType: "blob",
      },
    );
    return response.data as Blob;
  },

  solicitudesXlsx: async (estado: string, mes?: string, modo?: string) => {
    const response = await apiClient.get("/reportes/solicitudes.xlsx", {
      params: { estado, mes: mes || undefined, modo: modo || undefined },
      responseType: "blob",
    });
    return response.data as Blob;
  },

  monitorSolicitudPdf: async (nroSolicitud: string) => {
    const response = await apiClient.get("/reportes/solicitudes/monitor", {
      params: { nroSolicitud },
      responseType: "blob",
    });
    return response.data as Blob;
  },
};
