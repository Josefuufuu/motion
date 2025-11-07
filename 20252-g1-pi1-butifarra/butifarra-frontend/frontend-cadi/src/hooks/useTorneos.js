// src/hooks/useTorneos.js
import { useState, useEffect, useCallback } from 'react';
import { getCookie, showToast } from '../utils.js';

export const useTorneos = () => {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiFetch = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    if (!response.ok) {
      let message = response.statusText;
      try { const data = await response.json(); message = data.detail || data.error || message; } catch {}
      throw new Error(message);
    }
    return response.json();
  };

  const fetchTorneos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/torneos/');
      setTorneos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTorneos(); }, [fetchTorneos]);

  const createTorneo = async (torneoData) => {
    try {
      const csrftoken = getCookie('csrftoken');
      const created = await apiFetch('/api/torneos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(torneoData),
      });
      setTorneos(prev => [created, ...prev]);
      showToast('Torneo creado exitosamente', 'success');
      return created;
    } catch (err) {
      showToast(`Error al crear torneo: ${err.message}`, 'error');
      throw err;
    }
  };

  const deleteTorneo = async (id) => {
    try {
      const csrftoken = getCookie('csrftoken');
      await fetch(`/api/torneos/${id}/`, { method: 'DELETE', credentials: 'include', headers: { 'X-CSRFToken': csrftoken } });
      setTorneos(prev => prev.filter(t => t.id !== id));
      showToast('Torneo eliminado', 'success');
    } catch (err) {
      showToast(`Error al eliminar torneo: ${err.message}`, 'error');
    }
  };

  const updateTorneo = async (updatedData) => {
    try {
      const csrftoken = getCookie('csrftoken');
      const updated = await apiFetch(`/api/torneos/${updatedData.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(updatedData)
      });
      setTorneos(prev => prev.map(t => t.id === updated.id ? updated : t));
      showToast('Torneo actualizado', 'success');
      return updated;
    } catch (err) {
      showToast(`Error al actualizar torneo: ${err.message}`, 'error');
      throw err;
    }
  };

  const registerResult = (tournamentId, matchId, scores) => {
    setTorneos(prev => prev.map(torneo => {
      if (torneo.id === tournamentId) {
        const updatedMatches = (torneo.matches || []).map(match => (match.id === matchId ? { ...match, ...scores, status: 'played' } : match));
        return { ...torneo, matches: updatedMatches };
      }
      return torneo;
    }));
  };

  return { torneos, loading, error, createTorneo, deleteTorneo, updateTorneo, registerResult };
};