// ======== VIDRES SOSA · script_tarifa.js v2.2 ======== //

document.addEventListener("DOMContentLoaded", () => {
  const selectorTarifa = document.getElementById("selectorTarifa");
  const tipoVidrioSelect = document.getElementById("tipoVidrio");
  const tipoCantoSelect = document.getElementById("tipoCanto");
  const minimo05 = document.getElementById("minimo05");
  const minimo07 = document.getElementById("minimo07");
  const margenInput = document.getElementById("margenComercial");
  const anchoInput = document.getElementById("ancho");
  const altoInput = document.getElementById("alto");
  const btnCalcular = document.getElementById("btnCalcular");
  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnPDF = document.getElementById("btnPDF");
  const resultadoDiv = document.getElementById("resultado");
  const cantoBtns = document.querySelectorAll(".edge-btn");
  const IVA = 0.21;
  let ladosActivos = [];

  // === CANTOS ===
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

  // === Exclusividad metraje mínimo ===
  minimo05.addEventListener("change", () => { if (minimo05.checked) minimo07.checked = false; });
  minimo07.addEventListener("change", () => { if (minimo07.checked) minimo05.checked = false; });

  // === Cargar tarifas ===
  selectorTarifa.addEventListener("change", () => {
    if (selectorTarifa.value === "vidrios") cargarVidrios();
  });

  function cargarVidrios() {
    fetch("https://raw.githubusercontent.com/paanser/logro-o/main/tarifa_vidrios.csv")
      .then(r => r.text())
      .then(text => {
        const sep = text.includes(";") ? ";" : ",";
        const lineas = text.trim().split(/\r?\n/).slice(1);
        tipoVidrioSelect.innerHTML = `<option value="">Selecciona vidrio...</option>`;
        lineas.forEach(linea => {
          const [nombre, precio] = linea.split(sep);
          const p = parseFloat(precio.replace(",", ".").replace(/[^\d.]/g, "")) || 0;
          const n = nombre.trim();
          if (n) {
            const opt = document.createElement("option");
            opt.value = p;
            opt.textContent = `${n} — ${p.toFixed(2)} €/m²`;
            tipoVidrioSelect.appendChild(opt);
          }
        });
      });
  }

  fetch("https://raw.githubusercontent.com/paanser/logro-o/main/tarifa_cantos.csv")
    .then(r => r.text())
    .then(text => {
      const sep = text.includes(";") ? ";" : ",";
      const lineas = text.trim().split(/\r?\n/).slice(1);
      tipoCantoSelect.innerHTML = `<option value="">Selecciona canto...</option>`;
      lineas.forEach(linea => {
        const [nombre, precio] = linea.split(sep);
        const p = parseFloat(precio.replace(",", ".").replace(/[^\d.]/g, "")) || 0;
        const n = nombre.trim();
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = `${n} — ${p.toFixed(2)} €/ml`;
        tipoCantoSelect.appendChild(opt);
      });
    });

  // === FUNCIONES ===
  const parseFormato = v => {
    if (!v) return NaN;
    const s = String(v).trim().replace(",", ".");
    if (!s.includes(".")) return parseFloat(s);
    const [mStr, fracRaw] = s.split(".");
    const m = parseFloat(mStr) || 0;
    let frac = (fracRaw || "").replace(/\D/g, "");
    if (frac.length > 3) frac = frac.slice(0, 3);
    while (frac.length < 3) frac += "0";
    const d1 = +frac[0] || 0, d2 = +frac[1] || 0, d3 = +frac[2] || 0;
    return m + (d1 * 10 + d2) / 100 + d3 / 1000;
  };
  const redondear = m => !isFinite(m) ? NaN : Math.ceil(m / 0.06) * 0.06;
  const perimetroML = (a, h) => {
    let t = 0;
    ladosActivos.forEach(l => {
      if (["superior", "inferior"].includes(l)) t += a;
      if (["izquierdo", "derecho"].includes(l)) t += h;
    });
    return t;
  };

  // === CÁLCULO ===
  btnCalcular.addEventListener("click", () => {
    const ancho = parseFormato(anchoInput.value);
    const alto = parseFormato(altoInput.value);
    const precioM2 = parseFloat(tipoVidrioSelect.value) || 0;
    const precioCanto = parseFloat(tipoCantoSelect.value) || 0;
    const margen = parseFloat(margenInput.value) || 0;

    if (!ancho || !alto || !precioM2) {
      resultadoDiv.innerHTML = `<p style="color:red;">Introduce medidas válidas y selecciona un vidrio.</p>`;
      return;
    }

    const anchoCorr = redondear(ancho);
    const altoCorr = redondear(alto);
    const areaReal = ancho * alto;
    let areaCorr = anchoCorr * altoCorr;
    let textoMinimo = "—";

    if (minimo05.checked && areaCorr < 0.5) { areaCorr = 0.5; textoMinimo = "Metraje mínimo 0,50 m² aplicado"; }
    else if (minimo07.checked && areaCorr < 0.7) { areaCorr = 0.7; textoMinimo = "Metraje mínimo 0,70 m² aplicado"; }

    const perimetro = perimetroML(anchoCorr, altoCorr);
    const precioVidrio = areaCorr * precioM2;
    const precioCantos = perimetro * precioCanto;
    let base = precioVidrio + precioCantos;
    const importeMargen = margen > 0 ? base * (margen / 100) : 0;
    base += importeMargen;
    const iva = base * IVA;
    const total = base + iva;

    resultadoDiv.innerHTML = `
      <p><b>Vidrio:</b> ${tipoVidrioSelect.options[tipoVidrioSelect.selectedIndex]?.text}</p>
      <p><b>Canto:</b> ${tipoCantoSelect.options[tipoCantoSelect.selectedIndex]?.text}</p>
      <p><b>Medida real:</b> ${ancho.toFixed(3)} m × ${alto.toFixed(3)} m</p>
      <p><b>Superficie real:</b> ${areaReal.toFixed(3)} m²</p>
      <p><b>Medida ajustada:</b> ${anchoCorr.toFixed(3)} m × ${altoCorr.toFixed(3)} m</p>
      <p><b>Superficie ajustada usada:</b> ${areaCorr.toFixed(3)} m²</p>
      <p style="color:green;"><b>${textoMinimo}</b></p>
      <p><b>Metros lineales de canto:</b> ${perimetro.toFixed(3)} ml</p>
      <p><b>Precio vidrio:</b> ${precioVidrio.toFixed(2)} €</p>
      <p><b>Precio cantos:</b> ${precioCantos.toFixed(2)} €</p>
      <hr>
      <p><b>Margen comercial:</b> ${margen.toFixed(1)} % (+${importeMargen.toFixed(2)} €)</p>
      <p><b>Base sin IVA:</b> ${base.toFixed(2)} €</p>
      <p><b>IVA (21 %):</b> ${iva.toFixed(2)} €</p>
      <p><b>Total con IVA:</b> ${total.toFixed(2)} €</p>`;
  });

  btnReiniciar.addEventListener("click", () => location.reload());

  // === PDF ===
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
