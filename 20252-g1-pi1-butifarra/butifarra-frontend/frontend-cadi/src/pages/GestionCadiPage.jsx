import React, { useEffect } from "react";
import AppLayout from "../components/layout/AppLayout.jsx";
import { useActividades } from "../hooks/useActividades.js";
import { Link, useNavigate } from "react-router-dom";

export default function GestionCadiPage() {
  const { actividades, loading, error, listActividades } = useActividades();
  const navigate = useNavigate();

  useEffect(() => { listActividades(); }, [listActividades]);

  return (
    <AppLayout>
      <section className="rounded-2xl bg-white shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Gestión CADI</h1>
          <button
            onClick={() => navigate('/actividades/crear')}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Crear actividad
          </button>
        </div>
        {loading && <p className="text-gray-500">Cargando actividades...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Título</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2">Inicio</th>
                  <th className="p-2">Fin</th>
                  <th className="p-2">Cupos</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{a.title}</td>
                    <td className="p-2">{a.category}</td>
                    <td className="p-2">{new Date(a.start).toLocaleString()}</td>
                    <td className="p-2">{new Date(a.end).toLocaleString()}</td>
                    <td className="p-2">{a.available_spots}/{a.capacity}</td>
                    <td className="p-2">{a.status}</td>
                    <td className="p-2 space-x-2">
                      <Link className="text-indigo-600 hover:underline" to={`/actividades/${a.id}`}>Ver</Link>
                      {/* Podrías agregar Editar/Eliminar aquí */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {actividades.length === 0 && (
              <p className="text-gray-500 mt-4">No hay actividades registradas aún.</p>
            )}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
