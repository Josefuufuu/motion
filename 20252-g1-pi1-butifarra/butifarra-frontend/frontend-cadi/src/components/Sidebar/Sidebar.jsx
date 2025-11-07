import React from "react";
import { AccountToggle } from "./AccountToggle";
import { RouteSelect } from "./RouteSelect";
import { Logout } from "./Logout";

export const Sidebar = () => {
  return (
    <aside className="h-full w-full bg-white p-4 shadow">
      <div className="flex h-full flex-col gap-4 lg:sticky lg:top-4 lg:h-[90vh]">
        <AccountToggle />
        <RouteSelect />
        <Logout />
      </div>
    </aside>
  );
};