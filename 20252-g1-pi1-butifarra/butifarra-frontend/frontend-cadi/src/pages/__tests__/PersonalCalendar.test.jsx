import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PersonalCalendar from "../PersonalCalendar.jsx";
import { getUserActivities } from "../../services/activityService.js";

vi.mock("../../services/activityService.js", () => ({
  getUserActivities: vi.fn(),
}));

vi.mock("react-big-calendar", () => ({
  Calendar: ({ events, onSelectEvent }) => (
    <div>
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onSelectEvent(event)}
        >
          {event.title}
        </button>
      ))}
    </div>
  ),
}));

describe("PersonalCalendar modal", () => {
  let assignSpy;
  let originalAssign;

  beforeEach(() => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 1);
    const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000);

    getUserActivities.mockResolvedValue({
      activities: [
        {
          id: 42,
          title: "Actividad de prueba",
          description: "Descripción de prueba",
          location: "Sala 101",
          category: "Entrenamiento",
          instructor: "Profesor Test",
          start: futureStart.toISOString(),
          end: futureEnd.toISOString(),
          available_spots: 7,
        },
      ],
      tournaments: [],
    });

    originalAssign = window.location.assign?.bind(window.location);
    if (typeof window.location.assign !== "function") {
      window.location.assign = (url) => {
        window.location.href = url;
      };
    }
    assignSpy = vi.spyOn(window.location, "assign").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    assignSpy?.mockRestore();
    if (originalAssign) {
      window.location.assign = originalAssign;
    } else {
      delete window.location.assign;
    }
  });

  it("muestra los cupos y la ruta de registro generada", async () => {
    render(<PersonalCalendar />);

    await waitFor(() => {
      expect(getUserActivities).toHaveBeenCalled();
    });

    const eventButton = await screen.findByRole("button", {
      name: "Actividad de prueba",
    });

    fireEvent.click(eventButton);

    const quotaMessage = await screen.findByText("7 cupos disponibles");
    expect(quotaMessage).toBeInTheDocument();

    const registerButton = screen.getByRole("button", { name: "Ver detalle" });
    expect(registerButton).toHaveAttribute("data-register-url", "/actividades/42");

    fireEvent.click(registerButton);
    expect(assignSpy).toHaveBeenCalledWith("/actividades/42");
  });
});
