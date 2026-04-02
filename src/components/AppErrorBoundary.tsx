import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || "Error inesperado",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("App runtime error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <h1 className="text-xl font-semibold">Se produjo un error en la pantalla</h1>
            <p className="text-sm text-slate-600">
              La aplicación evitó una pantalla en blanco para que pueda recuperarse.
            </p>
            {this.state.message ? (
              <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto">
                {this.state.message}
              </pre>
            ) : null}
            <button
              type="button"
              className="action-button"
              onClick={() => window.location.reload()}
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

