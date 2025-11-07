import { useReducer, useState } from "react";
import AppLayout from "../components/layout/AppLayout.jsx";

const initialState = {
  name: "",
  sport: "Fútbol",
  format: "Eliminación Directa",
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  maxTeams: 8,
  playersPerTeam: 12,
  location: "",
  visibility: "Público",
  description: "",
  rulesUrl: "",
  bannerFile: null,
  allowDraws: false,
  homeAway: false,
};

function reducer(state, action) {
  if (action.type === "field") return { ...state, [action.name]: action.value };
  if (action.type === "reset") return initialState;
  return state;
}

export default function CreateTournamentPage() {
  const [form, dispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, ok: false, msg: "" });

  const setField = (name, value) =>
    dispatch({ type: "field", name, value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio.";
    if (!form.startDate) e.startDate = "Fecha de inicio requerida.";
    if (!form.endDate) e.endDate = "Fecha de fin requerida.";
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      e.endDate = "La fecha fin no puede ser anterior al inicio.";
    }
    if (form.registrationDeadline && form.startDate && form.registrationDeadline > form.startDate) {
      e.registrationDeadline = "El cierre de inscripciones debe ser antes del inicio.";
    }
    if (Number(form.maxTeams) < 2) e.maxTeams = "Mínimo 2 equipos.";
    if (Number(form.playersPerTeam) < 1) e.playersPerTeam = "Mínimo 1 jugador por equipo.";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setStatus({ loading: true, ok: false, msg: "" });

    // Solo frontend: imprime y muestra mensaje local.
    setTimeout(() => {
      console.log("Torneo a crear (solo frontend):", form);
      setStatus({ loading: false, ok: true, msg: "Torneo creado (mock). Puedes conectar al backend luego." });
      dispatch({ type: "reset" });
    }, 500);
  };

  return (
    <AppLayout title="Gestión de torneos">
      <div className="tournament-wrap">
        <div className="tournament-panel">
          <header>
            <h1 className="tournament-title">Crear torneo</h1>
            <p className="tournament-subtitle">
              Completa la información básica para registrar un nuevo torneo. Más adelante podrás añadir equipos, fixture y resultados.
            </p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            {/* Información general */}
            <section className="tournament-section">
              <h2>Información general</h2>
              <div className="tournament-grid-2">
                <div className="field">
                  <label>Nombre del torneo *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <div className="error">{errors.name}</div>}
                </div>
                <div className="field">
                  <label>Deporte</label>
                  <select
                    value={form.sport}
                    onChange={(e) => setField("sport", e.target.value)}
                    className="select"
                  >
                    <option>Fútbol</option>
                    <option>Baloncesto</option>
                    <option>Voleibol</option>
                    <option>Tenis de Mesa</option>
                    <option>Atletismo</option>
                  </select>
                </div>
                <div className="field">
                  <label>Formato</label>
                  <select
                    value={form.format}
                    onChange={(e) => setField("format", e.target.value)}
                    className="select"
                  >
                    <option>Eliminación Directa</option>
                    <option>Round Robin</option>
                    <option>Grupos + Eliminación</option>
                  </select>
                </div>
                <div className="field">
                  <label>Ubicación / Sede</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="field">
                <label>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={3}
                  className="textarea"
                  placeholder="Reglas generales, requisitos, notas para los equipos…"
                />
              </div>
            </section>

            {/* Calendario */}
            <section className="tournament-section">
              <h2>Calendario</h2>
              <div className="tournament-grid-3">
                <div className="field">
                  <label>Inicio *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.startDate}
                  />
                  {errors.startDate && <div className="error">{errors.startDate}</div>}
                </div>
                <div className="field">
                  <label>Fin *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.endDate}
                  />
                  {errors.endDate && <div className="error">{errors.endDate}</div>}
                </div>
                <div className="field">
                  <label>Cierre de inscripciones</label>
                  <input
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(e) => setField("registrationDeadline", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.registrationDeadline}
                  />
                  {errors.registrationDeadline && (
                    <div className="error">{errors.registrationDeadline}</div>
                  )}
                </div>
              </div>
            </section>

            {/* Cupos y reglas */}
            <section className="tournament-section">
              <h2>Cupos y reglas</h2>
              <div className="tournament-grid-3">
                <div className="field">
                  <label>Máx. equipos *</label>
                  <input
                    type="number"
                    min={2}
                    value={form.maxTeams}
                    onChange={(e) => setField("maxTeams", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.maxTeams}
                  />
                  {errors.maxTeams && <div className="error">{errors.maxTeams}</div>}
                </div>
                <div className="field">
                  <label>Jugadores por equipo *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.playersPerTeam}
                    onChange={(e) => setField("playersPerTeam", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.playersPerTeam}
                  />
                  {errors.playersPerTeam && <div className="error">{errors.playersPerTeam}</div>}
                </div>
                <div className="field">
                  <label>Visibilidad</label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setField("visibility", e.target.value)}
                    className="select"
                  >
                    <option>Público</option>
                    <option>Privado</option>
                  </select>
                </div>
              </div>
              <div className="tournament-grid-3" style={{marginTop: 8}}>
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    checked={form.allowDraws}
                    onChange={(e) => setField("allowDraws", e.target.checked)}
                  />
                  Permitir empates
                </label>
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    checked={form.homeAway}
                    onChange={(e) => setField("homeAway", e.target.checked)}
                  />
                  Ida y vuelta
                </label>
                {/* Espacio vacío para alinear */}
                <div />
              </div>
              <div className="tournament-grid-2">
                <div className="field">
                  <label>URL de reglamento</label>
                  <input
                    type="url"
                    value={form.rulesUrl}
                    onChange={(e) => setField("rulesUrl", e.target.value)}
                    className="input"
                    placeholder="https://…"
                  />
                </div>
                <div className="field">
                  <label>Banner (opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setField("bannerFile", e.target.files?.[0] || null)}
                    className="file"
                  />
                </div>
              </div>
            </section>

            {/* Acciones */}
            <div className="actions">
              <button
                type="button"
                onClick={() => dispatch({ type: "reset" })}
                className="btn"
                disabled={status.loading}
              >
                Limpiar
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={status.loading}
              >
                {status.loading ? "Guardando…" : "Crear torneo"}
              </button>
            </div>

            {/* Estado */}
            {status.msg && (
              <div className={`toast ${status.ok ? "ok" : "error"}`}>
                {status.msg}
              </div>
            )}
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
                disabled={status.loading}
              >
                {status.loading ? "Guardando…" : "Crear torneo"}
              </button>
            </div>

            {/* Estado */}
            {status.msg && (
              <p className={`text-sm ${status.ok ? "text-green-600" : "text-red-600"}`}>
                {status.msg}
              </p>
            )}
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
