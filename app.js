/* =======================
   app.js — Musicala · Pentagrama
   ======================= */

/* ----- Datos de claves ----- */
const CLAVES = {
  sol: { id: "sol", nombre: "Clave de Sol (G)", lineas: ["Mi","Sol","Si","Re","Fa"], espacios: ["Fa","La","Do","Mi"] },
  fa:  { id: "fa",  nombre: "Clave de Fa (F)",  lineas: ["Sol","Si","Re","Fa","La"], espacios: ["La","Do","Mi","Sol"] },
  do:  { id: "do",  nombre: "Clave de Do (C en 3ª)", lineas: ["Fa","La","Do","Mi","Sol"], espacios: ["Sol","Si","Re","Fa"] },
};

/* ----- Estado ----- */
let clave = "sol";
let modo = "lineas";             // lineas | espacios | explorar
let quizIndex = Math.floor(Math.random() * 5);
let respuesta = null;

/* ----- DOM ----- */
const staffHero = document.getElementById("staffHero");
const staffQuiz = document.getElementById("staffQuiz");

const claveChips = document.getElementById("claveChips");
const claveQuizChips = document.getElementById("claveQuizChips");
const modoQuizChips = document.getElementById("modoQuizChips");

const labelClaveNombre = document.getElementById("labelClaveNombre");
const labelModoTxt = document.getElementById("labelModoTxt");
const pillsMapa = document.getElementById("pillsMapa");
const opcionesQuiz = document.getElementById("opcionesQuiz");
const feedback = document.getElementById("feedback");
const btnNext = document.getElementById("btnNext");

/* =======================
   Dibujo de Pentagrama
   ======================= */
function drawStaff(svg, { highlightIndex = null, highlightType = "linea", claveId = "sol" } = {}) {
  const W = 560, H = 180;
  const padX = 40, padY = 24;
  const s = (H - padY * 2) / 4;

  const yLine = i => (H - padY) - i * s;   // 0 = línea inferior
  const ySpace = i => yLine(i) - s / 2;    // 0 = espacio inferior

  svg.innerHTML = "";

  // Fondo
  const defs = `<defs><linearGradient id="bg" x1="0" x2="1">
    <stop offset="0%" stop-color="#f7f8ff"/><stop offset="100%" stop-color="#eef1ff"/></linearGradient></defs>`;
  svg.insertAdjacentHTML("afterbegin", defs);

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", 0);
  bg.setAttribute("y", 0);
  bg.setAttribute("width", W);
  bg.setAttribute("height", H);
  bg.setAttribute("rx", 16);
  bg.setAttribute("fill", "url(#bg)");
  svg.appendChild(bg);

  // Clave
  const staffHeight = H - padY * 2;
  const clefSize = staffHeight * 0.8;
  const claveSymbol = (claveId === "fa" ? "𝄢" : (claveId === "do" ? "𝄡" : "𝄞"));
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", padX + 16);
  t.setAttribute("y", yLine(0) - s * 0.4);
  t.setAttribute("font-size", clefSize);
  t.setAttribute("font-family", "'Noto Music', sans-serif");
  t.textContent = claveSymbol;
  svg.appendChild(t);

  // Líneas del pentagrama
  for (let i = 0; i < 5; i++) {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", padX);
    l.setAttribute("x2", W - padX);
    l.setAttribute("y1", yLine(i));
    l.setAttribute("y2", yLine(i));
    l.setAttribute("stroke", "#111528");
    l.setAttribute("stroke-width", 2);
    l.setAttribute("opacity", "0.95");
    svg.appendChild(l);
  }

  // Etiquetas L1–L5 y E1–E4 a la izquierda
  const labelStyle = "font-size:11px; font-weight:700; fill:#6b7280;";
  for (let i = 0; i < 5; i++) {
    const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tx.setAttribute("x", padX - 26);
    tx.setAttribute("y", yLine(i) + 4);
    tx.setAttribute("style", labelStyle);
    tx.textContent = "L" + (i + 1);
    svg.appendChild(tx);
  }
  for (let i = 0; i < 4; i++) {
    const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tx.setAttribute("x", padX - 26);
    tx.setAttribute("y", ySpace(i) + 4);
    tx.setAttribute("style", labelStyle);
    tx.textContent = "E" + (i + 1);
    svg.appendChild(tx);
  }

  // Recuadro (quiz)
  if (highlightIndex !== null) {
    const y = highlightType === "linea" ? yLine(highlightIndex) : ySpace(highlightIndex);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", padX + 80);
    rect.setAttribute("width", 400);
    rect.setAttribute("height", 14);
    rect.setAttribute("rx", 4);
    rect.setAttribute("fill", "#0C41C420");
    rect.setAttribute("stroke", "#0C41C4");
    rect.setAttribute("stroke-width", 1.5);
    rect.setAttribute("y", y - 7);
    svg.appendChild(rect);
  }
}

