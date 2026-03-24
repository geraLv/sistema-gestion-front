import { useState, useEffect } from "react";
import { useCreateCliente, useUpdateCliente, useCliente } from "../../hooks/useClientes";
import { localidadesApi } from "../../api/endpoints";
import { SearchableSelect } from "../ui/SearchableSelect";

interface ClienteFormProps {
    id?: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ClienteForm({ id, onSuccess, onCancel }: ClienteFormProps) {
    const [formData, setFormData] = useState({
        nombre: "",
        nroDocumento: "",
        direccion: "",
        telefono: "",
        email: "",
        localidadId: "",
        fecha_nacimiento: "",
        estado: "1",
    });
    const [formError, setFormError] = useState("");
    const [selectedLocalidadOption, setSelectedLocalidadOption] = useState<{
        value: number;
        label: string;
    } | null>(null);

    const createMutation = useCreateCliente();
    const updateMutation = useUpdateCliente();

    // Fetch client data if id is provided
    const { data: clienteData, isLoading: isLoadingCliente } = useCliente(id || 0);

    useEffect(() => {
        if (clienteData && id) {
            const localidadId = Number(
                clienteData.relalocalidad || clienteData.localidadId || 0,
            );
            setFormData({
                nombre: clienteData.appynom || clienteData.nombre || "",
                nroDocumento: clienteData.dni || clienteData.nroDocumento || "",
                direccion: clienteData.direccion || "",
                telefono: clienteData.telefono || "",
                email: clienteData.email || "",
                localidadId: String(localidadId || ""),
                fecha_nacimiento: clienteData.fecha_nacimiento ? clienteData.fecha_nacimiento.split('T')[0] : "",
                estado: String(clienteData.condicion || clienteData.estado || 1),
            });

            if (localidadId > 0) {
                localidadesApi
                    .getById(localidadId)
                    .then((loc: any) => {
                        if (loc) {
                            setSelectedLocalidadOption({
                                value: loc.idlocalidad,
                                label: loc.nombre || "Sin nombre",
                            });
                        }
                    })
                    .catch(() => {});
            }
        }
    }, [clienteData, id]);

    const handleLocalidadSearch = async (term: string) => {
        try {
            const results = (await localidadesApi.search(term, 100)) as any[];
            return results.map((loc: any) => ({
                value: Number(loc.idlocalidad),
                label: loc.nombre || "Sin nombre",
            }));
        } catch {
            return [];
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            setFormData({ ...formData, telefono: val });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!formData.nombre || !formData.nroDocumento || !formData.localidadId) {
            setFormError("Nombre, documento y localidad son requeridos");
            return;
        }

        const payload = {
            appynom: formData.nombre,
            dni: formData.nroDocumento,
            direccion: formData.direccion,
            telefono: formData.telefono,
            email: formData.email,
            selectLocalidades: parseInt(formData.localidadId, 10),
            fecha_nacimiento: formData.fecha_nacimiento || undefined,
            condicion: parseInt(formData.estado, 10),
        };

        try {
            if (id) {
                await updateMutation.mutateAsync({ id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onSuccess();
        } catch (err: any) {
            const msg = err.response?.data?.error || "Error al guardar cliente";
            setFormError(msg);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (id && isLoadingCliente) {
        return <div className="p-4 text-center">Cargando datos...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {formError}
                </div>
            )}
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Nombre *
                </label>
                <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full input-sleek"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Documento *
                </label>
                <input
                    type="text"
                    value={formData.nroDocumento}
                    onChange={(e) =>
                        setFormData({ ...formData, nroDocumento: e.target.value })
                    }
                    className="w-full input-sleek"
                    required
                />
            </div>
            <div>
                <SearchableSelect
                    label="Localidad *"
                    options={selectedLocalidadOption ? [selectedLocalidadOption] : []}
                    value={formData.localidadId}
                    onChange={(val) =>
                        setFormData({ ...formData, localidadId: String(val) })
                    }
                    placeholder="Seleccionar localidad"
                    onSearch={handleLocalidadSearch}
                    minSearchLength={2}
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Fecha de Nacimiento
                </label>
                <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) =>
                        setFormData({ ...formData, fecha_nacimiento: e.target.value })
                    }
                    className="w-full input-sleek"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Dirección
                </label>
                <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) =>
                        setFormData({ ...formData, direccion: e.target.value })
                    }
                    className="w-full input-sleek"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Teléfono
                </label>
                <input
                    type="text"
                    value={formData.telefono}
                    onChange={handlePhoneChange}
                    className="w-full input-sleek"
                    placeholder="Solo números"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Email
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full input-sleek"
                />
            </div>
            <div className="flex gap-2 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 action-button disabled:opacity-50"
                >
                    {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 ghost-button"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
