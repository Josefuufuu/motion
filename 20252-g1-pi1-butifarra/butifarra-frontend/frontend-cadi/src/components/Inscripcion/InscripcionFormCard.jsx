import { useState } from "react";
import { crearInscripcion } from "../../services/psu";

export default function InscripcionFormCard({ proyecto, onSuccess }) {
  const [form, setForm] = useState({ nombres: "", correo: "", telefono: "" });
  const [acepto, setAcepto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text:string}

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(form.correo)) return setMsg({ type: "err", text: "Correo inválido" });
    if (!acepto) return setMsg({ type: "err", text: "Debes aceptar el tratamiento de datos" });

    setLoading(true); setMsg(null);
    try {
      await crearInscripcion({ proyecto: proyecto.id, ...form });
      setMsg({ type: "ok", text: "Inscripción confirmada" });
      setForm({ nombres: "", correo: "", telefono: "" });
      setAcepto(false);
      onSuccess?.();
    } catch (err) {
      setMsg({ type: "err", text: String(err.message || "Error al inscribirse") });
    } finally { setLoading(false); }
  };

  const cupos = proyecto?.cupos_disponibles ?? 0;

  return (
    <div className="w-full max-w-xl rounded-2xl shadow-lg bg-white border border-gray-100">
      <header className="px-6 pt-6">
        <h2 className="text-xl font-semibold text-gray-900">Inscripción a proyectos sociales</h2>
        <p className="text-sm text-gray-500">Proyecto: {proyecto?.nombre}</p>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${
          cupos>0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        }`}>{cupos} cupos</span>
      </header>

      <form onSubmit={onSubmit} className="p-6 grid gap-4">
        {msg && (
          <div className={`border rounded-xl px-3 py-2 text-sm ${
            msg.type==="ok" ? "bg-green-50 text-green-800 border-green-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>{msg.text}</div>
        )}

        <label className="grid gap-1">
          <span className="text-sm font-medium">Nombres y apellidos *</span>
          <input className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-text"
                 name="nombres" required value={form.nombres} onChange={onChange}/>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Correo *</span>
          <input className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-text"
                 type="email" name="correo" required value={form.correo} onChange={onChange}/>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Teléfono</span>
          <input className="px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-text"
                 name="telefono" value={form.telefono} onChange={onChange}/>
        </label>

        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input type="checkbox" className="mt-1 cursor-pointer" checked={acepto} onChange={(e)=>setAcepto(e.target.checked)}/>
          <span>Acepto el tratamiento de datos personales.</span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button disabled={loading} className={`px-4 py-2 rounded-xl text-white font-medium transition-colors ${loading?"bg-indigo-300 cursor-not-allowed":"bg-indigo-600 hover:bg-indigo-700 cursor-pointer"}`}>
            {loading ? "Enviando…" : "Inscribirme"}
          </button>
          <button type="button" onClick={()=>{setForm({nombres:"",correo:"",telefono:""});setAcepto(false);setMsg(null);}}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            Limpiar
          </button>
        </div>

        <p className="text-xs text-gray-500">Campos * obligatorios</p>
      </form>
    </div>
  );
}
