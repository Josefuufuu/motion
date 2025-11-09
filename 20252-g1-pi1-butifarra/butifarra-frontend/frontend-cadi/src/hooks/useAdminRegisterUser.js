import { useCallback, useState } from "react";
import { apiFetch } from "../services/api";

const flattenErrors = (input) => {
  if (!input) return [];
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) {
    return input.flatMap((item) => flattenErrors(item));
  }
  if (typeof input === "object") {
    return Object.values(input).flatMap((value) => flattenErrors(value));
  }
  return [];
};

export default function useAdminRegisterUser() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(null);

  const resetFeedback = useCallback(() => {
    setErrors([]);
    setSuccess(null);
  }, []);

  const registerUser = useCallback(async (payload) => {
    setLoading(true);
    setErrors([]);
    setSuccess(null);

    try {
      const response = await apiFetch("/api/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch (error) {
          data = null;
        }
      }

      if (!response.ok || data?.ok === false) {
        const backendMessages = flattenErrors(data?.errors ?? data);
        const fallbackMessage =
          data?.detail || data?.error || data?.message || "No se pudo registrar el usuario.";
        const messages = backendMessages.length > 0 ? backendMessages : [fallbackMessage];
        setErrors(messages);
        return { ok: false, data };
      }

      const message = data?.message || "Usuario registrado correctamente. Se envió la notificación de acceso.";
      setSuccess(message);
      return { ok: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
      setErrors([message]);
      return { ok: false, data: null };
    } finally {
      setLoading(false);
    }
  }, []);

  return { registerUser, loading, errors, success, resetFeedback };
}
