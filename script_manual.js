// ======== VIDRES SOSA · script_manual.js v1.8 ======== //

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

  // ---- METRAJE MÍNIMO (0,5 / 0,7) ----
  const minimo05 = document.getElementById("minimo05");
  const minimo07 = document.getElementById("minimo07");

  // Restringir a solo una marcada
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
    return total;
  }

  // ---- CÁLCULO PRINCIPAL ----
  function calcular() {
    const ancho = parseFormatoPauToMeters(anchoInput.value);
    const alto = parseFormatoPauToMeters(altoInput.value);
    const tipo = tipoVidrioInput.value.trim() || "—";
    const precioM2 = parseFloat(precioM2Input.value) || 0;
    const precioCanto = parseFloat(precioCantoML.value) || 0;
    const margen = parseFloat(margenInput.value) || 0;

    if (!ancho || !alto) {
      resultadoDiv.innerHTML = `<p style="color:red;">Introduce medidas válidas.</p>`;
      return;
    }

    // --- Cálculos base ---
    const anchoCorr = redondearAMultiplo6cm(ancho);
    const altoCorr = redondearAMultiplo6cm(alto);
    const areaReal = ancho * alto;
    let areaCorr = anchoCorr * altoCorr;
    let textoMinimo = "—";

    // --- Aplicar metraje mínimo si corresponde ---
    if (minimo05.checked) {
      areaCorr = 0.50;
      textoMinimo = "Metraje mínimo 0,50 m² aplicado";
    } else if (minimo07.checked) {
      areaCorr = 0.70;
      textoMinimo = "Metraje mínimo 0,70 m² aplicado";
    }

    // --- Perímetro y precios ---
    const perimetro = calcularPerimetroML(anchoCorr, altoCorr);
    const precioVidrio = areaCorr * precioM2;
    const precioCantos = perimetro * precioCanto;

    let base = precioVidrio + precioCantos;
    const importeMargen = base * (margen / 100);
    base += importeMargen;

    const iva = base * IVA;
    const total = base + iva;

    resultadoDiv.innerHTML = `
      <p><b>Medida real:</b> ${formatearMedida(ancho)} × ${formatearMedida(alto)}</p>
      <p><b>Superficie real:</b> ${areaReal.toFixed(3)} m²</p>
      <p><b>Medida ajustada (múltiplos 6 cm):</b> ${formatearMedida(anchoCorr)} × ${formatearMedida(altoCorr)}</p>
      <p><b>Superficie ajustada usada:</b> ${areaCorr.toFixed(3)} m²</p>
      <p><b>${textoMinimo}</b></p>
      <p><b>Metros lineales de canto pulido:</b> ${perimetro.toFixed(2)} ml</p>
      <p><b>Precio vidrio (${precioM2.toFixed(2)} €/m²):</b> ${precioVidrio.toFixed(2)} €</p>
      <p><b>Precio cantos (${precioCanto.toFixed(2)} €/ml):</b> ${precioCantos.toFixed(2)} €</p>
      <hr>
      <p><b>Margen comercial:</b> ${margen.toFixed(1)} % (+${importeMargen.toFixed(2)} €)</p>
      <p><b>Base sin IVA:</b> ${base.toFixed(2)} €</p>
      <p><b>IVA (21%):</b> ${iva.toFixed(2)} €</p>
      <p><b>Total con IVA:</b> ${total.toFixed(2)} €</p>
    `;
  }

  // ---- BOTONES ----
  btnCalcular.addEventListener("click", calcular);

  btnReiniciar.addEventListener("click", () => {
    document.querySelectorAll("input").forEach(i => {
      if (i.type === "checkbox" || i.type === "radio") i.checked = false;
      else i.value = "";
    });
    ladosActivos = [];
    cantoBtns.forEach(b => b.classList.remove("activo"));
    resultadoDiv.innerHTML = `
      <p><strong>Medida real:</strong> —</p>
      <p><strong>Superficie real (m²):</strong> —</p>
      <p><strong>Medida ajustada:</strong> —</p>
      <p><strong>Superficie ajustada (m²):</strong> —</p>
      <p><strong>Metros lineales del canto pulido:</strong> —</p>
      <p><strong>Precio del vidrio ajustado (m²):</strong> —</p>
      <p><strong>Precio del canto pulido (ML):</strong> —</p>
      <p><strong>Base sin IVA:</strong> —</p>
      <p><strong>IVA 21 %:</strong> —</p>
      <p><strong>Total con IVA:</strong> —</p>`;
  });

  // ---- EXPORTAR PDF ----
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