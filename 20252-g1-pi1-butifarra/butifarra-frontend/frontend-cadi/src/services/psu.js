import apiFetch from "./api";

const authHeaders = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

const mapProjectToUI = (p) => ({
  id: p.id,
  nombre: p.name,
  tipo: p.type === "PSU" ? "PSU" : "Voluntariado",
  area: p.area || "",
  subtipo: p.subtype || "",
  descripcion: p.description || "",
  cupo_total: p.total_quota,
  inicio: p.start_date || "",
  fin: p.end_date || "",
  estado: p.status, // enrollment | ongoing | finished | cancelled
  inscripciones_confirmadas: p.confirmed_enrollments ?? 0,
  cupos_disponibles:
    p.available_quota ??
    Math.max((p.total_quota ?? 0) - (p.confirmed_enrollments ?? 0), 0),
  yaInscrito: p.already_enrolled ?? false,
});

const mapEnrollmentToUI = (e) => ({
  id: e.id,
  proyecto: e.project,
  nombre_proyecto: e.project_name,
  usuario: e.user,
  correo_usuario: e.user_email,
  nombres: e.full_name,
  correo: e.email,
  telefono: e.phone || "",
  // backend: pending | confirmed | rejected | cancelled
  estado:
    e.status === "pending"
      ? "pendiente"
      : e.status === "confirmed"
      ? "confirmada"
      : e.status === "rejected"
      ? "rechazada"
      : "cancelada",
  fecha_inscripcion: e.enrollment_date,
  updated_at: e.updated_at,
});

export async function listarProyectosActivos() {
  const res = await apiFetch("/api/proyectos/?status=enrollment", {
    method: "GET",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`GET proyectos: ${res.status}`);
  const raw = await res.json();
  const arr = Array.isArray(raw) ? raw : raw?.results || raw?.data || [];
  return arr.map(mapProjectToUI);
}

export async function actualizarProyecto(id, payload) {
  const csrf = getCookie("csrftoken");
  const res = await apiFetch(`/api/proyectos/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(csrf ? { "X-CSRFToken": csrf } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || "No se pudo actualizar el proyecto");
  return data;
}

export async function crearInscripcion({ proyecto, nombres, correo, telefono }) {
  const csrf = getCookie("csrftoken");
  const res = await apiFetch("/api/inscripciones/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(csrf ? { "X-CSRFToken": csrf } : {}),
    },
    body: JSON.stringify({
      project: proyecto,
      full_name: nombres,
      email: correo,
      phone: telefono || "",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.project || data?.email || data?.detail || "Error al inscribirse";
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }
  return data;
}

export async function listarInscripciones() {
  const res = await apiFetch("/api/inscripciones/", {
    method: "GET",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`GET inscripciones: ${res.status}`);
  const raw = await res.json();
  const arr = Array.isArray(raw) ? raw : raw?.results || raw?.data || [];
  return arr.map(mapEnrollmentToUI);
}

export async function actualizarInscripcion(id, status) {
  const csrf = getCookie("csrftoken");
  const res = await apiFetch(`/api/inscripciones/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(csrf ? { "X-CSRFToken": csrf } : {}),
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || "No se pudo actualizar la inscripción");
  return data;
}

export async function eliminarInscripcion(id) {
  const csrf = getCookie("csrftoken");
  const res = await apiFetch(`/api/inscripciones/${id}/`, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
      ...(csrf ? { "X-CSRFToken": csrf } : {}),
    },
  });
  if (!res.ok) throw new Error(`DELETE inscripción: ${res.status}`);
}
