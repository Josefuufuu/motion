import { useEffect, useState } from "react";
import { actualizarProyecto } from "../../services/psu";

export default function NuevaConvocatoriaForm({
  onSuccess,
  onCancel,
  mode = "create",      // "create" | "edit"
  projectId = null,     
  initial = null,       
}) {
  const [form, setForm] = useState({
    nombre: "",
    tipo: "VOLUNTEER",   // PSU | VOLUNTEER
    area: "",
    subtipo: "",
    descripcion: "",
    cupo_total: 20,
    inicio: "",
    fin: "",
    estado: "enrollment", // enrollment | ongoing | finished | cancelled
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nombre: initial.nombre || "",
        tipo: initial.tipo === "PSU" ? "PSU" : "VOLUNTEER",
        area: initial.area || "",
        subtipo: initial.subtipo || "",
        descripcion: initial.descripcion || "",
        cupo_total: initial.cupo_total ?? 20,
        inicio: initial.inicio || "",
        fin: initial.fin || "",
        estado: initial.estado || "enrollment",
      });
    }
  }, [initial]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fieldClass = "grid gap-1 min-w-0";
  const inputClass =
    "block w-full min-w-0 h-12 px-3 py-2 rounded-xl border border-gray-300 bg-white " +
    "text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  const selectClass = `${inputClass} cursor-pointer`;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const buildPayload = () => ({
    name: form.nombre.trim(),
    type: form.tipo === "PSU" ? "PSU" : "VOLUNTEER",
    area: form.area.trim(),
    subtype: form.subtipo.trim(),
    description: form.descripcion.trim(),
    total_quota: Number(form.cupo_total),
    status: ["enrollment", "ongoing", "finished", "cancelled"].includes(form.estado)
      ? form.estado
      : "enrollment",
    ...(form.inicio ? { start_date: form.inicio } : {}),
    ...(form.fin ? { end_date: form.fin } : {}),
  });

  const formatErrors = (data) => {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
      .join(" | ");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = buildPayload();

      if (mode === "edit" && projectId) {
        await actualizarProyecto(projectId, payload);
      } else {

        const token = localStorage.getItem("token");
        const csrfToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrftoken="))
          ?.split("=")[1];

        const res = await fetch("/api/proyectos/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
          },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let data = null;
          try { data = await res.json(); } catch {}
          throw new Error(formatErrors(data) || `Error ${res.status} al crear convocatoria`);
        }
      }

      onSuccess?.();
    } catch (err) {
      setError(err.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl shadow-lg bg-white border border-gray-100">
      <header className="px-6 pt-6 border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === "edit" ? "Editar Convocatoria" : "Nueva Convocatoria"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {mode === "edit" ? "Actualiza los datos del proyecto" : "Crea un nuevo proyecto PSU o Voluntariado"}
        </p>
      </header>

      <form onSubmit={onSubmit} className="p-6 grid gap-4">
        {error && (
          <div className="border rounded-xl px-3 py-2 text-sm bg-rose-50 text-rose-800 border-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={fieldClass}>
            <span className="text-sm font-medium">Nombre del proyecto *</span>
            <input className={inputClass} name="nombre" required value={form.nombre} onChange={onChange} />
          </label>
          <label className={fieldClass}>
            <span className="text-sm font-medium">Tipo *</span>
            <select className={selectClass} name="tipo" value={form.tipo} onChange={onChange}>
              <option value="VOLUNTEER">Voluntariado</option>
              <option value="PSU">PSU</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={fieldClass}>
            <span className="text-sm font-medium">Área</span>
            <input className={inputClass} name="area" value={form.area} onChange={onChange} />
          </label>
          <label className={fieldClass}>
            <span className="text-sm font-medium">Subtipo</span>
            <input className={inputClass} name="subtipo" value={form.subtipo} onChange={onChange} />
          </label>
        </div>

        <label className={`${fieldClass} sm:col-span-2`}>
          <span className="text-sm font-medium">Descripción</span>
          <textarea className={`${inputClass} resize-none`} name="descripcion" rows={3} value={form.descripcion} onChange={onChange} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className={fieldClass}>
            <span className="text-sm font-medium">Cupo total *</span>
            <input className={inputClass} name="cupo_total" type="number" min="1" required value={form.cupo_total} onChange={onChange} />
          </label>
          <label className={fieldClass}>
            <span className="text-sm font-medium">Fecha inicio</span>
            <input className={inputClass} name="inicio" type="date" value={form.inicio} onChange={onChange} />
          </label>
          <label className={fieldClass}>
            <span className="text-sm font-medium">Fecha fin</span>
            <input className={inputClass} name="fin" type="date" value={form.fin} onChange={onChange} />
          </label>
        </div>

        <label className={fieldClass}>
          <span className="text-sm font-medium">Estado *</span>
          <select className={selectClass} name="estado" value={form.estado} onChange={onChange}>
            <option value="enrollment">Inscripción</option>
            <option value="ongoing">En curso</option>
            <option value="finished">Finalizado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>

        <div className="w-full flex justify-center items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-white font-medium transition-colors ${
              loading ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            }`}
          >
            {loading ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear Convocatoria"}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            Cancelar
          </button>
        </div>

        <p className="text-xs text-gray-500">Campos * obligatorios</p>
      </form>
    </div>
  );
}
