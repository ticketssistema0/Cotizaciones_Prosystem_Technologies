import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import Clientes from "./components/Clientes";
import Servicios from "./components/Servicios";
import Cotizaciones from "./components/Cotizaciones";
import Reportes from "./components/Reportes"; // 👈 Importamos la nueva pantalla
import Seguimiento from "./components/Seguimiento";
import Configuracion from "./components/Configuracion";

import "./App.css";

function App() {
  const [user, setUser] = useState(() => {
    // Recupera el usuario guardado en localStorage
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        {/* Ruta de login */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/home" /> : <Login onLogin={setUser} />
          }
        />

        {/* Ruta protegida Home */}
        <Route
          path="/home"
          element={
            user ? (
              <Home user={user} onLogout={() => setUser(null)} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Ruta protegida Clientes */}
        <Route
          path="/clientes"
          element={
            user ? <Clientes /> : <Navigate to="/" />
          }
        />

        {/* Ruta protegida Servicios */}
        <Route
          path="/servicios"
          element={
            user ? <Servicios /> : <Navigate to="/" />
          }
        />

        {/* Ruta protegida Cotizaciones */}
        <Route
          path="/cotizaciones"
          element={
            user ? <Cotizaciones /> : <Navigate to="/" />
          }
        />

        {/* 👇 NUEVA RUTA PROTEGIDA: Reportes */}
        <Route
          path="/reportes"
          element={
            user ? <Reportes /> : <Navigate to="/" />
          }
        />
        
        <Route
  path="/seguimiento"
  element={user ? <Seguimiento /> : <Navigate to="/" />}
/>

<Route
  path="/configuracion"
  element={user ? <Configuracion /> : <Navigate to="/" />}
/>
      </Routes>
    </Router>
  );
}

export default App;