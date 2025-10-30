// ======== VIDRES SOSA · script_manual.js v1.3 ======== //
// Formato Pau, áreas real y corregida, precios sin y con IVA (21%)

document.addEventListener("DOMContentLoaded", () => {
  const anchoInput = document.getElementById("ancho");
  const altoInput = document.getElementById("alto");
  const espesorInput = document.getElementById("espesor");
  const tipoVidrioInput = document.getElementById("tipoVidrio");
  const ajusteMultiplo6 = document.getElementById("ajusteMultiplo6");
  const precioCantoML = document.getElementById("precioCantoML");
  const btnCalcular = document.getElementById("btnCalcular");
  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnPDF = document.getElementById("btnPDF");
  const resultadoDiv = document.getElementById("resultado");
  const cantoBtns = document.querySelectorAll(".edge-btn");
  const IVA = 0.21;

  // -------- LADOS SELECCIONADOS --------
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

  // -------- FUNCIONES --------
  function parseFormatoPauToMeters(raw) {
    if (!raw) return NaN;
    const s = String(raw).trim().replace(",", ".");
    if (!s.includes(".")) return parseFloat(s);

    const [mStr, fracRaw] = s.split(".");
    const m = parseFloat(mStr) || 0;
    let frac = (fracRaw || "").replace(/\D/g, "");
    if (frac.length > 3) frac = frac.slice(0, 3);
    while (frac.length < 3) frac += "0";

    const d1 = +frac[0] || 0;
    const d2 = +frac[1] || 0;
    const d3 = +frac[2] || 0;

    const cm = d1 * 10 + d2;
    const mm = d3;
    return m + cm / 100 + mm / 1000;
  }

  function redondearAMultiplo6cm(m) {
    if (!isFinite(m)) return NaN;
    const paso = 0.06;
    return Math.ceil(m / paso) * paso;
  }

  function formatearMedida(m) {
    if (!isFinite(m)) return "—";
    const totalMm = Math.round(m * 1000);
    const metros = Math.floor(totalMm / 1000);
    const resto = totalMm % 1000;
    const cm = Math.floor(resto / 10);
    const mm = resto % 10;
    return `${metros} m ${cm} cm ${mm} mm`;
  }

  function calcularPerimetroML(anchoM, altoM) {
    let total = 0;
    ladosActivos.forEach(l => {
      if (l === "superior" || l === "inferior") total += anchoM;
      if (l === "izquierdo" || l === "derecho") total += altoM;
    });
    return total; // en metros lineales
  }

  // -------- CÁLCULO PRINCIPAL --------
  function calcular() {
    const ancho = parseFormatoPauToMeters(anchoInput.value);
    const alto = parseFormatoPauToMeters(altoInput.value);
    const espesor = parseFloat(espesorInput.value) || 0;
    const tipo = tipoVidrioInput.value.trim() || "Sin especificar";
    const precioCanto = parseFloat(precioCantoML.value) || 0;

    if (!ancho || !alto) {
      resultadoDiv.innerHTML = `<p style="color:red;">Introduce medidas válidas.</p>`;
      return;
    }

    const anchoCorr = ajusteMultiplo6.checked ? redondearAMultiplo6cm(ancho) : ancho;
    const altoCorr  = ajusteMultiplo6.checked ? redondearAMultiplo6cm(alto)  : alto;

    const areaReal = ancho * alto;
    const areaCorr = anchoCorr * altoCorr;

    const perimetro = calcularPerimetroML(ancho, alto);
    const perimetroCorr = calcularPerimetroML(anchoCorr, altoCorr);

    // Base de precio: suponemos que el usuario pondrá €/m²
    const precioM2 = parseFloat(prompt("Introduce precio €/m² (sin IVA):", "45")) || 0;

    const baseReal = areaReal * precioM2 + perimetro * precioCanto;
    const baseCorr = areaCorr * precioM2 + perimetroCorr * precioCanto;

    const ivaReal = baseReal * IVA;
    const ivaCorr = baseCorr * IVA;
    const totalReal = baseReal + ivaReal;
    const totalCorr = baseCorr + ivaCorr;

    resultadoDiv.innerHTML = `
      <p><b>Tipo de vidrio:</b> ${tipo}</p>
      <p><b>Espesor:</b> ${espesor} mm</p>
      <hr>
      <p><b>Medidas reales:</b> ${formatearMedida(ancho)} × ${formatearMedida(alto)}</p>
      <p><b>Área real:</b> ${areaReal.toFixed(3)} m²</p>
      <p><b>Perímetro real:</b> ${perimetro.toFixed(2)} ml</p>
      <p><b>Base sin IVA (real):</b> ${baseReal.toFixed(2)} €</p>
      <p><b>Total con IVA (real):</b> ${totalReal.toFixed(2)} €</p>
      <hr>
      <p><b>Medidas corregidas (múltiplos 6 cm):</b> ${formatearMedida(anchoCorr)} × ${formatearMedida(altoCorr)}</p>
      <p><b>Área corregida:</b> ${areaCorr.toFixed(3)} m²</p>
      <p><b>Perímetro corregido:</b> ${perimetroCorr.toFixed(2)} ml</p>
      <p><b>Base sin IVA (corregida):</b> ${baseCorr.toFixed(2)} €</p>
      <p><b>Total con IVA (corregida):</b> ${totalCorr.toFixed(2)} €</p>
    `;
  }

  // -------- BOTONES --------
  btnCalcular.addEventListener("click", calcular);

  btnReiniciar.addEventListener("click", () => {
    document.querySelectorAll("input").forEach(i => (i.value = ""));
    ladosActivos = [];
    cantoBtns.forEach(b => b.classList.remove("activo"));
    resultadoDiv.innerHTML = `
      <p><strong>Medida facturación (ajustada):</strong> —</p>
      <p><strong>Superficie (m²):</strong> —</p>
      <p><strong>Metros lineales pulidos:</strong> —</p>
      <p><strong>Base sin IVA:</strong> —</p>
      <p><strong>IVA 21 %:</strong> —</p>
      <p><strong>Total:</strong> —</p>`;
  });

  // -------- EXPORTAR PDF --------
  const { jsPDF } = window.jspdf;
  btnPDF.addEventListener("click", () => {
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa – Cálculo Manual", 50, 20);
    doc.setFontSize(11);

    const contenido = resultadoDiv.innerText.split("\n");
    doc.text(contenido, 10, 40);
    doc.save("resultado_manual.pdf");
  });
});