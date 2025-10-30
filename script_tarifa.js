// =========================================================
// VIDRES SOSA · SCRIPT TARIFA MAPFRE
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const ancho = document.getElementById("ancho");
  const alto = document.getElementById("alto");
  const vidrioSelect = document.getElementById("vidrio");
  const cantoSelect = document.getElementById("canto");
  const calcularBtn = document.getElementById("calcular");
  const nuevoBtn = document.getElementById("nuevo");
  const pdfBtn = document.getElementById("pdf");

  const superficieTxt = document.getElementById("superficie");
  const precioVidrioTxt = document.getElementById("precioVidrio");
  const precioCantosTxt = document.getElementById("precioCantos");
  const subtotalTxt = document.getElementById("subtotal");
  const ivaTxt = document.getElementById("iva");
  const totalTxt = document.getElementById("total");

  let tarifasVidrio = [];
  let tarifasCantos = [];
  let precioVidrio = 0;
  let precioCanto = 0;

  // === Cargar CSVs ===
  Promise.all([
    fetch("tarifa_vidrios.csv").then(r => r.text()),
    fetch("tarifa_cantos.csv").then(r => r.text())
  ])
  .then(([vidriosCSV, cantosCSV]) => {
    tarifasVidrio = parseCSV(vidriosCSV);
    tarifasCantos = parseCSV(cantosCSV);
    cargarOpciones(vidrioSelect, tarifasVidrio);
    cargarOpciones(cantoSelect, tarifasCantos);
  })
  .catch(err => console.error("Error al cargar tarifas:", err));

  function parseCSV(text) {
    return text.trim().split("\n").slice(1).map(line => {
      const [nombre, precio] = line.split(",");
      return { nombre: nombre.trim(), precio: parseFloat(precio) || 0 };
    });
  }

  function cargarOpciones(select, lista) {
    lista.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.precio;
      opt.textContent = `${item.nombre} (${item.precio.toFixed(2)} €/m²)`;
      select.appendChild(opt);
    });
  }

  // === Calcular ===
  calcularBtn.addEventListener("click", () => {
    const anchoCm = parseFloat(ancho.value);
    const altoCm = parseFloat(alto.value);
    if (!anchoCm || !altoCm || !vidrioSelect.value) {
      alert("Introduce medidas y selecciona un tipo de vidrio.");
      return;
    }

    precioVidrio = parseFloat(vidrioSelect.value);
    precioCanto = parseFloat(cantoSelect.value) || 0;

    const anchoM = Math.ceil(anchoCm / 6) * 6 / 100;
    const altoM = Math.ceil(altoCm / 6) * 6 / 100;
    const superficie = anchoM * altoM;

    // Cálculo de cantos seleccionados
    let metrosLineales = 0;
    if (document.getElementById("canto-superior").checked) metrosLineales += anchoM;
    if (document.getElementById("canto-inferior").checked) metrosLineales += anchoM;
    if (document.getElementById("canto-izquierda").checked) metrosLineales += altoM;
    if (document.getElementById("canto-derecha").checked) metrosLineales += altoM;

    const precioVidrioTotal = superficie * precioVidrio;
    const precioCantosTotal = metrosLineales * precioCanto;
    const subtotal = precioVidrioTotal + precioCantosTotal;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    superficieTxt.textContent = `Superficie ajustada: ${superficie.toFixed(3)} m²`;
    precioVidrioTxt.textContent = `Precio vidrio: ${precioVidrioTotal.toFixed(2)} €`;
    precioCantosTxt.textContent = `Precio cantos: ${precioCantosTotal.toFixed(2)} €`;
    subtotalTxt.textContent = `Subtotal (sin IVA): ${subtotal.toFixed(2)} €`;
    ivaTxt.textContent = `IVA (21 %): ${iva.toFixed(2)} €`;
    totalTxt.textContent = `Total con IVA: ${total.toFixed(2)} €`;
  });

  // === Nuevo cálculo ===
  nuevoBtn.addEventListener("click", () => {
    [ancho, alto].forEach(el => el.value = "");
    vidrioSelect.selectedIndex = 0;
    cantoSelect.selectedIndex = 0;
    document.querySelectorAll(".cantos input").forEach(c => c.checked = false);
    [superficieTxt, precioVidrioTxt, precioCantosTxt, subtotalTxt, ivaTxt, totalTxt]
      .forEach(el => el.textContent = "-");
  });

  // === Exportar PDF ===
  pdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Vidres Sosa · Cálculo por Tarifa Mapfre", 10, 15);
    doc.setFontSize(11);
    doc.text(`Medidas: ${ancho.value} x ${alto.value} cm`, 10, 30);
    doc.text(`Vidrio: ${vidrioSelect.options[vidrioSelect.selectedIndex].text}`, 10, 40);
    doc.text(`Canto: ${cantoSelect.options[cantoSelect.selectedIndex].text}`, 10, 50);
    doc.text(superficieTxt.textContent, 10, 70);
    doc.text(precioVidrioTxt.textContent, 10, 80);
    doc.text(precioCantosTxt.textContent, 10, 90);
    doc.text(subtotalTxt.textContent, 10, 100);
    doc.text(ivaTxt.textContent, 10, 110);
    doc.text(totalTxt.textContent, 10, 120);
    doc.save("presupuesto_tarifa.pdf");
  });
});