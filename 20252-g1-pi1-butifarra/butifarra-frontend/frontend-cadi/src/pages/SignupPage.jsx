import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    phoneNumber: "",
    program: "",
    semester: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [success, setSuccess] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setErrorMessages([]);
    setSuccess(null);

    const trimmedEmail = formData.email.trim();
    const trimmedUsername = formData.username.trim();
    const trimmedProgram = formData.program.trim();
    const semesterValue = formData.semester.toString().trim();
    const phoneDigits = formData.phoneNumber.replace(/\D/g, "");

    if (!trimmedEmail || !trimmedUsername || !trimmedProgram || !semesterValue || !formData.password || !formData.confirmPassword) {
      setErrorMessages(["Por favor completa todos los campos obligatorios."]);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessages(["Las contraseñas no coinciden."]);
      return;
    }

    if (phoneDigits.length !== 10) {
      setErrorMessages(["El número de celular debe tener exactamente 10 dígitos."]);
      return;
    }

    const parsedSemester = Number(semesterValue);
    if (!Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 20) {
      setErrorMessages(["El semestre debe estar entre 1 y 20."]);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        email: trimmedEmail,
        username: trimmedUsername,
        phone_number: phoneDigits,
        program: trimmedProgram,
        semester: parsedSemester,
        password1: formData.password,
        password2: formData.confirmPassword,
      };
      const response = await apiFetch("/api/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || (data && data.ok === false)) {
        const backendMessages = flattenErrors(data?.errors);
        const fallbackMessage =
          data?.detail || data?.error || data?.message || "No se pudo completar el registro.";
        const messages = backendMessages.length > 0 ? backendMessages : [fallbackMessage];
        throw { messages };
      }
      setSuccess(data?.message || "¡Registro exitoso! Ya puedes iniciar sesión.");
      setFormData({
        email: "",
        username: "",
        phoneNumber: "",
        program: "",
        semester: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      if (err?.messages && Array.isArray(err.messages)) {
        setErrorMessages(err.messages);
      } else {
        const message = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
        setErrorMessages([message]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-lg">
        <h1 className="text-3xl font-semibold text-gray-900">Crear cuenta</h1>
        <p className="mt-2 text-sm text-gray-600">
          Regístrate con tu correo institucional para acceder a las actividades del Cadi.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo institucional
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="nombre.apellido@correo.icesi.edu.co"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="usuario"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Celular
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="3001234567"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="program" className="block text-sm font-medium text-gray-700">
              Programa académico
            </label>
            <input
              id="program"
              name="program"
              type="text"
              value={formData.program}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Ingeniería Industrial"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
              Semestre actual
            </label>
            <input
              id="semester"
              name="semester"
              type="number"
              min="1"
              max="20"
              value={formData.semester}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="5"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Repite tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {submitting ? "Creando cuenta..." : "Registrarme"}
          </button>
        </form>

        {errorMessages.length > 0 && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <ul className="list-inside list-disc space-y-1">
              {errorMessages.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
