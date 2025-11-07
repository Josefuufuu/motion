import React from "react";
import { Link } from "react-router-dom";
import { FiBell, FiUser } from "react-icons/fi";

export default function Header() {
  return (
    <div className="flex h-16 items-center justify-between px-4 sm:px-6">
      <div className="text-lg font-semibold text-slate-700">Panel de bienestar</div>
      <div className="flex items-center gap-2">
        <Link
          to="/notificaciones"
          className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
          aria-label="Notificaciones"
        >
          <FiBell className="size-5" />
        </Link>
        <Link
          to="/perfil"
          className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
          aria-label="Perfil"
        >
          <FiUser className="size-5" />
        </Link>
      </div>
    </div>
  );
}
