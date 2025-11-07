// src/mocks/userActivitiesMock.js
// Este archivo contiene actividades de ejemplo para el calendario del beneficiario.
// Al conectar el backend, estas actividades serán reemplazadas por datos reales.

export default [
  {
    id: 1,
    title: "Partido de fútbol",
    start: new Date(2025, 9, 24, 15, 0), // 24 de octubre de 2025, 15:00
    end: new Date(2025, 9, 24, 17, 0),   // 24 de octubre de 2025, 17:00
    location: "Cancha principal",
    description: "Partido amistoso de fútbol con la selección universitaria.",
    category: "Deporte",
    instructor: "Entrenador Gómez",
    availableSpots: 0,
    registerUrl: "/registro/futbol",
    isFavorite: false,
  },
  {
    id: 2,
    title: "Festival de cultura",
    start: new Date(2025, 9, 25, 10, 0), // 25 de octubre de 2025, 10:00
    end: new Date(2025, 9, 25, 14, 0),   // 25 de octubre de 2025, 14:00
    location: "Plaza central",
    description: "Presentaciones artísticas y gastronomía de distintas regiones.",
    category: "Cultura",
    instructor: "Equipo Cultural",
    availableSpots: 100,
    registerUrl: "/registro/festival",
    isFavorite: false,
  },
  {
    id: 3,
    title: "Conferencia de tecnología",
    start: new Date(2025, 9, 26, 9, 0), // 26 de octubre de 2025, 09:00
    end: new Date(2025, 9, 26, 11, 30), // 26 de octubre de 2025, 11:30
    location: "Auditorio A",
    description: "Últimas tendencias en desarrollo web y aplicaciones móviles.",
    category: "Evento",
    instructor: "Ing. Pérez",
    availableSpots: 50,
    registerUrl: "/registro/tecnologia",
    isFavorite: false,
  },
];