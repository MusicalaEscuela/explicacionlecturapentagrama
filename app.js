/* =======================
   app.js — Musicala · Lectura en el Pentagrama
   Ruta progresiva con los ejercicios reales de las guías (ver ejercicios.js)
   + Modo presentación (pantalla grande para el salón)
   ======================= */

/* ----- Notas diatónicas ----- */
const NOTES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];

/* ----- Claves -----
   Grados verticales: 0=L1, 1=E1, 2=L2, 3=E2, 4=L3, 5=E3, 6=L4, 7=E4, 8=L5.
   Los grados negativos van por debajo del pentagrama y los >8 por encima.
   refPos = grado de la línea de referencia · refNote = índice en NOTES.
   Los glifos son SMuFL (fuente Bravura): la línea base del glifo cae exactamente
   sobre la línea que la clave nombra, y 1 espacio de pentagrama = font-size / 4. */
const CLAVES = {
  sol: { id: "sol", nombre: "Clave de Sol (G)",       corto: "Sol", glifo: "", refPos: 2, refNote: 4 }, // L2 = Sol
  fa:  { id: "fa",  nombre: "Clave de Fa (F)",        corto: "Fa",  glifo: "", refPos: 6, refNote: 3 }, // L4 = Fa
  do:  { id: "do",  nombre: "Clave de Do (3ª línea)", corto: "Do",  glifo: "", refPos: 4, refNote: 0 }, // L3 = Do
};

function noteAt(claveId, deg) {
  const c = CLAVES[claveId];
  const idx = ((c.refNote + (deg - c.refPos)) % 7 + 7) % 7;
  return NOTES[idx];
}
const gradoEsLinea = deg => ((deg % 2) + 2) % 2 === 0;
const enPentagrama = deg => deg >= 0 && deg <= 8;
function gradoEtiqueta(deg) {
  return gradoEsLinea(deg) ? "L" + (deg / 2 + 1) : "E" + ((deg - 1) / 2 + 1);
}

/* Mapa de notas de la etapa: las del pentagrama y, aparte, las adicionales */
function pillsDeEtapa(etapa) {
  const dentro = etapa.grados.filter(enPentagrama);
  const fuera = etapa.grados.filter(d => !enPentagrama(d));
  const pill = (clase, txt) => `<span class="pill ${clase}">${txt}</span>`;
  const html = dentro.map(d =>
    pill(gradoEsLinea(d) ? "linea" : "espacio", `${gradoEtiqueta(d)}: <strong>${noteAt(clave, d)}</strong>`)
  );
  if (fuera.length) {
    const notas = [...new Set(fuera.map(d => noteAt(clave, d)))].join(" · ");
    html.push(pill("extra", `Fuera del pentagrama: <strong>${notas}</strong>`));
  }
  return html.join("");
}

/* =======================
   Ruta: 3 guías, cada una en etapas de 8 compases
   ======================= */
const MEASURES = 8;              // compases por etapa
const NOTES_PER_MEASURE = 4;

const GUIA_META = {
  lineas: {
    id: "lineas", nombre: "Líneas", icono: "▬",
    intro: "Solo notas en las líneas del pentagrama. Es la guía de líneas de Musicala, compás por compás.",
    titulos: ["2 líneas", "3 líneas", "4 líneas", "5 líneas", "Líneas + adicional grave"],
  },
  espacios: {
    id: "espacios", nombre: "Espacios", icono: "▭",
    intro: "Solo notas en los espacios. Es la guía de espacios de Musicala, compás por compás.",
    titulos: ["2 espacios", "3 espacios", "4 espacios", "Espacios + agudo", "Espacios + grave"],
  },
  mixto: {
    id: "mixto", nombre: "Líneas + espacios", icono: "▩",
    intro: "Lectura combinada: todo el pentagrama, ampliando el ámbito etapa tras etapa.",
    titulos: null, // se generan solas: "Etapa 1" … "Etapa 14"
  },
};

