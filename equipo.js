/* ════════════════════════════════════════════════════════════
   FICHA DE EQUIPO · cbis  —  PÁGINA PÚBLICA (destino del QR)
   Cualquiera puede ver la ficha al escanear el código.
   Editar o eliminar requiere una sesión de administrador.
   ════════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence }
  from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc, updateDoc }
  from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { NIVELES, crearVisorPlano, montarPestanasNiveles, textoUbicacion }
  from "./plano-equipos.js?v=20260924c"; // ← sube este número cada vez que cambie plano-equipos.js: los navegadores cachean agresivamente los módulos ES y si no, se sigue viendo la versión vieja aunque el archivo ya se haya actualizado en el servidor

/* Misma configuración de Firebase que el resto del sitio */
const firebaseConfig = {
  apiKey: "AIzaSyCyDCn87fbRJpLRixd-1utjc-TIzUU3wOk",
  authDomain: "cbis-inventario.firebaseapp.com",
  projectId: "cbis-inventario",
  storageBucket: "cbis-inventario.firebasestorage.app",
  messagingSenderId: "442600862426",
  appId: "1:442600862426:web:399c935e05112d3bf7ebe3"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fdb  = getFirestore(app);
const col  = collection(fdb, "equipos");

const $ = s => document.querySelector(s);
const ESTADOS = { activo:"Activo", mantenimiento:"En Mantenimiento", baja:"De Baja" };

let equipoActual = null;
let fotosFicha   = [];
let esAdmin      = false;
let visorFicha   = null;
let fichaMapaBorrador = null;

/* ═══════════════════════════════════════════════════════════════
   ARRANQUE: ¿llegamos con un código en el enlace?
   ═══════════════════════════════════════════════════════════════ */
const params = new URLSearchParams(location.search);
const codigoInicial = (params.get("codigo") || "").trim();

if(codigoInicial) buscarYRenderizar(codigoInicial);
else mostrarBusqueda();

/* ═══════════════════════════════════════════════════════════════
   BÚSQUEDA EN FIRESTORE
   ═══════════════════════════════════════════════════════════════ */
async function buscarPorCodigoExacto(codigo){
  const snap = await getDocs(query(col, where("codigo","==",codigo)));
  if(snap.empty) return null;
  const d = snap.docs[0];
  return { id:d.id, ...d.data() };
}

/* Reintento flexible (mayúsculas/minúsculas) por si el enlace se escribió a mano */
async function buscarPorCodigoFlexible(codigo){
  const c = codigo.trim().toLowerCase();
  const snap = await getDocs(col);
  const encontrado = snap.docs.find(d => ((d.data().codigo)||"").toLowerCase() === c);
  return encontrado ? { id:encontrado.id, ...encontrado.data() } : null;
}

async function buscarYRenderizar(codigo){
  ocultarTodo();
  $("#estado-carga").hidden = false;

  try{
    let eq = await buscarPorCodigoExacto(codigo);
    if(!eq) eq = await buscarPorCodigoFlexible(codigo);

    $("#estado-carga").hidden = true;
    if(!eq){ mostrarNoEncontrado(codigo); return; }

    equipoActual = eq;
    history.replaceState(null, "", `equipo.html?codigo=${encodeURIComponent(eq.codigo)}`);
    /* La ficha debe quedar visible ANTES de pintarla: el plano de
       ubicación mide su propio tamaño en pantalla (para el paneo y
       el zoom) y con #ficha aún oculto (hidden) esas medidas serían
       0 y el plano se dibujaría mal la primera vez. */
    $("#ficha").hidden = false;
    pintarFicha(eq);
  }catch(err){
    console.error(err);
    $("#estado-carga").hidden = true;
    if(err && err.code === "permission-denied") mostrarSinPermiso(codigo);
    else mostrarNoEncontrado(codigo, true);
  }
}

/* ═══════════════════════════════════════════════════════════════
   ESTADOS DE LA PANTALLA
   ═══════════════════════════════════════════════════════════════ */
function ocultarTodo(){
  $("#estado-carga").hidden = true;
  $("#estado-busqueda").hidden = true;
  $("#estado-vacio").hidden = true;
  $("#ficha").hidden = true;
}

function mostrarBusqueda(){
  ocultarTodo();
  $("#estado-busqueda").hidden = false;
  requestAnimationFrame(() => $("#input-buscar-equipo")?.focus());
}

function mostrarNoEncontrado(codigo, error=false){
  ocultarTodo();
  $("#estado-vacio-icono").innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  $("#estado-vacio-titulo").textContent = error ? "No se pudo cargar el equipo" : "Equipo no encontrado";
  $("#estado-vacio-texto").innerHTML = error
    ? "Ocurrió un problema al buscar este equipo. Verifica tu conexión e intenta de nuevo."
    : `El código <strong>${esc(codigo)}</strong> no corresponde a ningún equipo registrado.`;
  $("#estado-vacio").hidden = false;
}

function mostrarEliminado(codigo, nombre){
  ocultarTodo();
  $("#estado-vacio-icono").innerHTML = '<path d="M20 6 9 17l-5-5"/>';
  $("#estado-vacio-titulo").textContent = "Equipo eliminado";
  $("#estado-vacio-texto").innerHTML = `<strong>${esc(nombre)}</strong> (${esc(codigo)}) se eliminó correctamente del inventario.`;
  $("#estado-vacio").hidden = false;
}

function mostrarSinPermiso(codigo){
  ocultarTodo();
  $("#estado-vacio-icono").innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
  $("#estado-vacio-titulo").textContent = "Firestore rechazó la lectura";
  $("#estado-vacio-texto").innerHTML =
    `Las reglas de seguridad de Firestore no están permitiendo leer el equipo <strong>${esc(codigo)}</strong> sin una sesión iniciada. ` +
    `Revisa Firebase Console → Firestore Database → Reglas y confirma que la colección <code>equipos</code> permite <code>read</code> público.`;
  $("#estado-vacio").hidden = false;
}

$("#btn-buscar-otro").addEventListener("click", () => {
  history.replaceState(null, "", "equipo.html");
  mostrarBusqueda();
});
$("#btn-buscar-equipo").addEventListener("click", ejecutarBusqueda);
$("#input-buscar-equipo").addEventListener("keydown", e => { if(e.key === "Enter") ejecutarBusqueda(); });
function ejecutarBusqueda(){
  const v = $("#input-buscar-equipo").value.trim();
  if(!v) return;
  buscarYRenderizar(v);
}

/* ═══════════════════════════════════════════════════════════════
   RENDER DE LA FICHA
   ═══════════════════════════════════════════════════════════════ */
function esc(s){ return String(s??"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function capitaliza(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
function formatearFecha(ts){
  if(!ts) return "";
  try{ return new Date(ts).toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" }); }
  catch(_){ return ""; }
}

function pintarFicha(e){
  $("#ficha-estado").textContent = ESTADOS[e.estado] || e.estado || "—";
  $("#ficha-estado").className = `pill ${e.estado||""}`;
  $("#ficha-codigo").textContent = e.codigo || "";
  $("#ficha-nombre").textContent = e.nombre || "Equipo sin nombre";
  $("#ficha-marca-modelo").textContent = [e.marca, e.modelo].filter(Boolean).join(" · ") || "Sin marca ni modelo registrado";

  const filas = [
    ["Categoría", e.categoria],
    ["Ubicación", e.ubicacion],
    ["Condición física", capitaliza(e.condicion)],
    ["Periféricos / Componentes", e.perifericos, true],
    ["Descripción", e.descripcion, true],
    ["Fecha de registro", formatearFecha(e.creado)]
  ];
  $("#info-grid").innerHTML = filas
    .filter(([,v]) => v)
    .map(([k,v,full]) => `<div${full ? ' class="full"' : ''}><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("") || `<div class="full"><dd>Este equipo aún no tiene datos adicionales registrados.</dd></div>`;

  /* Fotos */
  fotosFicha = Array.isArray(e.fotos) ? e.fotos : [];
  if(fotosFicha.length){
    $("#fotos-grid-ficha").innerHTML = fotosFicha.map((src,i) => `
      <div class="foto-item" data-lb="${i}">
        <img src="${src}" alt="Evidencia ${i+1} de ${esc(e.nombre)}" loading="lazy" />
      </div>`).join("");
    $("#seccion-fotos").hidden = false;
  }else{
    $("#seccion-fotos").hidden = true;
  }

  /* Ubicación (texto + plano) */
  pintarUbicacionMapa(e);

  /* QR */
  pintarQR(e);
}

/* ═══════════════════════════════════════════════════════════════
   UBICACIÓN EN EL PLANO — mapa grande dentro de la ficha
   Público: solo puede ver el punto marcado (si existe) y hacer
   zoom/paneo. Administrador (sesión iniciada en esta ficha): puede
   tocar una sala o arrastrar el punto para reubicar el equipo, y
   cambiar de edificio/nivel con las pestañas.
   ═══════════════════════════════════════════════════════════════ */

/* Reemplaza el contenedor del plano por un clon limpio (sin los
   listeners de pointer/zoom de una instancia anterior) antes de
   volver a montar el visor — evita apilar manejadores duplicados
   cada vez que se repinta (p.ej. al iniciar/cerrar sesión admin). */
function reiniciarStageFicha(){
  const viejo = $("#ficha-mapa-stage");
  const nuevo = viejo.cloneNode(true);
  viejo.replaceWith(nuevo);
  return nuevo;
}

function pintarUbicacionMapa(e){
  const tieneMapa = e.nivelId != null && e.posX != null && e.posY != null;

  $("#ubicacion-texto").innerHTML = tieneMapa
    ? `Ubicación registrada: <strong>${esc(textoUbicacion(e.nivelId, e.posX, e.posY))}</strong>`
    : (e.ubicacion
        ? `Ubicación registrada: <strong>${esc(e.ubicacion)}</strong> <span style="color:var(--txt-muted)">(sin marcar aún en el plano)</span>`
        : "Este equipo aún no tiene una ubicación registrada.");

  if(!tieneMapa && !esAdmin){
    $("#ficha-mapa-wrap").hidden = true;
    $("#ubicacion-sin-mapa").hidden = false;
    return;
  }
  $("#ubicacion-sin-mapa").hidden = true;
  $("#ficha-mapa-wrap").hidden = false;

  reiniciarStageFicha();
  fichaMapaBorrador = null;

  const nivelInicial = tieneMapa ? e.nivelId : NIVELES[0].id;
  const marcadorInicial = tieneMapa ? { x:e.posX, y:e.posY } : null;

  visorFicha = crearVisorPlano($("#ficha-mapa-svg"), $("#ficha-mapa-stage"), {
    nivelId: nivelInicial, marcador: marcadorInicial,
    colocable: esAdmin, arrastrable: esAdmin,
    onCambiar(nivelId, punto){
      fichaMapaBorrador = { nivelId, x:punto.x, y:punto.y };
      $("#btn-guardar-ubicacion").disabled = false;
    }
  });
  /* Si ya tiene una ubicación guardada dentro de una sala con mesas,
     abre el mapa directamente acercado a ella en vez de mostrar el
     plano completo con el pin diminuto (sin marcar esto como un
     cambio: no debe activar "Guardar nueva ubicación" solo por mirar). */
  if(tieneMapa) visorFicha.enfocarMarcadorActual();
  $("#ficha-mapa-stage").classList.toggle("peq-colocable", esAdmin);
  $("#ficha-mapa-zoom-in").addEventListener("click", () => visorFicha.zoomIn());
  $("#ficha-mapa-zoom-out").addEventListener("click", () => visorFicha.zoomOut());

  const tabs = $("#ficha-mapa-tabs");
  tabs.hidden = !esAdmin;
  tabs.innerHTML = "";
  if(esAdmin){
    montarPestanasNiveles(tabs, nivelInicial, nivelId => {
      fichaMapaBorrador = { nivelId, x:null, y:null };
      $("#btn-guardar-ubicacion").disabled = true;
      visorFicha.cambiarNivel(nivelId);
    });
  }

  $("#ficha-mapa-admin-acciones").hidden = !esAdmin;
  $("#btn-guardar-ubicacion").disabled = true;
  $("#ficha-mapa-ayuda").textContent = esAdmin
    ? "Toca una sala o arrastra el punto dorado para reubicar el equipo (en salas con mesas, un primer toque acerca la vista y el siguiente elige la mesa); luego presiona “Guardar nueva ubicación”."
    : "Arrastra para mover el plano y usa la rueda del mouse o los botones +/- para hacer zoom.";
}

$("#btn-guardar-ubicacion").addEventListener("click", async () => {
  if(!esAdmin || !equipoActual || !fichaMapaBorrador || fichaMapaBorrador.x == null) return;
  const btn = $("#btn-guardar-ubicacion");
  const textoOriginal = btn.textContent;
  btn.disabled = true; btn.textContent = "Guardando…";
  try{
    const datos = {
      nivelId: fichaMapaBorrador.nivelId,
      posX: fichaMapaBorrador.x,
      posY: fichaMapaBorrador.y,
      ubicacion: textoUbicacion(fichaMapaBorrador.nivelId, fichaMapaBorrador.x, fichaMapaBorrador.y)
    };
    await updateDoc(doc(fdb, "equipos", equipoActual.id), datos);
    equipoActual = { ...equipoActual, ...datos };
    pintarUbicacionMapa(equipoActual);
  }catch(err){
    alert("Error al guardar la ubicación: " + err.message);
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
});

/* ═══════════════════════════════════════════════════════════════
   CÓDIGO QR
   ═══════════════════════════════════════════════════════════════ */
function urlDeEquipo(codigo){
  return `${location.origin}${location.pathname}?codigo=${encodeURIComponent(codigo)}`;
}

function pintarQR(e){
  QRCode.toCanvas($("#qr-canvas"), urlDeEquipo(e.codigo), {
    width:200, margin:1, color:{ dark:"#1f1240", light:"#ffffff" }
  }, err => { if(err) console.error(err); });
}

/* ═══════════════════════════════════════════════════════════════
   IMAGEN DESCARGABLE: QR + ficha resumida del equipo
   En vez de descargar solo el cuadro QR, se compone una tarjeta con
   el QR a un lado y los datos que permiten identificar el equipo al
   otro (nombre, código, ubicación y estado), sin necesidad de
   escanearlo. Antes de guardar el archivo se muestra una vista
   previa exacta en una ventana modal.
   ═══════════════════════════════════════════════════════════════ */
function cargarImagen(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function trazarRectRedondeado(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Reparte un texto largo en varias líneas que quepan en maxWidth */
function envolverTexto(ctx, texto, maxWidth){
  const palabras = String(texto ?? "").split(/\s+/).filter(Boolean);
  const lineas = [];
  let actual = "";
  palabras.forEach(palabra => {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if(ctx.measureText(prueba).width > maxWidth && actual){
      lineas.push(actual);
      actual = palabra;
    }else{
      actual = prueba;
    }
  });
  if(actual) lineas.push(actual);
  return lineas;
}

const COLOR_ESTADO_ETIQUETA = {
  activo:        { fondo:"#6fe6c9", texto:"#0f3d34", etiqueta:"Activo · funciona" },
  mantenimiento: { fondo:"#ffd668", texto:"#4a3300", etiqueta:"En mantenimiento" },
  baja:          { fondo:"#ff9c8f", texto:"#4d0f0a", etiqueta:"De baja · no funciona" }
};

const ETIQUETA_ESCALA = 2;

/* Dibuja (o solo mide, si dibujar=false) el contenido del panel de
   información dentro del rectángulo [x, y, w, ···]. Se llama dos veces:
   una vez en un lienzo de prueba para saber cuánta altura hace falta
   según los datos de ESTE equipo, y otra en el lienzo final ya con el
   tamaño exacto — así el recorte se ajusta al contenido (más chico si
   hay pocos datos, más grande si hay más) en vez de dejar aire de más. */
async function trazarPanelInfo(ctx, equipo, x, y, w, dibujar){
  const ix = x + 22;
  const anchoTexto = w - 44;
  let iy = y + 28;

  if(dibujar){
    try{
      const logo = await cargarImagen("Imagenes/Cbis_transparente.png");
      const logoH = 23, logoW = logo.width * (logoH / logo.height);
      ctx.drawImage(logo, ix, iy - 17, logoW, logoH);
      ctx.fillStyle = "rgba(255,255,255,.65)";
      ctx.font = "700 10px Inter, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText("INVENTARIO Y REGISTRO DE EQUIPO", ix + logoW + 10, iy - 5);
    }catch(_){ /* si el logo no carga, se continúa sin él */ }
  }
  iy += 25;

  /* Pill de estado: si funciona o no, sin necesidad de escanear */
  const info = COLOR_ESTADO_ETIQUETA[equipo.estado] || { fondo:"#e4d9ff", texto:"#2a1850", etiqueta: equipo.estado || "Sin estado" };
  const pillTexto = info.etiqueta.toUpperCase();
  ctx.font = "700 11.5px Inter, sans-serif";
  const pillW = ctx.measureText(pillTexto).width + 40;
  const pillH = 23;
  if(dibujar){
    trazarRectRedondeado(ctx, ix, iy, pillW, pillH, pillH / 2);
    ctx.fillStyle = info.fondo;
    ctx.fill();
    ctx.fillStyle = info.texto;
    ctx.beginPath();
    ctx.arc(ix + 15, iy + pillH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.textBaseline = "middle";
    ctx.fillText(pillTexto, ix + 26, iy + pillH / 2 + 1);
  }
  iy += pillH + 28; /* deja hueco para el ascenso del título (25px en negrita), si no, se topan */

  /* Nombre del equipo */
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 25px Inter, sans-serif";
  envolverTexto(ctx, equipo.nombre || "Equipo sin nombre", anchoTexto).slice(0, 2)
    .forEach(linea => { if(dibujar){ ctx.fillStyle = "#ffffff"; ctx.fillText(linea, ix, iy); } iy += 28; });

  /* Marca / modelo */
  const marcaModelo = [equipo.marca, equipo.modelo].filter(Boolean).join(" · ");
  if(marcaModelo){
    ctx.font = "500 14px Inter, sans-serif";
    if(dibujar){ ctx.fillStyle = "rgba(255,255,255,.72)"; ctx.fillText(marcaModelo, ix, iy + 2); }
    iy += 22;
  }

  /* Código */
  ctx.font = "600 12.5px 'JetBrains Mono', ui-monospace, monospace";
  if(dibujar){ ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillText((equipo.codigo || "").toUpperCase(), ix, iy + 3); }
  iy += 24;

  if(dibujar){
    ctx.strokeStyle = "rgba(255,255,255,.15)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(x + w - 22, iy); ctx.stroke();
  }
  iy += 20;

  /* Ubicación: dónde va, sin necesidad de escanear */
  ctx.font = "700 10px Inter, sans-serif";
  if(dibujar){ ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillText("UBICACIÓN", ix, iy); }
  iy += 17;
  ctx.font = "600 15.5px Inter, sans-serif";
  envolverTexto(ctx, equipo.ubicacion || "Sin ubicación registrada", anchoTexto).slice(0, 2)
    .forEach(linea => { if(dibujar){ ctx.fillStyle = "#ffffff"; ctx.fillText(linea, ix, iy); } iy += 20; });

  if(equipo.categoria){
    iy += 12;
    ctx.font = "700 10px Inter, sans-serif";
    if(dibujar){ ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillText("CATEGORÍA", ix, iy); }
    iy += 17;
    ctx.font = "500 14px Inter, sans-serif";
    if(dibujar){ ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillText(equipo.categoria, ix, iy); }
  }

  iy += 20; /* respiro inferior mínimo, no un panel vacío */
  return iy - y;
}

async function generarEtiquetaCanvas(equipo){
  const outerPad   = 24;
  const gapPaneles = 18;
  const panelInfoW = 380;
  const qrLado     = 148;
  const innerPadQr = 20;
  const panelQrW   = qrLado + innerPadQr * 2;
  const gapCaption = 18;   /* espacio entre el QR y "ESCANÉAME" */
  const altoCaption = 36;  /* alto reservado para las dos líneas de texto bajo el QR */
  const bloqueQrAlto = qrLado + gapCaption + altoCaption;
  const radio = 18;

  /* 1) Medir cuánta altura necesita ESTE equipo (sin dibujar aún) */
  const medidor = document.createElement("canvas").getContext("2d");
  const alturaInfo = await trazarPanelInfo(medidor, equipo, 0, 0, panelInfoW, false);
  const alturaQr = innerPadQr * 2 + bloqueQrAlto;
  const panelH = Math.max(alturaInfo, alturaQr, 190); /* alto mínimo para que no se vea aplastado */

  const W = outerPad * 2 + panelInfoW + gapPaneles + panelQrW;
  const H = outerPad * 2 + panelH;

  /* 2) Crear el lienzo ya con el tamaño exacto que hace falta */
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(W * ETIQUETA_ESCALA);
  canvas.height = Math.round(H * ETIQUETA_ESCALA);
  const ctx = canvas.getContext("2d");
  ctx.scale(ETIQUETA_ESCALA, ETIQUETA_ESCALA);

  /* Fondo: el mismo degradado de marca que el resto del sitio */
  const fondo = ctx.createLinearGradient(0, 0, W, H);
  fondo.addColorStop(0,   "#6a44a8");
  fondo.addColorStop(.45, "#432a78");
  fondo.addColorStop(.8,  "#2a1850");
  fondo.addColorStop(1,   "#1f1240");
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, W, H);

  const glow = (cx, cy, r, color) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  };
  glow(40, 25, Math.max(W, H) * 0.35, "rgba(214,65,143,.35)");
  glow(W - 30, H - 20, Math.max(W, H) * 0.32, "rgba(69,169,156,.30)");

  const panelY = outerPad;
  const panelInfoX = outerPad;
  const panelQrX = panelInfoX + panelInfoW + gapPaneles;

  /* ── Panel izquierdo: lo necesario para identificar el equipo ── */
  trazarRectRedondeado(ctx, panelInfoX, panelY, panelInfoW, panelH, radio);
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.stroke();

  await trazarPanelInfo(ctx, equipo, panelInfoX, panelY, panelInfoW, true);

  /* ── Panel derecho: QR listo para escanear, centrado en el panel ── */
  trazarRectRedondeado(ctx, panelQrX, panelY, panelQrW, panelH, radio);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const qrCanvas = document.createElement("canvas");
  await new Promise((resolve, reject) => {
    QRCode.toCanvas(qrCanvas, urlDeEquipo(equipo.codigo), {
      width: qrLado, margin: 1, color: { dark: "#1f1240", light: "#ffffff" }
    }, err => err ? reject(err) : resolve());
  });
  const qrX = panelQrX + (panelQrW - qrLado) / 2;
  const qrY = panelY + (panelH - bloqueQrAlto) / 2;
  ctx.drawImage(qrCanvas, qrX, qrY, qrLado, qrLado);

  const centroX = panelQrX + panelQrW / 2;
  const baseCaption1 = qrY + qrLado + gapCaption + 14; /* +14 ≈ ascenso del texto de 17px */
  const baseCaption2 = baseCaption1 + 17;
  ctx.textAlign = "center";
  ctx.fillStyle = "#1f1240";
  ctx.font = "800 17px Inter, sans-serif";
  ctx.fillText("ESCANÉAME", centroX, baseCaption1);
  ctx.fillStyle = "#6b5c92";
  ctx.font = "500 11px Inter, sans-serif";
  ctx.fillText("Ver ficha completa del equipo", centroX, baseCaption2);
  ctx.textAlign = "left";

  return canvas;
}

let etiquetaDataUrl = null;
let etiquetaNombreArchivo = "";

function abrirModal(modalEl){
  modalEl.classList.add("open");
  modalEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function cerrarModal(modalEl){
  modalEl.classList.remove("open");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

$("#btn-descargar-qr").addEventListener("click", async () => {
  if(!equipoActual) return;
  const btn = $("#btn-descargar-qr");
  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Generando vista previa…";
  try{
    const canvas = await generarEtiquetaCanvas(equipoActual);
    etiquetaDataUrl = canvas.toDataURL("image/png");
    etiquetaNombreArchivo = `QR-${equipoActual.codigo}.png`;
    $("#preview-png-img").src = etiquetaDataUrl;
    abrirModal($("#preview-png-modal"));
  }catch(err){
    console.error(err);
    alert("No se pudo generar la vista previa de la imagen. Intenta de nuevo.");
  }finally{
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
});

$("#btn-confirmar-descarga").addEventListener("click", () => {
  if(!etiquetaDataUrl) return;
  const a = document.createElement("a");
  a.href = etiquetaDataUrl;
  a.download = etiquetaNombreArchivo || "QR-equipo.png";
  a.click();
  cerrarModal($("#preview-png-modal"));
});
$("#btn-cancelar-descarga").addEventListener("click", () => cerrarModal($("#preview-png-modal")));
$("#preview-png-close").addEventListener("click", () => cerrarModal($("#preview-png-modal")));
$("#preview-png-modal").addEventListener("click", e => { if(e.target === $("#preview-png-modal")) cerrarModal($("#preview-png-modal")); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && $("#preview-png-modal").classList.contains("open")) cerrarModal($("#preview-png-modal")); });

/* "Imprimir etiqueta" usa el mismo lienzo (generarEtiquetaCanvas) que
   "Descargar imagen", para que ambas den exactamente el mismo resultado
   — antes armaba una etiqueta aparte, más simple (sin estado, modelo ni
   ubicación) y con fondo blanco liso. Hay que esperar a que la imagen
   quede realmente cargada en el <img> antes de imprimir: si se llama a
   print() justo después de poner el src, algunos navegadores todavía no
   terminaron de decodificarla y la hoja sale en blanco. */
$("#btn-imprimir-qr").addEventListener("click", async () => {
  if(!equipoActual) return;
  const btn = $("#btn-imprimir-qr");
  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Preparando…";
  try{
    const canvas = await generarEtiquetaCanvas(equipoActual);
    const img = $("#etiqueta-imprimir-img");
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = canvas.toDataURL("image/png");
    });
    window.print();
  }catch(err){
    console.error(err);
    alert("No se pudo preparar la etiqueta para imprimir. Intenta de nuevo.");
  }finally{
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
});

/* ═══════════════════════════════════════════════════════════════
   ZONA DE ADMINISTRADOR (editar / eliminar)
   Por diseño, esta ficha NUNCA confía en una sesión ya activa en
   otra parte del sitio (p.ej. el panel de inventario): cada vez que
   se abre la página hay que iniciar sesión aquí explícitamente.
   La sesión que se crea aquí es solo para esta pestaña (no persiste).
   ═══════════════════════════════════════════════════════════════ */
const ERRORES_LOGIN = {
  "auth/invalid-email":          "El correo no tiene un formato válido.",
  "auth/user-not-found":         "Correo o contraseña incorrectos.",
  "auth/wrong-password":         "Correo o contraseña incorrectos.",
  "auth/invalid-credential":     "Correo o contraseña incorrectos.",
  "auth/too-many-requests":      "Demasiados intentos. Intenta más tarde.",
  "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
  "auth/user-disabled":          "Esta cuenta está deshabilitada."
};

function desbloquearAdmin(){
  esAdmin = true;
  $("#admin-zone").hidden = false;
  $("#login-gate").hidden = true;
  $("#btn-salir-admin").hidden = false;
  if(equipoActual) pintarUbicacionMapa(equipoActual);
}
function bloquearAdmin(){
  esAdmin = false;
  $("#admin-zone").hidden = true;
  $("#login-gate").hidden = false;
  $("#btn-salir-admin").hidden = true;
  if(equipoActual) pintarUbicacionMapa(equipoActual);
}

$("#form-login-ficha").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#lf-email").value.trim();
  const clave = $("#lf-password").value;
  const msg   = $("#msg-login-ficha");
  const btn   = $("#btn-login-ficha");
  msg.className = "msg";

  if(!email || !clave){
    msg.textContent = "Completa correo y contraseña.";
    msg.className = "msg show err";
    return;
  }

  btn.disabled = true; btn.textContent = "Verificando…";
  try{
    /* La sesión iniciada aquí vive solo mientras esta pestaña esté abierta */
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, clave);
    desbloquearAdmin();
    $("#lf-password").value = "";
  }catch(err){
    msg.textContent = ERRORES_LOGIN[err.code] || "Ocurrió un error. Intenta de nuevo.";
    msg.className = "msg show err";
  }
  btn.disabled = false; btn.textContent = "Iniciar sesión";
});

$("#btn-salir-admin").addEventListener("click", async () => {
  await signOut(auth);
  bloquearAdmin();
});

$("#btn-editar").addEventListener("click", () => {
  if(!equipoActual) return;
  location.href = `inventario.html?editar=${encodeURIComponent(equipoActual.codigo)}`;
});

$("#btn-eliminar").addEventListener("click", async () => {
  if(!equipoActual || !esAdmin) return;
  const ok = confirm(`¿Eliminar "${equipoActual.nombre}" (${equipoActual.codigo})? Esta acción no se puede deshacer.`);
  if(!ok) return;
  try{
    await deleteDoc(doc(fdb, "equipos", equipoActual.id));
    mostrarEliminado(equipoActual.codigo, equipoActual.nombre);
    equipoActual = null;
  }catch(err){
    alert("Error al eliminar: " + err.message);
  }
});

/* ═══════════════════════════════════════════════════════════════
   LIGHTBOX DE FOTOS (versión de solo lectura)
   ═══════════════════════════════════════════════════════════════ */
const lb        = document.getElementById("lightbox");
const lbImg     = document.getElementById("lb-img");
const lbPrev    = document.getElementById("lb-prev");
const lbNext    = document.getElementById("lb-next");
const lbClose   = document.getElementById("lb-close");
const lbCounter = document.getElementById("lb-counter");
const lbThumbs  = document.getElementById("lb-thumbs");
let lbIndex     = 0;

function lbAbrir(index){
  if(!fotosFicha.length) return;
  lbIndex = index;
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
  lbRenderizar();
}
function lbCerrar(){
  lb.classList.remove("open");
  document.body.style.overflow = "";
}
function lbRenderizar(){
  lbImg.classList.add("fade");
  setTimeout(() => { lbImg.src = fotosFicha[lbIndex]; lbImg.classList.remove("fade"); }, 180);
  lbCounter.textContent = `${lbIndex + 1} / ${fotosFicha.length}`;
  lbPrev.classList.toggle("hidden", lbIndex === 0);
  lbNext.classList.toggle("hidden", lbIndex === fotosFicha.length - 1);
  lbThumbs.innerHTML = fotosFicha.map((src,i) => `
    <div class="lb-thumb ${i===lbIndex?'active':''}" data-lb-thumb="${i}">
      <img src="${src}" alt="Miniatura ${i+1}" />
    </div>`).join("");
  const thumbActiva = lbThumbs.querySelector(".active");
  if(thumbActiva) thumbActiva.scrollIntoView({ inline:"center", behavior:"smooth" });
}
function lbNavegar(dir){
  const nuevo = lbIndex + dir;
  if(nuevo < 0 || nuevo >= fotosFicha.length) return;
  lbIndex = nuevo;
  lbRenderizar();
}

$("#fotos-grid-ficha").addEventListener("click", e => {
  const item = e.target.closest(".foto-item");
  if(item) lbAbrir(Number(item.dataset.lb));
});
lbPrev.addEventListener("click", () => lbNavegar(-1));
lbNext.addEventListener("click", () => lbNavegar(1));
lbClose.addEventListener("click", lbCerrar);
lb.addEventListener("click", e => { if(e.target === lb) lbCerrar(); });
lbThumbs.addEventListener("click", e => {
  const t = e.target.closest("[data-lb-thumb]");
  if(t){ lbIndex = Number(t.dataset.lbThumb); lbRenderizar(); }
});
document.addEventListener("keydown", e => {
  if(!lb.classList.contains("open")) return;
  if(e.key === "ArrowLeft")  lbNavegar(-1);
  if(e.key === "ArrowRight") lbNavegar(1);
  if(e.key === "Escape")     lbCerrar();
});