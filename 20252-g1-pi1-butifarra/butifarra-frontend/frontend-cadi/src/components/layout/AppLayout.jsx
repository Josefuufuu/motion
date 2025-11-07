import React from "react";
import PropTypes from "prop-types";
import Header from "./Header";
import { Sidebar } from "../Sidebar/Sidebar";
import AnimatedContainer from "../ui/AnimatedContainer.jsx";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Sidebar />
      </aside>

      <div className="flex w-full flex-1 flex-col">
        <div className="border-b border-slate-200 bg-white shadow-sm lg:hidden">
          <div className="max-h-[70vh] overflow-y-auto">
            <Sidebar />
          </div>
        </div>

        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <Header />
        </header>

        <AnimatedContainer
          as="main"
          className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-10"
          variant="fade-up"
        >
          {children}
        </AnimatedContainer>
      </div>
    </div>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node,
};
