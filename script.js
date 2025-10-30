// ======== SCRIPT VIDRES SOSA CALCULADORA PRO v1.3 (formato Pau + área corregida) ======== //

document.addEventListener("DOMContentLoaded", () => {

  // --- SECCIONES ---
  const loginSection = document.getElementById("login-section");
  const menuSection = document.getElementById("menu-section");
  const manualSection = document.getElementById("manual-section");
  const tarifaSection = document.getElementById("tarifa-section");

  // --- LOGIN ---
  const btnLogin = document.getElementById("btnLogin");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("login-error");

  btnLogin.addEventListener("click", () => {
    if (passwordInput.value === "123") {
      loginSection.classList.add("hidden");
      menuSection.classList.remove("hidden");
      menuSection.classList.add("active-section");
    } else {
      loginError.textContent = "Contraseña incorrecta.";
    }
  });

  // --- BOTONES DE NAVEGACIÓN ---
  const btnManual = document.getElementById("btnManual");
  const btnTarifa = document.getElementById("btnTarifa");
  const backToMenu1 = document.getElementById("backToMenu1");
  const backToMenu2 = document.getElementById("backToMenu2");

  btnManual.addEventListener("click", () => {
    menuSection.classList.add("hidden");
    manualSection.classList.remove("hidden");
    manualSection.classList.add("active-section");
  });

  btnTarifa.addEventListener("click", () => {
    menuSection.classList.add("hidden");
    tarifaSection.classList.remove("hidden");
    tarifaSection.classList.add("active-section");
  });

  backToMenu1.addEventListener("click", () => {
    manualSection.classList.add("hidden");
    menuSection.classList.remove("hidden");
    menuSection.classList.add("active-section");
  });

  backToMenu2.addEventListener("click", () => {
    tarifaSection.classList.add("hidden");
    menuSection.classList.remove("hidden");
    menuSection.classList.add("active-section");
  });

  // ======== MODO MANUAL ======== //
  const btnCalcularManual = document.getElementById("btnCalcularManual");
  const manualResultado = document.getElementById("manual-resultado");
  const btnPDFManual = document.getElementById("btnPDFManual");

  // === SELECCIÓN DE CANTOS PULIDOS === //
  const ladoBtns = document.querySelectorAll(".canto-btn");
  let ladosActivos = [];

  ladoBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const lado = btn.dataset.lado;

      if (lado === "perimetral") {
        const todosActivos = ladosActivos.length === 4;
        ladosActivos = todosActivos ? [] : ["top", "bottom", "left", "right"];
        ladoBtns.forEach(b => {
          if (b.dataset.lado !== "perimetral") {
            b.classList.toggle("activo", !todosActivos);
          }
        });
        btn.classList.toggle("activo", !todosActivos);
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

  // --- Funciones de conversión formato Pau ---
  function parseFormatoPauToMeters(raw) {
    if (!raw) return NaN;
    const s = String(raw).trim().replace(",", ".");
    if (!s) return NaN;

    if (!s.includes(".")) return parseFloat(s);

    const [mStr, fracRaw] = s.split(".");
    const m = parseFloat(mStr) || 0;

    let frac = (fracRaw || "").replace(/\D/g, "");
    if (frac.length > 3) frac = frac.slice(0, 3);
    while (frac.length < 3) frac += "0";

    const d1 = Number(frac[0] || 0);
    const d2 = Number(frac[1] || 0);
    const d3 = Number(frac[2] || 0);

    const cm = d1 * 10 + d2;
    const mm = d3;
    return m + cm / 100 + mm / 1000;
  }

  function redondearAMultiplo6cm(m) {
    if (!isFinite(m)) return NaN;
    const paso = 0.06;
    return Math.ceil(m / paso) * paso;
  }

  function formatear(m) {
    if (!isFinite(m)) return "—";
    const totalMm = Math.round(m * 1000);
    const metros = Math.floor(totalMm / 1000);
    const resto = totalMm % 1000;
    const cm = Math.floor(resto / 10);
    const mm = resto % 10;
    return `${metros} m ${cm} cm ${mm} mm`;
  }

  // === CÁLCULO MANUAL (mejorado) === //
  function calcularManual() {
    const anchoInput = document.getElementById("manual-ancho");
    const altoInput = document.getElementById("manual-alto");
    const tipo = document.getElementById("manual-tipo").value;
    const precioM2 = parseFloat(document.getElementById("manual-precio").value);
    const precioCanto = parseFloat(document.getElementById("manual-canto-precio").value) || 0;

    const ancho = parseFormatoPauToMeters(anchoInput.value);
    const alto = parseFormatoPauToMeters(altoInput.value);

    if (!ancho || !alto || !tipo || !precioM2) {
      manualResultado.innerHTML = `<p style="color:red;">Completa todos los campos obligatorios.</p>`;
      return;
    }

    // Real
    const areaReal = ancho * alto;
    const perimetroML = calcularPerimetro(ancho * 1000, alto * 1000, ladosActivos);

    // Corregido a múltiplos de 6 cm
    const anchoCorr = redondearAMultiplo6cm(ancho);
    const altoCorr = redondearAMultiplo6cm(alto);
    const areaCorr = anchoCorr * altoCorr;

    // Cálculos económicos
    const precioVidrioReal = areaReal * precioM2;
    const precioVidrioCorr = areaCorr * precioM2;
    const precioCantos = perimetroML * precioCanto;

    const subtotalReal = precioVidrioReal + precioCantos;
    const subtotalCorr = precioVidrioCorr + precioCantos;

    const ivaReal = subtotalReal * 0.21;
    const ivaCorr = subtotalCorr * 0.21;

    const totalReal = subtotalReal + ivaReal;
    const totalCorr = subtotalCorr + ivaCorr;

    manualResultado.innerHTML = `
      <p><b>Tipo de vidrio:</b> ${tipo}</p>
      <hr>
      <p><b>Medidas reales:</b> ${formatear(ancho)} × ${formatear(alto)}</p>
      <p><b>Área real:</b> ${areaReal.toFixed(3)} m²</p>
      <p><b>Precio sin IVA (real):</b> ${subtotalReal.toFixed(2)} €</p>
      <p><b>Precio con IVA (real):</b> ${totalReal.toFixed(2)} €</p>
      <hr>
      <p><b>Medidas corregidas (múltiplos 6 cm):</b> ${formatear(anchoCorr)} × ${formatear(altoCorr)}</p>
      <p><b>Área corregida:</b> ${areaCorr.toFixed(3)} m²</p>
      <p><b>Precio sin IVA (corregido):</b> ${subtotalCorr.toFixed(2)} €</p>
      <p><b>Precio con IVA (corregido):</b> ${totalCorr.toFixed(2)} €</p>
      <hr>
      <p><b>Cantos seleccionados:</b> ${ladosActivos.join(", ") || "Ninguno"}</p>
      <p><b>Metros lineales:</b> ${perimetroML.toFixed(2)} ml</p>
      <p><b>Precio cantos:</b> ${precioCantos.toFixed(2)} €</p>
    `;
    manualResultado.classList.add("show");
    btnPDFManual.classList.remove("hidden");
  }

  btnCalcularManual.addEventListener("click", calcularManual);

  // En tiempo real
  ["manual-ancho", "manual-alto", "manual-precio"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", calcularManual);
  });

  // ======== MODO TARIFA (sin cambios) ======== //
  const btnCalcularTarifa = document.getElementById("btnCalcularTarifa");
  const tarifaTipo = document.getElementById("tarifa-tipo");
  const tarifaResultado = document.getElementById("tarifa-resultado");
  const btnPDFTarifa = document.getElementById("btnPDFTarifa");

  let tarifasVidrios = {};
  let tarifasCantos = {};

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

  function parseCSV(text) {
    const lines = text.trim().split("\n").slice(1);
    const data = {};
    lines.forEach(line => {
      const [nombre, valor] = line.split(",");
      data[nombre.trim()] = parseFloat(valor.replace(",", "."));
    });
    return data;
  }

  function actualizarSelectorVidrios(data) {
    tarifaTipo.innerHTML = "";
    Object.keys(data).forEach(nombre => {
      const option = document.createElement("option");
      option.value = nombre;
      option.textContent = nombre;
      tarifaTipo.appendChild(option);
    });
  }

  btnCalcularTarifa.addEventListener("click", () => {
    const ancho = parseFloat(document.getElementById("tarifa-ancho").value);
    const alto = parseFloat(document.getElementById("tarifa-alto").value);
    const tipo = tarifaTipo.value;
    const usarCantos = document.getElementById("usarCantosTarifa").checked;

    if (!ancho || !alto || !tipo) {
      alert("Completa todos los campos.");
      return;
    }

    const areaM2 = Math.ceil(((ancho * alto) / 1000000) * 100) / 100;
    const precioM2 = tarifasVidrios[tipo] || 0;
    const precioVidrio = areaM2 * precioM2;

    let precioCantos = 0;
    if (usarCantos) {
      const perimetro = ((ancho + alto) * 2) / 1000;
      const precioML = tarifasCantos["Canto Pulido"] || 0;
      precioCantos = perimetro * precioML;
    }

    const subtotal = precioVidrio + precioCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    tarifaResultado.innerHTML = `
      <p><b>Vidrio:</b> ${tipo}</p>
      <p><b>Área:</b> ${areaM2.toFixed(2)} m²</p>
      <p><b>Precio vidrio:</b> ${precioVidrio.toFixed(2)} €</p>
      <p><b>Precio cantos:</b> ${precioCantos.toFixed(2)} €</p>
      <p><b>Subtotal:</b> ${subtotal.toFixed(2)} €</p>
      <p><b>IVA (21%):</b> ${iva.toFixed(2)} €</p>
      <p><b>Total:</b> ${total.toFixed(2)} €</p>
    `;
    tarifaResultado.classList.add("show");
    btnPDFTarifa.classList.remove("hidden");
  });

  // ======== FUNCIONES AUXILIARES ======== //
  function calcularPerimetro(ancho, alto, lados) {
    let total = 0;
    lados.forEach(l => {
      if (l === "top" || l === "bottom") total += ancho;
      else if (l === "left" || l === "right") total += alto;
    });
    return total / 1000;
  }

  // ======== PDF ======== //
  const { jsPDF } = window.jspdf;
  function generarPDF(modo) {
    const doc = new jsPDF();
    doc.addImage("logo.png", "PNG", 10, 10, 30, 20);
    doc.setFontSize(14);
    doc.text("Vidres Sosa - Calculadora PRO", 50, 20);
    doc.setFontSize(11);

    const yStart = 40;
    const contenido = modo === "manual"
      ? manualResultado.innerText
      : tarifaResultado.innerText;

    doc.text(contenido.split("\n"), 10, yStart);
    doc.save(`resultado_${modo}.pdf`);
  }

  btnPDFManual.addEventListener("click", () => generarPDF("manual"));
  btnPDFTarifa.addEventListener("click", () => generarPDF("tarifa"));
});