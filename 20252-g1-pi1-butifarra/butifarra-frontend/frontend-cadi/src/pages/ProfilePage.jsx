import React from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Perfil</h1>
          <p className="mt-2 text-sm text-slate-500">
            No se encontró información de tu cuenta. Intenta volver a iniciar sesión.
          </p>
        </div>
      </AppLayout>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const displayName = fullName || user.username || user.email || "Usuario";
  const email = user.email || "Sin correo registrado";
  const username = user.username || "Sin usuario";
  const phoneNumber = user.profile?.phone_number || "No registrado";
  const program = user.profile?.program || "No registrado";
  const semesterValue = user.profile?.semester;
  const semester =
    typeof semesterValue === "number" && !Number.isNaN(semesterValue)
      ? `Semestre ${semesterValue}`
      : semesterValue
        ? String(semesterValue)
        : "No registrado";

  const handleEditClick = (event) => {
    event.preventDefault();
    // Espacio para integrar la edición del perfil cuando esté disponible
    console.info("Editar perfil");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-violet-600">
              Tu cuenta
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">Perfil</h1>
            <p className="mt-2 text-sm text-slate-500">
              Consulta y gestiona tu información personal registrada en Bienestar.
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              to="#editar"
              onClick={handleEditClick}
              className="inline-flex items-center justify-center rounded-full border border-violet-200 px-4 py-2 text-sm font-medium text-violet-600 transition hover:border-violet-400 hover:text-violet-700"
            >
              Editar perfil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              Cerrar sesión
            </button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Datos básicos</h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-sm font-medium text-slate-500">Nombre completo</dt>
                <dd className="text-base text-slate-900">{displayName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Correo electrónico</dt>
                <dd className="text-base text-slate-900">{email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Usuario</dt>
                <dd className="text-base text-slate-900">{username}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Perfil académico</h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-sm font-medium text-slate-500">Teléfono</dt>
                <dd className="text-base text-slate-900">{phoneNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Programa</dt>
                <dd className="text-base text-slate-900">{program}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Semestre</dt>
                <dd className="text-base text-slate-900">{semester}</dd>
              </div>
            </dl>
          </article>
        </section>
      </div>
    </AppLayout>
  );
}
