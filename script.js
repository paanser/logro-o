/* =======================================
   VIDRES SOSA — SCRIPT PRINCIPAL V5 FINAL
   ======================================= */

document.addEventListener("DOMContentLoaded", () => {
  const loginDiv = document.getElementById("login");
  const appDiv = document.getElementById("app");
  const btnLogin = document.getElementById("btnLogin");
  const passInput = document.getElementById("password");
  const errorMsg = document.getElementById("error");

  if (sessionStorage.getItem("logged") === "true") {
    loginDiv.style.display = "none";
    appDiv.style.display = "block";
    initApp();
  }

  btnLogin.addEventListener("click", checkPassword);
  passInput.addEventListener("keypress", e => {
    if (e.key === "Enter") checkPassword();
  });

  function checkPassword() {
    const input = passInput.value.trim();
    const realPass = atob("MTIz"); // "123"
    if (input === realPass) {
      sessionStorage.setItem("logged", "true");
      loginDiv.style.display = "none";
      appDiv.style.display = "block";
      initApp();
    } else errorMsg.textContent = "Contraseña incorrecta.";
  }
});

function initApp() {
  const vidrioSelect = document.getElementById("vidrioSelect");
  let multiplos = [];
  let tarifa = [];

  // Cargar multiplos
  fetch("multiplos.csv")
    .then(r => r.text())
    .then(t => (multiplos = t.trim().split("\n").map(v => parseFloat(v.replace(",", "."))).filter(Boolean)))
    .catch(() => console.warn("No se pudo cargar multiplos.csv"));

  // Cargar tarifa (solo ; como separador)
  fetch("tarifa_mapfre_completa.csv")
    .then(r => r.text())
    .then(data => {
      const lineas = data.trim().split(/\r?\n/);
      vidrioSelect.innerHTML = "";
      lineas.forEach((linea, i) => {
        if (i > 0) {
          const cols = linea.split(";");
          const nombre = cols[0];
          const precio = parseFloat((cols[1] || "0").replace(",", ".")) || 0;
          const canto = parseFloat((cols[2] || "0").replace(",", ".")) || 0;
          tarifa.push({ nombre, precio, canto });
          const opt = document.createElement("option");
          opt.value = JSON.stringify({ precio, canto });
          opt.textContent = `${nombre} — ${precio.toFixed(2)} €/m²`;
          vidrioSelect.appendChild(opt);
        }
      });
    })
    .catch(() => console.warn("Error al cargar tarifa."));

  // Cambiar modos
  const btnManual = document.getElementById("btnManual");
  const btnTarifa = document.getElementById("btnTarifa");
  const manualDiv = document.getElementById("manual");
  const tarifaDiv = document.getElementById("tarifa");

  btnManual.onclick = () => setMode("manual");
  btnTarifa.onclick = () => setMode("tarifa");

  function setMode(mode) {
    const manual = mode === "manual";
    manualDiv.style.display = manual ? "block" : "none";
    tarifaDiv.style.display = manual ? "none" : "block";
    btnManual.classList.toggle("active", manual);
    btnTarifa.classList.toggle("active", !manual);
    clearResults();
  }

  function clearResults() {
    document.getElementById("resultadoManual").innerHTML = "";
    document.getElementById("resultadoTarifa").innerHTML = "";
  }

  const ajustarMultiplos = a => (multiplos.length ? multiplos.find(m => a <= m) || multiplos.at(-1) : Math.ceil(a * 100) / 100);
  const aplicarMargen = (p, m) => (m ? p * (1 + m / 100) : p);

  // ---------- MANUAL ----------
  document.getElementById("btnCalcularManual").onclick = () => calcular("manual");
  document.getElementById("btnNuevoManual").onclick = () => clearInputs("manual");
  // ---------- TARIFA ----------
  document.getElementById("btnCalcularTarifa").onclick = () => calcular("tarifa");
  document.getElementById("btnNuevoTarifa").onclick = () => clearInputs("tarifa");

  function calcular(mode) {
    const a = parseFloat(document.getElementById(`ancho${mode === "manual" ? "Manual" : "Tarifa"}`).value) || 0;
    const b = parseFloat(document.getElementById(`alto${mode === "manual" ? "Manual" : "Tarifa"}`).value) || 0;
    const u = parseInt(document.getElementById(`unidades${mode === "manual" ? "Manual" : "Tarifa"}`).value) || 1;
    const margen = parseFloat(document.getElementById(`margen${mode === "manual" ? "Manual" : "Tarifa"}`).value) || 0;
    const res = document.getElementById(`resultado${mode === "manual" ? "Manual" : "Tarifa"}`);

    let precioVidrio, precioCanto;
    if (mode === "manual") {
      precioVidrio = parseFloat(document.getElementById("precioManual").value) || 0;
      precioCanto = parseFloat(document.getElementById("precioCantoM").value) || 0;
    } else {
      const vidrio = JSON.parse(vidrioSelect.value || "{}");
      precioVidrio = vidrio.precio || 0;
      precioCanto = parseFloat(document.getElementById("precioCanto").value) || vidrio.canto || 0;
    }

    if (!a || !b || !precioVidrio) return (res.textContent = "Introduce todos los valores.");

    // Redondear lados a múltiplos de 6 cm
    const Ared = Math.ceil(a / 0.06) * 0.06;
    const Bred = Math.ceil(b / 0.06) * 0.06;
    const area = Ared * Bred;
    const ajustado = ajustarMultiplos(area);
    const precioFinal = aplicarMargen(precioVidrio, margen);

    // Cálculo de cantos
    const c = mode === "manual" ? "" : "";
    const a1 = document.getElementById(`ancho1${mode === "manual" ? "M" : ""}`).checked;
    const a2 = document.getElementById(`ancho2${mode === "manual" ? "M" : ""}`).checked;
    const l1 = document.getElementById(`largo1${mode === "manual" ? "M" : ""}`).checked;
    const l2 = document.getElementById(`largo2${mode === "manual" ? "M" : ""}`).checked;
    let ml = 0;
    if (a1) ml += Ared;
    if (a2) ml += 2 * Ared;
    if (l1) ml += Bred;
    if (l2) ml += 2 * Bred;

    const costeCantos = ml * precioCanto * u;
    const subtotalVidrio = ajustado * precioFinal * u;
    const subtotal = subtotalVidrio + costeCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    res.innerHTML = `
      <b>${mode === "manual" ? "Cálculo Manual" : vidrioSelect.selectedOptions[0].textContent}</b><br>
      Medidas introducidas: ${a.toFixed(3)} × ${b.toFixed(3)} m<br>
      Medidas ajustadas: ${Ared.toFixed(2)} × ${Bred.toFixed(2)} m<br>
      Superficie ajustada: ${ajustado.toFixed(2)} m²<br>
      Precio vidrio: ${precioFinal.toFixed(2)} €/m²<br>
      Cantos: ${ml.toFixed(2)} m × ${precioCanto.toFixed(2)} € = ${costeCantos.toFixed(2)} €<br>
      Unidades: ${u}<br>
      Subtotal: ${subtotal.toFixed(2)} €<br>
      IVA (21%): ${iva.toFixed(2)} €<br>
      <b>Total: ${total.toFixed(2)} €</b>`;
  }

  function clearInputs(mode) {
    document.querySelectorAll(`#${mode} input`).forEach(i => {
      if (i.type === "number") i.value = "";
      if (i.type === "checkbox") i.checked = false;
    });
    clearResults();
  }

  document.getElementById("btnExportarPDF").onclick = () => {
    if (!window.jspdf) return alert("Falta jsPDF para exportar.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString("es-ES");
    const texto = document.getElementById("resultadoManual").innerText || document.getElementById("resultadoTarifa").innerText || "Sin resultados para exportar.";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Vidres Sosa – Presupuesto", 20, 20);
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 20, 28);
    doc.setFont("helvetica", "normal");
    doc.text(texto, 20, 40, { maxWidth: 170 });
    doc.save(`Presupuesto_VidresSosa_${fecha.replace(/\//g, "-")}.pdf`);
  };
}