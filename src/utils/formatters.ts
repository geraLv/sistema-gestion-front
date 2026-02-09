export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const getStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return "bg-yellow-100 text-yellow-800";
    case 1:
      return "bg-blue-100 text-blue-800";
    case 2:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusLabel = (
  status: number,
  type: "solicitud" | "cuota" = "solicitud",
): string => {
  if (type === "cuota") {
    return status === 0 ? "Impaga" : status === 2 ? "Pagada" : "Pendiente";
  }
  return status === 0 ? "Impaga" : status === 2 ? "Pagada" : "Pendiente";
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateDNI = (dni: string): boolean => {
  return dni.length >= 10 && dni.length <= 11 && /^\d+$/.test(dni);
};

export const validatePhone = (phone: string): boolean => {
  return phone.length >= 7;
};
