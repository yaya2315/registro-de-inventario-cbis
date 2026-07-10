/* ════════════════════════════════════════════════════════════
   INVENTARIO · cbis  —  CONECTADO (Firestore, SIN Storage)
   Las fotos se comprimen y se guardan dentro de Firestore.
   No requiere plan Blaze: funciona en el plan gratuito (Spark).
   ════════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy }
  from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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

function pintarStats(){
  const t = DB.listar();
  $("#st-total").textContent  = t.length;
  $("#st-activo").textContent = t.filter(e=>e.estado==="activo").length;
  $("#st-mant").textContent   = t.filter(e=>e.estado==="mantenimiento").length;
  $("#st-baja").textContent   = t.filter(e=>e.estado==="baja").length;
}

function pintarTabla(filtro=""){
  const f = (filtro||"").trim().toLowerCase();
  const lista = DB.listar().filter(e =>
    (!filtroEstado || e.estado === filtroEstado) &&
    (!f || (e.codigo||"").toLowerCase().includes(f) || (e.nombre||"").toLowerCase().includes(f)));
  const tb = $("#tbody");
  if(!lista.length){ tb.innerHTML = `<tr><td colspan="4" class="empty">No se encontraron equipos${filtroEstado ? ` en “${NOMBRE_FILTRO[filtroEstado]}”` : ""}.</td></tr>`; return; }
  tb.innerHTML = lista.map(e => `
    <tr>
      <td class="cod">${esc(e.codigo)}</td>
      <td class="nom" title="${esc(e.nombre)}">${esc(e.nombre)}</td>
      <td><span class="pill ${e.estado}">${ESTADOS[e.estado]||e.estado}</span></td>
      <td><div class="acts">
        <button class="icon-btn qr" data-qr="${e.id}" aria-label="Ver código QR de ${esc(e.nombre)}" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v3M14 21h3M21 21v-.01"/></svg></button>
        <button class="icon-btn edit" data-edit="${e.id}" aria-label="Editar ${esc(e.nombre)}" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>
        <button class="icon-btn del" data-del="${e.id}" aria-label="Eliminar ${esc(e.nombre)}" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
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

/* ---- Ubicación con caso especial "Cómputo → Mesa" ---- */
const ES_COMPUTO = "COMPUTO";

function toggleMesa(){
  const esComputo = $("#f-ubicacion").value === ES_COMPUTO;
  $("#f-mesa").classList.toggle("show", esComputo);
  if(!esComputo) $("#f-mesa").value = "";
}

function ubicacionFinal(){
  if($("#f-ubicacion").value === ES_COMPUTO){
    const m = $("#f-mesa").value;
    return m ? `Cómputo · ${m}` : "Cómputo";
  }
  return $("#f-ubicacion").value;
}

function setUbicacion(valor){
  if((valor||"").startsWith("Cómputo")){
    $("#f-ubicacion").value = ES_COMPUTO;
    $("#f-mesa").value = (valor.split("·")[1] || "").trim();
  }else{
    $("#f-ubicacion").value = valor || "";  // si no coincide, queda en "Seleccionar…"
  }
  toggleMesa();
}

$("#f-ubicacion").addEventListener("change", toggleMesa);

/* ---- Leer / escribir formulario ---- */
function leerForm(){
  return {
    codigo:$("#f-codigo").value.trim(), nombre:$("#f-nombre").value.trim(),
    marca:$("#f-marca").value.trim(), modelo:$("#f-modelo").value.trim(),
    condicion:$("#f-condicion").value, categoria:$("#f-categoria").value,
    ubicacion: ubicacionFinal(), estado:$("#f-estado").value,
    perifericos:$("#f-perifericos").value.trim(), descripcion:$("#f-descripcion").value.trim()
  };
}
function escribirForm(e){
  $("#f-codigo").value=e.codigo; $("#f-nombre").value=e.nombre; $("#f-marca").value=e.marca||"";
  $("#f-modelo").value=e.modelo; $("#f-condicion").value=e.condicion||""; $("#f-categoria").value=e.categoria||"";
  setUbicacion(e.ubicacion||""); $("#f-estado").value=e.estado;
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
    width:220, margin:1, color:{ dark:"#1f1240", light:"#ffffff" }
  }, err => { if(err) console.error(err); });
}

function abrirQRModal(equipo){
  pintarQR(equipo);
  qrModal.classList.add("open");
  qrModal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function cerrarQRModal(){
  qrModal.classList.remove("open");
  qrModal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}
$("#qr-modal-close").addEventListener("click", cerrarQRModal);
qrModal.addEventListener("click", e => { if(e.target === qrModal) cerrarQRModal(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && qrModal.classList.contains("open")) cerrarQRModal(); });

$("#btn-descargar-qr").addEventListener("click", () => {
  if(!equipoQrActual) return;
  const a = document.createElement("a");
  a.href = $("#qr-canvas").toDataURL("image/png");
  a.download = `QR-${equipoQrActual.codigo}.png`;
  a.click();
});

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
  QRCode.toCanvas(c, urlDeEquipo(equipoQrActual.codigo), { width:180, margin:1 }, err => {
    if(!err) window.print();
  });
});

function modoCrear(){
  editandoId=null; $("#form").reset(); $("#f-estado").value="activo";
  fotos = []; pintarFotos();
  toggleMesa();   // oculta el selector de mesa al limpiar
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

/* Editar / Eliminar desde la tabla */
$("#tbody").addEventListener("click", async e => {
  const ed=e.target.closest("[data-edit]"), dl=e.target.closest("[data-del]"), qr=e.target.closest("[data-qr]");
  if(qr){ const eq=DB.listar().find(x=>x.id===qr.dataset.qr); if(eq) abrirQRModal(eq); }
  if(ed){ const eq=DB.listar().find(x=>x.id===ed.dataset.edit); if(eq) modoEditar(eq); }
  if(dl){
    const eq=DB.listar().find(x=>x.id===dl.dataset.del);
    if(eq && confirm(`¿Eliminar "${eq.nombre}" (${eq.codigo})?`)){
      try{ await DB.eliminar(eq.id); if(editandoId===eq.id) modoCrear(); }
      catch(err){ alert("Error al eliminar: "+err.message); }
    }
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
  if(confirm("¿Cerrar sesión?")){ await signOut(auth); location.href="index.html"; }
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
