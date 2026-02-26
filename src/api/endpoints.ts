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
    apiClient.post<ApiResponse<{ userData: Usuario }>>("/auth/login", {
      usuario,
      password,
    }),

  validateToken: () =>
    apiClient.post<ApiResponse<Usuario>>("/auth/validate-token", {}),

  getCurrentUser: () => apiClient.get<ApiResponse<Usuario>>("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/auth/change-password", { currentPassword, newPassword }),

  logout: () => apiClient.post("/auth/logout", {}),
  refreshToken: () => apiClient.post("/auth/refresh-token", {}),
};

// Clientes
export const clientesApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Cliente[]>>("/clientes");
    return response.data.data || [];
  },
  getPaged: async (params?: { q?: string; page?: number; pageSize?: number }) => {
    const response = await apiClient.get<ApiResponse<Cliente[]>>("/clientes", {
      params: {
        q: params?.q || undefined,
        page: params?.page || undefined,
        pageSize: params?.pageSize || undefined,
      },
    });
    return {
      items: response.data.data || [],
      total: (response.data as any).total ?? (response.data.data || []).length,
    };
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Cliente>>(
      `/clientes/${id}`,
    );
    return response.data.data || null;
  },

  search: async (q: string) => {
    const response = await apiClient.get<ApiResponse<Cliente[]>>(
      "/clientes/search",
      {
        params: { q },
      },
    );
    return response.data.data || [];
  },

  create: async (data: Partial<Cliente>) => {
    const response = await apiClient.post<ApiResponse<Cliente>>(
      "/clientes",
      data,
    );
    return response.data.data;
  },

  update: async (id: number, data: Partial<Cliente>) => {
    const response = await apiClient.post<ApiResponse<Cliente>>("/clientes", {
      ...data,
      idcliente: id,
    });
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/clientes/${id}`);
    return response.data;
  },
};

// Localidades
export const localidadesApi = {
  getAll: async () => {
    const response =
      await apiClient.get<ApiResponse<Localidad[]>>("/localidades");
    return response.data.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Localidad>>(
      `/localidades/${id}`,
    );
    return response.data.data || null;
  },

  search: async (q: string) => {
    const response = await apiClient.get<ApiResponse<Localidad[]>>(
      "/localidades/search",
      {
        params: { q },
      },
    );
    return response.data.data || [];
  },
};

// Solicitudes
export const solicitudesApi = {
  getAll: async (filtro?: string, q?: string) => {
    const response = await apiClient.get<ApiResponse<Solicitud[]>>(
      "/solicitudes",
      {
        params: { filtro, q },
      },
    );
    return response.data.data || [];
  },
  getPaged: async (params?: {
    filtro?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<Solicitud[]>>(
      "/solicitudes",
      {
        params: {
          filtro: params?.filtro || undefined,
          q: params?.q || undefined,
          page: params?.page || undefined,
          pageSize: params?.pageSize || undefined,
        },
      },
    );
    return {
      items: response.data.data || [],
      total: (response.data as any).total ?? (response.data.data || []).length,
    };
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Solicitud>>(
      `/solicitudes/${id}`,
    );
    return response.data.data || null;
  },

  getByNro: async (nro: string) => {
    const response = await apiClient.get<ApiResponse<Solicitud>>(
      `/solicitudes/nro/${nro}`,
    );
    return response.data.data || null;
  },

  create: async (data: Partial<Solicitud>) => {
    const response = await apiClient.post<ApiResponse<Solicitud>>(
      "/solicitudes",
      data,
    );
    return response.data.data;
  },

  update: async (id: number, data: Partial<Solicitud>) => {
    const response = await apiClient.put<ApiResponse<Solicitud>>(
      `/solicitudes/${id}`,
      data,
    );
    return response.data.data;
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
    return response.data.data || [];
  },

  addCuotas: async (id: number, cantCuotas: number) => {
    const response = await apiClient.post<ApiResponse<Cuota[]>>(
      `/solicitudes/${id}/cuotas`,
      {
        cantCuotas,
      },
    );
    return response.data.data || [];
  },

  getMisVentas: async (params?: { page?: number; pageSize?: number }) => {
    const response = await apiClient.get<ApiResponse<Solicitud[]>>(
      "/solicitudes/mis-ventas",
      {
        params: {
          page: params?.page || undefined,
          pageSize: params?.pageSize || undefined,
        },
      },
    );
    return {
      items: (response.data.data || []) as any[],
      total: (response.data as any).total ?? 0,
      kpis: (response.data as any).kpis,
    };
  },
};

// Cuotas
export const cuotasApi = {
  getAll: async (filtro?: string, q?: string) => {
    const response = await apiClient.get<ApiResponse<Cuota[]>>("/cuotas", {
      params: { filtro, q },
    });
    return response.data.data || [];
  },
  getPaged: async (params?: {
    filtro?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<Cuota[]>>("/cuotas", {
      params: {
        filtro: params?.filtro || undefined,
        q: params?.q || undefined,
        page: params?.page || undefined,
        pageSize: params?.pageSize || undefined,
      },
    });
    return {
      items: response.data.data || [],
      total: (response.data as any).total ?? (response.data.data || []).length,
    };
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Cuota>>(`/cuotas/${id}`);
    return response.data.data || null;
  },

  getForSolicitud: async (idsolicitud: number) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/cuotas/solicitud/${idsolicitud}`,
    );
    return response.data.data || { cuotas: [], resumen: null };
  },

  pagar: async (idcuota: number) => {
    const response = await apiClient.post("/cuotas/pagar", { idcuota });
    return response.data.data || response.data;
  },

  pagarMultiples: async (idcuotas: number[]) => {
    const response = await apiClient.post("/cuotas/pagar-multiples", {
      idcuotas,
    });
    return response.data.data || response.data;
  },

  updateImporte: async (id: number, importe: number) => {
    const response = await apiClient.put(`/cuotas/${id}/importe`, { importe });
    return response.data.data || response.data;
  },
  updateFechaPago: async (id: number, fechaPago: string) => {
    const response = await apiClient.put(`/cuotas/${id}/fecha-pago`, {
      fechaPago,
    });
    return response.data.data || response.data;
  },

  recalcularVencimientos: async (idsolicitud: number, fechaInicio: string) => {
    const response = await apiClient.put(
      `/cuotas/solicitud/${idsolicitud}/recalcular-vencimientos`,
      { fechaInicio },
    );
    return response.data.data || response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/cuotas/${id}`);
    return response.data;
  },

  getComprobantes: async (idcuota: number) => {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/cuotas/${idcuota}/comprobantes`,
    );
    console.log("comprobantes:", response);
    return response.data.data || [];
  },
  uploadComprobante: async (idcuota: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const response = await apiClient.post<ApiResponse<any>>(
      `/cuotas/${idcuota}/comprobante`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
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
    return response.data.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Vendedor>>(
      `/vendedores/${id}`,
    );
    return response.data.data || null;
  },

  getActivos: async () => {
    const response = await apiClient.get<ApiResponse<Vendedor[]>>(
      "/vendedores/activos",
    );
    return response.data.data || [];
  },

  search: async (q: string) => {
    const response = await apiClient.get<ApiResponse<Vendedor[]>>(
      "/vendedores/search",
      {
        params: { q },
      },
    );
    return response.data.data || [];
  },
};

