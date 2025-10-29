const state = {
  cantos: new Set()
};

// === INICIALIZAR ===
document.addEventListener("DOMContentLoaded", () => {
  initCantos();
  document.getElementById("btnCalcular").addEventListener("click", calcular);
  document.getElementById("btnReiniciar").addEventListener("click", reiniciar);
  document.getElementById("btnPDF").addEventListener("click", generarPDF);
});

// === CANTOS ===
function initCantos() {
  const group = document.getElementById("cantosGroup");
  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".edge-btn");
    if (!btn) return;
    const edge = btn.dataset.edge;

    // lógica toggle
    if (edge === "perimetral") {
      // desactiva todo y activa solo perimetral
      state.cantos.clear();
      document.querySelectorAll(".edge-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.cantos.add("perimetral");
    } else {
      // si está activo, desactiva
      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        state.cantos.delete(edge);
      } else {
        // si perimetral estaba activo, quítalo
        const peri = document.querySelector('[data-edge="perimetral"]');
        peri.classList.remove("active");
        state.cantos.delete("perimetral");
        btn.classList.add("active");
        state.cantos.add(edge);
      }
    }
  });
}

// === CALCULO ===
function calcular() {
  const ancho = parseFloat(document.getElementById("ancho").value) || 0;
  const alto = parseFloat(document.getElementById("alto").value) || 0;
  const espesor = parseFloat(document.getElementById("espesor").value) || 0;
  const tipoVidrio = document.getElementById("tipoVidrio").value || "Sin especificar";
  const ajuste = document.getElementById("ajusteMultiplo6").checked;
  const precioCanto = parseFloat(document.getElementById("precioCantoML").value) || 0;

  if (!ancho || !alto || !espesor) {
    alert("Introduce ancho, alto y espesor.");
    return;
  }

  const anchoFact = ajuste ? Math.ceil(ancho / 6) * 6 : ancho;
  const altoFact = ajuste ? Math.ceil(alto / 6) * 6 : alto;
  const m2 = (anchoFact / 1000) * (altoFact / 1000);

  // Calcular metros lineales de cantos
  let ml = 0;
  if (state.cantos.has("perimetral")) {
    ml = 2 * (anchoFact / 1000 + altoFact / 1000);
  } else {
    if (state.cantos.has("superior")) ml += anchoFact / 1000;
    if (state.cantos.has("inferior")) ml += anchoFact / 1000;
    if (state.cantos.has("izquierdo")) ml += altoFact / 1000;
    if (state.cantos.has("derecho")) ml += altoFact / 1000;
  }

  const base = m2 * 0 + ml * precioCanto; // sin tarifa base, solo cantos
  const iva = base * 0.21;
  const total = base + iva;

  document.getElementById("medidaFact").textContent = `${anchoFact} x ${altoFact} mm`;
  document.getElementById("m2Ajustados").textContent = m2.toFixed(3);
  document.getElementById("mlCanto").textContent = ml.toFixed(2);
  document.getElementById("base").textContent = base.toFixed(2) + " €";
  document.getElementById("iva").textContent = iva.toFixed(2) + " €";
  document.getElementById("total").textContent = total.toFixed(2) + " €";

  state.resultado = { anchoFact, altoFact, m2, ml, base, iva, total, tipoVidrio, espesor };
}

// === REINICIAR ===
function reiniciar() {
  document.querySelectorAll("input").forEach(el => el.value = "");
  document.getElementById("tipoVidrio").value = "";
  document.getElementById("ajusteMultiplo6").checked = true;
  document.querySelectorAll(".edge-btn").forEach(b => b.classList.remove("active"));
  state.cantos.clear();
  document.querySelectorAll("#resultado span").forEach(s => s.textContent = "");
}

// === PDF ===
function generarPDF() {
  if (!state.resultado) {
    alert("Calcula primero un vidrio.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Vidres Sosa - Cálculo Manual", 14, 20);
  doc.setFontSize(11);
  doc.text(`Tipo de vidrio: ${state.resultado.tipoVidrio}`, 14, 30);
  doc.text(`Espesor: ${state.resultado.espesor} mm`, 14, 38);
  doc.text(`Medida facturación: ${state.resultado.anchoFact} x ${state.resultado.altoFact} mm`, 14, 46);
  doc.text(`Superficie ajustada: ${state.resultado.m2.toFixed(3)} m²`, 14, 54);
  doc.text(`Metros lineales pulidos: ${state.resultado.ml.toFixed(2)} ml`, 14, 62);
  doc.text(`Base sin IVA: ${state.resultado.base.toFixed(2)} €`, 14, 70);
  doc.text(`IVA 21%: ${state.resultado.iva.toFixed(2)} €`, 14, 78);
  doc.text(`Total: ${state.resultado.total.toFixed(2)} €`, 14, 86);

  doc.save("Calculo_Manual_Vidres_Sosa.pdf");
}