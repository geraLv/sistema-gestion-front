export const parseDateInput = (value?: string | null): Date | null => {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  // Handle date-only strings as local dates to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-").map((part) => Number(part));
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateEs = (value?: string | null): string => {
  const date = parseDateInput(value);
  if (!date) return "-";
  return date.toLocaleDateString("es-AR");
};

export const formatDateTimeEs = (value?: string | null): string => {
  const date = parseDateInput(value);
  if (!date) return "-";
  return date.toLocaleString("es-AR");
};

export const formatDateInput = (value?: string | null): string => {
  const date = parseDateInput(value);
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