/* Construye la ruta a partir de los compases transcritos */
function construirGuias() {
  return Object.keys(GUIA_META).map(gid => {
    const meta = GUIA_META[gid];
    const compases = GUIAS_RAW[gid];
    const nEtapas = compases.length / MEASURES;
    const etapas = [];
    for (let e = 0; e < nEtapas; e++) {
      const bloque = compases.slice(e * MEASURES, (e + 1) * MEASURES);
      const grados = [...new Set(bloque.flat())].sort((a, b) => a - b);
      etapas.push({
        id: `${gid[0].toUpperCase()}${e + 1}`,
        titulo: meta.titulos ? meta.titulos[e] : `${grados.length} notas`,
        compases: bloque,
        grados,
        desdeCompas: e * MEASURES + 1,
      });
    }
    return { ...meta, etapas };
  });
}
const GUIAS = construirGuias();

/* ----- Estado ----- */
let clave = "sol";
let guiaIdx = 0;
let etapaIdx = 0;
let cursor = 0;      // compás actual (0..7)
let progreso = 0;    // compases ya leídos (0..8)
let showNames = false;
let presentando = false;
let presentZoom = 1;

const guiaActual = () => GUIAS[guiaIdx];
const etapaActual = () => guiaActual().etapas[etapaIdx];

/* ----- DOM ----- */
const $ = id => document.getElementById(id);
const staffHero      = $("staffHero");
const claveChips     = $("claveChips");
const guiaTabs       = $("guiaTabs");
const rutaChips      = $("rutaChips");
const rutaTitulo     = $("rutaTitulo");
const rutaDesc       = $("rutaDesc");
const rutaClaveTxt   = $("rutaClaveTxt");
const rutaProgreso   = $("rutaProgreso");
const handImgs       = $("handImgs");
const rutaPills      = $("rutaPills");
const btnPrevSys     = $("btnPrevSys");
const btnNextSys     = $("btnNextSys");
const staffEjercicio = $("staffEjercicio");
const compasHoyTxt   = $("compasHoyTxt");
const progresoBar    = $("progresoBar");
const progresoTxt    = $("progresoTxt");
const btnCompasPrev  = $("btnCompasPrev");
const btnCompasNext  = $("btnCompasNext");
const btnLeido       = $("btnLeido");
const btnReiniciar   = $("btnReiniciar");
const btnNombres     = $("btnNombres");
const btnPresentar   = $("btnPresentar");

const SVGNS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}) => {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};
const txt = (attrs, content) => { const t = el("text", attrs); t.textContent = content; return t; };

/* =======================
   Dibujo de un pentagrama
   Geometría: S = distancia entre líneas. y(grado) = yL1 - grado * S/2
   ======================= */
function dibujarClave(g, claveId, S, xClef, yL1) {
  const c = CLAVES[claveId];
  // SMuFL: la base del glifo se apoya en la línea que la clave nombra (refPos)
  // y el glifo está diseñado para un pentagrama de 4 espacios = font-size.
  g.appendChild(txt({
    x: xClef + S * 0.25,
    y: yL1 - (c.refPos / 2) * S,
    class: "clef",
    "font-size": S * 4,
  }, c.glifo));
}

function ledgersDe(deg) {
  const out = [];
  if (deg <= -2) for (let d = -2; d >= deg; d -= 2) out.push(d);
  if (deg >= 10) for (let d = 10; d <= deg; d += 2) out.push(d);
  // una nota en espacio fuera del pentagrama (p. ej. -1 o 9) no necesita línea adicional
  return out.filter(d => gradoEsLinea(d));
}

/* Pentagrama de referencia (hero): etiquetas L1–L5 / E1–E4 */
function drawStaffHero(svg, claveId) {
  const S = 26, W = 620, H = 230;
  const yL1 = 150, xStart = 130, xEnd = W - 24;
  const y = deg => yL1 - (deg / 2) * S;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";
  const g = el("g");

  for (let i = 0; i < 5; i++) {
    g.appendChild(el("line", { x1: xStart, x2: xEnd, y1: y(i * 2), y2: y(i * 2), class: "staff-line" }));
    g.appendChild(txt({ x: xStart - 16, y: y(i * 2) + 5, class: "staff-label", "text-anchor": "end" }, "L" + (i + 1)));
  }
  for (let i = 0; i < 4; i++) {
    g.appendChild(txt({ x: xStart - 16, y: y(i * 2 + 1) + 5, class: "staff-label soft", "text-anchor": "end" }, "E" + (i + 1)));
  }
  g.appendChild(el("line", { x1: xStart, x2: xStart, y1: y(0), y2: y(8), class: "staff-line" }));
  dibujarClave(g, claveId, S, xStart + 14, yL1);

  // Notas de referencia: el nombre de cada línea y cada espacio en esta clave
  for (let d = 0; d <= 8; d++) {
    const cx = xStart + 150 + d * ((xEnd - xStart - 175) / 8);
    const cy = y(d);
    g.appendChild(el("ellipse", {
      cx, cy, rx: S * 0.58, ry: S * 0.44,
      transform: `rotate(-20 ${cx} ${cy})`,
      class: gradoEsLinea(d) ? "notehead linea" : "notehead espacio",
    }));
    g.appendChild(txt({ x: cx, y: y(8) - S * 0.9, class: "note-name", "text-anchor": "middle" }, noteAt(claveId, d)));
  }
  svg.appendChild(g);
}

