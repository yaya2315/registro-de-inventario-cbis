/* ════════════════════════════════════════════════════════════
   INVENTARIO · cbis  —  CONECTADO (Firestore, SIN Storage)
   Las fotos se comprimen y se guardan dentro de Firestore.
   No requiere plan Blaze: funciona en el plan gratuito (Spark).
   ════════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy }
  from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { NIVELES, crearVisorPlano, montarPestanasNiveles, textoUbicacion, dibujarPlanoEstatico }
  from "./plano-equipos.js?v=20260924c"; // ← sube este número cada vez que cambie plano-equipos.js: los navegadores cachean agresivamente los módulos ES y si no, se sigue viendo la versión vieja aunque el archivo ya se haya actualizado en el servidor

/* Configuración de tu proyecto Firebase */
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

/* ═══ GUARD DE SESIÓN: sin usuario → de vuelta al login ═══ */
onAuthStateChanged(auth, user => { if(!user) location.href = "index.html"; });

/* ═══════════════════════════════════════════════════════════════
   CAPA DE DATOS (Firestore en tiempo real)
   ═══════════════════════════════════════════════════════════════ */
let cache = [];
const DB = {
  listar(){ return [...cache]; },
  buscarPorCodigo(cod){
    const c = cod.trim().toLowerCase();
    return cache.find(e => (e.codigo||"").toLowerCase() === c) || null;
  },
  crear(datos){ return addDoc(col, { ...datos, creado: Date.now() }); },
  actualizar(id, datos){ return updateDoc(doc(fdb,"equipos",id), datos); },
  eliminar(id){ return deleteDoc(doc(fdb,"equipos",id)); }
};

/* Extrae el primer número que aparece en el código (p.ej. "EQ-12-CBIS" → 12).
   Códigos sin número quedan al final, en orden alfabético entre ellos. */
function numeroDeCodigo(codigo){
  const m = String(codigo || "").match(/\d+/);
  return m ? parseInt(m[0], 10) : Infinity;
}

/* Ordena SIEMPRE de forma ascendente por el número del código (1, 2, 3…),
   sin importar el orden en que se hayan registrado los equipos. */
function ordenarPorCodigo(lista){
  return [...lista].sort((a, b) => {
    const na = numeroDeCodigo(a.codigo), nb = numeroDeCodigo(b.codigo);
    if(na !== nb) return na - nb;
    return String(a.codigo||"").localeCompare(String(b.codigo||""), "es", { numeric:true, sensitivity:"base" });
  });
}

/* Escucha en vivo: cualquier cambio repinta tabla + estadísticas */
onSnapshot(query(col, orderBy("creado","desc")), snap => {
  cache = ordenarPorCodigo(snap.docs.map(d => ({ id:d.id, ...d.data() })));
  pintarStats();
  pintarTabla($("#search").value);
  aplicarEditarDesdeUrl();
});

/* Si se llega con ?editar=codigo (p.ej. desde la ficha pública del QR),
   abre automáticamente ese equipo en modo edición una sola vez. */
let editarDesdeUrlAplicado = false;
function aplicarEditarDesdeUrl(){
  if(editarDesdeUrlAplicado) return;
  const cod = new URLSearchParams(location.search).get("editar");
  if(!cod) return;
  const eq = DB.buscarPorCodigo(cod);
  if(eq){
    editarDesdeUrlAplicado = true;
    modoEditar(eq);
    history.replaceState(null, "", location.pathname);
  }
}

