import AppLayout from "../components/layout/AppLayout.jsx";

export default function TorneosPage() {
  return (
    <AppLayout>
      <section className="rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Torneos</h1>
        <p className="text-gray-600">
          Consulta la programación de torneos deportivos y culturales, sigue tus equipos
          favoritos y mantente al tanto de los resultados más recientes.
        </p>
      </section>
    </AppLayout>
  );
}