/* Ejercicio: 8 compases × 4 negras, en filas */
function drawEjercicio(svg, opts) {
  const {
    claveId, compases, cursor, progreso, showNames,
    S = 16, perRow = 4, grande = false,
  } = opts;

  const measureW = S * (grande ? 12.5 : 11);
  const clefW = S * 3.6;
  const padL = S * 0.8, padR = S * 0.8;
  const staffH = S * 4;
  // Aire suficiente para 2 líneas adicionales arriba/abajo + nº de compás + nombres
  const rowPadTop = S * 6;
  const rowPadBot = S * 4;
  const rowH = staffH + rowPadTop + rowPadBot;
  const rows = Math.ceil(compases.length / perRow);
  const W = padL + clefW + measureW * perRow + padR;
  const H = rows * rowH + S;

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";

  const yL1 = r => S * 0.5 + r * rowH + rowPadTop + staffH;
  const y = (r, deg) => yL1(r) - (deg / 2) * S;

  compases.forEach((notas, m) => {
    const r = Math.floor(m / perRow);
    const col = m % perRow;
    const xLeft = padL + clefW + col * measureW;
    const xRight = xLeft + measureW;
    const leido = m < progreso;
    const esHoy = m === cursor;

    const g = el("g", { class: `compas${esHoy ? " hoy" : ""}${leido ? " leido" : ""}` });

    // Zona del compás
    if (leido || esHoy) {
      g.appendChild(el("rect", {
        x: xLeft, y: y(r, 8) - S * 3, width: measureW, height: staffH + S * 6, rx: S * 0.35,
        class: esHoy ? "compas-bg hoy" : "compas-bg leido",
      }));
    }

    // Número de compás
    const yNum = y(r, 8) - S * 4.4;
    g.appendChild(txt({
      x: xLeft + measureW / 2, y: yNum,
      class: "compas-num", "text-anchor": "middle", "font-size": S * 0.8,
    }, m + 1));
    if (leido) {
      g.appendChild(txt({
        x: xRight - S * 0.5, y: yNum, class: "compas-check", "text-anchor": "end", "font-size": S * 0.9,
      }, "✓"));
    }

    // Notas
    notas.forEach((deg, k) => {
      const cx = xLeft + measureW * (k + 0.5) / NOTES_PER_MEASURE;
      const cy = y(r, deg);

      ledgersDe(deg).forEach(d => {
        g.appendChild(el("line", {
          x1: cx - S * 0.95, x2: cx + S * 0.95, y1: y(r, d), y2: y(r, d), class: "ledger",
        }));
      });

      g.appendChild(el("ellipse", {
        cx, cy, rx: S * 0.58, ry: S * 0.44,
        transform: `rotate(-20 ${cx} ${cy})`,
        class: "notehead",
      }));

      // Plica: hacia arriba si la nota está por debajo de la línea central (L3 = grado 4)
      const arriba = deg < 4;
      const sx = arriba ? cx + S * 0.52 : cx - S * 0.52;
      const sy = arriba ? cy - S * 3.3 : cy + S * 3.3;
      g.appendChild(el("line", { x1: sx, x2: sx, y1: cy, y2: sy, class: "stem" }));

      if (showNames) {
        g.appendChild(txt({
          x: cx, y: y(r, 8) - S * 3,
          class: "note-name-sm", "text-anchor": "middle", "font-size": S * 0.85,
        }, noteAt(claveId, deg)));
      }
    });

    // Barra de compás
    g.appendChild(el("line", {
      x1: xRight, x2: xRight, y1: y(r, 0), y2: y(r, 8),
      class: col === perRow - 1 ? "barline final" : "barline",
    }));

    svg.appendChild(g);
  });

  // Pentagramas + clave (encima del fondo, debajo de nada)
  for (let r = 0; r < rows; r++) {
    const g = el("g", { class: "staff-group" });
    const xStart = padL + clefW, xEnd = padL + clefW + measureW * perRow;
    for (let i = 0; i < 5; i++) {
      g.appendChild(el("line", { x1: xStart, x2: xEnd, y1: y(r, i * 2), y2: y(r, i * 2), class: "staff-line" }));
    }
    g.appendChild(el("line", { x1: xStart, x2: xStart, y1: y(r, 0), y2: y(r, 8), class: "barline" }));
    dibujarClave(g, claveId, S, padL, yL1(r));
    svg.insertBefore(g, svg.firstChild);
  }
}

