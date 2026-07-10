/* ════════════════════════════════════════════════════════════
   FICHA DE EQUIPO · cbis  —  PÁGINA PÚBLICA (destino del QR)
   Cualquiera puede ver la ficha al escanear el código.
   Editar o eliminar requiere una sesión de administrador.
   ════════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence }
  from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc }
  from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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
    pintarFicha(eq);
    $("#ficha").hidden = false;
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

  /* Ubicación */
  $("#ubicacion-texto").innerHTML = e.ubicacion
    ? `Ubicación registrada: <strong>${esc(e.ubicacion)}</strong>`
    : "Este equipo aún no tiene una ubicación registrada.";

  /* QR */
  pintarQR(e);
}

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

$("#btn-descargar-qr").addEventListener("click", () => {
  if(!equipoActual) return;
  const a = document.createElement("a");
  a.href = $("#qr-canvas").toDataURL("image/png");
  a.download = `QR-${equipoActual.codigo}.png`;
  a.click();
});

$("#btn-imprimir-qr").addEventListener("click", () => {
  if(!equipoActual) return;
  $("#etiqueta-nombre").textContent = equipoActual.nombre || "";
  $("#etiqueta-codigo").textContent = equipoActual.codigo || "";
  const cont = $("#etiqueta-qr");
  cont.innerHTML = "";
  const c = document.createElement("canvas");
  cont.appendChild(c);
  QRCode.toCanvas(c, urlDeEquipo(equipoActual.codigo), { width:180, margin:1 }, err => {
    if(!err) window.print();
  });
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
}
function bloquearAdmin(){
  esAdmin = false;
  $("#admin-zone").hidden = true;
  $("#login-gate").hidden = false;
  $("#btn-salir-admin").hidden = true;
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
