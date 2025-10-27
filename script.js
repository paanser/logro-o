/* VIDRES SOSA — SCRIPT PRINCIPAL v8 (manual funcional, Safari compatible) */

document.addEventListener("DOMContentLoaded", () => {
  const loginDiv = document.getElementById("login");
  const appDiv = document.getElementById("app");
  const btnLogin = document.getElementById("btnLogin");
  const passInput = document.getElementById("password");
  const errorMsg = document.getElementById("error");

  btnLogin.addEventListener("click", checkPassword);
  passInput.addEventListener("keypress", e => { if (e.key === "Enter") checkPassword(); });

  if (sessionStorage.getItem("logged") === "true") {
    loginDiv.style.display = "none";
    appDiv.style.display = "block";
    initApp();
  }

  function checkPassword() {
    const input = passInput.value.trim();
    const real = atob("MTIz"); // contraseña: 123
    if (input === real) {
      sessionStorage.setItem("logged", "true");
      loginDiv.style.display = "none";
      appDiv.style.display = "block";
      initApp();
    } else {
      errorMsg.textContent = "Contraseña incorrecta.";
    }
  }
});

function initApp() {
  const btnManual = document.getElementById("btnManual");
  const btnTarifa = document.getElementById("btnTarifa");
  const manualDiv = document.getElementById("manual");
  const tarifaDiv = document.getElementById("tarifa");

  const outManual = document.getElementById("resultadoManual");
  const outTarifa = document.getElementById("resultadoTarifa");

  const listaPresupuesto = [];
  let multiplos = [];

  // --- Cambio de modo
  btnManual.addEventListener("click", () => setMode("manual"));
  btnTarifa.addEventListener("click", () => setMode("tarifa"));

  function setMode(mode) {
    const isManual = mode === "manual";
    manualDiv.style.display = isManual ? "block" : "none";
    tarifaDiv.style.display = isManual ? "none" : "block";
    btnManual.classList.toggle("active", isManual);
    btnTarifa.classList.toggle("active", !isManual);
  }

  // --- Funciones auxiliares
  const ajustarPorTabla = (m2) => {
    if (!multiplos.length) return Math.round(m2 * 100) / 100;
    for (const m of multiplos) if (m2 <= m) return m;
    return multiplos[multiplos.length - 1];
  };
  const aplicarMargen = (precio, margen) => margen ? precio * (1 + margen / 100) : precio;

  // --- Cargar múltiplos
  fetch("multiplos.csv")
    .then(r => r.text())
    .then(text => {
      multiplos = text.trim().split(/\r?\n/).map(v => parseFloat(v.replace(",", "."))).filter(v => !isNaN(v)).sort((a, b) => a - b);
    })
    .catch(() => console.warn("No se pudo cargar multiplos.csv"));

  // ============================================================
  // 🧮 MODO MANUAL FUNCIONAL
  // ============================================================
  document.getElementById("btnCalcularManual").addEventListener("click", () => {
    const ancho = parseFloat(document.getElementById("anchoManual").value) || 0;
    const alto = parseFloat(document.getElementById("altoManual").value) || 0;
    const uds = parseInt(document.getElementById("unidadesManual").value) || 1;
    const pBase = parseFloat(document.getElementById("precioManual").value) || 0;
    const pCanto = parseFloat(document.getElementById("precioCantoM").value) || 0;
    const margen = parseFloat(document.getElementById("margenManual").value) || 0;

    if (!ancho || !alto) {
      alert("Introduce ancho y alto válidos.");
      return;
    }
    if (!pBase) {
      alert("Introduce el precio €/m² del vidrio.");
      return;
    }

    const Ared = Math.ceil(ancho / 0.06) * 0.06;
    const Bred = Math.ceil(alto / 0.06) * 0.06;
    const area = ajustarPorTabla(Ared * Bred);
    const pVidFinal = aplicarMargen(pBase, margen);

    // Cantos seleccionados
    const a1 = document.getElementById("ancho1M").checked;
    const a2 = document.getElementById("ancho2M").checked;
    const l1 = document.getElementById("largo1M").checked;
    const l2 = document.getElementById("largo2M").checked;
    let ml = 0;
    if (a1) ml += Ared;
    if (a2) ml += Ared;
    if (l1) ml += Bred;
    if (l2) ml += Bred;

    const costeCantos = ml * pCanto * uds;
    const subtotalVid = area * pVidFinal * uds;
    const subtotal = subtotalVid + costeCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    const bloque = `
      <div class="bloque-vidrio">
        <b>Cálculo Manual</b><br>
        Medidas introducidas: ${ancho.toFixed(2)} × ${alto.toFixed(2)} m<br>
        Ajustadas: ${Ared.toFixed(2)} × ${Bred.toFixed(2)} m = ${area.toFixed(2)} m²<br>
        Precio vidrio: ${pVidFinal.toFixed(2)} €/m² — Unidades: ${uds}<br>
        Cantos: ${ml.toFixed(2)} m × ${pCanto.toFixed(2)} € = ${costeCantos.toFixed(2)} €<br>
        Subtotal: ${subtotal.toFixed(2)} € — IVA (21%): ${iva.toFixed(2)} €<br>
        <b>Total: ${total.toFixed(2)} €</b>
      </div><hr>`;

    outManual.innerHTML += bloque;

    listaPresupuesto.push({
      nombreVid1: `Manual (${pBase.toFixed(2)} €/m²${margen ? ` +${margen}%` : ""})`,
      nombreVid2: "",
      area, uds, subtotal, iva, total
    });

    mostrarPresupuesto();

    document.querySelectorAll("#manual input").forEach(i => {
      if (i.type === "number") i.value = "";
      if (i.type === "checkbox") i.checked = false;
    });
  });

  document.getElementById("btnNuevoManual").addEventListener("click", () => {
    document.querySelectorAll("#manual input").forEach(i => {
      if (i.type === "number") i.value = "";
      if (i.type === "checkbox") i.checked = false;
    });
  });

  // ============================================================
  // 📊 PRESUPUESTO GENERAL
  // ============================================================
  function mostrarPresupuesto() {
    let html = "";
    let totalFinal = 0;
    listaPresupuesto.forEach((v, i) => {
      html += `
      <div class="bloque-vidrio">
        <b>${i + 1}. ${v.nombreVid1}</b><br>
        Superficie: ${v.area.toFixed(2)} m² — Unidades: ${v.uds}<br>
        Subtotal: ${v.subtotal.toFixed(2)} € — IVA: ${v.iva.toFixed(2)} €<br>
        <b>Total: ${v.total.toFixed(2)} €</b>
      </div><hr>`;
      totalFinal += v.total;
    });
    outTarifa.innerHTML = html + `<h3>Total general del presupuesto: ${totalFinal.toFixed(2)} €</h3>`;
  }
}