/* Comprime una imagen a un JPEG pequeño (data URL) para guardarla en Firestore */
function comprimirImagen(file, maxLado = 1000, calidad = 0.55){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if(width >= height && width > maxLado){ height = Math.round(height * maxLado / width); width = maxLado; }
        else if(height > maxLado){ width = Math.round(width * maxLado / height); height = maxLado; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", calidad));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ═══════════════════════════════════════════════════════════════
   INTERFAZ
   ═══════════════════════════════════════════════════════════════ */
const $ = s => document.querySelector(s);
const ESTADOS = { activo:"Activo", mantenimiento:"En Mantenimiento", baja:"De Baja" };
let editandoId = null;
let fotos = [];   // data URLs (imágenes comprimidas)
let filtroEstado = "";  // "" = todos · "activo" | "mantenimiento" | "baja"

const NOMBRE_FILTRO = { activo:"Activos", mantenimiento:"En Mantenimiento", baja:"De Baja" };
const botonesFiltro = document.querySelectorAll(".stat[data-filtro]");

function aplicarFiltro(valor){
  filtroEstado = (filtroEstado === valor) ? "" : valor;   // clic de nuevo → quita el filtro
  botonesFiltro.forEach(btn=>{
    const activo = btn.dataset.filtro === filtroEstado;
    btn.classList.toggle("active", activo);
    btn.setAttribute("aria-pressed", String(activo));
  });
  const aviso = $("#filtro-aviso");
  if(filtroEstado){ aviso.hidden = false; $("#filtro-aviso-txt").textContent = NOMBRE_FILTRO[filtroEstado]; }
  else{ aviso.hidden = true; }
  pintarTabla($("#search").value);
}
botonesFiltro.forEach(btn => btn.addEventListener("click", ()=> aplicarFiltro(btn.dataset.filtro)));
$("#filtro-quitar").addEventListener("click", ()=> aplicarFiltro(""));

/* Anima un contador de un número al otro (sensación de "tablero vivo" en
   vez de solo reemplazar el texto) — respeta prefers-reduced-motion porque
   el .num nunca cambia de valor final, solo la transición visual. */
function animarNumero(el, valorFinal){
  const inicio = parseInt(el.textContent, 10) || 0;
  if(inicio === valorFinal) return;
  const dur = 500, t0 = performance.now();
  const paso = now => {
    const p = Math.min(1, (now - t0) / dur);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cúbico
    el.textContent = Math.round(inicio + (valorFinal - inicio) * ease);
    if(p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

function pintarStats(){
  const t = DB.listar();
  animarNumero($("#st-total"),  t.length);
  animarNumero($("#st-activo"), t.filter(e=>e.estado==="activo").length);
  animarNumero($("#st-mant"),   t.filter(e=>e.estado==="mantenimiento").length);
  animarNumero($("#st-baja"),   t.filter(e=>e.estado==="baja").length);
}

function pintarTabla(filtro=""){
  const f = (filtro||"").trim().toLowerCase();
  const lista = DB.listar().filter(e =>
    (!filtroEstado || e.estado === filtroEstado) &&
    (!f || (e.codigo||"").toLowerCase().includes(f) || (e.nombre||"").toLowerCase().includes(f)));
  const tb = $("#tbody");
  if(!lista.length){ tb.innerHTML = `<tr><td colspan="4" class="empty">No se encontraron equipos${filtroEstado ? ` en “${NOMBRE_FILTRO[filtroEstado]}”` : ""}.</td></tr>`; return; }
  tb.innerHTML = lista.map((e, i) => `
    <tr class="row-clic" style="--i:${i}" data-codigo="${esc(e.codigo)}" tabindex="0" role="button" aria-label="Ver ficha completa de ${esc(e.nombre)}">
      <td class="cod">${esc(e.codigo)}</td>
      <td class="nom" title="${esc(e.nombre)}">${esc(e.nombre)}</td>
      <td><span class="pill ${e.estado}">${ESTADOS[e.estado]||e.estado}</span></td>
      <td><div class="acts">
        <button class="icon-btn edit" data-edit="${e.id}" aria-label="Editar ${esc(e.nombre)}" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>
        <button class="icon-btn del" data-del="${e.id}" aria-label="Eliminar ${esc(e.nombre)}" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
        <svg class="row-clic-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
      </div></td>
    </tr>`).join("");
}

function esc(s){ return String(s??"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function aviso(sel, texto, tipo){
  const el = $(sel); el.textContent = texto; el.className = `msg show ${tipo}`;
  clearTimeout(el._t); el._t = setTimeout(()=>{ el.className = "msg"; }, 4000);
}

/* ---- Fotos ---- */
function pintarFotos(){
  $("#fotos-grid").innerHTML = fotos.map((src,i)=>`
    <div class="foto-item">
      <img src="${src}" alt="Evidencia ${i+1}" />
      <button type="button" class="quitar" data-foto="${i}" aria-label="Quitar foto">×</button>
    </div>`).join("");
}
async function agregarFotos(fileList){
  for(const file of fileList){
    if(!file.type.startsWith("image/")) continue;
    try{ fotos.push(await comprimirImagen(file)); pintarFotos(); }
    catch(_){ /* archivo inválido, se ignora */ }
  }
}
$("#btn-camara").addEventListener("click", ()=> $("#f-camara").click());
$("#btn-galeria").addEventListener("click", ()=> $("#f-galeria").click());
$("#f-camara").addEventListener("change", async e => { await agregarFotos(e.target.files); e.target.value=""; });
$("#f-galeria").addEventListener("change", async e => { await agregarFotos(e.target.files); e.target.value=""; });
/* El click en fotos-grid (quitar + lightbox) se maneja al final del archivo */

/* ═══════════════════════════════════════════════════════════════
   UBICACIÓN EN EL PLANO — selector como ventana flotante
   Guarda nivelId + posX/posY (metros, coords. reales del plano) y
   deriva el texto legible ("Edificio · Sala") con textoUbicacion().
   Para equipos antiguos sin plano asignado, se conserva el texto
   libre que ya tuvieran en `ubicacion` como respaldo visual.
   ═══════════════════════════════════════════════════════════════ */
let ubicacionActual = { nivelId:null, x:null, y:null, texto:"" };
let ubicacionBorrador = null; // selección provisional dentro del modal, antes de confirmar
let visorUbicacion = null;

function actualizarChipUbicacion(){
  const chip = $("#ubicacion-chip");
  if(ubicacionActual.nivelId != null && ubicacionActual.x != null){
    chip.innerHTML = `<strong>${esc(textoUbicacion(ubicacionActual.nivelId, ubicacionActual.x, ubicacionActual.y))}</strong>`;
  }else if(ubicacionActual.texto){
    chip.innerHTML = `<strong>${esc(ubicacionActual.texto)}</strong> <span style="color:var(--txt-muted)">(sin plano asignado — tócala para ubicarla)</span>`;
  }else{
    chip.textContent = "Sin ubicación asignada todavía";
  }
}

function fijarUbicacion({ nivelId=null, x=null, y=null, texto="" } = {}){
  ubicacionActual = { nivelId, x, y, texto };
  actualizarChipUbicacion();
}

function asegurarVisorUbicacion(){
  if(visorUbicacion) return visorUbicacion;
  visorUbicacion = crearVisorPlano($("#ubicacion-svg"), $("#ubicacion-stage"), {
    nivelId: NIVELES[0].id,
    colocable: true,
    onCambiar(nivelId, punto, sala){
      ubicacionBorrador = { nivelId, x:punto.x, y:punto.y };
      $("#ubicacion-confirm-txt").innerHTML = `Marcarás el equipo en: <strong>${esc(textoUbicacion(nivelId, punto.x, punto.y))}</strong>`;
      $("#btn-confirmar-ubicacion").disabled = false;
    }
  });
  montarPestanasNiveles($("#ubicacion-tabs"), visorUbicacion.nivelActualId(), nivelId=>{
    ubicacionBorrador = null;
    $("#btn-confirmar-ubicacion").disabled = true;
    $("#ubicacion-confirm-txt").textContent = "Toca una sala en este nivel para marcar el equipo.";
    visorUbicacion.cambiarNivel(nivelId);
  });
  $("#ubicacion-zoom-in").addEventListener("click", ()=> visorUbicacion.zoomIn());
  $("#ubicacion-zoom-out").addEventListener("click", ()=> visorUbicacion.zoomOut());
  return visorUbicacion;
}

const ubicacionModal = $("#ubicacion-modal");
function abrirUbicacionModal(){
  /* El modal debe quedar visible ANTES de crear el visor: el SVG
     necesita medidas reales (getBoundingClientRect) para el paneo
     y el zoom, y con el modal aún oculto (display:none) esas
     medidas serían 0 y el plano se dibujaría mal la primera vez. */
  ubicacionModal.classList.add("open");
  ubicacionModal.setAttribute("aria-hidden","false");
  asegurarVisorUbicacion();
  ubicacionBorrador = null;
  $("#btn-confirmar-ubicacion").disabled = true;
  if(ubicacionActual.nivelId != null && ubicacionActual.x != null){
    visorUbicacion.irANivelDe(ubicacionActual.x, ubicacionActual.y, ubicacionActual.nivelId);
    ubicacionBorrador = { nivelId:ubicacionActual.nivelId, x:ubicacionActual.x, y:ubicacionActual.y };
    $("#ubicacion-confirm-txt").innerHTML = `Ubicación actual: <strong>${esc(textoUbicacion(ubicacionActual.nivelId, ubicacionActual.x, ubicacionActual.y))}</strong>`;
    $("#btn-confirmar-ubicacion").disabled = false;
  }else{
    visorUbicacion.cambiarNivel(NIVELES[0].id);
    $("#ubicacion-confirm-txt").textContent = "Toca una sala para marcar el equipo ahí.";
  }
  montarPestanasNiveles($("#ubicacion-tabs"), visorUbicacion.nivelActualId(), nivelId=>{
    ubicacionBorrador = null;
    $("#btn-confirmar-ubicacion").disabled = true;
    $("#ubicacion-confirm-txt").textContent = "Toca una sala en este nivel para marcar el equipo.";
    visorUbicacion.cambiarNivel(nivelId);
  });
}
function cerrarUbicacionModal(){
  ubicacionModal.classList.remove("open");
  ubicacionModal.setAttribute("aria-hidden","true");
}
$("#btn-ubicacion").addEventListener("click", abrirUbicacionModal);
$("#ubicacion-modal-close").addEventListener("click", cerrarUbicacionModal);
ubicacionModal.addEventListener("click", e => { if(e.target === ubicacionModal) cerrarUbicacionModal(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && ubicacionModal.classList.contains("open")) cerrarUbicacionModal(); });
$("#btn-confirmar-ubicacion").addEventListener("click", () => {
  if(!ubicacionBorrador) return;
  fijarUbicacion({ nivelId:ubicacionBorrador.nivelId, x:ubicacionBorrador.x, y:ubicacionBorrador.y, texto:"" });
  cerrarUbicacionModal();
});

/* ---- Leer / escribir formulario ---- */
function leerForm(){
  const tieneMapa = ubicacionActual.nivelId != null && ubicacionActual.x != null;
  return {
    codigo:$("#f-codigo").value.trim(), nombre:$("#f-nombre").value.trim(),
    marca:$("#f-marca").value.trim(), modelo:$("#f-modelo").value.trim(),
    condicion:$("#f-condicion").value, categoria:$("#f-categoria").value,
    nivelId: tieneMapa ? ubicacionActual.nivelId : null,
    posX: tieneMapa ? ubicacionActual.x : null,
    posY: tieneMapa ? ubicacionActual.y : null,
    ubicacion: tieneMapa ? textoUbicacion(ubicacionActual.nivelId, ubicacionActual.x, ubicacionActual.y) : (ubicacionActual.texto || ""),
    estado:$("#f-estado").value,
    perifericos:$("#f-perifericos").value.trim(), descripcion:$("#f-descripcion").value.trim()
  };
}
function escribirForm(e){
  $("#f-codigo").value=e.codigo; $("#f-nombre").value=e.nombre; $("#f-marca").value=e.marca||"";
  $("#f-modelo").value=e.modelo; $("#f-condicion").value=e.condicion||""; $("#f-categoria").value=e.categoria||"";
  if(e.nivelId){ fijarUbicacion({ nivelId:e.nivelId, x:e.posX, y:e.posY, texto:"" }); }
  else{ fijarUbicacion({ texto: e.ubicacion || "" }); }
  $("#f-estado").value=e.estado;
  $("#f-perifericos").value=e.perifericos||""; $("#f-descripcion").value=e.descripcion||"";
  fotos = Array.isArray(e.fotos) ? [...e.fotos] : []; pintarFotos();
}

/* ---- Modal de registro / edición ---- */
const formModal = $("#form-modal");
let ultimoFoco = null;

function abrirFormModal(){
  ultimoFoco = document.activeElement;
  formModal.classList.add("open");
  formModal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(()=> $("#f-nombre")?.focus());
}
function cerrarFormModal(){
  formModal.classList.remove("open");
  formModal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
  if(ultimoFoco && typeof ultimoFoco.focus === "function") ultimoFoco.focus();
}
$("#btn-nuevo-equipo").addEventListener("click", ()=>{ modoCrear(); abrirFormModal(); });
$("#form-modal-close").addEventListener("click", cerrarFormModal);
$("#btn-cancelar").addEventListener("click", cerrarFormModal);
formModal.addEventListener("click", e => { if(e.target === formModal) cerrarFormModal(); });
document.addEventListener("keydown", e => {
  if(e.key === "Escape" && formModal.classList.contains("open")) cerrarFormModal();
});

/* ═══════════════════════════════════════════════════════════════
   CÓDIGO QR DEL EQUIPO
   ═══════════════════════════════════════════════════════════════ */
const qrModal = $("#qr-modal");
let equipoQrActual = null;

/* Enlace absoluto a la ficha pública de este equipo (equipo.html) */
function urlDeEquipo(codigo){
  return `${new URL("equipo.html", location.href).href}?codigo=${encodeURIComponent(codigo)}`;
}

function pintarQR(equipo){
  equipoQrActual = equipo;
  $("#qr-nombre").textContent = equipo.nombre || "";
  $("#qr-codigo").textContent = equipo.codigo || "";
  $("#qr-pill-estado").textContent = ESTADOS[equipo.estado] || equipo.estado || "";
  $("#qr-pill-estado").className = `pill ${equipo.estado||""}`;
  QRCode.toCanvas($("#qr-canvas"), urlDeEquipo(equipo.codigo), {
    width:220, margin:1, color:{ dark:"#312e81", light:"#ffffff" }
  }, err => { if(err) console.error(err); });
}

function abrirQRModal(equipo){
  pintarQR(equipo);
  qrModal.classList.add("open");
  qrModal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  /* Reinicia la animación de "palomita" cada vez (si no, al abrir el modal
     una segunda vez la animación ya habría terminado y no se vería). */
  const circulo = $("#qr-success-circle");
  circulo.classList.remove("play");
  void circulo.offsetWidth; // fuerza reflow para poder reiniciar la animación CSS
  circulo.classList.add("play");
}
function cerrarQRModal(){
  qrModal.classList.remove("open");
  qrModal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}
$("#qr-modal-close").addEventListener("click", cerrarQRModal);
qrModal.addEventListener("click", e => { if(e.target === qrModal) cerrarQRModal(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && qrModal.classList.contains("open")) cerrarQRModal(); });

/* ═══════════════════════════════════════════════════════════════
   CONFIRMACIÓN — reemplaza los confirm()/alert() nativos del navegador
   por un diálogo con el mismo estilo del resto del sitio.
   ═══════════════════════════════════════════════════════════════ */
const confirmModal   = $("#confirm-modal");
const confirmPanel   = confirmModal.querySelector(".confirm-modal-panel");
const confirmIcono   = $("#confirm-icono");
let   resolverConfirm = null;

const ICONO_CONFIRM_NEUTRAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
const ICONO_CONFIRM_PELIGRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

function confirmarAccion({ titulo, mensaje, textoAceptar = "Confirmar", peligro = false }){
  $("#confirm-modal-title").textContent = titulo;
  $("#confirm-modal-texto").textContent = mensaje;
  $("#confirm-btn-aceptar").textContent = textoAceptar;
  confirmPanel.classList.toggle("peligro", peligro);
  confirmIcono.classList.toggle("peligro", peligro);
  confirmIcono.innerHTML = peligro ? ICONO_CONFIRM_PELIGRO : ICONO_CONFIRM_NEUTRAL;
  confirmModal.classList.add("open");
  confirmModal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  $("#confirm-btn-aceptar").focus();
  return new Promise(resolve => { resolverConfirm = resolve; });
}
function cerrarConfirm(resultado){
  confirmModal.classList.remove("open");
  confirmModal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
  if(resolverConfirm){ resolverConfirm(resultado); resolverConfirm = null; }
}
$("#confirm-btn-aceptar").addEventListener("click", ()=> cerrarConfirm(true));
$("#confirm-btn-cancelar").addEventListener("click", ()=> cerrarConfirm(false));
confirmModal.addEventListener("click", e => { if(e.target === confirmModal) cerrarConfirm(false); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && confirmModal.classList.contains("open")) cerrarConfirm(false); });

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
  const info = COLOR_ESTADO_ETIQUETA[equipo.estado] || { fondo:"#e0e7ff", texto:"#312e81", etiqueta: equipo.estado || "Sin estado" };
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
  fondo.addColorStop(0,   "#4f46e5");
  fondo.addColorStop(.45, "#312e81");
  fondo.addColorStop(.8,  "#181736");
  fondo.addColorStop(1,   "#0c0c14");
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
      width: qrLado, margin: 1, color: { dark: "#312e81", light: "#ffffff" }
    }, err => err ? reject(err) : resolve());
  });
  const qrX = panelQrX + (panelQrW - qrLado) / 2;
  const qrY = panelY + (panelH - bloqueQrAlto) / 2;
  ctx.drawImage(qrCanvas, qrX, qrY, qrLado, qrLado);

  const centroX = panelQrX + panelQrW / 2;
  const baseCaption1 = qrY + qrLado + gapCaption + 14; /* +14 ≈ ascenso del texto de 17px */
  const baseCaption2 = baseCaption1 + 17;
  ctx.textAlign = "center";
  ctx.fillStyle = "#312e81";
  ctx.font = "800 17px Inter, sans-serif";
  ctx.fillText("ESCANÉAME", centroX, baseCaption1);
  ctx.fillStyle = "#6b6d8c";
  ctx.font = "500 11px Inter, sans-serif";
  ctx.fillText("Ver ficha completa del equipo", centroX, baseCaption2);
  ctx.textAlign = "left";

  return canvas;
}

