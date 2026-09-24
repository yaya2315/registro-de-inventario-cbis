/* ════════════════════════════════════════════════════════════
   PLANO DE EQUIPOS · cbis
   Geometría real de los planos arquitectónicos (levantamiento de
   mayo 2024, esc. 1:75) y un visor SVG reutilizable: se usa para
   elegir la ubicación de un equipo en el formulario, para mostrarla
   en grande en la ficha del equipo, y para la mini-vista de la
   etiqueta imprimible.

   Coordenadas en METROS, relativas al origen de cada nivel.
   ════════════════════════════════════════════════════════════ */

export const NIVELES = [
  {
    id:"e1-aulas", tag:"N2", edificio:"Edificio 1", nombre:"Aulas y administración", npt:"N.P.T. = 0+3.20",
    envelope:[
      "M -0.15 -0.15 H 38.98 V 13.60 H -0.15 Z",
      "M 38.98 -0.15 H 41.01 V 13.60 H 38.98 Z",
      "M 29.71 -3.10 H 42.36 V -0.15 H 29.71 Z",
      "M 31.75 13.60 H 38.94 V 16.50 H 31.75 Z",
      "M -2.25 5.77 H 0 V 10.81 H -2.25 Z"
    ],
    r:[
      ["ss-m","SS Mujeres","serv",0.15,0.15,3.63,4.91],
      ["bod1","Bodega #1","serv",3.93,0.15,1.68,4.91],
      ["aula1","Aula #1","room",5.91,0.15,5.77,4.91],
      ["profes","Sala de Profesores","room",11.83,0.15,2.86,4.91],
      ["centro-computo","Centro de Computación","room",14.84,0.15,8.84,4.91],
      ["aula2","Aula #2","room",23.83,0.15,5.80,4.91],
      ["admin1","Administración #1","room",29.86,0.15,5.82,4.91],
      ["ofi2","Oficina #2","room",35.91,0.15,2.92,4.91],
      ["dir","Oficina Director","room",29.86,-2.95,5.82,2.80],
      ["admin2","Administración #2","room",35.91,-2.95,2.88,2.80],
      ["libreria","Librería","room",39.06,-2.95,3.15,2.80],
      ["pasillo","Pasillo","circ",0.15,5.36,38.68,2.87],
      ["pasillo-e","Pasillo Externo","circ",39.06,0.15,1.80,13.30],
      ["ss-h","SS Hombres","serv",0.15,8.53,3.78,4.77],
      ["bod2","Bodega #2","serv",4.08,8.53,1.60,4.77],
      ["lab-quim","Laboratorio de Química","room",5.91,8.53,5.77,4.77],
      ["aula3","Aula #3","room",11.83,8.53,5.85,4.77],
      ["aula4","Aula #4","room",17.83,8.53,5.85,4.77],
      ["aula5","Aula #5","room",23.83,8.53,5.80,4.77],
      ["reuniones","Sala de Reuniones","room",29.86,8.53,5.82,4.77],
      ["ofi1","Oficina #1","room",35.91,8.53,2.88,4.77],
      ["bod3","Bodega #3","serv",31.90,13.60,3.78,2.75],
      ["bod4","Bodega #4","serv",35.83,13.60,2.96,2.75],
      ["esc-o","Escalera","circ",-2.10,5.92,1.95,4.74]
    ]
  },
  {
    id:"e1-sotano", tag:"N1", edificio:"Edificio 1", nombre:"Sótano y cafetería", npt:"N.P.T. = 0+0.20",
    envelope:[
      "M -0.15 -0.15 H 35.90 L 36.00 -1.40 L 45.85 -3.75 V 3.45 H 42.36 V 13.60 H -0.15 Z",
      "M 39.06 13.60 H 49.20 V 15.70 H 39.06 Z",
      "M 30.60 13.60 H 39.06 V 16.65 H 30.60 Z",
      "M -2.25 5.77 H 0 V 10.81 H -2.25 Z"
    ],
    r:[
      ["ss-m2","SS Mujeres","serv",0.15,0.15,5.45,3.90],
      ["ss-h2","SS Hombres","serv",0.15,9.40,5.45,3.90],
      ["mesas1","Zona de Mesas","open",5.90,0.15,23.65,3.90],
      ["mesas2","Zona de Mesas","open",29.90,0.15,5.70,3.90],
      ["sotano","Sótano","open",5.90,4.25,29.70,9.05],
      ["ss-pasillo","Vestíbulo","circ",0.15,4.25,5.45,5.00],
      ["cafeteria","Cafetería","open",35.90,0.15,6.30,7.75],
      ["cocina","Cocina","serv",41.60,-2.55,4.10,2.70],
      ["gaveteros","Gaveteros","serv",42.50,0.15,2.90,3.10],
      ["esc-e2","Escalera","circ",40.30,4.36,1.35,4.60],
      ["bod4s","Bodega #4","serv",40.45,10.05,1.95,1.45],
      ["bod3s","Bodega #3","serv",40.45,11.70,1.95,1.60],
      ["bod1s","Bodega #1","serv",30.75,13.75,2.95,2.75],
      ["bod2s","Bodega #2","serv",35.90,13.75,2.95,2.75],
      ["cisterna","Cisterna","serv",43.90,13.75,5.00,1.80],
      ["esc-o2","Escalera","circ",-2.10,5.92,1.95,4.74]
    ]
  },
  {
    id:"e1-templo", tag:"N3", edificio:"Edificio 1", nombre:"Templo y pastoral", npt:"N.P.T. = 0+6.40",
    envelope:[
      "M -0.15 -0.15 H 17.00 V -2.85 H 24.70 V -0.15 H 35.60 V -3.00 H 42.15 V 12.98 H 39.06 V 12.98 H 23.50 V 14.65 H 17.90 V 12.98 H -0.15 Z",
      "M 40.90 -0.40 H 43.45 V 11.65 H 40.90 Z"
    ],
    r:[
      ["templo","Templo","open",0.15,0.15,38.60,12.68],
      ["pulpito","Púlpito","room",17.10,-2.70,7.50,5.10],
      ["multimedia","Multimedia","room",18.00,12.98,5.40,1.52],
      ["estar","Estar","room",35.74,-2.85,2.94,2.70],
      ["pastoral","Oficina Pastoral","room",38.86,-2.85,3.14,2.70],
      ["pasillo-ext","Pasillo Externo","circ",39.06,0.15,1.70,12.68],
      ["rampa","Rampa","circ",41.05,-0.25,2.25,11.75]
    ]
  },
  {
    id:"e2-n1", tag:"N4", edificio:"Edificio 2", nombre:"Aulas 1.er nivel", npt:"N.P.T. = 0+1.51",
    envelope:[
      "M -0.20 -0.20 H 8.60 V 34.10 H -0.20 Z",
      "M -10.10 21.80 H 0 V 32.40 H -10.10 Z",
      "M -34.40 -0.20 H -0.60 V 22.00 H -34.40 Z"
    ],
    r:[
      ["cancha","Cancha BKB","open",-34.20,0.00,33.40,21.80],
      ["pasillo2","Pasillo","circ",0.00,0.00,2.00,33.90],
      ["baptisterio","Baptisterio","room",2.20,0.00,6.20,5.64],
      ["e2a4","Aula #4","room",2.20,5.84,6.20,4.80],
      ["e2a5","Aula #5","room",2.20,10.84,6.20,4.90],
      ["e2a6","Aula #6","room",2.20,15.94,6.20,5.90],
      ["e2a7","Aula #7","room",2.20,22.04,6.20,5.80],
      ["e2a8","Aula #8","room",2.20,28.04,6.20,5.86],
      ["e2a1","Aula #1","room",-9.90,22.00,4.90,2.40],
      ["e2a2","Aula #2","room",-9.90,24.60,4.90,2.20],
      ["e2b1","Bodega #1","serv",-9.90,27.00,4.90,2.20],
      ["e2b2","Bodega #2","serv",-9.90,29.40,4.90,2.80],
      ["e2b3","Bodega #3","serv",-4.80,22.00,4.50,2.80],
      ["esc2","Escalera","circ",-4.80,25.00,4.50,1.90],
      ["e2a3","Aula #3","room",-4.80,27.10,4.50,5.10],
      ["basura","Depósito de Basura","serv",-34.20,19.40,2.20,2.20]
    ]
  },
  {
    id:"e2-n2", tag:"N5", edificio:"Edificio 2", nombre:"Aulas 2.º nivel", npt:"N.P.T. = 0+2.92",
    envelope:[
      "M -0.20 -0.20 H 8.60 V 34.05 H -0.20 Z",
      "M -12.70 26.30 H 0 V 33.60 H -12.70 Z",
      "M -6.40 22.30 H -2.20 V 26.50 H -6.40 Z",
      "M -34.40 -0.20 H -0.60 V 22.00 H -34.40 Z"
    ],
    r:[
      ["cancha2","Cancha BKB","open",-34.20,0.00,33.40,21.80],
      ["pasillo3","Pasillo","circ",0.00,0.00,2.00,33.85],
      ["e2b1n2","Aula #1","room",2.20,0.00,6.20,5.44],
      ["e2b2n2","Aula #2","room",2.20,5.64,6.20,5.31],
      ["e2b3n2","Aula #3","room",2.20,11.15,6.20,5.31],
      ["e2b4n2","Aula #4","room",2.20,16.66,6.20,5.31],
      ["e2b5n2","Aula #5","room",2.20,22.17,6.20,5.31],
      ["e2b6n2","Aula #6","room",2.20,27.68,6.20,6.17],
      ["salacuna","Sala Cuna","room",-12.50,26.50,5.13,6.90],
      ["juegos","Área de Juegos infantes","open",-7.17,26.50,6.95,5.40],
      ["ss-inf","SS Infantes","serv",-4.60,32.10,3.10,1.40],
      ["esc2b","Escalera","circ",-6.20,22.50,3.80,3.80]
    ]
  }
];

