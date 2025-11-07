// src/pages/PsuVoluntariadosPage.jsx
import { useEffect, useState } from "react";
import AppLayout from "../components/layout/AppLayout.jsx";
import Modal from "../components/ui/Modal.jsx";
import InscripcionFormCard from "../components/Inscripcion/InscripcionFormCard.jsx";
import NuevaConvocatoriaForm from "../components/Proyectos/NuevaConvocatoriaForm.jsx";
import { listarProyectosActivos, listarInscripciones } from "../services/psu.js";

export default function PsuVoluntariadosPage() {
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(false);
  const [openConvocatoria, setOpenConvocatoria] = useState(false);
  const [tabActiva, setTabActiva] = useState('programas');

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await listarProyectosActivos();
      setProyectos(data);
    } finally {
      setLoading(false);
    }
  };

  const cargarInscripciones = async () => {
    try {
      const data = await listarInscripciones();
      setInscripciones(data);
    } catch (err) {
      console.error('Error cargando inscripciones:', err);
    }
  };

  useEffect(() => {
    cargar();
    cargarInscripciones();
  }, []);

  const cuposDisp = (p) =>
    Math.max((p.cupo_total ?? 0) - (p.inscripciones_confirmadas ?? 0), 0);

  const tabs = [
    { id: 'programas', label: 'Programas' },
    { id: 'inscripciones', label: 'Inscripciones' },
    { id: 'chatbox', label: 'Chatbox FAQ' },
    { id: 'reportes', label: 'Reportes' }
  ];

  return (
    <AppLayout>
      <section className="rounded-2xl bg-white shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">PSU y Voluntariados</h1>
            <p className="text-gray-600">
              Gestiona programas de servicio social y proyectos de voluntariado
            </p>
          </div>
          <button
            onClick={() => setOpenConvocatoria(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>+</span>
            Nueva convocatoria
          </button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white overflow-hidden">
        <div className="border-b">
          <nav className="flex gap-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`py-4 border-b-2 transition-colors cursor-pointer ${
                  tabActiva === tab.id
                    ? 'border-indigo-600 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {tabActiva === 'programas' && (
          <div>
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
                            className={`px-3 py-2 rounded-xl text-white text-sm transition-colors ${
                              sinCupo || inscrito
                                ? "bg-indigo-300 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
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
          </div>
        )}

        {tabActiva === 'inscripciones' && (() => {
          const pendientes = inscripciones.filter(i => i.estado === 'pendiente').length;
          const confirmadas = inscripciones.filter(i => i.estado === 'confirmada').length;
          const nuevas = inscripciones.filter(i => {
            const fecha = new Date(i.fecha_inscripcion);
            const hoy = new Date();
            const diff = (hoy - fecha) / (1000 * 60 * 60 * 24);
            return diff <= 7;
          }).length;

          return (
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Nuevas aplicaciones</span>
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="text-3xl font-semibold text-purple-900">{nuevas}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Aprobadas</span>
                    <span className="text-2xl">✓</span>
                  </div>
                  <div className="text-3xl font-semibold text-green-900">{confirmadas}</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Pendientes</span>
                    <span className="text-2xl">⏱</span>
                  </div>
                  <div className="text-3xl font-semibold text-yellow-900">{pendientes}</div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-medium">Lista de inscripciones</h3>
                  <p className="text-sm text-gray-500">Gestiona y valida elegibilidad de aplicantes</p>
                </div>
                {inscripciones.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📋</div>
                      <p>No hay inscripciones registradas</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-5 py-3 text-left">Nombre</th>
                          <th className="px-5 py-3 text-left">Correo</th>
                          <th className="px-5 py-3 text-left">Proyecto</th>
                          <th className="px-5 py-3 text-left">Teléfono</th>
                          <th className="px-5 py-3 text-left">Estado</th>
                          <th className="px-5 py-3 text-left">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inscripciones.map((inscripcion) => (
                          <tr key={inscripcion.id} className="border-t">
                            <td className="px-5 py-4 font-medium">{inscripcion.nombres}</td>
                            <td className="px-5 py-4">{inscripcion.correo}</td>
                            <td className="px-5 py-4">{inscripcion.nombre_proyecto}</td>
                            <td className="px-5 py-4">{inscripcion.telefono || '—'}</td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs border ${
                                inscripcion.estado === 'confirmada'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : inscripcion.estado === 'pendiente'
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {inscripcion.estado === 'confirmada' ? 'Confirmada'
                                  : inscripcion.estado === 'pendiente' ? 'Pendiente'
                                  : inscripcion.estado === 'rechazada' ? 'Rechazada'
                                  : 'Cancelada'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-gray-500">
                              {new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {tabActiva === 'chatbox' && (
          <div className="p-6 text-center text-gray-500">
            <p>Próximamente: Chatbox FAQ</p>
          </div>
        )}

        {tabActiva === 'reportes' && (
          <div className="p-6 text-center text-gray-500">
            <p>Próximamente: Reportes</p>
          </div>
        )}
      </section>

      <Modal open={open} onClose={() => setOpen(false)}>
        {sel && (
          <InscripcionFormCard
            proyecto={sel}
            onSuccess={() => { setOpen(false); cargar(); cargarInscripciones(); }}
          />
        )}
      </Modal>

      <Modal open={openConvocatoria} onClose={() => setOpenConvocatoria(false)}>
        <NuevaConvocatoriaForm
          onSuccess={() => { setOpenConvocatoria(false); cargar(); }}
          onCancel={() => setOpenConvocatoria(false)}
        />
      </Modal>
    </AppLayout>
  );
}
