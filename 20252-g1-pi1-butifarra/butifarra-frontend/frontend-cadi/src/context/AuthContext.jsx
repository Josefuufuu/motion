import { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { apiFetch } from "../services/api";

const AuthContext = createContext(null);

const parseResponse = async (response) => {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = null;
    }
  }

  return {
    data,
    ok: response.ok,
    status: response.status,
  };
};

const extractMessage = (data, status) => {
  if (data && typeof data === "object") {
    return (
      data.detail ||
      data.message ||
      data.error ||
      data.non_field_errors?.[0]
    );
  }

  if (status === 401 || status === 403) {
    return "Sesión no válida.";
  }

  return "Ocurrió un error inesperado.";
};

const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const profile = rawUser.profile;
  const normalizedProfile =
    profile && typeof profile === "object"
      ? {
          // keep role flags so routing works
          role: profile.role ?? null,
          is_admin: Boolean(profile.is_admin),
          is_beneficiary: Boolean(profile.is_beneficiary),
          // keep personal info
          phone_number: profile.phone_number ?? "",
          program: profile.program ?? "",
          semester:
            typeof profile.semester === "number"
              ? profile.semester
              : Number.parseInt(profile.semester ?? "", 10) || null,
        }
      : null;

  return {
    ...rawUser,
    // is_staff/is_superuser come from backend; keep them as-is
    is_staff: Boolean(rawUser.is_staff),
    is_superuser: Boolean(rawUser.is_superuser),
    profile: normalizedProfile,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUserData = useCallback((payload) => {
    if (!payload) {
      setUser(null);
      return null;
    }

    if (typeof payload === "object" && payload !== null) {
      const candidate = payload.user ?? payload;
      const normalized = normalizeUser(candidate);
      setUser(normalized);
      return normalized;
    }

    setUser(null);
    return null;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/api/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const { data, ok, status } = await parseResponse(response);

      if (!ok) {
        throw new Error(extractMessage(data, status));
      }

      return handleUserData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleUserData]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/api/logout/", {
        method: "POST",
      });

      const { data, ok, status } = await parseResponse(response);

      if (!ok) {
        throw new Error(extractMessage(data, status));
      }

      setUser(null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cerrar la sesión.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/api/session/");
      const { data, ok, status } = await parseResponse(response);

      if (!ok) {
        if (status === 401 || status === 403) {
          setUser(null);
          return null;
        }

        throw new Error(extractMessage(data, status));
      }

      return handleUserData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo restaurar la sesión.";
      setError(message);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleUserData]);

  // Helper functions to check user roles
  const isAdmin = useCallback(() => {
    if (!user) return false;
    return (
      user.is_staff ||
      user.is_superuser ||
      user.profile?.is_admin === true ||
      user.profile?.role === 'ADMIN'
    );
  }, [user]);

  const isBeneficiary = useCallback(() => {
    if (!user) return false;
    return (
      user.profile?.is_beneficiary === true ||
      user.profile?.role === 'BENEFICIARY' ||
      (!user.is_staff && !user.is_superuser)
    );
  }, [user]);

  const isProfessor = useCallback(() => {
    if (!user) return false;
    return user.profile?.role === 'PROFESSOR';
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    restoreSession,
    isAdmin,
    isBeneficiary,
    isProfessor,
  }), [user, loading, error, login, logout, restoreSession, isAdmin, isBeneficiary, isProfessor]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }

  return context;
}