let etiquetaDataUrl = null;
let etiquetaNombreArchivo = "";

/* Este modal se abre sobre el modal de QR ya visible: no tocamos
   document.body.style.overflow aquí para no reactivar el scroll
   mientras el modal de QR siga abierto detrás. */
function abrirPreviewModal(){
  $("#preview-png-modal").classList.add("open");
  $("#preview-png-modal").setAttribute("aria-hidden", "false");
}
function cerrarPreviewModal(){
  $("#preview-png-modal").classList.remove("open");
  $("#preview-png-modal").setAttribute("aria-hidden", "true");
}

$("#btn-descargar-qr").addEventListener("click", async () => {
  if(!equipoQrActual) return;
  const btn = $("#btn-descargar-qr");
  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "Generando vista previa…";
  try{
    const canvas = await generarEtiquetaCanvas(equipoQrActual);
    etiquetaDataUrl = canvas.toDataURL("image/png");
    etiquetaNombreArchivo = `QR-${equipoQrActual.codigo}.png`;
    $("#preview-png-img").src = etiquetaDataUrl;
    abrirPreviewModal();
  }catch(err){
    console.error(err);
    aviso("#msg-qr","No se pudo generar la vista previa de la imagen. Intenta de nuevo.","err");
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
  cerrarPreviewModal();
});
$("#btn-cancelar-descarga").addEventListener("click", cerrarPreviewModal);
$("#preview-png-close").addEventListener("click", cerrarPreviewModal);
$("#preview-png-modal").addEventListener("click", e => { if(e.target === $("#preview-png-modal")) cerrarPreviewModal(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && $("#preview-png-modal").classList.contains("open")) cerrarPreviewModal(); });

$("#btn-copiar-enlace").addEventListener("click", async () => {
  if(!equipoQrActual) return;
  try{
    await navigator.clipboard.writeText(urlDeEquipo(equipoQrActual.codigo));
    aviso("#msg-qr","✓ Enlace copiado al portapapeles.","ok");
  }catch(_){
    aviso("#msg-qr","No se pudo copiar el enlace. Cópialo manualmente desde la barra de direcciones.","err");
  }
});

$("#btn-imprimir-qr").addEventListener("click", () => {
  if(!equipoQrActual) return;
  $("#etiqueta-nombre").textContent = equipoQrActual.nombre || "";
  $("#etiqueta-codigo").textContent = equipoQrActual.codigo || "";
  const cont = $("#etiqueta-qr"); cont.innerHTML = "";
  const c = document.createElement("canvas");
  cont.appendChild(c);
  pintarMiniMapaEtiqueta(equipoQrActual);
  QRCode.toCanvas(c, urlDeEquipo(equipoQrActual.codigo), { width:180, margin:1 }, err => {
    if(!err) window.print();
  });
});

/* Mini-mapa (pequeño, solo para no ocupar espacio) dentro de la
   etiqueta imprimible: muestra en qué sala va el equipo. Si el
   equipo no tiene ubicación asignada en el plano, se oculta. */
function pintarMiniMapaEtiqueta(equipo){
  const cont = $("#etiqueta-mapa"), txt = $("#etiqueta-mapa-txt");
  if(equipo.nivelId && equipo.posX != null && equipo.posY != null){
    dibujarPlanoEstatico($("#etiqueta-mapa-svg"), equipo.nivelId, { x:equipo.posX, y:equipo.posY }, { radio:5 });
    txt.textContent = textoUbicacion(equipo.nivelId, equipo.posX, equipo.posY);
    cont.hidden = false; txt.hidden = false;
  }else{
    cont.hidden = true; txt.hidden = true;
  }
}

function modoCrear(){
  editandoId=null; $("#form").reset(); $("#f-estado").value="activo";
  fotos = []; pintarFotos();
  fijarUbicacion();   // limpia la ubicación en el plano al limpiar el formulario
  $("#form-title-text").textContent="Registrar Nuevo Equipo";
  $("#btn-save-text").textContent="Guardar Equipo";
  $("#edit-banner").classList.remove("show");
  $("#form-icon").innerHTML='<path d="M12 5v14M5 12h14"/>';
}
function modoEditar(e){
  editandoId=e.id; escribirForm(e);
  $("#form-title-text").textContent="Editar Equipo";
  $("#btn-save-text").textContent="Actualizar Equipo";
  $("#edit-banner").classList.add("show");
  $("#form-icon").innerHTML='<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>';
  abrirFormModal();
}

/* Guardar (crear o actualizar) */
$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  const d = leerForm();
  if(!d.codigo||!d.nombre||!d.modelo||!d.categoria||!d.estado)
    return aviso("#msg-form","Completa los campos obligatorios (*).","err");
  const dup = DB.buscarPorCodigo(d.codigo);
  if(dup && dup.id !== editandoId)
    return aviso("#msg-form",`El código "${d.codigo}" ya está registrado.`,"err");

  d.fotos = [...fotos];
  // Firestore admite máx. 1 MB por equipo; avisamos si las fotos se pasan
  const peso = d.fotos.reduce((a,s)=>a+s.length,0);
  if(peso > 950000)
    return aviso("#msg-form","Las fotos juntas pesan demasiado. Quita alguna e intenta de nuevo.","err");

  const btn = $("#btn-save"); btn.disabled = true;
  try{
    if(editandoId){
      await DB.actualizar(editandoId,d);
      aviso("#msg-form","✓ Equipo actualizado.","ok");
      modoCrear();
    }else{
      const ref = await DB.crear(d);
      modoCrear();
      cerrarFormModal();
      abrirQRModal({ id:ref.id, ...d });   // el QR queda listo para ver o imprimir de inmediato
    }
  }catch(err){ aviso("#msg-form","Error al guardar: "+err.message,"err"); }
  btn.disabled = false;
});

