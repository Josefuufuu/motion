import React from "react";
import AppLayout from "../components/layout/AppLayout.jsx";
import { Dashboard } from "../components/Dashboard/Dashboard";

export default function AdminReport() {
  return (
    <AppLayout>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Dashboard />
      </section>
    </AppLayout>
  );
}
