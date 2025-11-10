// src/services/activityService.js
// src/services/activityService.js
// Servicio para obtener las actividades del usuario autenticado.
// Si la solicitud al backend falla, devuelve datos mock.
import userActivitiesMock from "../mocks/userActivitiesMock.js";

// Convierte las fechas en instancias de Date por si vienen como strings del backend.
const normalize = (items = []) =>
  (items ?? []).map((activity) => {
    const {
      available_spots,
      register_url,
      start,
      end,
      id,
      ...rest
    } = activity;

    const normalizedAvailableSpots =
      activity.availableSpots ?? available_spots ?? null;

    const normalizedRegisterUrl =
      activity.registerUrl ??
      register_url ??
      (typeof id !== "undefined" ? `/actividades/${id}` : undefined);

    return {
      ...rest,
      id,
      start: new Date(start),
      end: new Date(end),
      availableSpots: normalizedAvailableSpots,
      registerUrl: normalizedRegisterUrl,
    };
  });

export async function getUserActivities() {
  try {
    const response = await fetch("/api/user/activities", {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return {
      activities: normalize(data.activities),
      tournaments: normalize(data.tournaments),
    };
  } catch (error) {
    console.warn(
      "No se pudieron obtener las actividades del usuario, usando mock:",
      error?.message
    );
    return {
      activities: normalize(userActivitiesMock),
      tournaments: [],
    };
  }
}
