// src/services/psu.js
import apiFetch from "./api";

// === AUTH opcional (JWT) ===
const authHeaders = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// === CSRF opcional (Django con cookie) ===
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

// --- util: normaliza formatos distintos de respuesta ---
const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.results) return data.results;
  if (data?.data) return data.data;
  return [];
};

// --- GET proyectos activos ---
export async function listarProyectosActivos() {
  const res = await apiFetch("/api/proyectos/?estado=inscripcion", {
    method: "GET",
    headers: {
      ...authHeaders(), // quita si usas solo cookie
    },
  });
  if (!res.ok) throw new Error(`GET proyectos: ${res.status}`);
  const raw = await res.json();
  return toArray(raw);
}

// --- POST crear inscripción ---
export async function crearInscripcion({ proyecto, nombres, correo, telefono }) {
  const csrf = getCookie("csrftoken"); // cambia nombre si tu back usa otro
  const res = await apiFetch("/api/inscripciones/", {
    method: "POST",
    headers: {
      ...authHeaders(), // quita si usas solo cookie
      ...(csrf ? { "X-CSRFToken": csrf } : {}),
    },
    body: JSON.stringify({ proyecto, nombres, correo, telefono }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.proyecto ?? data?.detail ?? "Error al inscribirse");
  }
  return data;
}