/* Algunas salas se subdividen en "mesas" (agrupaciones de escritorios) donde
   también se puede registrar un equipo con precisión — por ahora sólo el
   Centro de Computación. Corregido según croquis del propio usuario sobre
   el salón real: la mesa central ("A"), dos bancos angostos contra la pared
   de entrada (el rincón "E" y el banco "C", separados por un muro/mueble
   real que no aparece en el plano de AutoCAD), un banco corto en la pared
   izquierda ("B"), uno en la pared derecha ("F") y uno en la pared del
   fondo ("D") — dejando libre la esquina inferior izquierda, que es una
   zona bloqueada (muro/almacenaje) y no piso útil. */
const MESAS_POR_SALA = {
  "centro-computo":[
    { id:"mesa-a", letra:"A", nombre:"Mesa A", x:18.00, y:1.75, w:3.50, h:1.60 }, // mesa central
    { id:"mesa-b", letra:"B", nombre:"Mesa B", x:14.84, y:0.90, w:1.00, h:2.75 }, // banco pared izquierda, baja hasta la zona bloqueada
    { id:"mesa-c", letra:"C", nombre:"Mesa C", x:18.55, y:0.15, w:3.90, h:0.90 }, // banco pared de entrada (a la derecha del muro)
    { id:"mesa-d", letra:"D", nombre:"Mesa D", x:17.85, y:4.06, w:2.72, h:1.00 }, // banco pared del fondo, empieza en la zona bloqueada
    { id:"mesa-e", letra:"E", nombre:"Mesa E", x:15.84, y:0.15, w:2.00, h:0.90 }, // escritorio rincón sup. izquierdo (a la izq. del muro)
    { id:"mesa-f", letra:"F", nombre:"Mesa F", x:22.90, y:0.40, w:0.78, h:2.10 }  // banco pared derecha
  ]
};

