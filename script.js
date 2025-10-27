/* =======================================
   VIDRES SOSA — SCRIPT PRINCIPAL V2
   ======================================= */

// -------------------- LOGIN --------------------
document.addEventListener("DOMContentLoaded", () => {
  const loginDiv = document.getElementById("login");
  const appDiv = document.getElementById("app");
  const btnLogin = document.getElementById("btnLogin");
  const passInput = document.getElementById("password");
  const errorMsg = document.getElementById("error");

  // Mantener sesión activa
  if (sessionStorage.getItem("logged") === "true") {
    loginDiv.style.display = "none";
    appDiv.style.display = "block";
  }

  btnLogin.addEventListener("click", checkPassword);
  passInput.addEventListener("keypress", e => {
    if (e.key === "Enter") checkPassword();
  });

  function checkPassword() {
    const input = passInput.value.trim();
    const realPass = atob("MTIz"); // "123" codificado Base64
    if (input === realPass) {
      sessionStorage.setItem("logged", "true");
      loginDiv.style.display = "none";
      appDiv.style.display = "block";
    } else {
      errorMsg.textContent = "Contraseña incorrecta.";
    }
  }
});

// -------------------- MODOS --------------------
const btnManual = document.getElementById("btnManual");
const btnTarifa = document.getElementById("btnTarifa");
const manualDiv = document.getElementById("manual");
const tarifaDiv = document.getElementById("tarifa");

btnManual.addEventListener("click", () => setMode("manual"));
btnTarifa.addEventListener("click", () => setMode("tarifa"));

function setMode(mode) {
  const manualActive = mode === "manual";
  manualDiv.style.display = manualActive ? "block" : "none";
  tarifaDiv.style.display = manualActive ? "none" : "block";
  btnManual.classList.toggle("active", manualActive);
  btnTarifa.classList.toggle("active", !manualActive);
  clearResults();
}

function clearResults() {
  document.getElementById("resultadoManual").innerHTML = "";
  document.getElementById("resultadoTarifa").innerHTML = "";
}

// -------------------- CARGA DE TARIFA --------------------
const vidrioSelect = document.getElementById("vidrioSelect");
let tarifa = [];

fetch("tarifa_mapfre_completa.csv")
  .then(res => res.text())
  .then(data => {
    const lineas = data.trim().split("\n");
    lineas.forEach((linea, i) => {
      if (i > 0) {
        const cols = linea.split(";");
        const nombre = cols[0];
        const precio = parseFloat(cols[cols.length - 2].replace(",", ".")) || 0;
        const canto = parseFloat(cols[cols.length - 1].replace(",", ".")) || 0;
        tarifa.push({ nombre, precio, canto });

        const opt = document.createElement("option");
        opt.value = JSON.stringify({ precio, canto });
        opt.textContent = `${nombre} — ${precio.toFixed(2)} €/m²`;
        vidrioSelect.appendChild(opt);
      }
    });
  })
  .catch(() => console.warn("No se pudo cargar la tarifa CSV."));

// -------------------- FUNCIONES DE CÁLCULO --------------------
function ajustarMultiplos(area) {
  return Math.ceil(area / 0.06) * 0.06;
}

function aplicarMargen(precio, margen) {
  if (!margen) return precio;
  return precio * (1 + margen / 100);
}

// -------------------- CÁLCULO MANUAL --------------------
document.getElementById("btnCalcularManual").addEventListener("click", calcularManual);
document.getElementById("btnNuevoManual").addEventListener("click", () => clearInputs("manual"));

function calcularManual() {
  const ancho = parseFloat(document.getElementById("anchoManual").value) || 0;
  const alto = parseFloat(document.getElementById("altoManual").value) || 0;
  const precioBase = parseFloat(document.getElementById("precioManual").value) || 0;
  const unidades = parseInt(document.getElementById("unidadesManual").value) || 1;
  const margen = parseFloat(document.getElementById("margenManual").value) || 0;
  const resultado = document.getElementById("resultadoManual");

  if (!ancho || !alto || !precioBase) {
    resultado.textContent = "Introduce todos los valores.";
    return;
  }

  let area = ancho * alto;
  let ajustado = ajustarMultiplos(area);
  let precioUnitario = aplicarMargen(precioBase, margen);
  const subtotal = ajustado * precioUnitario * unidades;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  resultado.innerHTML = `
    <b>Cálculo Manual</b><br>
    Medidas: ${ancho.toFixed(2)} × ${alto.toFixed(2)} m = ${area.toFixed(2)} m²<br>
    Superficie ajustada: ${ajustado.toFixed(2)} m²<br>
    Precio unitario: ${precioUnitario.toFixed(2)} €/m²<br>
    Unidades: ${unidades}<br>
    Subtotal: ${subtotal.toFixed(2)} €<br>
    IVA (21%): ${iva.toFixed(2)} €<br>
    <b>Total: ${total.toFixed(2)} €</b>`;
}