$("#btn-clear").addEventListener("click",()=>{ modoCrear(); aviso("#msg-form","Formulario limpiado.","ok"); });

/* Editar / Eliminar desde la tabla, y click en la fila → ficha completa del equipo */
$("#tbody").addEventListener("click", async e => {
  const ed=e.target.closest("[data-edit]"), dl=e.target.closest("[data-del]");
  if(ed){ const eq=DB.listar().find(x=>x.id===ed.dataset.edit); if(eq) modoEditar(eq); return; }
  if(dl){
    const eq=DB.listar().find(x=>x.id===dl.dataset.del);
    if(eq){
      const ok = await confirmarAccion({
        titulo: "Eliminar equipo",
        mensaje: `¿Eliminar "${eq.nombre}" (${eq.codigo})? Esta acción no se puede deshacer.`,
        textoAceptar: "Eliminar",
        peligro: true
      });
      if(ok){
        try{ await DB.eliminar(eq.id); if(editandoId===eq.id) modoCrear(); }
        catch(err){ alert("Error al eliminar: "+err.message); }
      }
    }
    return;
  }
  /* Clic en cualquier otra parte de la fila abre la ficha completa (con el QR hasta abajo) */
  const fila = e.target.closest(".row-clic");
  if(fila && fila.dataset.codigo) location.href = urlDeEquipo(fila.dataset.codigo);
});