/* =======================
   Mano de referencia
   ======================= */
function handImgSrc(modo, claveId) {
  return `${modo === "lineas" ? "Lineas" : "Espacios"} clave de ${claveId}.png`;
}
function renderHand(container, claveId, guiaId) {
  container.innerHTML = "";
  const modos = guiaId === "mixto" ? ["lineas", "espacios"] : [guiaId];
  modos.forEach(modo => {
    const src = handImgSrc(modo, claveId);
    const etiqueta = modo === "lineas" ? "Líneas" : "Espacios";
    const cap = `${etiqueta} · Clave de ${CLAVES[claveId].corto}`;
    const fig = document.createElement("figure");
    fig.className = "hand";
    const img = document.createElement("img");
    img.className = "hand-thumb";
    img.src = src;
    img.alt = `Mano de referencia para ${etiqueta} en clave de ${CLAVES[claveId].corto}`;
    img.addEventListener("click", () => openLightbox(src, cap));
    const fc = document.createElement("figcaption");
    fc.className = "muted text-sm mt-2";
    fc.innerHTML = `<strong>${etiqueta}</strong> · Clave de ${CLAVES[claveId].corto}`;
    fig.append(img, fc);
    container.appendChild(fig);
  });
}

/* =======================
   Progreso (persistencia por clave + etapa)
   ======================= */
const storeKey = () => `mus_prog_${clave}_${guiaActual().id}_${etapaActual().id}`;
function cargarProgreso() {
  try {
    const raw = localStorage.getItem(storeKey());
    const o = raw ? JSON.parse(raw) : null;
    progreso = o?.progreso ?? 0;
    cursor = o?.cursor ?? 0;
  } catch { progreso = 0; cursor = 0; }
}
function guardarProgreso() {
  try { localStorage.setItem(storeKey(), JSON.stringify({ progreso, cursor })); } catch {}
}

/* =======================
   Chips y pestañas
   ======================= */
function renderClaveChips(container) {
  if (!container) return;
  container.innerHTML = "";
  Object.values(CLAVES).forEach(c => {
    const chip = document.createElement("button");
    chip.className = "chip" + (c.id === clave ? " active" : "");
    chip.innerHTML = `<span class="chip-glifo">${c.glifo}</span> ${c.corto}`;
    chip.onclick = () => { clave = c.id; cargarProgreso(); updateAll(); };
    container.appendChild(chip);
  });
}
function renderGuiaTabs() {
  if (!guiaTabs) return;
  guiaTabs.innerHTML = "";
  GUIAS.forEach((g, i) => {
    const t = document.createElement("button");
    t.className = "tab" + (i === guiaIdx ? " active" : "");
    t.innerHTML = `<span class="tab-ico">${g.icono}</span> ${g.nombre} <span class="tab-n">${g.etapas.length} etapas</span>`;
    t.onclick = () => { guiaIdx = i; etapaIdx = 0; cargarProgreso(); updateAll(); };
    guiaTabs.appendChild(t);
  });
}
function renderRutaChips() {
  if (!rutaChips) return;
  rutaChips.innerHTML = "";
  guiaActual().etapas.forEach((e, i) => {
    const chip = document.createElement("button");
    chip.className = "chip step" + (i === etapaIdx ? " active" : "");
    chip.innerHTML = `<span class="step-id">${e.id}</span> ${e.titulo}`;
    chip.onclick = () => { etapaIdx = i; cargarProgreso(); updateAll(); };
    rutaChips.appendChild(chip);
  });
}