/* Muros/particiones reales que no están en el plano de AutoCAD pero sí en
   el salón (por eso sólo se dibujan, sin afectar los muros del envelope
   general), y puntos de interés que NO son mesas de equipo (como el
   escritorio del profesor) — sólo se muestran cuando la sala está enfocada. */
const MUROS_INTERNOS_POR_SALA = {
  "centro-computo":[ { x1:17.85, y1:0.15, x2:17.85, y2:1.55 } ] // separa la mesa E del banco C
};
const ZONAS_BLOQUEADAS_POR_SALA = {
  "centro-computo":[ { x:14.84, y:3.65, w:3.01, h:1.41 } ] // rincón inf. izquierdo: muro/almacenaje, no es piso útil
};
const PUNTOS_INTERES_POR_SALA = {
  "centro-computo":[ { x:21.46, y:4.56, etiqueta:"Profesor" } ]
};

/* Prepara .rooms una sola vez (objetos en vez de tuplas) */
NIVELES.forEach(n=>{
  if(n.rooms) return;
  n.rooms = n.r.map(([id,nombre,k,x,y,w,h]) => ({id,nombre,k,x,y,w,h}));
  n.rooms.forEach(rm=>{
    if(MESAS_POR_SALA[rm.id]) rm.mesas = MESAS_POR_SALA[rm.id];
    if(MUROS_INTERNOS_POR_SALA[rm.id]) rm.murosInternos = MUROS_INTERNOS_POR_SALA[rm.id];
    if(ZONAS_BLOQUEADAS_POR_SALA[rm.id]) rm.zonasBloqueadas = ZONAS_BLOQUEADAS_POR_SALA[rm.id];
    if(PUNTOS_INTERES_POR_SALA[rm.id]) rm.puntosInteres = PUNTOS_INTERES_POR_SALA[rm.id];
  });
});

export function buscarNivel(nivelId){
  return NIVELES.find(n => n.id === nivelId) || null;
}
export function buscarSala(nivelId, salaId){
  const n = buscarNivel(nivelId);
  return n ? n.rooms.find(r => r.id === salaId) || null : null;
}
/* Encuentra la sala cuyo rectángulo contiene el punto (x,y); null si cae en zona libre */
export function salaEnPunto(nivel, x, y){
  return nivel.rooms.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) || null;
}
/* Igual que salaEnPunto pero dentro de las mesas de una sala (si las tiene) */
export function mesaEnPunto(sala, x, y){
  if(!sala || !sala.mesas) return null;
  return sala.mesas.find(m => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h) || null;
}
export function bboxNivel(n){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  n.rooms.forEach(r=>{ x0=Math.min(x0,r.x); y0=Math.min(y0,r.y); x1=Math.max(x1,r.x+r.w); y1=Math.max(y1,r.y+r.h); });
  const m = 1.6;
  return {x:x0-m, y:y0-m, w:(x1-x0)+2*m, h:(y1-y0)+2*m};
}
/* Recorte ajustado alrededor de un punto, para la mini-vista de impresión */
export function bboxRecorte(n, x, y, radio){
  const bb = bboxNivel(n);
  let rx = Math.max(bb.x, x-radio), ry = Math.max(bb.y, y-radio);
  let rw = Math.min(bb.x+bb.w, x+radio) - rx, rh = Math.min(bb.y+bb.h, y+radio) - ry;
  if(rw < radio) { rx = Math.max(bb.x, bb.x+bb.w-radio*2>bb.x? Math.min(rx, bb.x+bb.w-Math.min(radio*2,bb.w)) : bb.x); rw = Math.min(bb.w, radio*2); }
  if(rh < radio) { ry = Math.max(bb.y, bb.y+bb.h-radio*2>bb.y? Math.min(ry, bb.y+bb.h-Math.min(radio*2,bb.h)) : bb.y); rh = Math.min(bb.h, radio*2); }
  return {x:rx, y:ry, w:Math.max(rw,1), h:Math.max(rh,1)};
}

