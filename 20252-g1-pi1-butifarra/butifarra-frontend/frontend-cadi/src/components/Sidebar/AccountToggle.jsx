import purpleLogo from "../../assets/purple-logo.png";
import React from "react";
import { useRole } from "./RoleContext";

export const AccountToggle = () => {
  const role = useRole();

  return (
    <div className="mb-4 mt-2 border-b border-stone-300 pb-4">
      <button
        type="button"
        className="ml-6 flex w-full items-center gap-2 rounded transition-colors hover:bg-stone-200"
      >
        <img className="size-8" src={purpleLogo} alt="ICESI Bienestar" />
        <div className="mt-0 text-start">
          <span className="sidebar-logo-color block text-[24px] font-bold leading-none">
            ICESI
          </span>
          <span className="sidebar-logo-color block text-[24px] font-bold leading-6">
            Bienestar
          </span>
        </div>
      </button>
      <div className="pt-2 text-sm font-medium text-stone-600">
        <span>{role || "Cargando rol"}</span>
      </div>
    </div>
  );
};
