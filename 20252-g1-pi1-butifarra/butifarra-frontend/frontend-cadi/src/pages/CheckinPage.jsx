import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useActividades } from '../hooks/useActividades.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_STYLES = {
  loading: 'border-slate-200 text-slate-600',
  success: 'border-emerald-200 text-emerald-700',
  info: 'border-blue-200 text-blue-700',
  login: 'border-amber-200 text-amber-700',
  error: 'border-rose-200 text-rose-700',
};

export default function CheckinPage() {
  const { token } = useParams();
  const { checkinActivity } = useActividades();
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', message: 'Registrando asistencia...', alreadyMarked: false });
  const [processing, setProcessing] = useState(false);

  const statusStyle = useMemo(() => STATUS_STYLES[state.status] ?? STATUS_STYLES.loading, [state.status]);

  const attemptCheckin = useCallback(async () => {
    if (!token) {
      setState({ status: 'error', message: 'Token no válido.', alreadyMarked: false });
      return;
    }
    setProcessing(true);
    setState({ status: 'loading', message: 'Registrando asistencia...', alreadyMarked: false });
    try {
      const response = await checkinActivity(token);
      setState({
        status: response?.already_marked ? 'info' : 'success',
        message: response?.already_marked
          ? 'Ya habías registrado tu asistencia anteriormente.'
          : '¡Asistencia registrada con éxito! Disfruta de la actividad.',
        alreadyMarked: Boolean(response?.already_marked),
        activityId: response?.activity_id,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo registrar la asistencia.';
      const needsLogin =
        !user ||
        /csrf/i.test(message) ||
        /autorizad/i.test(message) ||
        /sesión/i.test(message) ||
        /token/i.test(message) && /expirado|in[áa]lido/i.test(message);
      if (needsLogin) {
        setState({ status: 'login', message: 'Debes iniciar sesión para registrar tu asistencia.', alreadyMarked: false });
      } else {
        setState({ status: 'error', message, alreadyMarked: false });
      }
    } finally {
      setProcessing(false);
    }
  }, [token, checkinActivity, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await attemptCheckin();
      if (cancelled) {
        setProcessing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptCheckin]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className={`w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-lg ${statusStyle}`}>
        <h1 className="text-2xl font-semibold text-slate-800">Registro de asistencia</h1>
        <p className="mt-2 text-sm">Escanea el código QR que te entregue el profesor o visita este enlace directamente.</p>

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
          {state.status === 'loading' && (
            <div className="space-y-2">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-slate-600">{state.message}</p>
            </div>
          )}
          {state.status !== 'loading' && (
            <p className="text-sm font-medium">{state.message}</p>
          )}
        </div>

        {state.status === 'success' && (
          <div className="mt-4 text-sm text-emerald-700">
            ¡Gracias por confirmar tu asistencia!
          </div>
        )}

        {state.status === 'info' && (
          <div className="mt-4 text-sm text-blue-700">
            Tus datos ya estaban marcados, no necesitas hacer nada más.
          </div>
        )}

        {state.status === 'login' && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-amber-700">Inicia sesión para completar el registro.</p>
            <Link
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              to="/login"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        )}

        {state.status === 'error' && (
          <div className="mt-4 space-y-2 text-sm text-rose-700">
            <p>Ocurrió un problema: {state.message}</p>
            <p>Consulta con el profesor para obtener un nuevo código.</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={attemptCheckin}
            disabled={processing || state.status === 'loading'}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Reintentar
          </button>
          <Link className="text-indigo-600 hover:text-indigo-700" to="/inicio">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
