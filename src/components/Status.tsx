interface LoadingStateProps {
  label?: string;
}

interface EmptyStateProps {
  message?: string;
}

interface ErrorStateProps {
  message: string;
}

export function LoadingState({ label = "Cargando..." }: LoadingStateProps) {
  return <div className="text-center py-8 text-sm text-gray-500">{label}</div>;
}

export function EmptyState({ message = "No hay registros para mostrar" }: EmptyStateProps) {
  return <div className="text-center py-8 text-gray-500">{message}</div>;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {message}
    </div>
  );
}
