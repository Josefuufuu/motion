import * as React from "react";
import AnimatedContainer from "../ui/AnimatedContainer.jsx";

export default function LoginForm({
  email = "",
  setEmail = () => {},
  password = "",
  setPassword = () => {},
  onSubmit = () => {},
}) {
  return (
    <div className="w-full">
      {/* Card sized like the reference (max ~680px), with large radius */}
      <AnimatedContainer
        className="mx-auto w-full max-w-[680px] rounded-[28px] bg-white p-8 shadow-sm sm:p-10 md:p-12 lg:p-16 interactive-card"
        variant="fade-up"
      >
        {/* Title + helper */}
        <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
          Bienvenido/a a Bienestar Universitario Icesi
        </h1>
        <p className="mt-2 text-sm text-gray-500 sm:text-base mb-[80px]">
          Ingresa con tu correo institucional para acceder a tus actividades,
          inscripciones y calendario.
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-10 space-y-4 sm:mt-12">
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="Correo institucional"
              className="w-full rounded-xl border border-gray-300/90 px-4 py-3 text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-1 mb-[80px]">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Contraseña"
              className="w-full rounded-xl border border-gray-300/90 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-indigo-500"
            />
          </div>

          {/* Actions row */}
          <div className="mt-6 flex items-center justify-between">
            <label className="inline-flex cursor-pointer items-center gap-3">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-800">
                Recordarme
              </span>
            </label>

            <a
              href="#"
              className="text-sm font-medium text-gray-600 underline-offset-2 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Primary CTA */}
          <div className="pt-6">
            <button
              type="submit"
              className="h-[56px] w-[200px] rounded-xl bg-indigo-600 text-white transition-base hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
            >
              Ingresar
            </button>
          </div>

        </form>
      </AnimatedContainer>
    </div>
  );
}
