import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useActividades } from '../hooks/useActividades.js';
import { formatDate } from '../utils.js';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Tag as TagIcon, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { QRCodeSVG } from 'qrcode.react';

const CATEGORY_LABELS = {
  DEPORTE: 'Deporte',
  CULTURA: 'Cultura',
  BIENESTAR: 'Bienestar',
  EVENTO: 'Evento',
  OTRO: 'Otro',
};

export default function ActivityDetailPage() {
  const { id } = useParams();
  const {
    getActividad,
    loading,
    error,
    getEnrollments,
    setAttendance,
    saveProfessorNotes,
    generateCheckin,
  } = useActividades();
  const { user, isProfessor } = useAuth();
  const [activity, setActivity] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [attendedIds, setAttendedIds] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkinInfo, setCheckinInfo] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  const isAssignedProfessor = useMemo(() => {
    if (!activity || !user) return false;
    return isProfessor && isProfessor() && activity.assigned_professor === user.id;
  }, [activity, user, isProfessor]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const data = await getActividad(id);
      if (!isMounted) return;
      if (data) {
        setActivity(data);
        setNotFound(false);
        setNotes(data.notes || '');
      } else {
        setActivity(null);
        setNotFound(true);
      }
    })();
    return () => { isMounted = false; };
  }, [id, getActividad]);

  useEffect(() => {
    if (!isAssignedProfessor || !activity?.id) return undefined;
    let cancelled = false;
    const interval = setInterval(async () => {
      const updated = await getActividad(activity.id);
      if (!cancelled && updated) {
        setActivity(prev => ({ ...(prev ?? {}), ...updated }));
      }
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAssignedProfessor, activity?.id, getActividad]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!isAssignedProfessor) return;
      const data = await getEnrollments(id);
      if (!isMounted) return;
      setEnrollments(Array.isArray(data) ? data : []);
      const preset = new Set((data || []).filter(e => e.attended).map(e => e.user?.id));
      setAttendedIds(preset);
    })();
    return () => { isMounted = false; };
  }, [id, isAssignedProfessor, getEnrollments]);

  useEffect(() => {
    if (!activity?.checkin_token) {
      setCheckinInfo(null);
      return;
    }
    setCheckinInfo(prev => {
      if (prev && prev.token === activity.checkin_token) {
        return { ...prev, expires_at: activity.checkin_expires_at };
      }
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return {
        token: activity.checkin_token,
        expires_at: activity.checkin_expires_at,
        frontendUrl: origin ? `${origin}/checkin/${activity.checkin_token}` : `/checkin/${activity.checkin_token}`,
      };
    });
  }, [activity?.checkin_token, activity?.checkin_expires_at]);

  const toggleAttendance = (uid) => {
    setAttendedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    if (!activity) return;
    setBusy(true);
    try {
      const allIds = enrollments.map(e => e.user.id);
      const attended = Array.from(attendedIds);
      const not_attended = allIds.filter(id => !attendedIds.has(id));
      const resp = await setAttendance(activity.id, { attended, not_attended });
      // update activity actual attendees
      if (resp && typeof resp.actual_attendees === 'number') {
        setActivity(a => ({ ...a, actual_attendees: resp.actual_attendees }));
      }
    } finally { setBusy(false); }
  };

  const handleSaveNotes = async () => {
    if (!activity) return;
    setBusy(true);
    try {
      await saveProfessorNotes(activity.id, notes);
    } finally { setBusy(false); }
  };

  const handleGenerateQr = async () => {
    if (!activity) return;
    setGeneratingQr(true);
    try {
      const data = await generateCheckin(activity.id);
      if (data) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const frontendUrl = origin ? `${origin}/checkin/${data.token}` : `/checkin/${data.token}`;
        setCheckinInfo({ ...data, frontendUrl });
        setActivity(a => (a ? { ...a, checkin_token: data.token, checkin_expires_at: data.expires_at } : a));
      }
    } finally {
      setGeneratingQr(false);
    }
  };

  const Header = () => (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Detalle de actividad</h1>
        <p className="text-sm text-slate-500">Consulta la información detallada de la actividad seleccionada</p>
      </div>
      <Link to="/actividades" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        ← Volver al listado
      </Link>
    </header>
  );

  const Content = () => {
    if (loading && !activity) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          <p className="mt-3 text-sm">Cargando información de la actividad...</p>
        </div>
      );
    }
    if (error) {
      return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Error al cargar la actividad: {error}</div>;
    }
    if (notFound || !activity) {
      return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">No se encontró la actividad solicitada.</div>;
    }

    const {
      title,
      description,
      category,
      location,
      start,
      end,
      instructor,
      capacity,
      available_spots,
      status,
      tags,
      visibility,
    } = activity;

    return (
      <section className="space-y-6">
        {/* Hero card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                  <CalendarIcon className="h-3.5 w-3.5" /> {CATEGORY_LABELS[category] || category || 'Sin categoría'}
                </span>
                {status && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 uppercase">{status}</span>
                )}
                {visibility && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 uppercase">{visibility}</span>
                )}
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{title}</h2>
              {description && (
                <p className="mt-2 max-w-3xl text-slate-600 whitespace-pre-line">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Detalles</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Lugar:</span> {location || 'Por definir'}</span></div>
              <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Inicio:</span> {formatDate(start) || 'No definido'}</span></div>
              <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Fin:</span> {formatDate(end) || 'No definido'}</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Participación</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Cupo total:</span> {capacity ?? 'No definido'}</span></div>
              <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Cupos disponibles:</span> {available_spots ?? 'No definido'}</span></div>
              {instructor && (
                <div className="flex items-center"><Eye className="mr-2 h-4 w-4 text-violet-600" /> <span><span className="font-medium">Instructor:</span> {instructor}</span></div>
              )}
            </div>
          </div>
        </div>

        {Array.isArray(tags) && tags.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Etiquetas</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <TagIcon className="h-3.5 w-3.5 text-violet-600" /> {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  const ProfessorPanel = () => {
    if (!isAssignedProfessor) return null;
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Control de asistencias</h3>
              <p className="text-sm text-slate-500">Comparte este código con tus estudiantes para que registren su asistencia.</p>
              <button
                onClick={handleGenerateQr}
                disabled={generatingQr}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {generatingQr ? 'Generando...' : 'Generar QR'}
              </button>
              <p className="text-sm text-slate-600">
                Asistentes registrados: <span className="font-semibold">{activity?.actual_attendees ?? 0}</span>
              </p>
              {checkinInfo?.expires_at && (
                <p className="text-xs text-slate-500">Vence: {new Date(checkinInfo.expires_at).toLocaleString()}</p>
              )}
              {checkinInfo?.frontendUrl && (
                <p className="break-all text-xs text-slate-500">Enlace directo: {checkinInfo.frontendUrl}</p>
              )}
            </div>
            <div className="flex justify-center">
              {checkinInfo?.frontendUrl ? (
                <QRCodeSVG value={checkinInfo.frontendUrl} size={200} className="h-48 w-48" />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-400">
                  Genera un código para mostrarlo aquí
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Asistentes ({activity?.actual_attendees ?? 0})</h3>
          {enrollments.length === 0 ? (
            <p className="text-sm text-slate-500">No hay inscritos aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Asistió</th>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-left">Usuario</th>
                    <th className="p-2 text-left">Inscrito</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e.id} className="border-b">
                      <td className="p-2">
                        <input type="checkbox" checked={attendedIds.has(e.user?.id)} onChange={() => toggleAttendance(e.user?.id)} />
                      </td>
                      <td className="p-2">{[e.user?.first_name, e.user?.last_name].filter(Boolean).join(' ') || e.user?.username}</td>
                      <td className="p-2">{e.user?.username}</td>
                      <td className="p-2">{new Date(e.enrolled_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button onClick={handleSaveAttendance} disabled={busy} className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">Guardar asistencia</button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Notas del profesor</h3>
          <textarea className="w-full rounded border border-slate-300 p-2" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones, incidencias, evaluaciones..." />
          <div className="mt-3 flex gap-2">
            <button onClick={handleSaveNotes} disabled={busy} className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-50">Guardar notas</button>
          </div>
        </div>
      </section>
    );
  };

  const StudentActions = () => {
    if (isAssignedProfessor) return null; // no student actions for professor
    if (!activity) return null;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Participación</h3>
        <p className="text-sm text-slate-500">
          No es necesario inscribirse previamente. Escanea el código QR proporcionado por el profesor al inicio de la actividad para registrar tu asistencia.
        </p>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <Header />
        <Content />
        <ProfessorPanel />
        <StudentActions />
      </div>
    </AppLayout>
  );
}
