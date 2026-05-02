const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

const CANALES = ["Instagram", "Tienda Nube", "WhatsApp", "Otro"];
const ESTADOS = ["Cliente activo", "Cliente inactivo", "Carrito abandonado", "Consulta pendiente", "Prospecto"];
const TIPOS = ["Carrito abandonado", "Consulta IG", "Cliente dormido", "Seguidor", "Consulta WA"];
const STORAGE_KEY = "todo-basket-crm";
const STOCK_KEY = "todo-basket-stock";

const accent = "#2ea8e0";
const accentLight = "#b8e6f7";
const text = "#1a1a2e";
const textMuted = "#6b7280";
const pastelCard = "rgba(255,255,255,0.75)";

const S = {
  app: { minHeight: "100vh", background: "linear-gradient(135deg,#f0f4ff 0%,#e8f2ff 50%,#e0f4ff 100%)", fontFamily: "'DM Sans','Helvetica Neue',sans-serif", color: text },
  header: { padding: "28px 36px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" },
  logo: { fontFamily: "'DM Serif Display',Georgia,serif", fontSize: "26px", fontWeight: "400", letterSpacing: "-0.5px", color: text, margin: 0 },
  subtitle: { fontSize: "12px", color: textMuted, marginTop: "2px" },
  statsRow: { display: "flex", gap: "10px", flexWrap: "wrap", padding: "20px 36px 0" },
  stat: { background: pastelCard, backdropFilter: "blur(12px)", borderRadius: "12px", padding: "11px 18px", border: "1px solid rgba(46,168,224,0.15)", minWidth: "90px", textAlign: "center", cursor: "pointer" },
  statNum: { fontSize: "20px", fontWeight: "600", color: accent, display: "block", lineHeight: 1 },
  statLabel: { fontSize: "10px", color: textMuted, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" },
  toolbar: { display: "flex", gap: "9px", padding: "16px 36px", flexWrap: "wrap", alignItems: "center" },
  input: { background: "rgba(255,255,255,0.85)", border: "1px solid rgba(46,168,224,0.25)", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: text, outline: "none", fontFamily: "inherit" },
  select: { background: "rgba(255,255,255,0.85)", border: "1px solid rgba(46,168,224,0.25)", borderRadius: "8px", padding: "8px 28px 8px 12px", fontSize: "13px", color: text, outline: "none", fontFamily: "inherit", cursor: "pointer", appearance: "none" },
  btnPrimary: { background: accent, color: "#fff", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit" },
  btnSecondary: { background: "rgba(255,255,255,0.75)", color: accent, border: `1px solid ${accent}`, borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit" },
  btnCopy: { background: "rgba(46,168,224,0.1)", color: accent, border: `1px solid ${accent}`, borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit" },
  btnDanger: { background: "transparent", color: "#e74c3c", border: "none", padding: "4px 7px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", borderRadius: "6px" },
  tableWrap: { padding: "0 36px 40px", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 5px", minWidth: "850px" },
  th: { fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: textMuted, fontWeight: "500", padding: "0 12px 7px", textAlign: "left" },
  td: { padding: "11px 12px", fontSize: "12px", background: pastelCard, backdropFilter: "blur(10px)", border: "1px solid rgba(46,168,224,0.1)" },
  modal: { position: "fixed", inset: 0, background: "rgba(26,26,46,0.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" },
  modalBox: { background: "rgba(255,255,255,0.98)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(26,26,46,0.15)", border: "1px solid rgba(46,168,224,0.2)", maxHeight: "90vh", overflowY: "auto" },
  label: { fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: textMuted, fontWeight: "500", display: "block", marginBottom: "4px" },
  textarea: { background: "rgba(240,244,255,0.8)", border: "1px solid rgba(46,168,224,0.25)", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: text, outline: "none", fontFamily: "inherit", resize: "vertical", minHeight: "80px", width: "100%", boxSizing: "border-box" },
  badge: (estado) => {
    const c = { "Cliente activo": ["#d4edda","#2d6a4f"], "Cliente inactivo": ["#f0f0f0","#6c757d"], "Carrito abandonado": ["#ffe8d6","#d97706"], "Consulta pendiente": ["#d4e6ff","#0066cc"], "Prospecto": ["#f3e8ff","#7c3aed"] }[estado] || [accentLight, accent];
    return { display: "inline-block", background: c[0], color: c[1], borderRadius: "20px", padding: "2px 9px", fontSize: "10px", fontWeight: "500" };
  },
  dot: (canal) => ({ width: "7px", height: "7px", borderRadius: "50%", background: { Instagram: "#e1306c", "Tienda Nube": "#2ea8e0", WhatsApp: "#25d366", Otro: "#aaa" }[canal] || "#aaa", display: "inline-block", marginRight: "5px", flexShrink: 0 }),
};

const defaultForm = { nombre: "", email: "", telefono: "", canal: "Instagram", tipo: "Consulta IG", producto: "", precioCarrito: "", ultimoContacto: new Date().toISOString().split("T")[0], estado: "Prospecto", notas: "" };

function diasDesde(f) { return f ? Math.floor((Date.now() - new Date(f)) / 86400000) : null; }
function formatFecha(f) { if (!f) return "—"; const [y,m,d] = f.split("-"); return `${d}/${m}/${y}`; }
function parseFechaAR(f) { if (!f) return ""; if (f.includes("/")) { const [d,m,y] = f.split("/"); return y && m && d ? `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}` : ""; } return f; }

function parseCSV(text) {
  const lines = text.split("\n").filter(Boolean);
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.replace(/"/g,"").trim());
  return lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.replace(/"/g,"").trim());
    const obj = {};
    headers.forEach((h,i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
}

function parseStockCSV(text) {
  const lines = text.split("\n").filter(Boolean);
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.replace(/"/g,"").trim());
  const stock = {};
  
  lines.slice(1).forEach(line => {
    const vals = line.split(sep).map(v => v.replace(/"/g,"").trim());
    const obj = {};
    headers.forEach((h,i) => { obj[h] = vals[i] || ""; });
    
    const nombre = obj['Nombre'] || "";
    const talle = obj['Valor de propiedad 1'] || obj['Valor de propiedad 2'] || obj['Valor de propiedad 3'] || "";
    const stockVal = parseInt(obj['Stock'] || "0");
    
    if (nombre) {
      const key = talle ? `${nombre}|${talle}` : nombre;
      stock[key] = stockVal;
    }
  });
  
  return stock;
}

function mapTiendaNube(row) {
  const cantCompras = parseInt(row["Cantidad de compras"] || "0");
  const total = parseFloat((row["Total consumido (ARS)"] || "0").replace(",","."));
  const ultimaCompra = parseFechaAR(row["Última compra"]);
  const fechaRegistro = parseFechaAR(row["Fecha"] || row["Registrado"]);
  const compro = cantCompras > 0;
  let estado = compro ? "Cliente activo" : "Prospecto";
  let tipo = compro ? "Cliente dormido" : "Prospecto";
  if (compro && ultimaCompra && diasDesde(ultimaCompra) > 180) estado = "Cliente inactivo";
  
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    nombre: row["Nombre y Apellido"] || "",
    email: row["E-mail"] || "",
    telefono: row["Teléfono"] || "",
    canal: "Tienda Nube",
    tipo: tipo,
    producto: "",
    precioCarrito: total > 0 ? `$${Math.round(total).toLocaleString("es-AR")}` : "",
    ultimoContacto: ultimaCompra || fechaRegistro || new Date().toISOString().split("T")[0],
    estado,
    notas: `TN · ${cantCompras} compra${cantCompras!==1?"s":""}${total>0 ? ` · $${Math.round(total).toLocaleString("es-AR")}` : ""}`,
  };
}

function generarMensaje(contact, stock) {
  const nombre = contact.nombre;
  const producto = contact.producto || "producto";
  const precio = contact.precioCarrito;
  
  const tieneStock = stock && Object.keys(stock).some(k => 
    k.toLowerCase().includes(producto.toLowerCase()) && stock[k] > 0
  );
  
  switch(contact.tipo) {
    case "Carrito abandonado":
      return tieneStock 
        ? `Hola ${nombre}, ¿cómo estás? Vimos que dejaste el ${producto} en el carrito${precio ? ` (${precio})` : ""}. Tenemos stock disponible. ¿Querés que te lo apartemos? 🙌`
        : `Hola ${nombre}, ¿cómo estás? Vimos que te interesaba el ${producto}. Lamentablemente se nos agotó, pero tenemos llegada esta semana. ¿Te aviso cuando llega?`;
    
    case "Consulta IG":
      return tieneStock
        ? `Hola ${nombre}! 👋 Te preguntaste por el ${producto}. ¡Buenas noticias! Tenemos stock disponible. ¿Te doy info sin compromiso?`
        : `Hola ${nombre}! Te preguntaste por el ${producto}. Se nos agotó, pero tengo alternativas similares. ¿Te interesa verlas?`;
    
    case "Cliente dormido":
      return `Hola ${nombre}, ¿cómo va? Hace un tiempo que no sabemos nada de vos. Tenemos llegadas nuevas de zapatillas y ropa. ¿Entramos a revisar? 🔥`;
    
    case "Seguidor":
      return `Hola ${nombre}, ¿cómo estás? Vi que seguís nuestro perfil. ¿Hay algo específico que andes buscando? Podemos ayudarte a encontrarlo.`;
    
    case "Consulta WA":
      return tieneStock
        ? `Hola ${nombre}, buenas! Volvemos a tu consulta sobre el ${producto}. ¡Tenemos stock! ¿Te interesa que te pase info?`
        : `Hola ${nombre}, volvemos a tu consulta sobre el ${producto}. Se nos agotó, pero tenemos llegada esta semana. ¿Te aviso?`;
    
    default:
      return `Hola ${nombre}! ¿Cómo estás?`;
  }
}

function TodoBasketCRM() {
  const [contacts, setContacts] = useState([]);
  const [stock, setStock] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showImportTN, setShowImportTN] = useState(false);
  const [showImportWA, setShowImportWA] = useState(false);
  const [showImportStock, setShowImportStock] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [filterCanal, setFilterCanal] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [messageModal, setMessageModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const PER_PAGE = 25;
  const fileRef = useRef();
  const fileTNRef = useRef();
  const fileStockRef = useRef();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedStock = localStorage.getItem(STOCK_KEY);
    if (stored) setContacts(JSON.parse(stored));
    if (storedStock) setStock(JSON.parse(storedStock));
    setLoading(false);
  }, []);

  const save = (c) => {
    setContacts(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  };

  const saveStock = (s) => {
    setStock(s);
    localStorage.setItem(STOCK_KEY, JSON.stringify(s));
  };

  const handleFileTN = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        const mapped = rows.filter(r => r["Nombre y Apellido"]).map(mapTiendaNube);
        const existingEmails = new Set(contacts.map(c => c.email).filter(Boolean));
        const nuevos = mapped.filter(m => !existingEmails.has(m.email));
        const duplicados = mapped.length - nuevos.length;
        save([...contacts, ...nuevos]);
        setImportResult({ total: mapped.length, nuevos: nuevos.length, duplicados });
      } catch(err) { alert("Error leyendo el archivo."); }
    };
    reader.readAsText(file, "ISO-8859-1");
  };

  const handleFileStock = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedStock = parseStockCSV(e.target.result);
        saveStock(parsedStock);
        const totalProducts = Object.keys(parsedStock).length;
        setImportResult({ stock: totalProducts });
      } catch(err) { alert("Error leyendo el archivo de stock."); }
    };
    reader.readAsText(file, "cp1250");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filtered = contacts.filter(c => {
    const mc = filterCanal === "Todos" || c.canal === filterCanal;
    const me = filterEstado === "Todos" || c.estado === filterEstado;
    const ms = !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || (c.producto||"").toLowerCase().includes(search.toLowerCase());
    return mc && me && ms;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const stats = {
    total: contacts.length,
    abandonados: contacts.filter(c=>c.estado==="Carrito abandonado").length,
    pendientes: contacts.filter(c=>c.estado==="Consulta pendiente").length,
    inactivos: contacts.filter(c=>c.estado==="Cliente inactivo").length,
  };

  if (loading) return React.createElement("div", { style: {...S.app, display:"flex", alignItems:"center", justifyContent:"center"}}, React.createElement("p", { style: {color:textMuted}}, "Cargando..."));

  return React.createElement("div", { style: S.app },
    React.createElement("div", { style: S.header },
      React.createElement("div", null,
        React.createElement("h1", { style: S.logo }, "TODO BASKET CRM"),
        React.createElement("p", { style: S.subtitle }, "Recuperar carritos, cerrar consultas, reactivar clientes")
      ),
      React.createElement("div", { style: {display:"flex", gap:"6px", flexWrap:"wrap"}},
        React.createElement("button", { style: S.btnSecondary, onClick: () => { setImportResult(null); setShowImportTN(true); }}, "↑ CSV"),
        React.createElement("button", { style: S.btnSecondary, onClick: () => { setImportResult(null); setShowImportStock(true); }}, "📊 Stock"),
        React.createElement("button", { style: S.btnPrimary, onClick: () => { setForm(defaultForm); setEditId(null); setShowModal(true); }}, "+ Contacto")
      )
    ),
    React.createElement("div", { style: S.statsRow },
      [["total","Total"],["abandonados","Carritos"],["pendientes","Consultas"],["inactivos","Inactivos"]].map(([k,l]) =>
        React.createElement("div", { key: k, style: {...S.stat, cursor: k!=="total"?"pointer":"default"}, onClick: () => k!=="total" && (setFilterEstado(k==="abandonados"?"Carrito abandonado":k==="pendientes"?"Consulta pendiente":"Cliente inactivo"), setPage(1))},
          React.createElement("span", { style: S.statNum }, stats[k]),
          React.createElement("span", { style: S.statLabel }, l)
        )
      )
    ),
    React.createElement("div", { style: S.toolbar },
      React.createElement("input", { style: {...S.input, width:"190px"}, placeholder: "Buscar nombre, producto...", value: search, onChange: e => {setSearch(e.target.value); setPage(1);}}),
      React.createElement("div", { style: {position:"relative"}},
        React.createElement("select", { style: S.select, value: filterCanal, onChange: e => {setFilterCanal(e.target.value); setPage(1);}},
          React.createElement("option", null, "Todos los canales"),
          CANALES.map(c => React.createElement("option", { key: c}, c))
        ),
        React.createElement("span", { style: {position:"absolute", right:"9px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:textMuted, fontSize:"9px"}}, "▼")
      ),
      React.createElement("div", { style: {position:"relative"}},
        React.createElement("select", { style: {...S.select, ...(filterEstado!=="Todos"?{background:accentLight, borderColor:accent, color:accent}:{})}, value: filterEstado, onChange: e => {setFilterEstado(e.target.value); setPage(1);}},
          React.createElement("option", null, "Todos los estados"),
          ESTADOS.map(e => React.createElement("option", { key: e}, e))
        ),
        React.createElement("span", { style: {position:"absolute", right:"9px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", fontSize:"9px", color:filterEstado!=="Todos"?accent:textMuted}}, "▼")
      ),
      (filterCanal!=="Todos"||filterEstado!=="Todos"||search) && React.createElement("button", { style: {...S.btnSecondary, fontSize:"11px"}, onClick: () => {setFilterCanal("Todos"); setFilterEstado("Todos"); setSearch(""); setPage(1);}}, "Limpiar")
    ),
    React.createElement("div", { style: S.tableWrap },
      filtered.length === 0 ? 
        React.createElement("div", { style: {textAlign:"center", padding:"40px", color:textMuted, fontSize:"14px"}},
          contacts.length===0 ? "Sin contactos. Importá clientes con el botón ↑ CSV." : "Sin resultados."
        )
      :
        React.createElement(React.Fragment, null,
          React.createElement("table", { style: S.table },
            React.createElement("thead", null,
              React.createElement("tr", null,
                ["Nombre","Tipo","Producto","Precio","Canal","Último contacto","Estado","Mensaje",""].map(h =>
                  React.createElement("th", { key: h, style: S.th}, h)
                )
              )
            ),
            React.createElement("tbody", null,
              paginated.map(c => {
                const dias = diasDesde(c.ultimoContacto);
                return React.createElement("tr", { key: c.id },
                  React.createElement("td", { style: {...S.td, borderRadius:"9px 0 0 9px", borderRight:"none", fontWeight:"500"}}, c.nombre),
                  React.createElement("td", { style: {...S.td, borderRadius:0, borderLeft:"none", borderRight:"none", fontSize:"11px", color:accent, fontWeight:"500"}}, c.tipo),
                  React.createElement("td", { style: {...S.td, borderRadius:0, borderLeft:"none", borderRight:"none", fontSize:"11px", color:textMuted, maxWidth:"120px", overflow:"hidden", textOverflow:"ellipsis"}}, c.producto||"—"),
                  React.createElement("td", { style: {...S.td, borderRadius:0, borderLeft:"none", borderRight:"none", fontSize:"11px", color:textMuted}}, c.precioCarrito||"—"),
                  React.createElement("td", { style: {...S.td, borderRadius:0, borderLeft:"none", borderRight:"none"}},
                    React.createElement("span", { style: {display:"inline-flex", alignItems:"center"}},
                      React.createElement("span", { style: S.dot(c.canal)}),
                      c.canal
                    )
                  ),
                  React.createElement("td", { style: {...S.td, borderRadius:0, borderLeft:"none", borderRight:"none", fontSize:"11px"}},
                    formatFecha(c.ultimoContacto),
                    dias && dias>7 && React.createElement("span", { style: {marginLeft:"5px", color:"#d97706", fontWeight:"500"}}, `(${dias}d)`)
                  ),
                  React.createElement("td", { style: {...S.td, borderRadius:0, borderLeft:"none", borderRight:"none"}},
                    React.createElement("span", { style: S.badge(c.estado)}, c.estado)
                  ),
                  React.createElement("td", { style: {...S.td, borderRadius:0, borderLeft:"none", borderRight:"none", whiteSpace:"nowrap"}},
                    React.createElement("button", { style: S.btnCopy, onClick: () => setMessageModal(c)}, "Ver msg")
                  ),
                  React.createElement("td", { style: {...S.td, borderRadius:"0 9px 9px 0", borderLeft:"none", whiteSpace:"nowrap"}},
                    React.createElement("button", { style: {...S.btnSecondary, fontSize:"11px", padding:"4px 9px"}, onClick: () => {setForm({...c}); setEditId(c.id); setShowModal(true);}}, "Ed"),
                    React.createElement("button", { style: S.btnDanger, onClick: () => {if(window.confirm("¿Eliminar?")) save(contacts.filter(x => x.id !== c.id));}}, "✕")
                  )
                );
              })
            )
          ),
          totalPages > 1 && React.createElement("div", { style: {display:"flex", gap:"6px", justifyContent:"center", marginTop:"16px", alignItems:"center"}},
            React.createElement("button", { style: {...S.btnSecondary, fontSize:"11px", padding:"5px 10px"}, disabled: page===1, onClick: () => setPage(p=>p-1)}, "← Ant"),
            React.createElement("span", { style: {fontSize:"12px", color:textMuted}}, `${page} / ${totalPages}`),
            React.createElement("button", { style: {...S.btnSecondary, fontSize:"11px", padding:"5px 10px"}, disabled: page===totalPages, onClick: () => setPage(p=>p+1)}, "Sig →")
          )
        )
    ),
    showImportTN && React.createElement("div", { style: S.modal, onClick: e => e.target===e.currentTarget && setShowImportTN(false)},
      React.createElement("div", { style: {...S.modalBox, maxWidth:"420px"}},
        React.createElement("h2", { style: {fontSize:"16px", fontWeight:"600", marginBottom:"6px"}}, "Importar Clientes Tienda Nube"),
        React.createElement("p", { style: {fontSize:"12px", color:textMuted, marginBottom:"18px"}}, "Cargá el CSV de clientes desde tu admin de Tienda Nube."),
        React.createElement("input", { type: "file", accept: ".csv", ref: fileTNRef, style: {display:"none"}, onChange: e => handleFileTN(e.target.files[0])}),
        React.createElement("div", { style: {border: `2px dashed ${dragOver?accent:"rgba(46,168,224,0.4)"}`, borderRadius:"12px", padding:"28px 20px", textAlign:"center", cursor:"pointer", background: dragOver?accentLight:"rgba(255,255,255,0.5)", transition:"all 0.2s"}, onClick: () => fileTNRef.current?.click(), onDragOver: e => {e.preventDefault(); setDragOver(true);}, onDragLeave: () => setDragOver(false), onDrop: e => {e.preventDefault(); setDragOver(false); handleFileTN(e.dataTransfer.files[0]);}},
          React.createElement("div", { style: {fontSize:"28px", marginBottom:"6px"}}, "📂"),
          React.createElement("div", { style: {fontSize:"13px", fontWeight:"500", color:accent}}, "Arrastrá el CSV"),
          React.createElement("div", { style: {fontSize:"11px", color:textMuted, marginTop:"3px"}}, "o hacé click")
        ),
        importResult && React.createElement("div", { style: {marginTop:"14px", background:"rgba(212,237,218,0.5)", border:"1px solid rgba(45,106,79,0.2)", borderRadius:"10px", padding:"12px 14px", fontSize:"12px"}},
          React.createElement("div", { style: {fontWeight:"600", color:"#2d6a4f", marginBottom:"4px"}}, "✓ Listo"),
          React.createElement("div", null, `📥 ${importResult.nuevos} nuevos cargados`),
          importResult.duplicados>0 && React.createElement("div", { style: {color:textMuted}}, `⟳ ${importResult.duplicados} existían ya`)
        ),
        React.createElement("div", { style: {display:"flex", justifyContent:"flex-end", marginTop:"16px"}},
          React.createElement("button", { style: S.btnSecondary, onClick: () => setShowImportTN(false)}, "Cerrar")
        )
      )
    ),
    showImportStock && React.createElement("div", { style: S.modal, onClick: e => e.target===e.currentTarget && setShowImportStock(false)},
      React.createElement("div", { style: {...S.modalBox, maxWidth:"420px"}},
        React.createElement("h2", { style: {fontSize:"16px", fontWeight:"600", marginBottom:"6px"}}, "Actualizar Stock Semanal"),
        React.createElement("p", { style: {fontSize:"12px", color:textMuted, marginBottom:"18px"}}, "Cargá el CSV de stock que exportás de Tienda Nube. Los mensajes se adaptarán automáticamente."),
        React.createElement("input", { type: "file", accept: ".csv", ref: fileStockRef, style: {display:"none"}, onChange: e => handleFileStock(e.target.files[0])}),
        React.createElement("div", { style: {border: `2px dashed ${dragOver?accent:"rgba(46,168,224,0.4)"}`, borderRadius:"12px", padding:"28px 20px", textAlign:"center", cursor:"pointer", background: dragOver?accentLight:"rgba(255,255,255,0.5)", transition:"all 0.2s"}, onClick: () => fileStockRef.current?.click(), onDragOver: e => {e.preventDefault(); setDragOver(true);}, onDragLeave: () => setDragOver(false), onDrop: e => {e.preventDefault(); setDragOver(false); handleFileStock(e.dataTransfer.files[0]);}},
          React.createElement("div", { style: {fontSize:"28px", marginBottom:"6px"}}, "📊"),
          React.createElement("div", { style: {fontSize:"13px", fontWeight:"500", color:accent}}, "Arrastrá el CSV de stock"),
          React.createElement("div", { style: {fontSize:"11px", color:textMuted, marginTop:"3px"}}, "o hacé click")
        ),
        importResult?.stock && React.createElement("div", { style: {marginTop:"14px", background:"rgba(212,237,218,0.5)", border:"1px solid rgba(45,106,79,0.2)", borderRadius:"10px", padding:"12px 14px", fontSize:"12px"}},
          React.createElement("div", { style: {fontWeight:"600", color:"#2d6a4f", marginBottom:"4px"}}, "✓ Stock actualizado"),
          React.createElement("div", null, `📦 ${importResult.stock} productos cargados`)
        ),
        React.createElement("div", { style: {display:"flex", justifyContent:"flex-end", marginTop:"16px"}},
          React.createElement("button", { style: S.btnSecondary, onClick: () => setShowImportStock(false)}, "Cerrar")
        )
      )
    ),
    messageModal && React.createElement("div", { style: S.modal, onClick: e => e.target===e.currentTarget && setMessageModal(null)},
      React.createElement("div", { style: {...S.modalBox, maxWidth:"480px"}},
        React.createElement("h2", { style: {fontSize:"16px", fontWeight:"600", marginBottom:"4px"}}, messageModal.nombre),
        React.createElement("p", { style: {fontSize:"11px", color:textMuted, marginBottom:"16px", textTransform:"uppercase", letterSpacing:"0.06em"}}, `${messageModal.tipo} · ${messageModal.canal}`),
        React.createElement("div", { style: {background:"rgba(240,244,255,0.8)", border: `1px solid ${accent}`, borderRadius:"10px", padding:"16px", marginBottom:"16px", fontSize:"13px", lineHeight:"1.5", color:text}},
          generarMensaje(messageModal, stock)
        ),
        React.createElement("div", { style: {display:"flex", gap:"8px"}},
          React.createElement("button", { style: {...S.btnCopy, flex:1}, onClick: () => {copyToClipboard(generarMensaje(messageModal, stock)); setMessageModal(null);}},
            copied ? "✓ Copiado" : "📋 Copiar"
          ),
          React.createElement("button", { style: {...S.btnSecondary, flex:1}, onClick: () => setMessageModal(null)}, "Cerrar")
        )
      )
    ),
    showModal && React.createElement("div", { style: S.modal, onClick: e => e.target===e.currentTarget && setShowModal(false)},
      React.createElement("div", { style: S.modalBox},
        React.createElement("h2", { style: {fontSize:"17px", fontWeight:"600", marginBottom:"18px"}}, editId ? "Editar contacto" : "Nuevo contacto"),
        React.createElement("div", { style: {display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px"}},
          React.createElement("div", { style: {gridColumn:"1/-1"}},
            React.createElement("label", { style: S.label}, "Nombre *"),
            React.createElement("input", { style: {...S.input, width:"100%", boxSizing:"border-box", background:"rgba(240,244,255,0.8)"}, value: form.nombre, onChange: e => setForm({...form, nombre: e.target.value}), placeholder: "Nombre del cliente"})
          ),
          React.createElement("div", null,
            React.createElement("label", { style: S.label}, "Email"),
            React.createElement("input", { style: {...S.input, width:"100%", boxSizing:"border-box", background:"rgba(240,244,255,0.8)"}, type: "email", value: form.email, onChange: e => setForm({...form, email: e.target.value}), placeholder: "correo@ejemplo.com"})
          ),
          React.createElement("div", null,
            React.createElement("label", { style: S.label}, "Teléfono"),
            React.createElement("input", { style: {...S.input, width:"100%", boxSizing:"border-box", background:"rgba(240,244,255,0.8)"}, value: form.telefono, onChange: e => setForm({...form, telefono: e.target.value}), placeholder: "+54..."})
          ),
          React.createElement("div", null,
            React.createElement("label", { style: S.label}, "Canal"),
            React.createElement("select", { style: {...S.select, width:"100%", background:"rgba(240,244,255,0.8)"}, value: form.canal, onChange: e => setForm({...form, canal: e.target.value})},
              CANALES.map(c => React.createElement("option", { key: c}, c))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: S.label}, "Tipo de contacto *"),
            React.createElement("select", { style: {...S.select, width:"100%", background:"rgba(240,244,255,0.8)"}, value: form.tipo, onChange: e => setForm({...form, tipo: e.target.value})},
              TIPOS.map(t => React.createElement("option", { key: t}, t))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: S.label}, "Estado"),
            React.createElement("select", { style: {...S.select, width:"100%", background:"rgba(240,244,255,0.8)"}, value: form.estado, onChange: e => setForm({...form, estado: e.target.value})},
              ESTADOS.map(e => React.createElement("option", { key: e}, e))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: S.label}, "Producto"),
            React.createElement("input", { style: {...S.input, width:"100%", boxSizing:"border-box", background:"rgba(240,244,255,0.8)"}, value: form.producto, onChange: e => setForm({...form, producto: e.target.value}), placeholder: "Ej: Nike Ja Morant 1"})
          ),
          React.createElement("div", null,
            React.createElement("label", { style: S.label}, "Precio / Monto"),
            React.createElement("input", { style: {...S.input, width:"100%", boxSizing:"border-box", background:"rgba(240,244,255,0.8)"}, value: form.precioCarrito, onChange: e => setForm({...form, precioCarrito: e.target.value}), placeholder: "Ej: $89.999"})
          ),
          React.createElement("div", null,
            React.createElement("label", { style: S.label}, "Último contacto"),
            React.createElement("input", { type: "date", style: {...S.input, width:"100%", boxSizing:"border-box", background:"rgba(240,244,255,0.8)"}, value: form.ultimoContacto, onChange: e => setForm({...form, ultimoContacto: e.target.value})})
          ),
          React.createElement("div", { style: {gridColumn:"1/-1"}},
            React.createElement("label", { style: S.label}, "Notas"),
            React.createElement("textarea", { style: S.textarea, value: form.notas, onChange: e => setForm({...form, notas: e.target.value}), placeholder: "Detalles: qué preguntó, contexto..."})
          )
        ),
        React.createElement("div", { style: {display:"flex", justifyContent:"flex-end", gap:"8px", marginTop:"18px"}},
          React.createElement("button", { style: S.btnSecondary, onClick: () => setShowModal(false)}, "Cancelar"),
          React.createElement("button", { style: S.btnPrimary, onClick: () => {
            if (!form.nombre.trim()) return;
            if (editId) save(contacts.map(c => c.id === editId ? {...form, id: editId} : c));
            else save([...contacts, {...form, id: Date.now().toString()}]);
            setShowModal(false);
          }}, editId ? "Guardar" : "Agregar")
        )
      )
    )
  );
}

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(TodoBasketCRM));
