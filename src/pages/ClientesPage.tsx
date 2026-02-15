import { useState } from "react";
import Layout from "../components/Layout";
import { ClientesList } from "../components/clientes/ClientesList";
import { ClienteForm } from "../components/clientes/ClienteForm";
import { Plus } from "lucide-react";

export default function ClientesPage() {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleCreate = () => {
    setSelectedId(null);
    setViewMode("create");
  };

  const handleEdit = (id: number) => {
    setSelectedId(id);
    setViewMode("edit");
  };

  const handleSuccess = () => {
    setViewMode("list");
    setSelectedId(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 page-shell">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clientes</h1>
          {viewMode === "list" && (
            <button onClick={handleCreate} className="action-button flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
          {viewMode === "list" && (
            <ClientesList onEdit={handleEdit} />
          )}

          {(viewMode === "create" || viewMode === "edit") && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-slate-100">
                {viewMode === "create" ? "Nuevo Cliente" : "Editar Cliente"}
              </h2>
              <ClienteForm
                id={selectedId ?? undefined}
                onSuccess={handleSuccess}
                onCancel={() => setViewMode("list")}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
