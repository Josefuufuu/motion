// Si ya tienes react-router-dom, usa Links. Si no, cambia <Link> por <a>.
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-semibold">Icesi Bienestar</Link>

        <nav className="ml-auto flex items-center gap-4 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "text-indigo-600" : "text-gray-600")}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/HomeBeneficiary"
            className={({ isActive }) => (isActive ? "text-indigo-600" : "text-gray-600")}
          >
            Home Beneficiary
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
