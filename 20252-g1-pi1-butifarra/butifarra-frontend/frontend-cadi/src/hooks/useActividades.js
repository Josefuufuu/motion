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
    } catch (e) {
      // If we can't parse the error, use the status text
      errorMessage = response.statusText;
    }

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
  const listActividades = useCallback(async ({ from, to, category, q } = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Build query string from filters
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (category) params.append('category', category);
      if (q) params.append('q', q);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const url = `/api/actividades/${queryString}`;

      const data = await apiFetch(url);
      console.log('Loaded activities:', data);
      setActividades(data);
      return data;
    } catch (err) {
      console.error('Error loading activities:', err);
      setError(err.message);
      showToast(`Error al cargar actividades: ${err.message}`, 'error');
      return [];
    } finally {
      setLoading(false);
    }
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
      const data = await apiFetch(`/api/actividades/${id}/`);
      return data;
    } catch (err) {
      setError(err.message);
      showToast(`Error al obtener actividad: ${err.message}`, 'error');
      return null;
    } finally {
      setLoading(false);
    }
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

  return {
    actividades,
    loading,
    error,
    listActividades,
    createActividad,
    getActividad,
    updateActividad,
    deleteActividad
  };
};
