import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Cotizaciones.css";
import logoProsystem from "../assets/logo_prosystem.png";
import { db } from "../firebaseConfig";
import { 
  collection, getDocs, addDoc, deleteDoc, doc, 
  query, where, updateDoc, getDoc, onSnapshot 
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Cotizaciones = () => {
  // --- ESTADOS DE DATOS ---
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientesBase, setClientesBase] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [categoriasDinamicas, setCategoriasDinamicas] = useState([]);
  
  // --- ESTADOS DE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- ESTADOS DE CONFIRMACIÓN (BORRADO) ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState({
    cliente: "",
    servicio: "",
    productosSeleccionados: [],
    manoDeObra: ""
  });

  // 1. CARGA INICIAL Y TIEMPO REAL
  useEffect(() => {
    fetchData();

    // Sincronizar categorías desde la pantalla de Servicios
    const unsubCategorias = onSnapshot(collection(db, "categorias"), (snap) => {
      setCategoriasDinamicas(snap.docs.map(doc => doc.data().nombre));
    });

    // Sincronizar cotizaciones para ver cambios de otros usuarios
    const unsubCotizaciones = onSnapshot(collection(db, "cotizaciones"), (snap) => {
      setCotizaciones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCategorias();
      unsubCotizaciones();
    };
  }, []);

  const fetchData = async () => {
    try {
      const snapCli = await getDocs(collection(db, "clientes"));
      setClientesBase(snapCli.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("Error al obtener clientes:", error); }
  };

  // 2. BUSCAR PRODUCTOS SEGÚN CATEGORÍA SELECCIONADA
  useEffect(() => {
    const fetchProductos = async () => {
      if (formData.servicio) {
        const q = query(collection(db, "servicios"), where("tipo", "==", formData.servicio));
        const snapProd = await getDocs(q);
        setProductosDisponibles(snapProd.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };
    fetchProductos();
  }, [formData.servicio]);

  // --- LÓGICA DE FILTRADO (BUSCADOR) ---
  const cotizacionesFiltradas = cotizaciones.filter((cot) =>
    cot.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LÓGICA DE BORRADO CON MODAL ---
  const abrirConfirmacion = (id) => {
    setItemToDelete(id);
    setShowConfirm(true);
  };

  const confirmarBorrado = async () => {
    if (itemToDelete) {
      await deleteDoc(doc(db, "cotizaciones", itemToDelete));
      setShowConfirm(false);
      setItemToDelete(null);
    }
  };

  // --- PROCESAMIENTO DE IMÁGENES PARA PDF ---
  const getBase64Image = (url) => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.src = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve(null);
    });
  };

  const agregarProductoLista = (productoNombre) => {
    const prodInfo = productosDisponibles.find(p => p.nombre === productoNombre);
    if (!prodInfo) return;
    setFormData({
      ...formData,
      productosSeleccionados: [...formData.productosSeleccionados, {
        nombre: prodInfo.nombre,
        precio: parseFloat(prodInfo.precio || 0),
        cantidad: 1,
        imagenUrl: prodInfo.imagenUrl || ""
      }]
    });
  };

  const calcularTotal = () => {
    const sub = formData.productosSeleccionados.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    return sub + (parseFloat(formData.manoDeObra) || 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const data = { ...formData, total: calcularTotal(), fecha: new Date().toLocaleDateString() };
    if (editingId) await updateDoc(doc(db, "cotizaciones", editingId), data);
    else await addDoc(collection(db, "cotizaciones"), data);
    cerrarModal();
  };

  const handleEditOpen = (cot) => {
    setEditingId(cot.id);
    setFormData({
      cliente: cot.cliente || "",
      servicio: cot.servicio || "",
      productosSeleccionados: cot.productosSeleccionados || [],
      manoDeObra: cot.manoDeObra || ""
    });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false); setEditingId(null);
    setFormData({ cliente: "", servicio: "", productosSeleccionados: [], manoDeObra: "" });
  };

  // --- GENERADOR DE PDF PROFESIONAL ---
  const generarPDF = async (c) => {
    setIsGenerating(true);
    let configEmpresa = {
      nombreEmpresa: "PROSYSTEM Technologies",
      rfc: "", direccion: "", telefono: "", email: "",
      garantia: "Garantía estándar de 1 año."
    };

    try {
      const configDoc = await getDoc(doc(db, "configuracion", "empresa"));
      if (configDoc.exists()) configEmpresa = configDoc.data();
    } catch (e) { console.error(e); }

    const docPdf = new jsPDF();
    const azulClaro = [135, 206, 235]; 

    docPdf.setFillColor(azulClaro[0], azulClaro[1], azulClaro[2]);
    docPdf.rect(0, 0, 5, 297, 'F'); 
    docPdf.addImage(logoProsystem, 'PNG', 15, 15, 30, 18);

    docPdf.setFontSize(9);
    docPdf.setTextColor(80);
    docPdf.text(configEmpresa.nombreEmpresa, 195, 20, { align: "right" });
    docPdf.text(configEmpresa.direccion, 195, 25, { align: "right" });
    docPdf.text(`Tel: ${configEmpresa.telefono} | ${configEmpresa.email}`, 195, 30, { align: "right" });
    docPdf.text(`RFC: ${configEmpresa.rfc}`, 195, 35, { align: "right" });

    docPdf.setFontSize(22);
    docPdf.setTextColor(azulClaro[0], azulClaro[1], azulClaro[2]);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("COTIZACIÓN", 15, 45);
    docPdf.setDrawColor(azulClaro[0], azulClaro[1], azulClaro[2]);
    docPdf.setLineWidth(1);
    docPdf.line(15, 48, 60, 48);

    docPdf.setFontSize(10);
    docPdf.setTextColor(0);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("PREPARADO PARA:", 15, 60);
    docPdf.text("DETALLES:", 130, 60);

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(60);
    docPdf.text(c.cliente, 15, 66);
    docPdf.text(`Servicio: ${c.servicio}`, 15, 71);
    docPdf.text(`Folio: #COT-${c.fecha.replace(/\//g, '')}`, 130, 66);
    docPdf.text(`Fecha: ${c.fecha}`, 130, 71);

    const imagesCache = await Promise.all((c.productosSeleccionados || []).map(async (p) => {
      return p.imagenUrl ? await getBase64Image(p.imagenUrl) : null;
    }));

    const body = (c.productosSeleccionados || []).map((p, i) => [
      "", p.nombre, p.cantidad, `$${p.precio.toFixed(2)}`, `$${(p.cantidad * p.precio).toFixed(2)}`
    ]);

    body.push(["", "Mano de Obra Especializada", "1", `$${parseFloat(c.manoDeObra || 0).toFixed(2)}`, `$${parseFloat(c.manoDeObra || 0).toFixed(2)}`]);

    autoTable(docPdf, {
      startY: 80,
      head: [['VISTA', 'DESCRIPCIÓN', 'CANT.', 'PRECIO', 'SUBTOTAL']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: azulClaro, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 9, cellPadding: 4, minCellHeight: 25, verticalAlign: 'middle' },
      columnStyles: { 0: { cellWidth: 25 }, 4: { halign: 'right', fontStyle: 'bold' } },
      didDrawCell: (data) => {
        if (data.column.index === 0 && data.cell.section === 'body') {
          const img = imagesCache[data.row.index];
          if (img) docPdf.addImage(img, 'JPEG', data.cell.x + 2, data.cell.y + 2, 21, 21);
        }
      }
    });

    const finalY = docPdf.lastAutoTable.finalY + 10;
    docPdf.setFillColor(azulClaro[0], azulClaro[1], azulClaro[2]);
    docPdf.rect(140, finalY, 55, 12, 'F');
    docPdf.setTextColor(255);
    docPdf.text(`TOTAL: $${c.total?.toLocaleString()}`, 192, finalY + 8, { align: "right" });

    docPdf.save(`Cotizacion_${c.cliente}.pdf`);
    setIsGenerating(false);
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
            <li><Link to="/reportes">Reportes</Link></li>
            <li><Link to="/seguimiento">Seguimiento</Link></li>
            <li><Link to="/configuracion">Configuración</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="profile"><span>{isGenerating ? "GENERANDO ARCHIVO..." : "PANEL DE COTIZACIONES"}</span></div>
        </header>

        <div className="cotizaciones-container">
          <div className="header-actions">
            <h1>Cotizaciones</h1>
            <div className="search-container">
              <input 
                type="text" 
                placeholder="🔍 Buscar cliente..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-open-modal" onClick={() => setIsModalOpen(true)}>+ Nueva</button>
          </div>

          <table className="cotizaciones-table">
            <thead>
              <tr><th>Cliente</th><th>Categoría</th><th>Monto</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {cotizacionesFiltradas.map(c => (
                <tr key={c.id}>
                  <td>{c.cliente}</td>
                  <td>{c.servicio}</td>
                  <td>${c.total?.toLocaleString()}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn-edit" onClick={() => handleEditOpen(c)}>Editar</button>
                      <button className="btn-pdf" onClick={() => generarPDF(c)}>PDF</button>
                      <button className="btn-eliminar" onClick={() => abrirConfirmacion(c.id)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- MODAL DE FORMULARIO --- */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{editingId ? "Editar" : "Nueva"} Cotización</h2>
              <form onSubmit={handleSave}>
                <label>Cliente</label>
                <select value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} required>
                  <option value="">Seleccione...</option>
                  {clientesBase.map(cli => <option key={cli.id} value={cli.nombre}>{cli.nombre}</option>)}
                </select>

                <label>Categoría</label>
                <select value={formData.servicio} onChange={e => setFormData({...formData, servicio: e.target.value, productosSeleccionados: []})} required>
                  <option value="">Seleccione...</option>
                  {categoriasDinamicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <label>Producto</label>
                <select onChange={e => agregarProductoLista(e.target.value)} value="" disabled={!formData.servicio}>
                  <option value="">-- Seleccionar --</option>
                  {productosDisponibles.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>

                <div className="lista-productos-temporal">
                  {formData.productosSeleccionados.map((p, i) => (
                    <div key={i} className="producto-item-row">
                      <span>{p.nombre}</span>
                      <div className="item-controls">
                        <input type="number" min="1" value={p.cantidad} onChange={e => {
                          const n = [...formData.productosSeleccionados];
                          n[i].cantidad = parseInt(e.target.value) || 1;
                          setFormData({...formData, productosSeleccionados: n});
                        }} />
                        <button type="button" className="btn-remove-item" onClick={() => setFormData({...formData, productosSeleccionados: formData.productosSeleccionados.filter((_, idx) => idx !== i)})}>x</button>
                      </div>
                    </div>
                  ))}
                </div>

                <label>Mano de Obra ($)</label>
                <input type="number" value={formData.manoDeObra} onChange={e => setFormData({...formData, manoDeObra: e.target.value})} required />
                <div className="total-preview">Total: ${calcularTotal().toLocaleString()}</div>

                <div className="modal-buttons">
                  <button type="button" className="btn-cancelar" onClick={cerrarModal}>Cerrar</button>
                  <button type="submit" className="btn-guardar">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL DE CONFIRMACIÓN DE BORRADO --- */}
        {showConfirm && (
          <div className="modal-overlay">
            <div className="modal-confirm">
              <div className="icon-warning">⚠️</div>
              <h3>¿Eliminar cotización?</h3>
              <p>Esta acción no se puede deshacer.</p>
              <div className="confirm-actions">
                <button className="btn-cancelar" onClick={() => setShowConfirm(false)}>Cancelar</button>
                <button className="btn-confirm-delete" onClick={confirmarBorrado}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cotizaciones;