const esc = s => String(s??"").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* Dibuja el contenido (muros, salas, rótulos, marcador) dentro de un <svg> ya
   posicionado; no toca el viewBox — eso lo decide quien llama. */
function construirContenido(nivel, { resaltarSalaId, marcador, mostrarRotulos = true, salaEnfocada, mesaResaltadaId, escalaMarcador = 1 } = {}){
  let g = `<g class="peq-walls">${nivel.envelope.map(d=>`<path class="peq-envelope" d="${d}"/>`).join("")}</g>`;

  g += `<g class="peq-rooms">`;
  nivel.rooms.forEach(rm=>{
    const resaltada = rm.id === resaltarSalaId;
    g += `<g class="peq-roomg${resaltada?' peq-hl':''}" data-sala="${rm.id}">`;
    g += `<rect class="peq-rm peq-k-${rm.k}" x="${rm.x}" y="${rm.y}" width="${rm.w}" height="${rm.h}"/>`;
    g += `<rect class="peq-hit" x="${rm.x}" y="${rm.y}" width="${rm.w}" height="${rm.h}" role="button" tabindex="0" aria-label="${esc(rm.nombre)}"><title>${esc(rm.nombre)}</title></rect>`;
    g += `<rect class="peq-outline" x="${rm.x}" y="${rm.y}" width="${rm.w}" height="${rm.h}"/>`;
    g += `</g>`;
  });
  g += `</g>`;

  /* Zonas bloqueadas (muro/almacenaje real que no es piso útil, aunque el
     plano de AutoCAD no lo distinga) — se pintan detrás de las mesas, sólo
     con la sala enfocada. */
  if(salaEnfocada && salaEnfocada.zonasBloqueadas){
    g += `<g class="peq-bloqueado">`;
    salaEnfocada.zonasBloqueadas.forEach(z=>{
      g += `<rect class="peq-bloqueado-rect" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"/>`;
    });
    g += `</g>`;
  }

  /* Mesas de la sala actualmente enfocada (zoom activo sobre ella) — se
     dibujan sólo cuando está enfocada, para no saturar la vista completa
     del nivel con subdivisiones que sólo importan de cerca. */
  if(salaEnfocada && salaEnfocada.mesas){
    g += `<g class="peq-mesas">`;
    salaEnfocada.mesas.forEach(ms=>{
      const resaltada = ms.id === mesaResaltadaId;
      const fs = Math.max(0.4, Math.min(1.0, Math.min(ms.w, ms.h)*0.55));
      const cx = ms.x+ms.w/2, cy = ms.y+ms.h/2;
      g += `<g class="peq-mesag${resaltada?' peq-hl':''}" data-mesa="${ms.id}">`;
      g += `<rect class="peq-mesa-rect" x="${ms.x}" y="${ms.y}" width="${ms.w}" height="${ms.h}"/>`;
      g += `<rect class="peq-mesa-hit" x="${ms.x}" y="${ms.y}" width="${ms.w}" height="${ms.h}" role="button" tabindex="0" aria-label="Mesa ${esc(ms.letra)}"><title>Mesa ${esc(ms.letra)}</title></rect>`;
      g += `<rect class="peq-mesa-outline" x="${ms.x}" y="${ms.y}" width="${ms.w}" height="${ms.h}"/>`;
      g += `<text class="peq-mesa-letra" x="${cx.toFixed(3)}" y="${(cy+fs*0.34).toFixed(3)}" font-size="${fs.toFixed(3)}">${esc(ms.letra)}</text>`;
      g += `</g>`;
    });
    g += `</g>`;
  }

  /* Muros/particiones reales que no aparecen en el plano de AutoCAD, pero
     sí existen en el salón (p.ej. un mueble o medio muro entre dos mesas) —
     puramente informativos, encima de las mesas para que se noten. */
  if(salaEnfocada && salaEnfocada.murosInternos){
    g += `<g class="peq-muro-interno">`;
    salaEnfocada.murosInternos.forEach(m=>{
      g += `<line x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}"/>`;
    });
    g += `</g>`;
  }

  /* Puntos de interés que NO son mesas de equipo (p.ej. el escritorio del
     profesor) — sólo un rótulo de referencia, no se puede tocar. */
  if(salaEnfocada && salaEnfocada.puntosInteres){
    g += `<g class="peq-poi">`;
    salaEnfocada.puntosInteres.forEach(p=>{
      g += `<g class="peq-poi-item" transform="translate(${p.x} ${p.y})">
        <circle class="peq-poi-dot" r="0.32"/>
        <text class="peq-poi-label" x="0" y="0.72">${esc(p.etiqueta)}</text>
      </g>`;
    });
    g += `</g>`;
  }

  if(mostrarRotulos){
    g += `<g class="peq-labels">`;
    const CW = 0.50;
    nivel.rooms.forEach(rm=>{
      if(salaEnfocada && rm.id === salaEnfocada.id) return; // ya se ve el detalle de sus mesas
      if(rm.w < 1.2 || rm.h < 0.9) return; // evita saturar espacios diminutos
      const cx = rm.x+rm.w/2, cy = rm.y+rm.h/2;
      const words = rm.nombre.split(" ");
      const usable = rm.w*0.88;
      let lines = [rm.nombre];
      if(words.length > 1 && rm.nombre.length*CW*0.72 > usable){
        let best=1, diff=1e9;
        for(let i=1;i<words.length;i++){
          const a = words.slice(0,i).join(" ").length, b = words.slice(i).join(" ").length;
          if(Math.abs(a-b) < diff){ diff=Math.abs(a-b); best=i; }
        }
        lines = [words.slice(0,best).join(" "), words.slice(best).join(" ")];
      }
      const maxLen = Math.max(...lines.map(t=>t.length));
      let fs = Math.min(0.62, usable/(maxLen*CW));
      fs = Math.min(fs, (rm.h*0.7)/(lines.length*1.25));
      fs = Math.max(fs, 0.24);
      const lh = fs*1.18;
      let y = cy - (lines.length-1)*lh/2 + fs*0.32;
      lines.forEach(t=>{ g += `<text class="peq-rlabel" x="${cx}" y="${y.toFixed(3)}" font-size="${fs.toFixed(3)}">${esc(t)}</text>`; y+=lh; });
    });
    g += `</g>`;
  }

  if(marcador){
    /* El marcador se contra-escala con escalaMarcador (= ancho de vista
       actual / ancho del plano completo) para que su tamaño EN PANTALLA
       se mantenga constante sin importar cuánto zoom tenga la vista —
       igual que un pin en un mapa: si no se contra-escalara, al acercar
       el zoom hacia una mesa pequeña el halo (fijo en metros) se vería
       enorme y taparía todo a su alrededor. */
    g += `<g class="peq-mk" data-x="${marcador.x}" data-y="${marcador.y}" transform="translate(${marcador.x} ${marcador.y}) scale(${escalaMarcador})">
      <circle class="peq-mk-halo" r="1.9"/>
      <circle class="peq-mk-disc" r="0.85"/>
      <circle class="peq-mk-dot" r="0.32"/>
    </g>`;
  }
  return g;
}