/* =======================
   UI / Chips
   ======================= */
function renderChips() {
  // Claves (Hero)
  if (claveChips) {
    claveChips.innerHTML = "";
    Object.values(CLAVES).forEach(c => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.textContent = c.id.toUpperCase();
      if (c.id === clave) chip.classList.add("active");
      chip.onclick = () => { clave = c.id; updateAll(); };
      claveChips.appendChild(chip);
    });
  }

  // Claves (Quiz)
  if (claveQuizChips) {
    claveQuizChips.innerHTML = "";
    Object.values(CLAVES).forEach(c => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.textContent = c.id.toUpperCase();
      if (c.id === clave) chip.classList.add("active");
      chip.onclick = () => { clave = c.id; updateAll(); };
      claveQuizChips.appendChild(chip);
    });
  }

  // Modo (en el Quiz)
  if (modoQuizChips) {
    modoQuizChips.innerHTML = "";
    ["lineas", "espacios", "explorar"].forEach(m => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.textContent = m[0].toUpperCase() + m.slice(1);
      if (m === modo) chip.classList.add("active");
      chip.onclick = () => { modo = m; updateAll(); };
      modoQuizChips.appendChild(chip);
    });
  }
}

/* =======================
   Render principal
   ======================= */
function updateAll() {
  const data = CLAVES[clave];
  labelClaveNombre.textContent = data.nombre;
  labelModoTxt.textContent = modo === "lineas" ? "líneas" : "espacios";

  // Hero
  drawStaff(staffHero, { claveId: clave });

  // Lista de referencia para el quiz (texto arriba de las opciones)
  pillsMapa.innerHTML = (modo === "lineas" ? data.lineas : data.espacios)
    .map(n => `<span>${n}</span>`).join("");

  // Quiz
  renderQuiz();

  // Refrescar chips activos
  renderChips();
}

/* =======================
   Quiz
   ======================= */
function renderQuiz() {
  const data = CLAVES[clave];
  const arr = (modo === "lineas") ? data.lineas : data.espacios;

  quizIndex = Math.floor(Math.random() * arr.length);
  respuesta = arr[quizIndex];

  drawStaff(staffQuiz, {
    highlightIndex: quizIndex,
    highlightType: (modo === "lineas") ? "linea" : "espacio",
    claveId: clave
  });

  const opts = arr.slice().sort(() => Math.random() - 0.5);
  opcionesQuiz.innerHTML = opts.map(o => `<button>${o}</button>`).join("");
  feedback.textContent = "";
  opcionesQuiz.querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      if (b.textContent === respuesta) {
        feedback.textContent = "✅ Correcto";
        feedback.className = "feedback correct";
      } else {
        feedback.textContent = "❌ Incorrecto";
        feedback.className = "feedback wrong";
      }
    };
  });
}

/* =======================
   Eventos
   ======================= */
if (btnNext) btnNext.onclick = renderQuiz;

// Primera carga
renderChips();
updateAll();

/* =======================
   Lightbox (manos)
   ======================= */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCap = document.getElementById("lightboxCap");
const closeBtn = document.querySelector(".lightbox-close");

document.querySelectorAll("[data-enlarge]").forEach(img => {
  img.addEventListener("click", () => {
    lightboxImg.src = img.dataset.enlarge;
    lightboxCap.textContent = img.alt;
    lightbox.setAttribute("aria-hidden", "false");
  });
});

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    lightbox.setAttribute("aria-hidden", "true");
  });
}

/* =======================
   Tooltip modo explorar
   ======================= */
const exploreTip = document.getElementById("exploreTip");
function showTip(text) {
  if (!exploreTip) return;
  exploreTip.textContent = text;
  exploreTip.style.display = "block";
  setTimeout(() => (exploreTip.style.display = "none"), 2000);
}