/* Misma navegación por teclado (Enter / Espacio) para accesibilidad */
$("#tbody").addEventListener("keydown", e => {
  const fila = e.target.closest(".row-clic");
  if(!fila || e.target.closest(".acts")) return;
  if(e.key==="Enter" || e.key===" "){
    e.preventDefault();
    if(fila.dataset.codigo) location.href = urlDeEquipo(fila.dataset.codigo);
  }
});

/* Búsqueda por código de barras */
$("#btn-barcode").addEventListener("click", buscarBarcode);
$("#barcode").addEventListener("keydown", e=>{ if(e.key==="Enter") buscarBarcode(); });
function buscarBarcode(){
  const cod=$("#barcode").value.trim();
  if(!cod) return aviso("#msg-barcode","Ingresa un código de barras.","err");
  const eq=DB.buscarPorCodigo(cod);
  if(eq){ aviso("#msg-barcode",`✓ Encontrado: ${eq.nombre}. Cargado para editar.`,"ok"); modoEditar(eq); }
  else{ aviso("#msg-barcode","No existe ese código. Se abrirá el formulario para registrarlo.","err"); modoCrear();
        $("#f-codigo").value=cod; abrirFormModal(); }
  $("#barcode").value="";
}

/* Búsqueda en el listado */
$("#search").addEventListener("input", e => pintarTabla(e.target.value));