/* ════════════════════════════════════════════════════════════
   VISOR ESTÁTICO (sin interacción) — mini-mapa para imprimir
   ════════════════════════════════════════════════════════════ */
export function dibujarPlanoEstatico(svgEl, nivelId, marcador, { radio = 6 } = {}){
  const nivel = buscarNivel(nivelId);
  if(!nivel){ svgEl.innerHTML = ""; return; }
  const sala = marcador ? salaEnPunto(nivel, marcador.x, marcador.y) : null;
  const mesa = marcador ? mesaEnPunto(sala, marcador.x, marcador.y) : null;
  const bb = marcador ? bboxRecorte(nivel, marcador.x, marcador.y, radio) : bboxNivel(nivel);
  svgEl.setAttribute("viewBox", `${bb.x} ${bb.y} ${bb.w} ${bb.h}`);
  svgEl.innerHTML = `<g>${construirContenido(nivel, { resaltarSalaId: sala?.id, marcador, mostrarRotulos:true, salaEnfocada: sala?.mesas ? sala : null, mesaResaltadaId: mesa?.id })}</g>`;
}

/* ════════════════════════════════════════════════════════════
   VISOR INTERACTIVO — usado en el selector del formulario y en
   la ficha del equipo (zoom, paneo, elegir sala, arrastrar pin)
   ════════════════════════════════════════════════════════════ */
