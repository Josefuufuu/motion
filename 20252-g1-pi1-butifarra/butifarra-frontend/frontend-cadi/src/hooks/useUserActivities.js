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
        const { activities: enrolledActivities, tournaments } =
          await getUserActivities();
        const merged = [...enrolledActivities, ...tournaments];
        setActivities(merged);
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
