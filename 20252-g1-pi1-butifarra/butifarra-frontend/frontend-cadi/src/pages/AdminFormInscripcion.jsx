import React, { useState } from "react";
import AppLayout from "../components/layout/AppLayout.jsx";

export default function AdminFormInscripcion() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    taller: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.correo.includes("@")) newErrors.correo = "Correo inválido";
    if (!formData.taller) newErrors.taller = "Selecciona un taller";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      alert("✅ Inscripción registrada con éxito!");
      setFormData({ nombre: "", correo: "", taller: "" });
      setErrors({});
    }
  };

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <span className="text-4xl">🎓</span>
          <h1 className="mt-2 text-2xl font-semibold text-slate-800">Formulario de inscripción</h1>
          <p className="mt-2 text-sm text-slate-500">
            Registra rápidamente nuevos participantes en las actividades del CADI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ingresa el nombre completo"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
            {errors.nombre && <p className="mt-1 text-xs text-rose-500">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Correo electrónico</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
            {errors.correo && <p className="mt-1 text-xs text-rose-500">{errors.correo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600">Selecciona un taller</label>
            <select
              name="taller"
              value={formData.taller}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="">-- Selecciona --</option>
              <option value="arte">🎨 Arte</option>
              <option value="deporte">⚽ Deporte</option>
              <option value="musica">🎶 Música</option>
            </select>
            {errors.taller && <p className="mt-1 text-xs text-rose-500">{errors.taller}</p>}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Enviar inscripción
          </button>
        </form>
      </section>
    </AppLayout>
  );
}
