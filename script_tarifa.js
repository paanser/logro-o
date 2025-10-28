// ===== VIDRES SOSA · TARIFA TODO EN UNO v3.0 =====
document.addEventListener("DOMContentLoaded", () => {

  const anchoInput = document.getElementById("ancho");
  const altoInput = document.getElementById("alto");
  const tipoSelect = document.getElementById("tipoVidrio");
  const btnCalcular = document.getElementById("btnCalcular");
  const resultadoDiv = document.getElementById("resultado");
  const btnPDF = document.getElementById("btnPDF");
  const ladoBtns = document.querySelectorAll(".lado-btn");
  const modoManual = document.getElementById("cantoManual");
  const modoTarifa = document.getElementById("cantoTarifa");
  const manualCantoBox = document.getElementById("manualCantoBox");
  const precioCantoInput = document.getElementById("precioCantoManual");

  let multiplos = [];
  let tarifaVidrios = {};
  let ladosSeleccionados = [];

  // === cargar múltiplos ===
  fetch("multiplos.csv")
    .then(r => r.text())
    .then(txt => {
      const rows = txt.trim().split("\n").slice(1);
      multiplos = rows.map(l => {
        const [min, max] = l.split(",").map(Number);
        return { min, max };
      });
    });

  // === cargar tarifa de vidrios (usa punto y coma y encabezados "Nombre;Precio (€)") ===
  fetch("tarifa_vidrios.csv")
    .then(r => r.text())
    .then(txt => {
      const rows = txt.trim().split("\n").slice(1);
      tipoSelect.innerHTML = '<option value="">Selecciona vidrio...</option>';
      rows.forEach(l => {
        const [nombre, precio] = l.split(";");
        if (!nombre || !precio) return;
        const name = nombre.trim();
        const val = parseFloat(precio.replace(",", "."));
        tarifaVidrios[name.toLowerCase()] = val;
        const opt = document.createElement("option");
        opt.value = name.toLowerCase();
        opt.textContent = `${name} — ${val.toFixed(2)} €/m²`;
        tipoSelect.appendChild(opt);
      });
    });

  // === selección de lados ===
  ladoBtns.forEach(b => {
    b.addEventListener("click", () => {
      const lado = b.dataset.lado;
      if (ladosSeleccionados.includes(lado)) {
        ladosSeleccionados = ladosSeleccionados.filter(x => x !== lado);
        b.classList.remove("active");
      } else {
        ladosSeleccionados.push(lado);
        b.classList.add("active");
      }
    });
  });

  // === cambio de modo canto ===
  modoManual.addEventListener("change", () => manualCantoBox.style.display = "block");
  modoTarifa.addEventListener("change", () => manualCantoBox.style.display = "none");

  // === función de ajuste ===
  const ajustar = v => {
    if (multiplos.length === 0) return Math.ceil(v / 0.06) * 0.06;
    for (const { min, max } of multiplos) if (v > min && v <= max) return max;
    return v;
  };

  // === cálculo final ===
  btnCalcular.addEventListener("click", async () => {
    const ancho = parseFloat(anchoInput.value);
    const alto = parseFloat(altoInput.value);
    const tipo = tipoSelect.options[tipoSelect.selectedIndex]?.textContent || "";
    const clave = tipoSelect.value;
    if (!ancho || !alto || !clave) return alert("⚠️ Completa medidas y tipo de vidrio.");

    const precioM2 = tarifaVidrios[clave.toLowerCase()] || 0;
    const anchoCorr = ajustar(ancho);
    const altoCorr = ajustar(alto);
    const areaReal = ancho * alto;
    const areaCorr = anchoCorr * altoCorr;

    // ml de cantos
    let ml = 0;
    ladosSeleccionados.forEach(l => {
      if (l === "top" || l === "bottom") ml += anchoCorr;
      else ml += altoCorr;
    });

    // precio canto
    let precioCanto = 0;
    if (modoTarifa.checked) {
      const datos = await fetch("tarifa_cantos.csv").then(r => r.text());
      const lineas = datos.trim().split("\n").slice(1);
      const [nombre, valor] = lineas[0].split(";");
      precioCanto = parseFloat(valor.replace(",", "."));
    } else {
      precioCanto = parseFloat(precioCantoInput.value) || 0;
    }

    // cálculos
    const precioVidrio = areaCorr * precioM2;
    const precioCantos = ml * precioCanto;
    const subtotal = precioVidrio + precioCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    resultadoDiv.innerHTML = `
      <p><b>Vidrio:</b> ${tipo}</p>
      <p><b>Medidas reales:</b> ${ancho.toFixed(3)} × ${alto.toFixed(3)} m</p>
      <p><b>Medidas corregidas:</b> ${anchoCorr.toFixed(2)} × ${altoCorr.toFixed(2)} m</p>
      <p><b>Área real:</b> ${areaReal.toFixed(3)} m²</p>
      <p><b>Área corregida:</b> ${areaCorr.toFixed(3)} m²</p>
      <p><b>Cantos seleccionados:</b> ${ladosSeleccionados.length} (${ml.toFixed(2)} ml)</p>
      <p><b>Precio vidrio:</b> ${precioVidrio.toFixed(2)} €</p>
      <p><b>Precio cantos:</b> ${precioCantos.toFixed(2)} €</p>
      <p><b>Subtotal:</b> ${subtotal.toFixed(2)} €</p>
      <p><b>IVA (21 %):</b> ${iva.toFixed(2)} €</p>
      <p><b>Total:</b> ${total.toFixed(2)} €</p>
    `;
    resultadoDiv.classList.remove("hidden");
    btnPDF.classList.remove("hidden");
    window.scrollTo({ top: resultadoDiv.offsetTop, behavior: "smooth" });
  });

  // === PDF ===
  btnPDF.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa — Cálculo por Tarifa", 50, 20);
    doc.setFontSize(11);
    const lines = resultadoDiv.innerText.split("\n");
    doc.text(lines, 10, 40);
    doc.save("resultado_tarifa.pdf");
  });

});
