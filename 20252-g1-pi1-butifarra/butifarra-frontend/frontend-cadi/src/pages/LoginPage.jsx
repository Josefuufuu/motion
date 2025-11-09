import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/layout/LoginForm.jsx";
import loginBackground from "../assets/login-background.jpg";
import icesiLogo from "../assets/icesi-logo.png";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const loggedUser = await login({ email, password });
      // Decide redirection based on role to avoid landing on beneficiary page for admins
      const isAdmin = !!(
        loggedUser?.is_staff ||
        loggedUser?.is_superuser ||
        loggedUser?.profile?.is_admin ||
        loggedUser?.profile?.role === "ADMIN"
      );
      const isProfessor = loggedUser?.profile?.role === "PROFESSOR";
      navigate(isAdmin ? "/admin/home" : isProfessor ? "/profesor" : "/inicio", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      setFeedback(message);
    }
  };

  const errorMessage = feedback || error;

  return (
    <div className="flex w-full h-screen">
      {/* Left side: Login form (40%) */}
      <div className="w-full flex flex-col items-center justify-center lg:w-2/5">
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onSubmit={handleSubmit}
        />
        <div className="mt-6 text-center">
          {loading && (
            <p className="text-sm text-gray-600">Iniciando sesión...</p>
          )}
          {errorMessage && !loading && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </div>
      </div>

      {/* Right side: Image (60%) */}
      <div className="bg-white hidden h-full lg:flex items-center justify-center w-3/5">
        <div className="relative lg:flex h-full w-full">
          <img
            className="rounded-4xl w-full h-full object-cover"
            src={loginBackground}
            alt="login-background"
          />
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-black/30 to-transparent"></div>
          {/* university logo */}
          <img
            className="absolute top-4 right-4 w-50"
            src={icesiLogo}
            alt="logo"
          />
        </div>
      </div>
    </div>
  );
}