export function crearVisorPlano(svgEl, wrapEl, opts = {}){
  const estado = {
    nivelId: opts.nivelId || NIVELES[0].id,
    marcador: opts.marcador || null,
    colocable: !!opts.colocable,     // clic en el plano coloca / mueve el marcador
    arrastrable: !!opts.arrastrable, // el marcador puesto se puede arrastrar
    onCambiar: opts.onCambiar || (()=>{}), // (nivelId, {x,y}, sala|null)
    view: null,      // {x,y,w,h} — rectángulo del plano visible ahora mismo (metros)
    ajusteMax: null, // {x,y,w,h} = bboxNivel(nivel): el plano completo; jamás se puede alejar más que esto
    salaEnfocada: null // id de la sala con "mesas" a la que se le hizo zoom (o null)
  };

  function nivelActual(){ return buscarNivel(estado.nivelId); }
  function salaEnfocadaObj(){
    const n = nivelActual();
    return estado.salaEnfocada ? n.rooms.find(r=>r.id===estado.salaEnfocada) || null : null;
  }

  /* Reinicio completo: recalcula el ajuste al plano entero y vuelve a
     mostrarlo desde cero (cambio de nivel, primera carga). */
  function render(){
    const n = nivelActual();
    estado.ajusteMax = bboxNivel(n);
    estado.view = { ...estado.ajusteMax }; // siempre arranca mostrando el plano completo, con el borde mínimo ya incluido en bboxNivel
    estado.salaEnfocada = null;
    aplicarViewBox();
    construirYPintar();
  }

  /* Sólo reconstruye el contenido (salas, mesas, marcador) del svg, sin
     tocar el rectángulo de vista actual — así colocar un marcador o
     enfocar una sala no hace que la vista "salte" de vuelta al plano
     completo. */
  function construirYPintar(){
    const n = nivelActual();
    const sala = estado.marcador ? salaEnPunto(n, estado.marcador.x, estado.marcador.y) : null;
    const mesa = estado.marcador ? mesaEnPunto(sala, estado.marcador.x, estado.marcador.y) : null;
    svgEl.innerHTML = `<g id="peq-escena">${construirContenido(n, { resaltarSalaId: sala?.id, marcador: estado.marcador, salaEnfocada: salaEnfocadaObj(), mesaResaltadaId: mesa?.id, escalaMarcador: escalaMarcadorActual() })}</g>`;
    wire();
  }

  /* El pin se dibuja en las mismas unidades (metros) que el resto del
     plano, así que al acercar el zoom se vería crecer sin límite hasta
     tapar la mesa entera — igual que en un mapa, su tamaño en pantalla
     debe mantenerse constante. escalaMarcadorActual() da el factor que
     lo "encoge" en proporción a cuánto se ha acercado la vista respecto
     al plano completo (1 = plano completo, más pequeño mientras más
     zoom). posicionarMarcadorDom() vuelve a aplicar esa escala sin
     reconstruir todo el SVG, para usarla en cada paso de zoom. */
  function escalaMarcadorActual(){
    const v = estado.view, m = estado.ajusteMax;
    return (m && m.w) ? Math.min(1, v.w / m.w) : 1;
  }
  function posicionarMarcadorDom(){
    const mk = svgEl.querySelector(".peq-mk");
    if(!mk || !estado.marcador) return;
    const { x, y } = estado.marcador;
    mk.setAttribute("transform", `translate(${x} ${y}) scale(${escalaMarcadorActual()})`);
    mk.dataset.x = x; mk.dataset.y = y;
  }

  /* Acerca la vista al rectángulo de una sala (con un pequeño margen) y
     activa sus "mesas" — se usa cuando se elige en el mapa una sala que
     tiene mesas, para poder luego elegir la mesa exacta. */
  function enfocarSala(sala){
    estado.salaEnfocada = sala.id;
    const m = 0.6;
    estado.view = { x: sala.x-m, y: sala.y-m, w: sala.w+m*2, h: sala.h+m*2 };
    limitarView();
    aplicarViewBox();
    construirYPintar();
  }

  function aplicarViewBox(){
    const v = estado.view;
    svgEl.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
  }

  /* Nota: colocar una sala NO se resuelve con el evento "click" nativo de
     cada rect .peq-hit, porque wrapEl captura el puntero (setPointerCapture)
     desde el pointerdown para permitir el paneo — y con el puntero
     capturado, Chrome redirige también el "click" de compatibilidad al
     elemento que lo capturó, así que un clic sobre una sala nunca llegaría
     a su propio listener. En vez de eso, setupPointer() distingue un
     "toque" (sin arrastre) de un paneo por la distancia recorrida, y ahí
     se calcula qué sala cayó bajo el punto. */
  function wire(){
    if(estado.colocable){
      /* Accesible por teclado: Enter/Espacio sobre una sala enfocada
         (tabindex="0") la selecciona igual que un toque — si la sala
         tiene mesas, primero acerca el zoom a ella (igual que un toque). */
      svgEl.querySelectorAll(".peq-hit").forEach(el=>{
        el.addEventListener("keydown", ev=>{
          if(ev.key !== "Enter" && ev.key !== " ") return;
          ev.preventDefault();
          const salaId = el.closest(".peq-roomg")?.dataset.sala;
          const rm = nivelActual().rooms.find(r=>r.id===salaId);
          if(!rm) return;
          if(rm.mesas && estado.salaEnfocada !== rm.id){ enfocarSala(rm); return; }
          fijarMarcador(rm.x+rm.w/2, rm.y+rm.h/2);
        });
      });
      /* Igual, pero para las mesas de la sala enfocada. */
      svgEl.querySelectorAll(".peq-mesa-hit").forEach(el=>{
        el.addEventListener("keydown", ev=>{
          if(ev.key !== "Enter" && ev.key !== " ") return;
          ev.preventDefault();
          const mesaId = el.closest(".peq-mesag")?.dataset.mesa;
          const ms = salaEnfocadaObj()?.mesas?.find(m=>m.id===mesaId);
          if(ms) fijarMarcador(ms.x+ms.w/2, ms.y+ms.h/2);
        });
      });
    }
    if(estado.arrastrable){
      const mk = svgEl.querySelector(".peq-mk");
      if(mk) mk.addEventListener("pointerdown", ev=>{ ev.stopPropagation(); arrastrando = true; mk.setPointerCapture(ev.pointerId); });
    }
  }

  /* Convierte un punto de pantalla (evento de puntero) a coordenadas del
     plano (metros), replicando el recorte "xMidYMid meet" que el propio
     navegador aplica cuando la proporción del contenedor no coincide con
     la del rectángulo visible actual (estado.view). */
  function puntoDesdeEvento(ev){
    const r = svgEl.getBoundingClientRect(), v = estado.view;
    const escala = Math.min(r.width/v.w, r.height/v.h);
    const offX = (r.width - v.w*escala)/2, offY = (r.height - v.h*escala)/2;
    return { x:(ev.clientX-r.left-offX)/escala + v.x, y:(ev.clientY-r.top-offY)/escala + v.y };
  }
  function escalaActual(){
    const r = svgEl.getBoundingClientRect(), v = estado.view;
    return v.w ? Math.min(r.width/v.w, r.height/v.h) : 1;
  }

  function colocarEnEvento(ev){
    const p = puntoDesdeEvento(ev);
    manejarSeleccion(p.x, p.y);
  }

  /* Resuelve un toque/clic sobre el plano: si cae en una sala con mesas
     que todavía no está enfocada, el toque sólo acerca el zoom a esa
     sala (para poder ver y elegir la mesa exacta) sin colocar nada
     todavía; en cualquier otro caso, coloca/mueve el marcador ahí mismo
     (en una mesa, entre mesas, o en una sala sin subdivisiones). */
  function manejarSeleccion(x, y){
    const n = nivelActual();
    const sala = salaEnPunto(n, x, y);
    if(sala && sala.mesas && estado.salaEnfocada !== sala.id){
      enfocarSala(sala);
      return;
    }
    fijarMarcador(x, y);
  }

  function fijarMarcador(x, y){
    estado.marcador = {x,y};
    const n = nivelActual();
    const sala = salaEnPunto(n, x, y);
    const mesa = mesaEnPunto(sala, x, y);
    const mk = svgEl.querySelector(".peq-mk");
    if(mk) posicionarMarcadorDom();
    else construirYPintar();
    svgEl.querySelectorAll(".peq-roomg").forEach(g=>g.classList.toggle("peq-hl", g.dataset.sala === sala?.id));
    svgEl.querySelectorAll(".peq-mesag").forEach(g=>g.classList.toggle("peq-hl", g.dataset.mesa === mesa?.id));
    estado.onCambiar(estado.nivelId, {x,y}, sala, mesa);
  }

  /* El rectángulo visible (estado.view) nunca puede quedar más grande
     que el plano completo (estado.ajusteMax) — así jamás se ve flotando
     rodeado de un borde vacío enorme — ni puede quedar paneado fuera de
     esos límites. */
  function limitarView(){
    const v = estado.view, m = estado.ajusteMax;
    v.w = Math.min(v.w, m.w);
    v.h = Math.min(v.h, m.h);
    v.x = v.w >= m.w ? m.x : Math.min(Math.max(v.x, m.x), m.x + m.w - v.w);
    v.y = v.h >= m.h ? m.y : Math.min(Math.max(v.y, m.y), m.y + m.h - v.h);
  }

  const ZOOM_MAX = 6; // no acercar a más de 6× el plano completo
  /* Acerca/aleja manteniendo fijo el punto "centro" (en coordenadas del
     plano) — con los botones +/- ese punto es el pin marcado, para que
     el equipo quede siempre a la vista al hacer zoom; con la rueda del
     mouse, el punto bajo el cursor. Sin marcador ni cursor, se usa el
     centro de lo que se esté viendo. El límite de alejamiento es
     exactamente el plano completo (estado.ajusteMax): de ahí no se
     puede "encoger" más. */
  function zoom(factor, centro){
    const v = estado.view, m = estado.ajusteMax;
    const cx = centro ? centro.x : v.x + v.w/2;
    const cy = centro ? centro.y : v.y + v.h/2;
    let nuevoAncho = Math.min(m.w, Math.max(m.w / ZOOM_MAX, v.w / factor));
    const factorReal = v.w / nuevoAncho;
    const nuevoAlto = v.h / factorReal;
    estado.view = {
      x: cx - (cx - v.x) / factorReal,
      y: cy - (cy - v.y) / factorReal,
      w: nuevoAncho,
      h: nuevoAlto
    };
    limitarView();
    aplicarViewBox();
    posicionarMarcadorDom();
    /* Si alejar (rueda o botón "-") devolvió la vista exactamente al plano
       completo mientras había una sala con mesas enfocada, se sale de ese
       enfoque — si no, el usuario quedaría "atrapado" viendo sólo esa
       sala sin poder volver a tocar cualquier otra con un solo toque. */
    if(estado.salaEnfocada && estado.view.w >= m.w - 1e-6 && estado.view.h >= m.h - 1e-6){
      estado.salaEnfocada = null;
      construirYPintar();
    }
  }
  function ajustar(){
    estado.salaEnfocada = null;
    estado.view = { ...estado.ajusteMax };
    aplicarViewBox();
    construirYPintar(); // oculta las mesas si se estaban mostrando
  }

  const UMBRAL_TOQUE = 6; // px de pantalla — por debajo de esto, se considera un toque y no un paneo
  let arrastrando = false, ultimo = null, inicioToque = null, seMovioBastante = false;
  function setupPointer(){
    wrapEl.addEventListener("pointerdown", ev=>{
      if(arrastrando) return;
      if(ev.target.closest(".peq-zoom")) return; // no interferir con los botones de +/-
      inicioToque = { x: ev.clientX, y: ev.clientY };
      seMovioBastante = false;
      ultimo = { x: ev.clientX, y: ev.clientY };
      wrapEl.classList.add("peq-arrastrando");
      wrapEl.setPointerCapture(ev.pointerId);
    });
    wrapEl.addEventListener("pointermove", ev=>{
      if(arrastrando){
        fijarMarcador(...Object.values(puntoDesdeEvento(ev)));
        return;
      }
      if(!ultimo) return;
      if(inicioToque && Math.hypot(ev.clientX-inicioToque.x, ev.clientY-inicioToque.y) > UMBRAL_TOQUE) seMovioBastante = true;
      const esc = escalaActual();
      estado.view.x -= (ev.clientX-ultimo.x)/esc;
      estado.view.y -= (ev.clientY-ultimo.y)/esc;
      limitarView();
      aplicarViewBox();
      ultimo = { x: ev.clientX, y: ev.clientY };
    });
    const soltar = ev=>{
      if(arrastrando){ arrastrando=false; }
      else if(estado.colocable && !seMovioBastante && inicioToque){
        colocarEnEvento(ev); // toque sin arrastre: coloca/mueve el marcador ahí
      }
      ultimo = null; inicioToque = null;
      wrapEl.classList.remove("peq-arrastrando");
    };
    wrapEl.addEventListener("pointerup", soltar);
    wrapEl.addEventListener("pointercancel", ()=>{ arrastrando=false; ultimo=null; inicioToque=null; wrapEl.classList.remove("peq-arrastrando"); });
    wrapEl.addEventListener("wheel", ev=>{
      ev.preventDefault();
      zoom(Math.exp(-ev.deltaY*0.0016), puntoDesdeEvento(ev)); // la rueda hace zoom hacia donde apunta el cursor
    }, {passive:false});
  }

  setupPointer();
  render();

  return {
    cambiarNivel(id){ estado.nivelId = id; estado.marcador = null; render(); },
    /* Abre directamente sobre una ubicación ya guardada: si cae dentro de
       una sala con mesas, enfoca esa sala primero para que el pin se vea
       ya acercado a su mesa, no perdido en la vista del plano completo. */
    irANivelDe(x, y, nivelId){
      estado.nivelId = nivelId;
      render();
      const n = nivelActual();
      const sala = salaEnPunto(n, x, y);
      if(sala && sala.mesas) enfocarSala(sala);
      fijarMarcador(x, y);
    },
    fijarMarcador,
    /* Si ya hay un marcador puesto y cae dentro de una sala con mesas,
       acerca la vista a esa sala — sin disparar onCambiar, porque sólo
       está ajustando el encuadre, no cambiando la ubicación. */
    enfocarMarcadorActual(){
      if(!estado.marcador) return;
      const n = nivelActual();
      const sala = salaEnPunto(n, estado.marcador.x, estado.marcador.y);
      if(sala && sala.mesas) enfocarSala(sala);
    },
    ajustar,
    /* Los botones +/- siempre acercan hacia el pin marcado (si ya hay
       uno), para que el equipo quede visible al hacer zoom; si aún no
       hay marcador, se acercan hacia el centro de lo que se ve. */
    zoomIn: ()=> zoom(1.35, estado.marcador),
    zoomOut: ()=> zoom(1/1.35, estado.marcador),
    nivelActualId: () => estado.nivelId,
    marcadorActual: () => estado.marcador
  };
}

