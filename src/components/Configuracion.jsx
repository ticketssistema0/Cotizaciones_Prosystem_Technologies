import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Configuracion.css";
import logoProsystem from "../assets/logo_prosystem.png";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Configuracion = () => {
  const [config, setConfig] = useState({
    nombreEmpresa: "PROSYSTEM Technologies",
    rfc: "",
    telefono: "",
    email: "",
    direccion: "",
    web: "",
    garantia: "Garantía de 1 año en equipos y 30 días en instalación.",
  });

  const [mensaje, setMensaje] = useState("");

  // Cargar configuración al iniciar
  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, "configuracion", "empresa");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const guardarConfiguracion = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "configuracion", "empresa"), config);
      setMensaje("✅ Configuración guardada correctamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error al guardar");
    }
  };

  return (
    <div className="home-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src={logoProsystem} alt="Logo" className="logo-img" />
        </div>
        <nav>
          <ul>
            <li><Link to="/home">Panel</Link></li>
            <li><Link to="/cotizaciones">Cotizaciones</Link></li>
                        <li><Link to="/clientes">Clientes</Link></li>
                                    <li><Link to="/servicios">Servicios</Link></li>
            
            <li><Link to="/seguimiento">Seguimiento</Link></li>
            <li><Link to="/reportes">Reportes</Link></li>
            <li><Link to="/configuracion">Configuración</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="profile"><span>AJUSTES DEL SISTEMA</span></div>
        </header>

        <div className="config-container">
          <div className="config-card">
            <h2>Datos de la Empresa</h2>
            <p className="subtitle">Esta información aparecerá en los encabezados de tus PDFs.</p>
            
            {mensaje && <div className="mensaje-alerta">{mensaje}</div>}

            <form onSubmit={guardarConfiguracion}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Nombre Comercial</label>
                  <input name="nombreEmpresa" value={config.nombreEmpresa} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Identificación Fiscal (RFC/NIT)</label>
                  <input name="rfc" value={config.rfc} onChange={handleChange} placeholder="Ej: ABC123456XYZ" />
                </div>
                <div className="input-group">
                  <label>Teléfono de Contacto</label>
                  <input name="telefono" value={config.telefono} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Correo Electrónico</label>
                  <input name="email" value={config.email} onChange={handleChange} />
                </div>
                <div className="input-group full-width">
                  <label>Dirección Física</label>
                  <input name="direccion" value={config.direccion} onChange={handleChange} />
                </div>
                <div className="input-group full-width">
                  <label>Términos de Garantía (Pie de página PDF)</label>
                  <textarea name="garantia" value={config.garantia} onChange={handleChange} rows="3" />
                </div>
              </div>
              <button type="submit" className="btn-guardar-config">Actualizar Perfil</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Configuracion;