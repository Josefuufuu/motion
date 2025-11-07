// src/hooks/useUserActivities.js
import { useState, useEffect } from "react";
import { getUserActivities } from "../services/activityService.js";

export default function useUserActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const data = await getUserActivities();
        // Normaliza fechas en caso de que vengan en string
        const normalized = data.map((activity) => ({
          ...activity,
          start: new Date(activity.start),
          end: new Date(activity.end),
        }));
        setActivities(normalized);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  return { activities, loading, error };
}