/* Pestañas de nivel reutilizables (formulario y ficha) */
export function montarPestanasNiveles(contenedor, nivelId, onCambiar){
  contenedor.innerHTML = NIVELES.map(n=>`
    <button type="button" class="peq-tab" data-nivel="${n.id}" aria-pressed="${n.id===nivelId}">
      <span class="peq-tab-tag">${n.tag}</span>${esc(n.edificio)} · ${esc(n.nombre)}
    </button>`).join("");
  contenedor.querySelectorAll(".peq-tab").forEach(b=>{
    b.addEventListener("click", ()=>{
      contenedor.querySelectorAll(".peq-tab").forEach(x=>x.setAttribute("aria-pressed", x===b));
      onCambiar(b.dataset.nivel);
    });
  });
}
export function marcarPestanaActiva(contenedor, nivelId){
  contenedor.querySelectorAll(".peq-tab").forEach(b=>b.setAttribute("aria-pressed", b.dataset.nivel===nivelId));
}

export function textoUbicacion(nivelId, x, y){
  const n = buscarNivel(nivelId);
  if(!n) return "";
  const sala = (x!=null && y!=null) ? salaEnPunto(n, x, y) : null;
  if(!sala) return `${n.edificio} · ${n.nombre}`;
  const mesa = mesaEnPunto(sala, x, y);
  return mesa ? `${n.edificio} · ${sala.nombre} · Mesa ${mesa.letra}` : `${n.edificio} · ${sala.nombre}`;
}
