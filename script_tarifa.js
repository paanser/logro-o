// =========================================================
// VIDRES SOSA · CÁLCULO POR TARIFA (v2.3 FINAL)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const btnCalcularTarifa = document.getElementById("btnCalcularTarifa");
  const btnPDFTarifa = document.getElementById("btnPDFTarifa");
  const tarifaTipo = document.getElementById("tarifa-tipo");
  const tarifaResultado = document.getElementById("tarifa-resultado");

  let tarifasVidrios = {};
  let tarifasCantos = {};

  // === FUNCIÓN AJUSTAR MÚLTIPLO DE 6 SUPERIOR ===
  function ajustarMultiploSuperior(valor) {
    if (!valor) return 0;
    const resto = valor % 6;
    return resto === 0 ? valor : valor + (6 - resto);
  }

  // === CARGA DE TARIFAS CSV ===
  Promise.all([
    fetch("tarifa_vidrios.csv").then(r => r.text()),
    fetch("tarifa_cantos.csv").then(r => r.text())
  ])
    .then(([vidriosData, cantosData]) => {
      tarifasVidrios = parseCSV(vidriosData);
      tarifasCantos = parseCSV(cantosData);
      actualizarSelectorVidrios(tarifasVidrios);
    })
    .catch(err => console.error("Error cargando tarifas:", err));

  // === PARSEO DE CSV ===
  function parseCSV(text) {
    const lines = text.trim().split("\n").slice(1);
    const data = {};
    lines.forEach(line => {
      const [nombre, valor] = line.split(",");
      data[nombre.trim()] = parseFloat(valor.replace(",", "."));
    });
    return data;
  }

  // === ACTUALIZAR SELECT DE VIDRIOS ===
  function actualizarSelectorVidrios(data) {
    tarifaTipo.innerHTML = "";
    Object.keys(data).forEach(nombre => {
      const option = document.createElement("option");
      option.value = nombre;
      option.textContent = nombre;
      tarifaTipo.appendChild(option);
    });
  }

  // === CALCULAR TARIFA ===
  btnCalcularTarifa.addEventListener("click", () => {
    const ancho = parseFloat(document.getElementById("tarifa-ancho").value);
    const alto = parseFloat(document.getElementById("tarifa-alto").value);
    const tipo = tarifaTipo.value;
    const usarCantos = document.getElementById("usarCantosTarifa").checked;
    const ajustar = document.getElementById("ajusteMultiplo6Tarifa").checked;

    if (!ancho || !alto || !tipo) {
      alert("Completa todos los campos.");
      return;
    }

    // Ajuste múltiplos de 6 mm superior
    const anchoAjustado = ajustar ? ajustarMultiploSuperior(ancho) : ancho;
    const altoAjustado = ajustar ? ajustarMultiploSuperior(alto) : alto;

    // Cálculo del área en m²
    const areaM2 = Math.ceil(((anchoAjustado * altoAjustado) / 1_000_000) * 100) / 100;
    const precioM2 = tarifasVidrios[tipo] || 0;
    const precioVidrio = areaM2 * precioM2;

    // Cantos opcionales
    let precioCantos = 0;
    if (usarCantos) {
      const perimetro = ((anchoAjustado + altoAjustado) * 2) / 1000;
      const precioML = tarifasCantos["Canto Pulido"] || 0;
      precioCantos = perimetro * precioML;
    }

    const subtotal = precioVidrio + precioCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    tarifaResultado.innerHTML = `
      <p><strong>Vidrio:</strong> ${tipo}</p>
      <p><strong>Área ajustada (m²):</strong> ${areaM2.toFixed(2)}</p>
      <p><strong>Precio vidrio:</strong> ${precioVidrio.toFixed(2)} €</p>
      <p><strong>Precio cantos:</strong> ${precioCantos.toFixed(2)} €</p>
      <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)} €</p>
      <p><strong>IVA (21 %):</strong> ${iva.toFixed(2)} €</p>
      <p><strong>Total:</strong> ${total.toFixed(2)} €</p>
    `;
  });

  // === EXPORTAR PDF ===
  const { jsPDF } = window.jspdf;
  btnPDFTarifa.addEventListener("click", () => {
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa - Cálculo por Tarifa", 50, 20);
    const resultado = tarifaResultado.innerText;
    doc.setFontSize(11);
    doc.text(resultado.split("\n"), 10, 45);
    doc.save("resultado_tarifa.pdf");
  });
});
