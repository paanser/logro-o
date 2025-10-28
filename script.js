// ======== SCRIPT VIDRES SOSA CALCULADORA PRO ======== //

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
      loginSection.classList.remove("active-section");
      loginSection.classList.add("hidden");
      menuSection.classList.remove("hidden");
      menuSection.classList.add("active-section");
    } else {
      loginError.textContent = "Contraseña incorrecta.";
    }
  });

  // --- BOTONES DEL MENÚ ---
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

  const ladoBtns = document.querySelectorAll(".lado-btn");
  let ladosActivos = [];

  ladoBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const lado = btn.dataset.lado;
      if (ladosActivos.includes(lado)) {
        ladosActivos = ladosActivos.filter(l => l !== lado);
        btn.classList.remove("active");
      } else {
        ladosActivos.push(lado);
        btn.classList.add("active");
      }
    });
  });

  btnCalcularManual.addEventListener("click", () => {
    const ancho = parseFloat(document.getElementById("manual-ancho").value);
    const alto = parseFloat(document.getElementById("manual-alto").value);
    const tipo = document.getElementById("manual-tipo").value;
    const precioM2 = parseFloat(document.getElementById("manual-precio").value);
    const precioCanto = parseFloat(document.getElementById("manual-canto-precio").value) || 0;

    if (!ancho || !alto || !tipo || !precioM2) {
      alert("Completa todos los campos obligatorios.");
      return;
    }

    const areaM2 = Math.ceil(((ancho * alto) / 1000000) * 100) / 100; // m² redondeado
    const perimetroML = calcularPerimetro(ancho, alto, ladosActivos);

    const precioVidrio = areaM2 * precioM2;
    const precioCantos = perimetroML * precioCanto;
    const subtotal = precioVidrio + precioCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    manualResultado.innerHTML = `
      <p><b>Tipo de vidrio:</b> ${tipo}</p>
      <p><b>Área:</b> ${areaM2.toFixed(2)} m²</p>
      <p><b>Cantos seleccionados:</b> ${ladosActivos.length}</p>
      <p><b>Metros lineales:</b> ${perimetroML.toFixed(2)} ml</p>
      <p><b>Precio vidrio:</b> ${precioVidrio.toFixed(2)} €</p>
      <p><b>Precio cantos:</b> ${precioCantos.toFixed(2)} €</p>
      <p><b>Subtotal:</b> ${subtotal.toFixed(2)} €</p>
      <p><b>IVA (21%):</b> ${iva.toFixed(2)} €</p>
      <p><b>Total:</b> ${total.toFixed(2)} €</p>
    `;
    manualResultado.classList.add("show");
    btnPDFManual.classList.remove("hidden");
  });

  // ======== MODO TARIFA ======== //
  const btnCalcularTarifa = document.getElementById("btnCalcularTarifa");
  const tarifaTipo = document.getElementById("tarifa-tipo");
  const tarifaResultado = document.getElementById("tarifa-resultado");
  const btnPDFTarifa = document.getElementById("btnPDFTarifa");

  let tarifasVidrios = {};
  let tarifasCantos = {};

  // CARGA DE TARIFAS CSV
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
      data[nombre.trim()] = parseFloat(valor.trim());
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
    return total / 1000; // ml
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
