// src/services/activityService.js
// src/services/activityService.js
// Servicio para obtener las actividades del usuario autenticado.
// Si la solicitud al backend falla, devuelve datos mock.
import userActivitiesMock from "../mocks/userActivitiesMock.js";

// Convierte las fechas en instancias de Date por si vienen como strings del backend.
const normalize = (items = []) =>
  items.map((activity) => ({
    ...activity,
    start: new Date(activity.start),
    end: new Date(activity.end),
  }));

export async function getUserActivities() {
  try {
    const response = await fetch("/api/user/activities", {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return normalize(data);
  } catch (error) {
    console.warn(
      "No se pudieron obtener las actividades del usuario, usando mock:",
      error?.message
    );
    return normalize(userActivitiesMock);
  }
}
