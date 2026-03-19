import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom"; // 👈 Importa el hook de navegación
import "./Login.css";
import logoProsystem from "../assets/logo_prosystem.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // 👈 Inicializa el hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Si el login es exitoso, redirige a Home.jsx
      navigate("/home"); 
    } catch (err) {
      setError("Credenciales inválidas o usuario no registrado");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logoProsystem} alt="Logo Prosystem" className="login-logo" />
        <h2 className="login-title">Portal Empresarial</h2>
        <p className="login-subtitle">Accede con tus credenciales</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Correo corporativo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button">
            Iniciar sesión
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <p className="login-footer">© 2026 Prosystem. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}

export default Login;
