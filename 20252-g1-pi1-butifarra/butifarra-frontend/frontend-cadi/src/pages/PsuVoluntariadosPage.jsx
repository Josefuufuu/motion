// src/pages/PsuVoluntariadosPage.jsx
import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout.jsx";
import Modal from "../components/ui/Modal.jsx";
import InscripcionFormCard from "../components/Inscripcion/InscripcionFormCard.jsx";
import { listarProyectosActivos } from "../services/psu.js";

export default function PsuVoluntariadosPage() {
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState([]);
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await listarProyectosActivos();
      setProyectos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const cuposDisp = (p) =>
    Math.max((p.cupo_total ?? 0) - (p.inscripciones_confirmadas ?? 0), 0);

  return (
    <AppLayout>
      <section className="rounded-2xl bg-white shadow p-6 mb-6">
        <h1 className="text-2xl font-semibold mb-1">PSU y Voluntariados</h1>
        <p className="text-gray-600">
          Gestiona programas de servicio social y voluntariados. Inscríbete en los proyectos activos.
        </p>
      </section>

      <section className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-medium">Proyectos activos</h2>
          <p className="text-sm text-gray-500">
            {loading ? "Cargando…" : `${proyectos.length} proyectos registrados`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left">Programa</th>
                <th className="px-5 py-3 text-left">Tipo</th>
                <th className="px-5 py-3 text-left">Cupos</th>
                <th className="px-5 py-3 text-left">Periodo</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-5 py-6 text-gray-500" colSpan={6}>Cargando…</td>
                </tr>
              )}
              {!loading && proyectos.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-gray-500" colSpan={6}>No hay proyectos activos.</td>
                </tr>
              )}
              {!loading && proyectos.map((p) => {
                const disp = cuposDisp(p);
                const sinCupo = disp <= 0;
                const inscrito = p.yaInscrito === true;

                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-5 py-4">
                      <div className="font-medium">{p.nombre}</div>
                      <div className="text-gray-500">{p.area ?? p.subtipo ?? ""}</div>
                    </td>
                    <td className="px-5 py-4">{p.tipo ?? "Voluntariado"}</td>
                    <td className="px-5 py-4">{disp}/{p.cupo_total ?? "-"}</td>
                    <td className="px-5 py-4">
                      {(p.inicio && p.fin) ? `${p.inicio} a ${p.fin}` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-full text-xs border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Inscripción
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        disabled={sinCupo || inscrito}
                        onClick={() => { setSel({ id: p.id, nombre: p.nombre, cupos_disponibles: disp }); setOpen(true); }}
                        className={`px-3 py-2 rounded-xl text-white text-sm ${
                          sinCupo || inscrito ? "bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {inscrito ? "Inscrito" : "Inscribirme"}
                      </button>
                      {sinCupo && <div className="text-xs text-rose-600 mt-1">Sin cupo</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)}>
        {sel && (
          <InscripcionFormCard
            proyecto={sel}
            onSuccess={() => { setOpen(false); cargar(); }}
          />
        )}
      </Modal>
    </AppLayout>
  );
}
