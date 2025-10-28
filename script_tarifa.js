// ===== VIDRES SOSA · SCRIPT TARIFA v2.1 =====
document.addEventListener("DOMContentLoaded", () => {

  const anchoInput = document.getElementById("ancho");
  const altoInput = document.getElementById("alto");
  const tipoSelect = document.getElementById("tipoVidrio");

  const btnCantos = document.getElementById("btnCantos");
  const cantosSection = document.getElementById("cantos-section");
  const btnManualCanto = document.getElementById("btnManualCanto");
  const btnTarifaCanto = document.getElementById("btnTarifaCanto");
  const manualCantoInput = document.getElementById("manual-canto-input");
  const btnFinal = document.getElementById("btnFinal");
  const resultadoSection = document.getElementById("resultado-section");
  const resultadoDiv = document.getElementById("resultado");
  const btnPDF = document.getElementById("btnPDF");

  const ladoBtns = document.querySelectorAll(".lado-btn");
  let ladosSeleccionados = [];
  let usarTarifaCantos = false;
  let precioCantoManual = 0;
  let multiplos = [];
  let tarifaVidrios = {};

  // ===== CARGA DE MÚLTIPLOS =====
  fetch("multiplos.csv")
    .then(r => r.text())
    .then(data => {
      const lineas = data.trim().split("\n").slice(1);
      multiplos = lineas.map(l => {
        const [minimo, maximo] = l.split(",").map(Number);
        return { minimo, maximo };
      });
    });

  // ===== CARGA DE TARIFA DE VIDRIOS (con punto y coma) =====
  fetch("tarifa_vidrios.csv")
    .then(r => r.text())
    .then(data => {
      const lineas = data.trim().split("\n").slice(1);
      lineas.forEach(l => {
        const [nombre, precio] = l.split(";");
        if (!nombre || !precio) return;
        const nombreLimpio = nombre.trim();
        const precioNum = parseFloat(precio.replace(",", "."));
        tarifaVidrios[nombreLimpio.toLowerCase()] = precioNum;

        // Añadir al desplegable
        const opt = document.createElement("option");
        opt.value = nombreLimpio.toLowerCase();
        opt.textContent = nombreLimpio;
        tipoSelect.appendChild(opt);
      });
    });

  // ===== SELECCIÓN DE MEDIDAS =====
  btnCantos.addEventListener("click", () => {
    const ancho = parseFloat(anchoInput.value);
    const alto = parseFloat(altoInput.value);
    const tipo = tipoSelect.value;

    if (!ancho || !alto || !tipo) {
      alert("Completa todas las medidas y selecciona un tipo de vidrio.");
      return;
    }

    cantosSection.classList.remove("hidden");
    window.scrollTo({ top: cantosSection.offsetTop, behavior: "smooth" });
  });

  // ===== SELECCIÓN DE LADOS =====
  ladoBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const lado = btn.dataset.lado;
      if (ladosSeleccionados.includes(lado)) {
        ladosSeleccionados = ladosSeleccionados.filter(l => l !== lado);
        btn.classList.remove("active");
      } else {
        ladosSeleccionados.push(lado);
        btn.classList.add("active");
      }
    });
  });

  // ===== MODO DE CANTO =====
  btnManualCanto.addEventListener("click", () => {
    manualCantoInput.classList.remove("hidden");
    usarTarifaCantos = false;
    btnFinal.classList.remove("hidden");
  });

  btnTarifaCanto.addEventListener("click", () => {
    manualCantoInput.classList.add("hidden");
    usarTarifaCantos = true;
    btnFinal.classList.remove("hidden");
  });

  // ===== FUNCIÓN DE AJUSTE =====
  function ajustarMultiplo(valor) {
    if (multiplos.length === 0) return Math.ceil(valor / 0.06) * 0.06;
    for (let i = 0; i < multiplos.length; i++) {
      const { minimo, maximo } = multiplos[i];
      if (valor > minimo && valor <= maximo) return maximo;
    }
    return valor;
  }

  // ===== CÁLCULO FINAL =====
  btnFinal.addEventListener("click", async () => {
    const anchoReal = parseFloat(anchoInput.value);
    const altoReal = parseFloat(altoInput.value);
    const tipoSeleccionado = tipoSelect.options[tipoSelect.selectedIndex].textContent;
    precioCantoManual = parseFloat(document.getElementById("precioCantoManual").value) || 0;

    const anchoCorr = ajustarMultiplo(anchoReal);
    const altoCorr = ajustarMultiplo(altoReal);
    const areaReal = anchoReal * altoReal;
    const areaCorr = anchoCorr * altoCorr;

    const precioM2 = tarifaVidrios[tipoSeleccionado.toLowerCase()] || 0;
    if (!precioM2) {
      alert("⚠️ No se encontró el precio del vidrio en la tarifa.");
      return;
    }

    // Cálculo de cantos
    let ml = 0;
    ladosSeleccionados.forEach(lado => {
      if (lado === "top" || lado === "bottom") ml += anchoCorr;
      else ml += altoCorr;
    });

    let precioCanto = 0;
    if (usarTarifaCantos) {
      const datos = await fetch("tarifa_cantos.csv").then(r => r.text());
      const lineas = datos.trim().split("\n").slice(1);
      const [nombre, valor] = lineas[0].split(";");
      precioCanto = parseFloat(valor.replace(",", "."));
    } else {
      precioCanto = precioCantoManual;
    }

    // Totales
    const precioVidrio = areaCorr * precioM2;
    const precioCantos = ml * precioCanto;
    const subtotal = precioVidrio + precioCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    resultadoDiv.innerHTML = `
      <p><b>Vidrio:</b> ${tipoSeleccionado}</p>
      <p><b>Medidas reales:</b> ${anchoReal.toFixed(3)} × ${altoReal.toFixed(3)} m</p>
      <p><b>Medidas corregidas:</b> ${anchoCorr.toFixed(2)} × ${altoCorr.toFixed(2)} m</p>
      <p><b>Área real:</b> ${areaReal.toFixed(3)} m²</p>
      <p><b>Área corregida:</b> ${areaCorr.toFixed(3)} m²</p>
      <p><b>Cantos seleccionados:</b> ${ladosSeleccionados.length} (${ml.toFixed(2)} ml)</p>
      <p><b>Precio vidrio (tarifa):</b> ${precioVidrio.toFixed(2)} €</p>
      <p><b>Precio cantos:</b> ${precioCantos.toFixed(2)} €</p>
      <p><b>Subtotal:</b> ${subtotal.toFixed(2)} €</p>
      <p><b>IVA (21%):</b> ${iva.toFixed(2)} €</p>
      <p><b>Total:</b> ${total.toFixed(2)} €</p>
    `;

    resultadoSection.classList.remove("hidden");
    window.scrollTo({ top: resultadoSection.offsetTop, behavior: "smooth" });
  });

  // ===== PDF =====
  btnPDF.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa - Cálculo por Tarifa", 50, 20);
    doc.setFontSize(11);
    const lineas = resultadoDiv.innerText.split("\n");
    doc.text(lineas, 10, 40);
    doc.save("resultado_tarifa.pdf");
  });

});
