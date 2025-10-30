// ======== VIDRES SOSA · script_tarifa.js v1.10 ======== //

document.addEventListener("DOMContentLoaded", () => {
  const anchoInput = document.getElementById("ancho");
  const altoInput = document.getElementById("alto");
  const tipoVidrioSelect = document.getElementById("tipoVidrio");
  const tipoCantoSelect = document.getElementById("tipoCanto");
  const btnCalcular = document.getElementById("btnCalcular");
  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnPDF = document.getElementById("btnPDF");
  const resultadoDiv = document.getElementById("resultado");
  const cantoBtns = document.querySelectorAll(".edge-btn");
  const IVA = 0.21;

  let ladosActivos = [];

  // ==========================
  // CONTROL DE CANTOS
  // ==========================
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

  // ==========================
  // CARGAR TARIFAS CSV
  // ==========================
  function parseCSV(text) {
    const separador = text.includes(";") ? ";" : ",";
    return text.trim().split(/\r?\n/).slice(1).map(line => {
      const [nombre, precio] = line.split(separador);
      return {
        nombre: nombre.trim(),
        precio: parseFloat(precio.replace(",", ".").replace(/[^\d.]/g, "")) || 0
      };
    });
  }

  Promise.all([
    fetch("https://raw.githubusercontent.com/paanser/logro-o/main/tarifa_vidrios.csv").then(r => r.text()),
    fetch("https://raw.githubusercontent.com/paanser/logro-o/main/tarifa_cantos.csv").then(r => r.text())
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

  // ==========================
  // FUNCIONES AUXILIARES
  // ==========================
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

  const calcularPerimetroML = (ancho, alto) => {
    let total = 0;
    ladosActivos.forEach(l => {
      if (["superior", "inferior"].includes(l)) total += ancho;
      if (["izquierdo", "derecho"].includes(l)) total += alto;
    });
    return total;
  };

  // ==========================
  // CÁLCULO PRINCIPAL
  // ==========================
  function calcular() {
    const ancho = parseFormatoPauToMeters(anchoInput.value);
    const alto = parseFormatoPauToMeters(altoInput.value);
    const precioM2 = parseFloat(tipoVidrioSelect.value) || 0;
    const precioCanto = parseFloat(tipoCantoSelect.value) || 0;
    const tipoVidrio = tipoVidrioSelect.options[tipoVidrioSelect.selectedIndex]?.text || "—";
    const tipoCanto = tipoCantoSelect.options[tipoCantoSelect.selectedIndex]?.text || "—";

    if (!ancho || !alto || !precioM2) {
      resultadoDiv.innerHTML = `<p style="color:red;">Introduce medidas válidas y selecciona un tipo de vidrio.</p>`;
      return;
    }

    const anchoCorr = redondearAMultiplo6cm(ancho);
    const altoCorr = redondearAMultiplo6cm(alto);
    const areaReal = ancho * alto;
    let areaCorr = anchoCorr * altoCorr;

    // --- Metraje mínimo ---
    let textoMinimo = "—";
    if (areaCorr < 0.5) {
      areaCorr = 0.5;
      textoMinimo = "Metraje mínimo 0,50 m² aplicado";
    }

    const perimetro = calcularPerimetroML(anchoCorr, altoCorr);
    const precioVidrio = areaCorr * precioM2;
    const precioCantos = perimetro * precioCanto;
    let base = precioVidrio + precioCantos;
    const iva = base * IVA;
    const total = base + iva;

    resultadoDiv.innerHTML = `
      <p><b>Tipo de vidrio:</b> ${tipoVidrio}</p>
      <p><b>Tipo de canto:</b> ${tipoCanto}</p>
      <p><b>Medida real:</b> ${ancho.toFixed(3)} m × ${alto.toFixed(3)} m</p>
      <p><b>Superficie real:</b> ${areaReal.toFixed(3)} m²</p>
      <p><b>Medida ajustada (múltiplos 6 cm):</b> ${anchoCorr.toFixed(3)} m × ${altoCorr.toFixed(3)} m</p>
      <p><b>Superficie ajustada usada:</b> ${areaCorr.toFixed(3)} m²</p>
      <p style="color:green;"><b>${textoMinimo}</b></p>
      <p><b>Metros lineales del canto pulido:</b> ${perimetro.toFixed(3)} ml</p>
      <p><b>Precio vidrio (${precioM2.toFixed(2)} €/m²):</b> ${precioVidrio.toFixed(2)} €</p>
      <p><b>Precio cantos (${precioCanto.toFixed(2)} €/ml):</b> ${precioCantos.toFixed(2)} €</p>
      <hr>
      <p><b>Base sin IVA:</b> ${base.toFixed(2)} €</p>
      <p><b>IVA (21 %):</b> ${iva.toFixed(2)} €</p>
      <p><b>Total con IVA:</b> ${total.toFixed(2)} €</p>
    `;
  }

  btnCalcular.addEventListener("click", calcular);

  btnReiniciar.addEventListener("click", () => {
    document.querySelectorAll("input, select").forEach(el => el.value = "");
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

  // ==========================
  // EXPORTAR PDF
  // ==========================
  const { jsPDF } = window.jspdf;
  btnPDF.addEventListener("click", () => {
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa – Cálculo por Tarifa", 50, 20);
    doc.setFontSize(11);
    const contenido = resultadoDiv.innerText.split("\n");
    doc.text(contenido, 10, 40);
    doc.save("resultado_tarifa.pdf");
  });
});
