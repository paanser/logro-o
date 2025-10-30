// ======== VIDRES SOSA · script_manual.js v1.9 ======== //

document.addEventListener("DOMContentLoaded", () => {
  // ---- CAMPOS PRINCIPALES ----
  const anchoInput = document.getElementById("ancho");
  const altoInput = document.getElementById("alto");
  const espesorInput = document.getElementById("espesor");
  const tipoVidrioInput = document.getElementById("tipoVidrio");
  const precioM2Input = document.getElementById("precioM2");
  const precioCantoML = document.getElementById("precioCantoML");
  const margenInput = document.getElementById("margenComercial");

  const btnCalcular = document.getElementById("btnCalcular");
  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnPDF = document.getElementById("btnPDF");
  const resultadoDiv = document.getElementById("resultado");
  const cantoBtns = document.querySelectorAll(".edge-btn");

  const IVA = 0.21;

  // ---- METRAJE MÍNIMO ----
  const minimo05 = document.getElementById("minimo05");
  const minimo07 = document.getElementById("minimo07");

  minimo05.addEventListener("change", () => {
    if (minimo05.checked) minimo07.checked = false;
  });
  minimo07.addEventListener("change", () => {
    if (minimo07.checked) minimo05.checked = false;
  });

  // ---- CANTOS PULIDOS ----
  let ladosActivos = [];
  cantoBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const lado = btn.dataset.edge;
      if (lado === "perimetral") {
        const todos = ["superior", "inferior", "izquierdo", "derecho"];
        const activar = ladosActivos.length !== 4;
        ladosActivos = activar ? [...todos] : [];
        cantoBtns.forEach(b => b.classList.toggle("activo", activar));
        return;
      }
      if (ladosActivos.includes(lado)) {
        ladosActivos = ladosActivos.filter(l => l !== lado);
        btn.classList.remove("activo");
      } else {
        ladosActivos.push(lado);
        btn.classList.add("activo");
      }
    });
  });

  // ---- FUNCIONES AUXILIARES ----
  const parseFormatoPauToMeters = raw => {
    if (!raw) return NaN;
    const s = String(raw).trim().replace(",", ".");
    if (!s.includes(".")) return parseFloat(s);
    const [mStr, fracRaw] = s.split(".");
    const m = parseFloat(mStr) || 0;
    let frac = (fracRaw || "").replace(/\D/g, "");
    if (frac.length > 3) frac = frac.slice(0, 3);
    while (frac.length < 3) frac += "0";
    const d1 = +frac[0] || 0, d2 = +frac[1] || 0, d3 = +frac[2] || 0;
    return m + (d1 * 10 + d2) / 100 + d3 / 1000;
  };

  const redondearAMultiplo6cm = m => !isFinite(m) ? NaN : Math.ceil(m / 0.06) * 0.06;

  const formatearMedida = m => {
    if (!isFinite(m)) return "—";
    const totalMm = Math.round(m * 1000);
    const metros = Math.floor(totalMm / 1000);
    const resto = totalMm % 1000;
    const cm = Math.floor(resto / 10);
    const mm = resto % 10;
    return `${metros} m ${cm} cm ${mm} mm`;
  };

  const calcularPerimetroML = (ancho, alto) => {
    let total = 0;
    ladosActivos.forEach(l => {
      if (["superior", "inferior"].includes(l)) total += ancho;
      if (["izquierdo", "derecho"].includes(l)) total += alto;
    });
    return total;
  };

  // ---- CÁLCULO PRINCIPAL ----
  function calcular() {
    const ancho = parseFormatoPauToMeters(anchoInput.value);
    const alto = parseFormatoPauToMeters(altoInput.value);
    const tipo = tipoVidrioInput.value.trim() || "—";
    const precioM2 = parseFloat(precioM2Input.value) || 0;
    const precioCanto = parseFloat(precioCantoML.value) || 0;
    const margen = parseFloat(margenInput.value) || 0;

    if (!ancho || !alto || !precioM2) {
      resultadoDiv.innerHTML = `<p style="color:red;">Introduce medidas y precio válidos.</p>`;
      return;
    }

    // --- Calcular áreas ---
    const anchoCorr = redondearAMultiplo6cm(ancho);
    const altoCorr = redondearAMultiplo6cm(alto);
    const areaReal = ancho * alto;
    let areaCorr = anchoCorr * altoCorr;
    let textoMinimo = "—";

    // --- Aplicar metraje mínimo solo si es menor ---
    if (minimo05.checked && areaCorr < 0.5) {
      areaCorr = 0.5;
      textoMinimo = "Metraje mínimo 0,50 m² aplicado";
    } else if (minimo07.checked && areaCorr < 0.7) {
      areaCorr = 0.7;
      textoMinimo = "Metraje mínimo 0,70 m² aplicado";
    }

    // --- Perímetro y precios ---
    const perimetro = calcularPerimetroML(anchoCorr, altoCorr);
    const precioVidrio = areaCorr * precioM2;
    const precioCantos = perimetro * precioCanto;

    let base = precioVidrio + precioCantos;
    const importeMargen = margen >
