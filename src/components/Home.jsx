import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import logoProsystem from "../assets/logo_prosystem.png";

// Importa Firestore
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";

const Home = () => {
  const [stats, setStats] = useState({
    clientesActivos: 0,
    totalCotizado: 0,
    numCotizaciones: 0,
    numServicios: 0
  });
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    // 1. Escuchar Clientes Activos
    const unsubClientes = onSnapshot(collection(db, "clientes"), (snap) => {
      const activos = snap.docs.filter(doc => doc.data().estado === "Activo").length;
      setStats(prev => ({ ...prev, clientesActivos: activos }));
    });

    // 2. Escuchar Cotizaciones (Total y Cantidad)
    const unsubCotizaciones = onSnapshot(collection(db, "cotizaciones"), (snap) => {
      let total = 0;
      snap.docs.forEach(doc => {
        total += parseFloat(doc.data().total || 0);
      });
      setStats(prev => ({ 
        ...prev, 
        totalCotizado: total, 
        numCotizaciones: snap.size 
      }));
    });

    // 3. Escuchar Servicios/Productos
    const unsubServicios = onSnapshot(collection(db, "servicios"), (snap) => {
      setStats(prev => ({ ...prev, numServicios: snap.size }));
    });

    // 4. Últimas 5 cotizaciones para la tabla de actividad
    const qRecientes = query(collection(db, "cotizaciones"), orderBy("fecha", "desc"), limit(5));
    const unsubRecientes = onSnapshot(qRecientes, (snap) => {
      setRecientes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubClientes();
      unsubCotizaciones();
      unsubServicios();
      unsubRecientes();
    };
  }, []);

  return (
    <div className="home-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src={logoProsystem} alt="Logo Prosystem" className="logo-img" />
        </div>
        <nav>
          <ul>
            <li><Link to="/home">Panel</Link></li>
            <li><Link to="/cotizaciones">Cotizaciones</Link></li>
            <li><Link to="/clientes">Clientes</Link></li>
            <li><Link to="/servicios">Servicios</Link></li>
            <li><Link to="/reportes">Reportes</Link></li>
            <li><Link to="/seguimiento">Seguimiento</Link></li>
                        <li><Link to="/configuracion">Configuracion</Link></li>


          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="profile">
            <span>BIENVENIDO AL SISTEMA DE GESTIÓN PROSYSTEM</span>
          </div>
        </header>

        {/* Tarjetas con datos REALES */}
        <section className="summary">
          <div className="card border-blue">
            <h3>Monto Total Cotizado</h3>
            <p className="price-tag">${stats.totalCotizado.toLocaleString('es-MX')}</p>
          </div>
          <div className="card border-sky">
            <h3>Cotizaciones Realizadas</h3>
            <p>{stats.numCotizaciones}</p>
          </div>
          <div className="card border-blue">
            <h3>Clientes Activos</h3>
            <p>{stats.clientesActivos}</p>
          </div>
          <div className="card border-sky">
            <h3>Catálogo de Productos</h3>
            <p>{stats.numServicios} items</p>
          </div>
        </section>

        {/* Tabla de Actividad Real */}
        <section className="activity">
          <div className="section-header">
            <h2>Últimas Cotizaciones Generadas</h2>
            <Link to="/cotizaciones" className="btn-view-all">Ver todas</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Monto Total</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.length > 0 ? (
                recientes.map((cot) => (
                  <tr key={cot.id}>
                    <td>{cot.cliente}</td>
                    <td>{cot.servicio}</td>
                    <td className="font-bold">${cot.total?.toLocaleString('es-MX')}</td>
                    <td>{cot.fecha}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>No hay actividad reciente</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <footer className="footer">
          <p>PROSYSTEM Technologies © 2026 | Sistema de Gestión Interna</p>
        </footer>
      </main>
    </div>
  );
};

export default Home;