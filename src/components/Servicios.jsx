import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Servicios.css";
import logoProsystem from "../assets/logo_prosystem.png";
import { db, storage } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentServicio, setCurrentServicio] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- ESTADOS PARA EL MODAL DE CONFIRMACIÓN ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [tiposServicio, setTiposServicio] = useState([]); 
  const [nuevoTipoInput, setNuevoTipoInput] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    estado: "Activo",
    tipo: "",
    imagenUrl: ""
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const unsubCategorias = onSnapshot(collection(db, "categorias"), (snap) => {
      const listaCategorias = snap.docs.map(doc => doc.data().nombre);
      setTiposServicio(listaCategorias);
      if (listaCategorias.length > 0 && !formData.tipo) {
          setFormData(prev => ({ ...prev, tipo: listaCategorias[0] }));
      }
    });

    const unsubServicios = onSnapshot(collection(db, "servicios"), (snap) => {
      setServicios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCategorias();
      unsubServicios();
    };
  }, [formData.tipo]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAddNewTipo = async () => {
    const nombreLimpio = nuevoTipoInput.trim();
    if (nombreLimpio !== "" && !tiposServicio.includes(nombreLimpio)) {
      try {
        await addDoc(collection(db, "categorias"), { nombre: nombreLimpio });
        setFormData({ ...formData, tipo: nombreLimpio });
        setNuevoTipoInput("");
      } catch (error) {
        console.error("Error al guardar categoría:", error);
      }
    }
  };

  const handleAdd = () => {
    setFormData({
      nombre: "", descripcion: "", precio: "",
      estado: "Activo", tipo: tiposServicio.length > 0 ? tiposServicio[0] : "", imagenUrl: ""
    });
    setFile(null); setPreview(null); setEditMode(false); setShowModal(true);
  };

  const handleEdit = (servicio) => {
    setFormData(servicio);
    setPreview(servicio.imagenUrl || null);
    setCurrentServicio(servicio.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.tipo) {
        alert("Por favor, selecciona o crea una categoría primero.");
        return;
    }
    try {
      let imageUrl = formData.imagenUrl;
      if (file) {
        const storageRef = ref(storage, `servicios/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }
      const dataToSave = { ...formData, precio: parseFloat(formData.precio) || 0, imagenUrl: imageUrl };
      if (editMode) {
        await updateDoc(doc(db, "servicios", currentServicio), dataToSave);
      } else {
        await addDoc(collection(db, "servicios"), dataToSave);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  // --- LÓGICA DE CONFIRMACIÓN DE ELIMINACIÓN ---
  const abrirConfirmacion = (id) => {
    setItemToDelete(id);
    setShowConfirm(true);
  };

  const ejecutarEliminacion = async () => {
    if (itemToDelete) {
      await deleteDoc(doc(db, "servicios", itemToDelete));
      setShowConfirm(false);
      setShowDetailsModal(false); // Cerramos también el modal de detalles
      setItemToDelete(null);
    }
  };

  const renderCards = (tipo) => {
    const filtrados = servicios.filter(s => s.tipo === tipo);
    if (filtrados.length === 0) return null;

    return (
      <section className="servicios-cards-section" key={tipo}>
        <h3 className="categoria-titulo">{tipo} ({filtrados.length})</h3>
        <div className="cards-grid">
          {filtrados.map(servicio => (
            <div className="producto-card" key={servicio.id} onClick={() => {
                setSelectedProduct(servicio);
                setShowDetailsModal(true);
            }}>
              <div className="card-image-container">
                {servicio.imagenUrl ? (
                  <img src={servicio.imagenUrl} alt={servicio.nombre} className="card-img" />
                ) : (
                  <div className="no-image">Sin imagen</div>
                )}
              </div>
              <div className="card-info">
                <h4 className="card-nombre">{servicio.nombre}</h4>
                <p className="card-precio">${servicio.precio.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

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
            <li><Link to="/configuracion">Configuración</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="profile"><span>CATÁLOGO PROSYSTEM</span></div>
        </header>

        <div className="servicios-container">
          <header className="servicios-header">
            <h1>Mis Servicios</h1>
            <button className="btn-agregar" onClick={handleAdd}>+ Nuevo Producto</button>
          </header>
          
          {servicios.length === 0 ? (
              <div className="empty-state">
                  <p>Aún no tienes productos. Haz clic en "+ Nuevo Producto" para empezar.</p>
              </div>
          ) : (
              tiposServicio.map(tipo => renderCards(tipo))
          )}
        </div>

        {/* MODAL FORMULARIO */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal modal-horizontal">
              <h2>{editMode ? "Editar" : "Nuevo"} Producto</h2>
              <div className="modal-content-grid">
                <div className="input-group">
                  <label>Nombre del Producto</label>
                  <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                </div>

                <div className="input-group">
                  <label>Categoría</label>
                  <div className="tipo-selection-group">
                    <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                      {tiposServicio.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="new-type-input">
                      <input type="text" placeholder="Nueva..." value={nuevoTipoInput} onChange={(e) => setNuevoTipoInput(e.target.value)} />
                      <button type="button" onClick={handleAddNewTipo}>Añadir</button>
                    </div>
                  </div>
                </div>

                <div className="input-group full-width">
                  <label>Descripción</label>
                  <textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
                </div>

                <div className="input-group">
                  <label>Precio ($)</label>
                  <input type="number" value={formData.precio} onChange={e => setFormData({ ...formData, precio: e.target.value })} />
                </div>

                <div className="input-group">
                  <label>Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label>Imagen</label>
                  <input type="file" onChange={handleFileChange} accept="image/*" />
                  {preview && <img src={preview} alt="preview" style={{width: '60px', marginTop: '10px', borderRadius: '5px'}} />}
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={handleSave} className="btn-guardar">Guardar</button>
                <button onClick={() => setShowModal(false)} className="btn-cancelar">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETALLES */}
        {showDetailsModal && selectedProduct && (
          <div className="modal-overlay">
            <div className="modal modal-horizontal detail-modal">
              <h2>Detalles del Producto</h2>
              <div className="detail-layout">
                <img src={selectedProduct.imagenUrl} alt="" className="detail-img-large" style={{width: '150px'}} />
                <div className="detail-info">
                  <h3>{selectedProduct.nombre}</h3>
                  <p><strong>Precio:</strong> ${selectedProduct.precio}</p>
                  <p><strong>Descripción:</strong> {selectedProduct.descripcion}</p>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-editar" onClick={() => { setShowDetailsModal(false); handleEdit(selectedProduct); }}>Editar</button>
                <button className="btn-eliminar" onClick={() => abrirConfirmacion(selectedProduct.id)}>Eliminar</button>
                <button onClick={() => setShowDetailsModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
        {showConfirm && (
          <div className="modal-overlay">
            <div className="modal-confirm">
              <div className="icon-warning">⚠️</div>
              <h3>¿Eliminar este producto?</h3>
              <p>Esta acción no se puede deshacer y el producto desaparecerá del catálogo.</p>
              <div className="confirm-actions">
                <button className="btn-cancelar" onClick={() => setShowConfirm(false)}>Cancelar</button>
                <button className="btn-confirm-delete" onClick={ejecutarEliminacion}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Servicios;