/* =======================
   Render de la ruta
   ======================= */
function renderRuta() {
  const guia = guiaActual();
  const etapa = etapaActual();
  cursor = Math.min(cursor, MEASURES - 1);

  rutaTitulo.textContent = `${etapa.id} · ${etapa.titulo}`;
  rutaDesc.textContent = `${guia.intro} Compases ${etapa.desdeCompas}–${etapa.desdeCompas + MEASURES - 1} de la guía original.`;
  rutaClaveTxt.textContent = CLAVES[clave].nombre;
  rutaProgreso.textContent = `Etapa ${etapaIdx + 1} de ${guia.etapas.length}`;

  drawEjercicio(staffEjercicio, {
    claveId: clave, compases: etapa.compases, cursor, progreso, showNames, S: 16, perRow: 4,
  });
  renderHand(handImgs, clave, guia.id);

  rutaPills.innerHTML = pillsDeEtapa(etapa);

  compasHoyTxt.textContent = `Compás ${cursor + 1}`;
  progresoBar.style.width = Math.round(progreso / MEASURES * 100) + "%";
  progresoTxt.textContent = `${progreso}/${MEASURES} compases leídos`;

  btnPrevSys.disabled = etapaIdx === 0;
  btnNextSys.disabled = etapaIdx === guia.etapas.length - 1;
  btnCompasPrev.disabled = cursor === 0;
  btnCompasNext.disabled = cursor === MEASURES - 1;
  btnNombres.setAttribute("aria-pressed", String(showNames));
  btnNombres.textContent = showNames ? "🙈 Ocultar nombres" : "👁 Mostrar nombres";

  if (presentando) renderPresentacion();
}

function updateAll() {
  drawStaffHero(staffHero, clave);
  renderClaveChips(claveChips);
  renderGuiaTabs();
  renderRutaChips();
  renderRuta();
}

/* =======================
   Modo presentación (salón / pantalla grande)
   ======================= */
const present        = $("present");
const presentStaff   = $("presentStaff");
const presentTitulo  = $("presentTitulo");
const presentClave   = $("presentClave");
const presentPills   = $("presentPills");
const presentCompas  = $("presentCompas");

function renderPresentacion() {
  const etapa = etapaActual();
  presentTitulo.textContent = `${guiaActual().nombre} · ${etapa.id} · ${etapa.titulo}`;
  presentClave.innerHTML = `<span class="chip-glifo">${CLAVES[clave].glifo}</span> ${CLAVES[clave].nombre}`;
  presentCompas.textContent = `Compás ${cursor + 1} de ${MEASURES}`;
  $("presentClaves")?.querySelectorAll("button[data-clave]").forEach(b => {
    b.classList.toggle("active", b.dataset.clave === clave);
  });
  presentPills.innerHTML = pillsDeEtapa(etapa);
  drawEjercicio(presentStaff, {
    claveId: clave, compases: etapa.compases, cursor, progreso, showNames,
    S: 34 * presentZoom, perRow: 4, grande: true,
  });
}

function abrirPresentacion() {
  presentando = true;
  present.setAttribute("aria-hidden", "false");
  document.body.classList.add("presentando");
  renderPresentacion();
  present.requestFullscreen?.().catch(() => {});
}
function cerrarPresentacion() {
  presentando = false;
  present.setAttribute("aria-hidden", "true");
  document.body.classList.remove("presentando");
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && presentando) cerrarPresentacion();
});

/* ----- Navegación compartida ----- */
function irCompas(delta) {
  const n = cursor + delta;
  if (n < 0 || n > MEASURES - 1) return;
  cursor = n; guardarProgreso(); renderRuta();
}
function irEtapa(delta) {
  const n = etapaIdx + delta;
  if (n < 0 || n > guiaActual().etapas.length - 1) return;
  etapaIdx = n; cargarProgreso(); updateAll();
}
function toggleNombres() { showNames = !showNames; renderRuta(); }
function marcarLeido() {
  progreso = Math.max(progreso, cursor + 1);
  if (cursor < MEASURES - 1) cursor++;
  guardarProgreso(); renderRuta();
}

