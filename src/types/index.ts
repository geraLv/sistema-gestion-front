// Tipos con transformación para usar camelCase en la UI
export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  email?: string;
  role?: string;
  status?: number;
}

export interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated?: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  nroDocumento: string;
  direccion: string;
  telefono: string;
  email?: string;
  localidadId: number;
  localidad?: Localidad;
  estado: number;

  // Raw DB fields
  appynom?: string;
  dni?: string;
  relalocalidad?: number;
  condicion?: number;
}

export interface Localidad {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  descripcion: string;
  precio: number;
  estado: number;
}

export interface Vendedor {
  id: number;
  nombre: string;
  estado: number;
}

export interface Solicitud {
  id: number;
  nroSolicitud: string;
  cliente: Cliente;
  clienteId: number;
  producto: Producto;
  productoId: number;
  importe: number;
  totalPagado: number;
  saldo: number;
  porcentajePagado: number;
  cantidadCuotas: number;
  estado: string; // "Pagada", "Impaga", "Pendiente"
  observaciones?: string;
  fechaCreacion?: string;
  cuotas?: Cuota[];
}

export interface Cuota {
  id: number;
  solicitudId: number;
  solicitud: Solicitud;
  nroCuota: number;
  importe: number;
  vencimiento: string;
  estado: string; // "Impaga", "Pagada", "Pendiente"
  fechaPago?: string;
  saldoAnterior?: number;
  // Raw DB fields
  idcuota?: number;
  relasolicitud?: number;
  fecha?: string;
  [key: string]: any;
}

export interface Adelanto {
  id: number;
  solicitudId: number;
  solicitud: Solicitud;
  importe: number;
  fecha: string;
  observaciones?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  userData?: Usuario;
  total?: number;
}