/* Cerrar sesión */
$("#logout").addEventListener("click", async () => {
  const ok = await confirmarAccion({
    titulo: "Cerrar sesión",
    mensaje: "¿Seguro que quieres cerrar tu sesión de administrador?",
    textoAceptar: "Cerrar sesión"
  });
  if(ok){ await signOut(auth); location.href="index.html"; }
});

/* ═══════════════════════════════════════════════════════════════
   LIGHTBOX DE FOTOS
   ═══════════════════════════════════════════════════════════════ */
const lb       = document.getElementById("lightbox");
const lbImg    = document.getElementById("lb-img");
const lbPrev   = document.getElementById("lb-prev");
const lbNext   = document.getElementById("lb-next");
const lbClose  = document.getElementById("lb-close");
const lbCounter= document.getElementById("lb-counter");
const lbThumbs = document.getElementById("lb-thumbs");
let lbIndex    = 0;

function lbAbrir(index){
  if(!fotos.length) return;
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
  /* imagen con fade */
  lbImg.classList.add("fade");
  setTimeout(()=>{
    lbImg.src = fotos[lbIndex];
    lbImg.classList.remove("fade");
  }, 180);

  /* contador */
  lbCounter.textContent = `${lbIndex + 1} / ${fotos.length}`;

  /* flechas */
  lbPrev.classList.toggle("hidden", lbIndex === 0);
  lbNext.classList.toggle("hidden", lbIndex === fotos.length - 1);

  /* miniaturas */
  lbThumbs.innerHTML = fotos.map((src, i) => `
    <div class="lb-thumb ${i===lbIndex?'active':''}" data-lb="${i}">
      <img src="${src}" alt="Miniatura ${i+1}" />
    </div>`).join("");

  /* centrar miniatura activa */
  const thumbActiva = lbThumbs.querySelector(".active");
  if(thumbActiva) thumbActiva.scrollIntoView({ inline:"center", behavior:"smooth" });
}

