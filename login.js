/* ════════════════════════════════════════════════════════════
   LOGIN · cbis  —  CONECTADO A FIREBASE AUTHENTICATION
   ════════════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

/* Configuración de tu proyecto Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyCyDCn87fbRJpLRixd-1utjc-TIzUU3wOk",
  authDomain: "cbis-inventario.firebaseapp.com",
  projectId: "cbis-inventario",
  storageBucket: "cbis-inventario.firebasestorage.app",
  messagingSenderId: "442600862426",
  appId: "1:442600862426:web:399c935e05112d3bf7ebe3"
};

/* A dónde ir tras iniciar sesión */
const REDIRECT = "inventario.html";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* Quita el aviso de "modo demo" (ya está conectado) */
document.getElementById("demo-tag")?.remove();

/* ---- Interfaz ---- */
const form   = document.getElementById("form-login");
const btn    = document.getElementById("btn-submit");
const msg    = document.getElementById("message");
const pass   = document.getElementById("password");
const toggle = document.getElementById("toggle-pass");

toggle.addEventListener("click", () => {
  const ver = pass.type === "password";
  pass.type = ver ? "text" : "password";
  toggle.setAttribute("aria-pressed", String(ver));
  toggle.setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
});

function mostrar(texto, tipo){ msg.textContent = texto; msg.className = "message show " + tipo; }
function limpiar(){ msg.className = "message"; }

const errores = {
  "auth/invalid-email":          "El correo no tiene un formato válido.",
  "auth/user-not-found":         "Correo o contraseña incorrectos.",
  "auth/wrong-password":         "Correo o contraseña incorrectos.",
  "auth/invalid-credential":     "Correo o contraseña incorrectos.",
  "auth/too-many-requests":      "Demasiados intentos. Intenta más tarde.",
  "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
  "auth/user-disabled":          "Esta cuenta está deshabilitada."
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  limpiar();

  const email = form.email.value.trim();
  const clave = form.password.value;

  if(!email || !clave){ return mostrar("Completa todos los campos.", "err"); }
  if(clave.length < 6){ return mostrar("La contraseña debe tener al menos 6 caracteres.", "err"); }

  btn.classList.add("loading");
  btn.disabled = true;

  try{
    await signInWithEmailAndPassword(auth, email, clave);
    mostrar("✓ Acceso correcto. Redirigiendo…", "ok");
    setTimeout(() => { window.location.href = REDIRECT; }, 700);
  }catch(err){
    mostrar(errores[err.code] || "Ocurrió un error. Intenta de nuevo.", "err");
    btn.classList.remove("loading"); btn.disabled = false;
  }
});