// -------------------- CÁLCULO TARIFA --------------------
document.getElementById("btnCalcularTarifa").addEventListener("click", calcularTarifa);
document.getElementById("btnNuevoTarifa").addEventListener("click", () => clearInputs("tarifa"));

function calcularTarifa() {
  const ancho = parseFloat(document.getElementById("anchoTarifa").value) || 0;
  const alto = parseFloat(document.getElementById("altoTarifa").value) || 0;
  const unidades = parseInt(document.getElementById("unidadesTarifa").value) || 1;
  const margen = parseFloat(document.getElementById("margenTarifa").value) || 0;
  const vidrio = JSON.parse(document.getElementById("vidrioSelect").value || "{}");
  const precioCantoManual = parseFloat(document.getElementById("precioCanto").value) || vidrio.canto || 0;

  const cantos = {
    izq: document.getElementById("cantoIzq").checked,
    der: document.getElementById("cantoDer").checked,
    arr: document.getElementById("cantoArr").checked,
    aba: document.getElementById("cantoAba").checked
  };

  const resultado = document.getElementById("resultadoTarifa");
  if (!ancho || !alto || !vidrio.precio) {
    resultado.textContent = "Introduce todos los valores.";
    return;
  }

  const area = ancho * alto;
  const ajustado = ajustarMultiplos(area);
  const precioVidrio = aplicarMargen(vidrio.precio, margen);

  // Cálculo real de cantos
  let metrosCanto = 0;
  if (cantos.izq) metrosCanto += alto;
  if (cantos.der) metrosCanto += alto;
  if (cantos.arr) metrosCanto += ancho;
  if (cantos.aba) metrosCanto += ancho;

  const costeCantos = metrosCanto * precioCantoManual * unidades;
  const subtotalVidrio = ajustado * precioVidrio * unidades;
  const subtotal = subtotalVidrio + costeCantos;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  resultado.innerHTML = `
    <b>${document.getElementById("vidrioSelect").selectedOptions[0].textContent}</b><br>
    Medidas: ${ancho.toFixed(2)} × ${alto.toFixed(2)} m = ${area.toFixed(2)} m²<br>
    Superficie ajustada: ${ajustado.toFixed(2)} m²<br>
    Precio vidrio (m²): ${precioVidrio.toFixed(2)} €<br>
    Cantos pulidos: ${metrosCanto.toFixed(2)} m × ${precioCantoManual.toFixed(2)} € = ${costeCantos.toFixed(2)} €<br>
    Unidades: ${unidades}<br>
    Subtotal: ${subtotal.toFixed(2)} €<br>
    IVA (21%): ${iva.toFixed(2)} €<br>
    <b>Total: ${total.toFixed(2)} €</b>`;
}

// -------------------- LIMPIAR CAMPOS --------------------
function clearInputs(mode) {
  const inputs = document.querySelectorAll(`#${mode} input`);
  inputs.forEach(i => (i.value = i.type === "number" ? "" : ""));
  clearResults();
}

// -------------------- EXPORTAR A PDF --------------------
document.getElementById("btnExportarPDF").addEventListener("click", exportarPDF);

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const fecha = new Date().toLocaleDateString("es-ES");
  const manualRes = document.getElementById("resultadoManual").innerText;
  const tarifaRes = document.getElementById("resultadoTarifa").innerText;
  const contenido = manualRes || tarifaRes || "Sin resultados para exportar.";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Vidres Sosa - Presupuesto", 20, 20);
  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, 20, 28);

  doc.setFont("helvetica", "normal");
  doc.text(contenido, 20, 40, { maxWidth: 170 });
  doc.save(`Presupuesto_VidresSosa_${fecha.replace(/\//g, "-")}.pdf`);
}
