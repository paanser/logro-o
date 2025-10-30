// ======== VIDRES SOSA · script_tarifa.js v1.0 ======== //

document.addEventListener("DOMContentLoaded", () => {
  const anchoInput = document.getElementById("ancho");
  const altoInput = document.getElementById("alto");
  const espesorInput = document.getElementById("espesor");
  const tipoVidrioSelect = document.getElementById("tipoVidrio");
  const tipoCantoSelect = document.getElementById("tipoCanto");
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
    return total;
  }

  // -------- CARGAR CSVs --------
  Promise.all([
    fetch("tarifa_vidrios.csv").then(r => r.text()),
    fetch("tarifa_cantos.csv").then(r => r.text())
  ])
  .then(([vidriosCSV, cantosCSV]) => {
    const vidrios = parseCSV(vidriosCSV);
    const cantos = parseCSV(cantosCSV);

    vidrios.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.precio;
      opt.textContent = `${v.nombre} (${v.precio.toFixed(2)} €/m²)`;
      tipoVidrioSelect.appendChild(opt);
    });

    cantos.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.precio;
      opt.textContent = `${c.nombre} (${c.precio.toFixed(2)} €/ml)`;
      tipoCantoSelect.appendChild(opt);
    });
  })
  .catch(err => console.error("Error al cargar tarifas:", err));

  function parseCSV(text) {
    return text.trim().split("\n").slice(1).map(line => {
      const [nombre, precio] = line.split(",");
      return { nombre: nombre.trim(), precio: parseFloat(precio) || 0 };
    });
  }

  // -------- CÁLCULO PRINCIPAL --------
  function calcular() {
    const ancho = parseFormatoPauToMeters(anchoInput.value);
    const alto = parseFormatoPauToMeters(altoInput.value);
    const espesor = parseFloat(espesorInput.value) || 0;
    const tipoVidrio = tipoVidrioSelect.options[tipoVidrioSelect.selectedIndex].text || "—";
    const tipoCanto = tipoCantoSelect.options[tipoCantoSelect.selectedIndex].text || "—";
    const precioM2 = parseFloat(tipoVidrioSelect.value) || 0;
    const precioCanto = parseFloat(tipoCantoSelect.value) || 0;

    if (!ancho || !alto || !precioM2) {
      resultadoDiv.innerHTML = `<p style="color:red;">Introduce medidas válidas y selecciona un vidrio.</p>`;
      return;
    }

    const anchoCorr = redondearAMultiplo6cm(ancho);
    const altoCorr = redondearAMultiplo6cm(alto);

    const areaReal = ancho * alto;
    const areaCorr = anchoCorr * altoCorr;
    const perimetro = calcularPerimetroML(anchoCorr, altoCorr);

    const precioVidrio = areaCorr * precioM2;
    const precioCantos = perimetro * precioCanto;
    const base = precioVidrio + precioCantos;
    const iva = base * IVA;
    const total = base + iva;

    resultadoDiv.innerHTML = `
      <p><b>Tipo de vidrio:</b> ${tipoVidrio}</p>
      <p><b>Tipo de canto:</b> ${tipoCanto}</p>
      <p><b>Medida real:</b> ${formatearMedida(ancho)} × ${formatearMedida(alto)}</p>
      <p><b>Superficie real:</b> ${areaReal.toFixed(3)} m²</p>
      <p><b>Medida ajustada (múltiplos 6 cm):</b> ${formatearMedida(anchoCorr)} × ${formatearMedida(altoCorr)}</p>
      <p><b>Superficie ajustada:</b> ${areaCorr.toFixed(3)} m²</p>
      <p><b>Metros lineales del canto pulido:</b> ${perimetro.toFixed(2)} ml</p>
      <p><b>Precio del vidrio ajustado (m²):</b> ${precioVidrio.toFixed(2)} €</p>
      <p><b>Precio del canto pulido (ML):</b> ${precioCantos.toFixed(2)} €</p>
      <p><b>Base sin IVA:</b> ${base.toFixed(2)} €</p>
      <p><b>IVA (21%):</b> ${iva.toFixed(2)} €</p>
      <p><b>Total con IVA:</b> ${total.toFixed(2)} €</p>
    `;
  }

  // -------- BOTONES --------
  btnCalcular.addEventListener("click", calcular);

  btnReiniciar.addEventListener("click", () => {
    document.querySelectorAll("input").forEach(i => (i.value = ""));
    tipoVidrioSelect.selectedIndex = 0;
    tipoCantoSelect.selectedIndex = 0;
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

  // -------- EXPORTAR PDF --------
  const { jsPDF } = window.jspdf;
  btnPDF.addEventListener("click", () => {
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa – Cálculo por Tarifa Mapfre", 50, 20);
    doc.setFontSize(11);
    const contenido = resultadoDiv.innerText.split("\n");
    doc.text(contenido, 10, 40);
    doc.save("resultado_tarifa.pdf");
  });
});