/* ----- Eventos ----- */
btnPrevSys?.addEventListener("click", () => irEtapa(-1));
btnNextSys?.addEventListener("click", () => irEtapa(1));
btnCompasPrev?.addEventListener("click", () => irCompas(-1));
btnCompasNext?.addEventListener("click", () => irCompas(1));
btnLeido?.addEventListener("click", marcarLeido);
btnReiniciar?.addEventListener("click", () => { progreso = 0; cursor = 0; guardarProgreso(); renderRuta(); });
btnNombres?.addEventListener("click", toggleNombres);
btnPresentar?.addEventListener("click", abrirPresentacion);

$("presentCerrar")?.addEventListener("click", cerrarPresentacion);
$("presentPrev")?.addEventListener("click", () => irCompas(-1));
$("presentNext")?.addEventListener("click", () => irCompas(1));
$("presentEtapaPrev")?.addEventListener("click", () => irEtapa(-1));
$("presentEtapaNext")?.addEventListener("click", () => irEtapa(1));
$("presentNombres")?.addEventListener("click", toggleNombres);
$("presentMas")?.addEventListener("click", () => { presentZoom = Math.min(1.6, presentZoom + 0.1); renderPresentacion(); });
$("presentMenos")?.addEventListener("click", () => { presentZoom = Math.max(0.6, presentZoom - 0.1); renderPresentacion(); });
$("presentClaves")?.addEventListener("click", e => {
  const b = e.target.closest("button[data-clave]");
  if (!b) return;
  clave = b.dataset.clave; cargarProgreso(); updateAll();
});

document.addEventListener("keydown", e => {
  if (!presentando) return;
  const acciones = {
    ArrowRight: () => irCompas(1),
    ArrowLeft:  () => irCompas(-1),
    ArrowDown:  () => irEtapa(1),
    ArrowUp:    () => irEtapa(-1),
    Escape:     cerrarPresentacion,
    n: toggleNombres, N: toggleNombres,
    "+": () => { presentZoom = Math.min(1.6, presentZoom + 0.1); renderPresentacion(); },
    "-": () => { presentZoom = Math.max(0.6, presentZoom - 0.1); renderPresentacion(); },
  };
  if (acciones[e.key]) { e.preventDefault(); acciones[e.key](); }
});

/* ----- Tema ----- */
const themeToggle = $("themeToggle");
themeToggle?.addEventListener("click", () => {
  const dark = document.body.getAttribute("data-theme") === "dark";
  document.body.setAttribute("data-theme", dark ? "light" : "dark");
  themeToggle.textContent = dark ? "🌗 Modo oscuro" : "☀️ Modo claro";
  themeToggle.setAttribute("aria-pressed", String(!dark));
});

/* ----- Lightbox ----- */
const lightbox = $("lightbox");
const lightboxImg = $("lightboxImg");
const lightboxCap = $("lightboxCap");
function openLightbox(src, cap) {
  lightboxImg.src = src;
  lightboxCap.textContent = cap || "";
  lightbox.setAttribute("aria-hidden", "false");
}
document.querySelector(".lightbox-close")?.addEventListener("click", () => lightbox.setAttribute("aria-hidden", "true"));
lightbox?.addEventListener("click", e => { if (e.target === lightbox) lightbox.setAttribute("aria-hidden", "true"); });

/* =======================
   Estado por URL: #guia=mixto&etapa=14&clave=fa&nombres=1&presentar=1
   Sirve para dejar un enlace listo para la clase.
   ======================= */
function leerHash() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ""));
  const g = GUIAS.findIndex(x => x.id === p.get("guia"));
  if (g >= 0) guiaIdx = g;
  if (CLAVES[p.get("clave")]) clave = p.get("clave");
  const e = parseInt(p.get("etapa"), 10);
  if (e >= 1 && e <= guiaActual().etapas.length) etapaIdx = e - 1;
  if (p.get("nombres") === "1") showNames = true;
  return p.get("presentar") === "1";
}

/* ----- Init ----- */
const abrirEnGrande = leerHash();
cargarProgreso();
updateAll();
if (abrirEnGrande) abrirPresentacion();
