// src/hooks/useActividades.js

import { useState, useCallback } from 'react';
import { getCookie, showToast } from '../utils';

// Create a reusable fetch function with credentials included
const apiFetch = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include', // Send cookies with the request
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  };

  console.log(`Making API request to: ${url}`, options);
  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    // Try to get error details from the response
    let errorMessage = `Error: ${response.status}`;
    try {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
    } catch {/* ignore parse error */ }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('API response data:', data);
  return data;
};

export const useActividades = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // List activities with optional filters
  const listActividades = useCallback(async ({ from, to, category, q, mine_prof } = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (category) params.append('category', category);
      if (q) params.append('q', q);
      if (mine_prof) params.append('mine_prof', '1');
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const url = `/api/actividades/${queryString}`;
      const data = await apiFetch(url);
      setActividades(data);
      return data;
    } catch (err) {
      setError(err.message);
      showToast(`Error al cargar actividades: ${err.message}`, 'error');
      return [];
    } finally { setLoading(false); }
  }, []);

  // Create a new activity
  const createActividad = useCallback(async (activityData) => {
    setLoading(true);
    setError(null);

    try {
      // Get CSRF token from cookie
      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) {
        throw new Error('No CSRF token found. Please ensure you are logged in.');
      }

      console.log('Creating activity with data:', activityData);
      console.log('CSRF Token:', csrftoken);

      const response = await apiFetch('/api/actividades/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(activityData)
      });

      console.log('Activity created successfully:', response);
      setActividades(prev => [response, ...prev]);
      showToast('Actividad creada exitosamente', 'success');
      return response;
    } catch (err) {
      console.error('Error creating activity:', err);
      setError(err.message);
      showToast(`Error al crear actividad: ${err.message}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get a single activity by ID
  const getActividad = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch(`/api/actividades/${id}/`);
    } catch (err) {
      setError(err.message);
      showToast(`Error al obtener actividad: ${err.message}`, 'error');
      return null;
    } finally { setLoading(false); }
  }, []);

  // Update an existing activity
  const updateActividad = useCallback(async (id, activityData) => {
    setLoading(true);
    setError(null);

    try {
      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) {
        throw new Error('No CSRF token found. Please ensure you are logged in.');
      }

      const response = await apiFetch(`/api/actividades/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(activityData)
      });

      setActividades(prev => prev.map(act => act.id === id ? response : act));
      showToast('Actividad actualizada exitosamente', 'success');
      return response;
    } catch (err) {
      setError(err.message);
      showToast(`Error al actualizar actividad: ${err.message}`, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing activity as professor
  const updateActividadProfesor = useCallback(async (id, partialData) => {
    setLoading(true); setError(null);
    try {
      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) throw new Error('No CSRF token found.');
      const response = await apiFetch(`/api/actividades/${id}/professor-update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
        body: JSON.stringify(partialData)
      });
      setActividades(prev => prev.map(a => a.id === id ? response : a));
      showToast('Actividad actualizada', 'success');
      return response;
    } catch (err) { setError(err.message); showToast(`Error: ${err.message}`, 'error'); throw err; }
    finally { setLoading(false); }
  }, []);

  // Delete an activity
  const deleteActividad = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) {
        throw new Error('No CSRF token found. Please ensure you are logged in.');
      }

      await fetch(`/api/actividades/${id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrftoken
        }
      });

      setActividades(prev => prev.filter(act => act.id !== id));
      showToast('Actividad eliminada exitosamente', 'success');
      return true;
    } catch (err) {
      setError(err.message);
      showToast(`Error al eliminar actividad: ${err.message}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEnrollments = useCallback(async (id) => {
    setError(null);
    try {
      return await apiFetch(`/api/actividades/${id}/enrollments/`);
    } catch (err) { setError(err.message); showToast(`Error al cargar inscripciones: ${err.message}`, 'error'); return []; }
  }, []);

  const setAttendance = useCallback(async (id, { attended = [], not_attended = [] } = {}) => {
    setLoading(true); setError(null);
    try {
      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) throw new Error('No CSRF token found.');
      const resp = await apiFetch(`/api/actividades/${id}/professor/attendance/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
        body: JSON.stringify({ attended, not_attended })
      });
      showToast('Asistencias actualizadas', 'success');
      return resp;
    } catch (err) { setError(err.message); showToast(`Error al marcar asistencia: ${err.message}`, 'error'); throw err; }
    finally { setLoading(false); }
  }, []);

  const saveProfessorNotes = useCallback(async (id, notes) => {
    setLoading(true); setError(null);
    try {
      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) throw new Error('No CSRF token found.');
      const resp = await apiFetch(`/api/actividades/${id}/professor/notes/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
        body: JSON.stringify({ notes })
      });
      showToast('Notas guardadas', 'success');
      return resp;
    } catch (err) { setError(err.message); showToast(`Error al guardar notas: ${err.message}`, 'error'); throw err; }
    finally { setLoading(false); }
  }, []);

  const enrollInActivity = useCallback(async (id) => {
    setLoading(true); setError(null);
    try {
      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) throw new Error('No CSRF token found.');
      const resp = await apiFetch(`/api/actividades/${id}/enroll/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
      });
      showToast('Inscripción exitosa', 'success');
      return resp;
    } catch (err) { setError(err.message); showToast(`No se pudo inscribir: ${err.message}`, 'error'); throw err; }
    finally { setLoading(false); }
  }, []);

  const unenrollFromActivity = useCallback(async (id) => {
    setLoading(true); setError(null);
    try {
      const csrftoken = getCookie('csrftoken');
      if (!csrftoken) throw new Error('No CSRF token found.');
      const resp = await apiFetch(`/api/actividades/${id}/unenroll/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
      });
      showToast('Inscripción cancelada', 'success');
      return resp;
    } catch (err) { setError(err.message); showToast(`No se pudo cancelar: ${err.message}`, 'error'); throw err; }
    finally { setLoading(false); }
  }, []);

  return {
    actividades,
    loading,
    error,
    listActividades,
    createActividad,
    getActividad,
    updateActividad,
    deleteActividad,
    updateActividadProfesor,
    getEnrollments,
    setAttendance,
    saveProfessorNotes,
    enrollInActivity,
    unenrollFromActivity,
  };
};
