import AppLayout from "../components/layout/AppLayout.jsx";

export default function CitasPsicologicasPage() {
  return (
    <AppLayout>
      <section className="rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Citas psicológicas</h1>
        <p className="text-gray-600">
          Agenda y gestiona tus acompañamientos psicológicos, conoce la disponibilidad del
          equipo profesional y mantente atento a tus próximas sesiones.
        </p>
      </section>
    </AppLayout>
  );
}
