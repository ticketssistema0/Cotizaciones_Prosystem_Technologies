import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Seguimiento.css";
import logoProsystem from "../assets/logo_prosystem.png";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

const Seguimiento = () => {
  const [proyectos, setProyectos] = useState([]);
  const [filtro, setFiltro] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState(""); // Nuevo estado para la fecha
  const [selectedProject, setSelectedProject] = useState(null);

  const estados = ["Pendiente", "En Proceso", "Por Cobrar", "Finalizado", "Rechazada"];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "cotizaciones"), (snapshot) => {
      setProyectos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    const proyectoRef = doc(db, "cotizaciones", id);
    await updateDoc(proyectoRef, { estadoProyecto: nuevoEstado });
  };

  // Lógica de filtrado mejorada
  const proyectosFiltrados = proyectos.filter((p) => {
    const matchesFiltro = filtro === "Todos" || (p.estadoProyecto || "Pendiente") === filtro;
    
    // Filtro por texto (Cliente)
    const matchesText = p.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por fecha (Calendario)
    // Asumimos que p.fecha viene en formato DD/MM/YYYY o similar. 
    // El input date entrega YYYY-MM-DD, así que comparamos si la fecha del proyecto incluye los números seleccionados.
    const matchesDate = !searchDate || (p.fecha && p.fecha.includes(searchDate.split('-').reverse().join('/')));

    return matchesFiltro && matchesText && matchesDate;
  });

  return (
    <div className="home-container">
      <aside className="sidebar">
        <div className="logo-container"><img src={logoProsystem} alt="Logo" className="logo-img" /></div>
        <nav>
          <ul>
            <li><Link to="/home">Panel</Link></li>
            <li><Link to="/cotizaciones">Cotizaciones</Link></li>
            <li><Link to="/clientes">Clientes</Link></li>
            <li><Link to="/servicios">Servicios</Link></li>
            <li><Link to="/seguimiento">Seguimiento</Link></li>
            <li><Link to="/reportes">Reportes</Link></li>
            <li><Link to="/configuracion">Configuracion</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar"><span>MONITOR DE OPERACIONES</span></header>

        <div className="seguimiento-container">
          <header className="seguimiento-header">
            <div className="header-top-row">
              <h2>Estatus de Proyectos</h2>
              
              {/* CONTENEDOR DE BÚSQUEDA DUAL */}
              <div className="search-group-seguimiento">
                <div className="search-box-seguimiento">
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar cliente..." 
                    className="input-sky-blue"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="date-box-seguimiento">
                  <input 
                    type="date" 
                    className="input-date-sky"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                  {searchDate && (
                    <button className="btn-clear-date" onClick={() => setSearchDate("")}>×</button>
                  )}
                </div>
              </div>
            </div>

            <div className="filtros-bar">
              {["Todos", ...estados].map(e => (
                <button 
                  key={e} 
                  className={`btn-filtro ${filtro === e ? "active" : ""}`}
                  onClick={() => setFiltro(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </header>

          <div className="proyectos-list">
            {proyectosFiltrados.length > 0 ? (
              proyectosFiltrados.map((p) => (
                <div key={p.id} className={`proyecto-item ${p.estadoProyecto === 'Rechazada' ? 'item-rechazado' : ''}`}>
                  <div className="proyecto-info">
                    <span className={`badge ${p.estadoProyecto || "Pendiente"}`}>{p.estadoProyecto || "Pendiente"}</span>
                    <h3>{p.cliente}</h3>
                    <p className="fecha-tag">📅 {p.fecha}</p>
                  </div>

                  <div className="proyecto-progreso">
                    {p.estadoProyecto === "Rechazada" ? (
                      <div className="rechazada-msg">Oportunidad Perdida / Rechazada</div>
                    ) : (
                      <div className="step-container">
                        {estados.filter(e => e !== "Rechazada").map((est, index) => {
                          const currentIndex = estados.indexOf(p.estadoProyecto || "Pendiente");
                          const activeClass = index <= currentIndex ? "completed" : "";
                          return (
                            <div key={est} className={`step ${activeClass}`}>
                              <div className="circle">{index + 1}</div>
                              <span>{est}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="proyecto-acciones-final">
                    <button className="btn-ver-mas" onClick={() => setSelectedProject(p)}>Ver Detalles</button>
                    <div className="update-status-box">
                      <label>Actualizar Estado:</label>
                      <select 
                        className="select-status-modern"
                        value={p.estadoProyecto || "Pendiente"} 
                        onChange={(e) => cambiarEstado(p.id, e.target.value)}
                      >
                        {estados.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">No se encontraron proyectos con esos criterios.</div>
            )}
          </div>
        </div>

        {/* --- MODAL DE DETALLES (Se mantiene igual) --- */}
        {selectedProject && (
          <div className="modal-overlay">
            <div className="modal-content detail-project-modal">
              <header className="modal-detail-header">
                <h2>Detalle de Cotización</h2>
                <button className="close-x" onClick={() => setSelectedProject(null)}>x</button>
              </header>
              <div className="detail-body">
                <div className="detail-row"><strong>Cliente:</strong> {selectedProject.cliente}</div>
                <div className="detail-row"><strong>Servicio Principal:</strong> {selectedProject.servicio}</div>
                <div className="detail-row"><strong>Fecha de Creación:</strong> {selectedProject.fecha}</div>
                <div className="detail-row"><strong>Monto Total:</strong> ${selectedProject.total?.toLocaleString()}</div>
                <hr />
                <h4>Productos Incluidos:</h4>
                <div className="products-mini-list">
                  {selectedProject.productosSeleccionados?.map((prod, i) => (
                    <div key={i} className="mini-item">
                       <span>{prod.nombre} (x{prod.cantidad})</span>
                       <span>${(prod.precio * prod.cantidad).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="mini-item">
                    <span>Mano de Obra</span>
                    <span>${parseFloat(selectedProject.manoDeObra || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button className="btn-cerrar-modal" onClick={() => setSelectedProject(null)}>Cerrar Ventana</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Seguimiento;