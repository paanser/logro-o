// =========================================================
// VIDRES SOSA · CÁLCULO MANUAL (v2.4 final)
// Medidas introducidas en metros → ajustadas internamente a mm múltiplos de 6
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const btnCalcular = document.getElementById("btnCalcular");
  const btnReiniciar = document.getElementById("btnReiniciar");
  const btnPDF = document.getElementById("btnPDF");
  const edgeButtons = document.querySelectorAll(".edge-btn");
  let edgesSelected = [];

  // === BOTONES DE CANTOS ===
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

  // === FUNCIÓN: REDONDEO A MÚLTIPLOS DE 6 mm SUPERIOR ===
  function ajustarMultiploSuperior(mm) {
    if (!mm) return 0;
    const resto = mm % 6;
    return resto === 0 ? mm : mm + (6 - resto);
  }

  // === CÁLCULO PRINCIPAL ===
  btnCalcular.addEventListener("click", () => {
    const ancho_m = parseFloat(document.getElementById("ancho").value);
    const alto_m = parseFloat(document.getElementById("alto").value);
    const espesor = parseFloat(document.getElementById("espesor").value) || 0;
    const tipoVidrio = document.getElementById("tipoVidrio").value.trim();
    const ajustar = document.getElementById("ajusteMultiplo6").checked;
    const precioCanto = parseFloat(document.getElementById("precioCantoML").value) || 0;

    if (!ancho_m || !alto_m) {
      alert("Introduce ancho y alto en metros (por ejemplo 1.345).");
      return;
    }

    // Convertir a mm
    let ancho_mm = ancho_m * 1000;
    let alto_mm = alto_m * 1000;

    // Ajustar múltiplos de 6 mm superiores
    if (ajustar) {
      ancho_mm = ajustarMultiploSuperior(ancho_mm);
      alto_mm = ajustarMultiploSuperior(alto_mm);
    }

    // Convertir de nuevo a metros
    const ancho_ajustado_m = ancho_mm / 1000;
    const alto_ajustado_m = alto_mm / 1000;

    // Calcular área en m²
    const m2 = Math.ceil((ancho_ajustado_m * alto_ajustado_m) * 100) / 100;

    // Calcular perímetro según cantos seleccionados
    let perimetro = 0;
    if (edgesSelected.includes("superior")) perimetro += ancho_mm;
    if (edgesSelected.includes("inferior")) perimetro += ancho_mm;
    if (edgesSelected.includes("izquierdo")) perimetro += alto_mm;
    if (edgesSelected.includes("derecho")) perimetro += alto_mm;
    const mlCanto = perimetro / 1000;

    // Precio base €/m² (puedes vincularlo a tarifa)
    const precioM2 = 37.41;
    const base = m2 * precioM2 + mlCanto * precioCanto;
    const iva = base * 0.21;
    const total = base + iva;

    // Mostrar resultados
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.innerHTML = `
      <p><strong>Medida facturación (ajustada):</strong> ${ancho_ajustado_m.toFixed(3)} m × ${alto_ajustado_m.toFixed(3)} m</p>
      <p><small>(${Math.round(ancho_mm)} mm × ${Math.round(alto_mm)} mm)</small></p>
      <p><strong>Superficie (m²):</strong> ${m2.toFixed(2)}</p>
      <p><strong>Metros lineales pulidos:</strong> ${mlCanto.toFixed(2)}</p>
      <p><strong>Base sin IVA:</strong> ${base.toFixed(2)} €</p>
      <p><strong>IVA 21 %:</strong> ${iva.toFixed(2)} €</p>
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
  btnReiniciar.addEventListener("click", () => location.reload());

  // === EXPORTAR PDF ===
  const { jsPDF } = window.jspdf;
  btnPDF.addEventListener("click", () => {
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa - Cálculo Manual (múltiplos de 6 mm)", 50, 20);
    const resultado = document.getElementById("resultado").innerText;
    doc.setFontSize(11);
    doc.text(resultado.split("\n"), 10, 45);
    doc.save("resultado_manual.pdf");
  });
});