// Productos
export const productosApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<Producto[]>>("/productos");
    return response.data.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Producto>>(
      `/productos/${id}`,
    );
    return response.data.data || null;
  },

  getActivos: async () => {
    const response =
      await apiClient.get<ApiResponse<Producto[]>>("/productos/activos");
    return response.data.data || [];
  },

  search: async (q: string) => {
    const response = await apiClient.get<ApiResponse<Producto[]>>(
      "/productos/search",
      {
        params: { q },
      },
    );
    return response.data.data || [];
  },
};

// Admin
export const adminApi = {
  getUsers: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>("/admin/users");
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
    const response = await apiClient.patch(`/admin/users/${id}/status`, {
      status,
    });
    return response.data.data || response.data;
  },
  setUserRole: async (id: number, role: string) => {
    const response = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return response.data.data || response.data;
  },
  resetPassword: async (id: number, password: string) => {
    const response = await apiClient.patch(`/admin/users/${id}/password`, { password });
    return response.data.data || response.data;
  },
};

export const auditApi = {
  getLogs: async (params: {
    entity?: string;
    entity_id?: string | number;
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
    const response =
      await apiClient.get<ApiResponse<any[]>>("/admin/vendedores");
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
    const response = await apiClient.patch(`/admin/vendedores/${id}/status`, {
      estado,
    });
    return response.data.data || response.data;
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

  recibosSolicitudPagados: async (idsolicitud: number) => {
    const response = await apiClient.get(
      `/reportes/recibos/solicitud/${idsolicitud}`,
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

  recibosMultiples: async (idcuotas: number[]) => {
    const response = await apiClient.post(
      "/reportes/recibos/multiples",
      { idcuotas },
      { responseType: "blob" },
    );
    return response.data as Blob;
  },
};

export const dashboardApi = {
  getSummary: async () => {
    const response = await apiClient.get<ApiResponse<any>>("/dashboard");
    return response.data.data || null;
  },
};
