// =========================================================
// VIDRES SOSA · CÁLCULO MANUAL (v2.3 FINAL)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // === BOTONES ===
  const btnCalcular = document.getElementById("btnCalcular");
  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnPDF = document.getElementById("btnPDF");

  // === CANTOS PULIDOS ===
  const edgeButtons = document.querySelectorAll(".edge-btn");
  let edgesSelected = [];

  edgeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const edge = btn.dataset.edge;

      if (edge === "perimetral") {
        const all = ["superior", "inferior", "izquierdo", "derecho"];
        const full = all.every(e => edgesSelected.includes(e));
        if (full) {
          edgesSelected = [];
          edgeButtons.forEach(b => b.classList.remove("active", "flash"));
        } else {
          edgesSelected = [...all];
          edgeButtons.forEach(b => {
            if (b.dataset.edge !== "perimetral") b.classList.add("active");
          });
          btn.classList.add("active", "flash");
          setTimeout(() => btn.classList.remove("flash"), 500);
        }
        return;
      }

      if (edgesSelected.includes(edge)) {
        edgesSelected = edgesSelected.filter(e => e !== edge);
        btn.classList.remove("active");
      } else {
        edgesSelected.push(edge);
        btn.classList.add("active");
      }
    });
  });

  // === FUNCIÓN REDONDEO A MÚLTIPLOS DE 6 SUPERIOR ===
  function ajustarMultiploSuperior(valor) {
    if (!valor) return 0;
    const resto = valor % 6;
    return resto === 0 ? valor : valor + (6 - resto);
  }

  // === CÁLCULO PRINCIPAL ===
  btnCalcular.addEventListener("click", () => {
    const ancho = parseFloat(document.getElementById("ancho").value);
    const alto = parseFloat(document.getElementById("alto").value);
    const espesor = parseFloat(document.getElementById("espesor").value) || 0;
    const tipoVidrio = document.getElementById("tipoVidrio").value.trim();
    const ajustar = document.getElementById("ajusteMultiplo6").checked;
    const precioCanto = parseFloat(document.getElementById("precioCantoML").value) || 0;

    if (!ancho || !alto) {
      alert("Introduce ancho y alto del vidrio.");
      return;
    }

    // Ajuste a múltiplos de 6 mm hacia arriba
    const anchoAjustado = ajustar ? ajustarMultiploSuperior(ancho) : ancho;
    const altoAjustado = ajustar ? ajustarMultiploSuperior(alto) : alto;

    // Área m² redondeada a dos decimales
    const m2 = Math.ceil(((anchoAjustado * altoAjustado) / 1_000_000) * 100) / 100;

    // Calcular perímetro según cantos
    let perimetro = 0;
    if (edgesSelected.includes("superior")) perimetro += anchoAjustado;
    if (edgesSelected.includes("inferior")) perimetro += anchoAjustado;
    if (edgesSelected.includes("izquierdo")) perimetro += altoAjustado;
    if (edgesSelected.includes("derecho")) perimetro += altoAjustado;
    const mlCanto = perimetro / 1000;

    // Precio €/m² base (puedes cambiarlo o hacerlo dinámico)
    const precioM2 = 37.41;
    const base = m2 * precioM2 + mlCanto * precioCanto;
    const iva = base * 0.21;
    const total = base + iva;

    // Mostrar resultados
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.innerHTML = `
      <p><strong>Medida facturación:</strong> ${anchoAjustado} x ${altoAjustado} mm</p>
      <p><strong>Superficie ajustada (m²):</strong> ${m2.toFixed(2)}</p>
      <p><strong>Metros lineales pulidos:</strong> ${mlCanto.toFixed(2)}</p>
      <p><strong>Base sin IVA:</strong> ${base.toFixed(2)} €</p>
      <p><strong>IVA 21%:</strong> ${iva.toFixed(2)} €</p>
      <p><strong>Total:</strong> ${total.toFixed(2)} €</p>
    `;

    if (tipoVidrio) {
      const info = document.createElement("p");
      info.classList.add("tipo-info");
      info.innerHTML = `<strong>Tipo de vidrio:</strong> ${tipoVidrio}`;
      resultadoDiv.appendChild(info);
    }
  });

  // === REINICIAR ===
  btnReiniciar.addEventListener("click", () => {
    document.querySelectorAll("input").forEach(el => (el.value = ""));
    document.getElementById("tipoVidrio").value = "";
    document.getElementById("resultado").innerHTML = `
      <p><strong>Medida facturación:</strong> —</p>
      <p><strong>Superficie ajustada (m²):</strong> —</p>
      <p><strong>Metros lineales pulidos:</strong> —</p>
      <p><strong>Base sin IVA:</strong> —</p>
      <p><strong>IVA 21%:</strong> —</p>
      <p><strong>Total:</strong> —</p>`;
    edgesSelected = [];
    edgeButtons.forEach(b => b.classList.remove("active"));
  });

  // === PDF ===
  const { jsPDF } = window.jspdf;

  btnPDF.addEventListener("click", () => {
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa - Cálculo Manual", 50, 20);
    const resultado = document.getElementById("resultado").innerText;
    doc.setFontSize(11);
    doc.text(resultado.split("\n"), 10, 45);
    doc.save("resultado_manual.pdf");
  });
});
