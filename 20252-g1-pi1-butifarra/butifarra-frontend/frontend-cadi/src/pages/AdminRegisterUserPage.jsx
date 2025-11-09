import { useState } from "react";
import AppLayout from "../components/layout/AppLayout.jsx";
import useAdminRegisterUser from "../hooks/useAdminRegisterUser.js";

const ROLE_OPTIONS = [
  { label: "Estudiante", value: "BENEFICIARY" },
  { label: "Profesor", value: "PROFESSOR" },
];

const INITIAL_FORM = {
  email: "",
  username: "",
  phoneNumber: "",
  program: "",
  semester: "",
  password: "",
  confirmPassword: "",
  role: ROLE_OPTIONS[0].value,
};

export default function AdminRegisterUserPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [clientErrors, setClientErrors] = useState([]);
  const { registerUser, loading, errors: apiErrors, success, resetFeedback } = useAdminRegisterUser();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (clientErrors.length > 0) {
      setClientErrors([]);
    }

    if (apiErrors.length > 0 || success) {
      resetFeedback();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setClientErrors([]);
    resetFeedback();

    const trimmedEmail = formData.email.trim();
    const trimmedUsername = formData.username.trim();
    const trimmedProgram = formData.program.trim();
    const semesterValue = formData.semester.toString().trim();
    const phoneDigits = formData.phoneNumber.replace(/\D/g, "");
    const validationErrors = [];

    if (
      !trimmedEmail ||
      !trimmedUsername ||
      !trimmedProgram ||
      !semesterValue ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      validationErrors.push("Por favor completa todos los campos obligatorios.");
    }

    if (formData.password !== formData.confirmPassword) {
      validationErrors.push("Las contraseñas no coinciden.");
    }

    if (phoneDigits.length !== 10) {
      validationErrors.push("El número de celular debe tener exactamente 10 dígitos.");
    }

    const parsedSemester = Number(semesterValue);
    if (!Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 20) {
      validationErrors.push("El semestre debe estar entre 1 y 20.");
    }

    if (!formData.role) {
      validationErrors.push("Selecciona el rol del nuevo usuario.");
    }

    if (validationErrors.length > 0) {
      setClientErrors(validationErrors);
      return;
    }

    const result = await registerUser({
      email: trimmedEmail,
      username: trimmedUsername,
      phone_number: phoneDigits,
      program: trimmedProgram,
      semester: parsedSemester,
      password1: formData.password,
      password2: formData.confirmPassword,
      role: formData.role,
    });

    if (result.ok) {
      setFormData((prev) => ({
        ...INITIAL_FORM,
        role: prev.role,
      }));
    }
  };

  const allErrors = clientErrors.concat(apiErrors);

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header className="text-left sm:text-center">
          <span className="text-4xl">🆕</span>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Registrar usuario interno</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Completa la información para crear cuentas de estudiantes o profesores directamente desde el panel de administración.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">
              Rol del usuario
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="nombre.apellido@correo.icesi.edu.co"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="usuario"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700">
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="3001234567"
            />
          </div>

          <div>
            <label htmlFor="program" className="block text-sm font-medium text-slate-700">
              Programa académico
            </label>
            <input
              id="program"
              name="program"
              type="text"
              value={formData.program}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Ingeniería Industrial"
            />
          </div>

          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-slate-700">
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="5"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Contraseña temporal
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Ingresa una contraseña segura"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Repite la contraseña"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Revisa la información antes de crear la cuenta. El usuario recibirá las instrucciones por correo.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-80 sm:w-auto"
            >
              {loading ? "Registrando..." : "Registrar usuario"}
            </button>
          </div>
        </form>

        {allErrors.length > 0 && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <ul className="list-inside list-disc space-y-1">
              {allErrors.map((message, index) => (
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
      </section>
    </AppLayout>
  );
}