function lbNavegar(dir){
  const nuevo = lbIndex + dir;
  if(nuevo < 0 || nuevo >= fotos.length) return;
  lbIndex = nuevo;
  lbRenderizar();
}

/* Abrir al hacer clic en una foto del grid */
$("#fotos-grid").addEventListener("click", e => {
  const item = e.target.closest(".foto-item");
  const del  = e.target.closest("[data-foto]");
  if(del){ fotos.splice(Number(del.dataset.foto),1); pintarFotos(); return; }
  if(item){
    const img = item.querySelector("img");
    if(img){
      const idx = [...document.querySelectorAll(".foto-item img")].indexOf(img);
      if(idx !== -1) lbAbrir(idx);
    }
  }
});

lbPrev.addEventListener("click", () => lbNavegar(-1));
lbNext.addEventListener("click", () => lbNavegar(1));
lbClose.addEventListener("click", lbCerrar);
lb.addEventListener("click", e => { if(e.target === lb) lbCerrar(); });

lbThumbs.addEventListener("click", e => {
  const t = e.target.closest("[data-lb]");
  if(t){ lbIndex = Number(t.dataset.lb); lbRenderizar(); }
});

/* Teclado: ← → Escape */
document.addEventListener("keydown", e => {
  if(!lb.classList.contains("open")) return;
  if(e.key === "ArrowLeft")  lbNavegar(-1);
  if(e.key === "ArrowRight") lbNavegar(1);
  if(e.key === "Escape")     lbCerrar();
});