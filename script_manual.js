// ======== VIDRES SOSA · script_manual.js v2.0 MULTIVIDRIO ======== //
document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("glassContainer");
  const addGlassBtn = document.getElementById("addGlass");
  const resumenGeneral = document.getElementById("resumenGeneral");
  const totalResumen = document.getElementById("totalResumen");
  const btnPDF = document.getElementById("btnPDF");
  const btnReiniciarTodo = document.getElementById("btnReiniciarTodo");
  const IVA = 0.21;
  let listaVidrios = [];

  // ===== FUNCIONES AUXILIARES =====
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
  const redondearAMultiplo6cm = m =>
    !isFinite(m) ? NaN : Math.ceil(m / 0.06) * 0.06;

  // ===== AÑADIR NUEVO VIDRIO =====
  addGlassBtn.addEventListener("click", () => {
    const id = Date.now();
    const card = document.createElement("div");
    card.className = "card vidrio-card";
    card.dataset.id = id;

    card.innerHTML = `
      <h3>Vidrio #${listaVidrios.length + 1}</h3>
      <div class="grid-medidas horizontal">
        <div class="campo"><label>Ancho (m)</label><input type="number" step="0.001" class="ancho"></div>
        <div class="campo"><label>Alto (m)</label><input type="number" step="0.001" class="alto"></div>
      </div>
      <div class="grid-medidas">
        <div class="campo"><label>Espesor (mm) (opcional)</label><input type="number" class="espesor"></div>
        <div class="campo"><label>Tipo de vidrio (opcional)</label><input type="text" class="tipoVidrio"></div>
      </div>
      <div class="campo"><label>Precio del m² (€)</label><input type="number" step="0.01" class="precioM2"></div>
      <div class="campo"><label>Precio ML canto (€)</label><input type="number" step="0.01" class="precioCantoML"></div>

      <div class="cantos">
        <button class="edge-btn" data-edge="superior">Superior</button>
        <button class="edge-btn" data-edge="inferior">Inferior</button>
        <button class="edge-btn" data-edge="izquierdo">Izquierdo</button>
        <button class="edge-btn" data-edge="derecho">Derecho</button>
        <button class="edge-btn" data-edge="perimetral">Perimetral</button>
      </div>

      <div class="campo">
        <label><input type="checkbox" class="minimo05"> Mínimo 0,50 m²</label><br>
        <label><input type="checkbox" class="minimo07"> Mínimo 0,70 m²</label>
      </div>

      <div class="campo"><label>Margen comercial (%)</label><input type="number" step="0.1" class="margen"></div>

      <div class="botones">
        <button class="btn verde btnCalcular">Calcular</button>
        <button class="btn rojo btnEliminar">Eliminar</button>
      </div>

      <div class="resultado"></div>
    `;
    contenedor.appendChild(card);
    resumenGeneral.style.display = "block";
    prepararVidrio(card);
  });

  // ===== CONFIGURAR FUNCIONALIDAD DE CADA VIDRIO =====
  function prepararVidrio(card) {
    const botonesCantos = card.querySelectorAll(".edge-btn");
    let ladosActivos = [];
    botonesCantos.forEach(b => {
      b.addEventListener("click", () => {
        const lado = b.dataset.edge;
        if (lado === "perimetral") {
          const todos = ["superior","inferior","izquierdo","derecho"];
          const activar = ladosActivos.length !== 4;
          ladosActivos = activar ? [...todos] : [];
          botonesCantos.forEach(bt => bt.classList.toggle("activo", activar));
          return;
        }
        if (ladosActivos.includes(lado)) {
          ladosActivos = ladosActivos.filter(l => l !== lado);
          b.classList.remove("activo");
        } else {
          ladosActivos.push(lado);
          b.classList.add("activo");
        }
      });
    });

    const calcularBtn = card.querySelector(".btnCalcular");
    const eliminarBtn = card.querySelector(".btnEliminar");
    const resultadoDiv = card.querySelector(".resultado");

    calcularBtn.addEventListener("click", () => {
      const ancho = parseFormatoPauToMeters(card.querySelector(".ancho").value);
      const alto = parseFormatoPauToMeters(card.querySelector(".alto").value);
      const precioM2 = parseFloat(card.querySelector(".precioM2").value) || 0;
      const precioCanto = parseFloat(card.querySelector(".precioCantoML").value) || 0;
      const margen = parseFloat(card.querySelector(".margen").value) || 0;
      const minimo05 = card.querySelector(".minimo05").checked;
      const minimo07 = card.querySelector(".minimo07").checked;

      if (!ancho || !alto || !precioM2) {
        resultadoDiv.innerHTML = `<p style="color:red;">Introduce medidas y precio válidos.</p>`;
        return;
      }

      const anchoCorr = redondearAMultiplo6cm(ancho);
      const altoCorr = redondearAMultiplo6cm(alto);
      const areaReal = ancho * alto;
      let areaCorr = anchoCorr * altoCorr;
      let textoMinimo = "—";

      if (minimo05 && areaCorr < 0.5) { areaCorr = 0.5; textoMinimo = "Mínimo 0,50 m²"; }
      else if (minimo07 && areaCorr < 0.7) { areaCorr = 0.7; textoMinimo = "Mínimo 0,70 m²"; }

      let perimetro = 0;
      ladosActivos.forEach(l => {
        if (["superior","inferior"].includes(l)) perimetro += anchoCorr;
        if (["izquierdo","derecho"].includes(l)) perimetro += altoCorr;
      });

      const precioVidrio = areaCorr * precioM2;
      const precioCantos = perimetro * precioCanto;
      let base = precioVidrio + precioCantos;
      const impMargen = base * (margen / 100);
      base += impMargen;
      const iva = base * IVA;
      const total = base + iva;

      resultadoDiv.innerHTML = `
        <p><b>Superficie:</b> ${areaCorr.toFixed(3)} m² (${textoMinimo})</p>
        <p><b>Perímetro cantos:</b> ${perimetro.toFixed(3)} ml</p>
        <p><b>Base:</b> ${base.toFixed(2)} €</p>
        <p><b>IVA (21 %):</b> ${iva.toFixed(2)} €</p>
        <p><b>Total:</b> ${total.toFixed(2)} €</p>
      `;

      const idx = listaVidrios.findIndex(v => v.id === card.dataset.id);
      const datos = {
        id: card.dataset.id,
        base,
        iva,
        total,
        ancho,
        alto,
        areaCorr,
        perimetro,
        precioM2,
        precioCanto,
        margen
      };
      if (idx >= 0) listaVidrios[idx] = datos;
      else listaVidrios.push(datos);
      actualizarTotalGeneral();
    });

    eliminarBtn.addEventListener("click", () => {
      listaVidrios = listaVidrios.filter(v => v.id !== card.dataset.id);
      card.remove();
      actualizarTotalGeneral();
      if (listaVidrios.length === 0) resumenGeneral.style.display = "none";
    });
  }

  // ===== TOTAL GENERAL =====
  function actualizarTotalGeneral() {
    const base = listaVidrios.reduce((s, v) => s + v.base, 0);
    const iva = listaVidrios.reduce((s, v) => s + v.iva, 0);
    const total = listaVidrios.reduce((s, v) => s + v.total, 0);
    totalResumen.innerHTML = `
      <p><strong>Base sin IVA:</strong> ${base.toFixed(2)} €</p>
      <p><strong>IVA 21 %:</strong> ${iva.toFixed(2)} €</p>
      <p><strong>Total con IVA:</strong> ${total.toFixed(2)} €</p>
    `;
  }

  // ===== PDF =====
  const { jsPDF } = window.jspdf;
  btnPDF.addEventListener("click", () => {
    if (listaVidrios.length === 0) return alert("No hay vidrios calculados.");
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa – Cálculo Manual Multividrio", 50, 20);
    doc.setFontSize(11);
    let y = 40;
    listaVidrios.forEach((v, i) => {
      doc.text(`Vidrio #${i + 1} – ${v.areaCorr.toFixed(3)} m²`, 10, y);
      y += 6;
      doc.text(
        `Base: ${v.base.toFixed(2)} €   IVA: ${v.iva.toFixed(
          2
        )} €   Total: ${v.total.toFixed(2)} €`,
        10,
        y
      );
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    const base = listaVidrios.reduce((s, v) => s + v.base, 0);
    const iva = listaVidrios.reduce((s, v) => s + v.iva, 0);
    const total = listaVidrios.reduce((s, v) => s + v.total, 0);
    doc.text(
      `TOTAL GENERAL: ${total.toFixed(2)} € (IVA ${iva.toFixed(2)} € incluido)`,
      10,
      y + 10
    );
    doc.save("resultado_multividrio.pdf");
  });

  // ===== REINICIAR TODO =====
  btnReiniciarTodo.addEventListener("click", () => {
    if (!confirm("¿Borrar todos los vidrios?")) return;
    listaVidrios = [];
    contenedor.innerHTML = "";
    resumenGeneral.style.display = "none";
  });
});