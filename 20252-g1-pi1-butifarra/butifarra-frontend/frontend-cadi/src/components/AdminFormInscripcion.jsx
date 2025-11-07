import React, { useState } from "react";

export default function AdminFormInscripcion() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    taller: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos enviados:", formData);
    // Aquí después conectarás con el backend
  };

  return (
    <div className="form-container">
      <h2>Formulario de Inscripción</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre completo"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo electrónico"
          value={formData.correo}
          onChange={handleChange}
          required
        />
        <select
          name="taller"
          value={formData.taller}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione un taller</option>
          <option value="deportes">Deportes</option>
          <option value="arte">Arte</option>
          <option value="tecnologia">Tecnología</option>
        </select>
        <button type="submit">Inscribirse</button>
      </form>
    </div>
  );
}
