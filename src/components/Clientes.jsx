import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Clientes.css";
import logoProsystem from "../assets/logo_prosystem.png";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCliente, setCurrentCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    estado: "Activo"
  });
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 nuevo estado

  const clientesRef = collection(db, "clientes");

  // Cargar clientes desde Firebase
  const fetchClientes = async () => {
    const snapshot = await getDocs(clientesRef);
    setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Abrir modal para nuevo cliente
  const handleAdd = () => {
    setFormData({ nombre: "", email: "", telefono: "", estado: "Activo" });
    setEditMode(false);
    setShowModal(true);
  };

  // Abrir modal para editar cliente
  const handleEdit = cliente => {
    setFormData(cliente);
    setCurrentCliente(cliente.id);
    setEditMode(true);
    setShowModal(true);
  };

  // Guardar cliente en Firebase
  const handleSave = async () => {
    if (editMode) {
      const clienteDoc = doc(db, "clientes", currentCliente);
      await updateDoc(clienteDoc, formData);
    } else {
      await addDoc(clientesRef, formData);
    }
    await fetchClientes();
    setShowModal(false);
  };

  // Eliminar cliente
  const handleDelete = async id => {
    await deleteDoc(doc(db, "clientes", id));
    setClientes(clientes.filter(c => c.id !== id));
  };

  // 🔍 Filtrar clientes según búsqueda
  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="home-container">
      {/* Barra lateral */}
      <aside className="sidebar">
        <div className="logo-container">
          <img src={logoProsystem} alt="Logo Prosystem" className="logo-img" />
        </div>
        <nav>
          <ul>
            <li><Link to="/">Panel</Link></li>
            <li><Link to="/cotizaciones">Cotizaciones</Link></li>
            <li><Link to="/clientes">Clientes</Link></li>
            <li><Link to="/servicios">Servicios</Link></li>
            <li><Link to="/reportes">Reportes</Link></li>
                        <li><Link to="/seguimiento">Seguimiento</Link></li>
                                    <li><Link to="/configuracion">Configuracion</Link></li>
            
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="main-content">
        {/* Barra superior */}
        <header className="topbar">
          <div className="profile">
           
            <span>BIENVENIDO AL GESTOR DE COTIZACIONES</span>
          </div>
        </header>

        {/* Sección de clientes */}
        <div className="clientes-container">
          <header className="clientes-header">
            <h1>Gestión de Clientes</h1>
            <div className="clientes-actions">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="clientes-search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} // 🔍 actualiza búsqueda
              />
              <button className="btn-agregar" onClick={handleAdd}>
                + Nuevo Cliente
              </button>
            </div>
          </header>

          <section className="clientes-table-section">
            <table className="clientes-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map(cliente => (
                  <tr key={cliente.id}>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.estado}</td>
                    <td>
                      <button
                        className="btn-editar"
                        onClick={() => handleEdit(cliente)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleDelete(cliente.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredClientes.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No se encontraron clientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>{editMode ? "Editar Cliente" : "Nuevo Cliente"}</h2>
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              />
              <select
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value })}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <div className="modal-actions">
                <button onClick={handleSave}>Guardar</button>
                <button onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Clientes;
