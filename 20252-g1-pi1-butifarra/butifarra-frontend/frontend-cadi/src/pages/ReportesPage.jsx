import AppLayout from "../components/layout/AppLayout.jsx";

export default function ReportesPage() {
  return (
    <AppLayout>
      <section className="rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Reportes</h1>
        <p className="text-gray-600">
          Visualiza indicadores clave y reportes de participación para hacer seguimiento al
          impacto de los programas de bienestar universitario.
        </p>
      </section>
    </AppLayout>
  );
}
