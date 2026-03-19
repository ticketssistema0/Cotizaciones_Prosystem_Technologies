import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Reportes.css";
import logoProsystem from "../assets/logo_prosystem.png";
import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";

const Reportes = () => {
  const [dataMensual, setDataMensual] = useState([]);
  const [dataServicios, setDataServicios] = useState([]);
  const [totalHistorico, setTotalHistorico] = useState(0);

  const COLORS = ["#1e3c72", "#87ceeb", "#27ae60", "#f0ad4e"];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "cotizaciones"), (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      
      // 1. Procesar Monto Total Histórico
      const total = docs.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
      setTotalHistorico(total);

      // 2. Procesar Datos para Gráfica de Barras (Por Mes)
      // Agrupamos montos por mes/año
      const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const reporteMes = {};

      docs.forEach(cot => {
        // Asumiendo que cot.fecha es un string tipo "DD/MM/YYYY"
        const partes = cot.fecha.split("/");
        const mesIndex = parseInt(partes[1]) - 1;
        const nombreMes = meses[mesIndex];

        if (!reporteMes[nombreMes]) reporteMes[nombreMes] = 0;
        reporteMes[nombreMes] += parseFloat(cot.total || 0);
      });

      const chartBarras = meses.map(m => ({ name: m, total: reporteMes[m] || 0 }));
      setDataMensual(chartBarras);

      // 3. Procesar Datos para Gráfica de Pastel (Por Servicio)
      const reporteServ = {};
      docs.forEach(cot => {
        const serv = cot.servicio || "Otros";
        if (!reporteServ[serv]) reporteServ[serv] = 0;
        reporteServ[serv] += 1;
      });

      const chartPie = Object.keys(reporteServ).map(key => ({
        name: key,
        value: reporteServ[key]
      }));
      setDataServicios(chartPie);
    });

    return () => unsubscribe();
  }, []);

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
            <li><Link to="/reportes">Reportes</Link></li>
                        <li><Link to="/seguimiento">Seguimiento</Link></li>
                                    <li><Link to="/configuracion">Configuracion</Link></li>
            
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="profile"><span>ESTADÍSTICAS Y RENDIMIENTO</span></div>
        </header>

        <div className="reportes-content">
          <section className="stats-hero">
            <h1>Balance General</h1>
            <div className="total-badge">
              <span>Total Cotizado (Acumulado)</span>
              <h2>${totalHistorico.toLocaleString("es-MX")}</h2>
            </div>
          </section>

          <div className="charts-grid">
            {/* Gráfica de Barras */}
            <div className="chart-card">
              <h3>Ingresos Estimados por Mes</h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={dataMensual}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="total" fill="#1e3c72" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica de Pastel */}
            <div className="chart-card">
              <h3>Demanda por Tipo de Servicio</h3>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dataServicios}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dataServicios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reportes;