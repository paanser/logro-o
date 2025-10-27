/* VIDRES SOSA — SCRIPT PRINCIPAL v4 */

document.addEventListener("DOMContentLoaded", () => {
  const loginDiv = document.getElementById("login");
  const appDiv   = document.getElementById("app");
  const btnLogin = document.getElementById("btnLogin");
  const passInput= document.getElementById("password");
  const errorMsg = document.getElementById("error");

  // Si ya hay sesión
  if (sessionStorage.getItem("logged") === "true") {
    loginDiv.style.display = "none";
    appDiv.style.display   = "block";
    initApp();
  }

  btnLogin.addEventListener("click", checkPassword);
  passInput.addEventListener("keypress", e => { if (e.key === "Enter") checkPassword(); });

  function checkPassword(){
    const input = passInput.value.trim();
    const real  = atob("MTIz"); // "123" en Base64
    if (input === real){
      sessionStorage.setItem("logged","true");
      loginDiv.style.display = "none";
      appDiv.style.display   = "block";
      initApp();
    } else {
      errorMsg.textContent = "Contraseña incorrecta.";
    }
  }
});

function initApp(){
  // Referencias
  const btnManual = document.getElementById("btnManual");
  const btnTarifa = document.getElementById("btnTarifa");
  const manualDiv = document.getElementById("manual");
  const tarifaDiv = document.getElementById("tarifa");

  btnManual.addEventListener("click", () => setMode("manual"));
  btnTarifa.addEventListener("click", () => setMode("tarifa"));

  function setMode(mode){
    const manual = mode === "manual";
    manualDiv.style.display = manual ? "block" : "none";
    tarifaDiv.style.display = manual ? "none"  : "block";
    btnManual.classList.toggle("active", manual);
    btnTarifa.classList.toggle("active", !manual);
    clearResults();
  }

  function clearResults(){
    document.getElementById("resultadoManual").innerHTML = "";
    document.getElementById("resultadoTarifa").innerHTML = "";
  }

  // Datos y variables globales
  const vidrioSelect  = document.getElementById("vidrioSelect");
  const vidrioSelect2 = document.getElementById("vidrioSelect2");
  const cantoSelect   = document.getElementById("cantoSelect");
  let multiplos = [];
  const listaPresupuesto = [];

  // 1️⃣ Cargar múltiplos
  fetch("multiplos.csv")
    .then(r => r.text())
    .then(text => {
      multiplos = text.trim()
        .split(/\r?\n/)
        .map(v => parseFloat(v.replace(",", ".")))
        .filter(v => !Number.isNaN(v))
        .sort((a,b)=>a-b);
    })
    .catch(() => console.warn("No se pudo cargar multiplos.csv"));

  // 2️⃣ Cargar tarifa de vidrios
  fetch("tarifa_vidrios.csv")
    .then(r => r.text())
    .then(text => {
      const lineas = text.trim().split(/\r?\n/);
      [vidrioSelect, vidrioSelect2].forEach(sel => sel.innerHTML = "");
      lineas.forEach((linea, i) => {
        if (!linea.trim() || i === 0) return;
        const [nombre, precioStr] = linea.split(";");
        const precio = parseFloat(precioStr?.replace(",", ".")) || 0;
        if (!nombre) return;
        const opt = document.createElement("option");
        opt.value = precio.toFixed(2);
        opt.textContent = `${nombre} — ${precio.toFixed(2)} €/m²`;
        vidrioSelect.appendChild(opt.cloneNode(true));
        vidrioSelect2.appendChild(opt);
      });
    })
    .catch(() => console.warn("No se pudo cargar tarifa_vidrios.csv"));

  // 3️⃣ Cargar tarifa de cantos
  fetch("tarifa_cantos.csv")
    .then(r => r.text())
    .then(text => {
      const lineas = text.trim().split(/\r?\n/);
      cantoSelect.innerHTML = "";
      lineas.forEach((linea, i) => {
        if (!linea.trim() || i === 0) return;
        const [nombre, precioStr] = linea.split(";");
        const precio = parseFloat(precioStr?.replace(",", ".")) || 0;
        if (!nombre) return;
        const opt = document.createElement("option");
        opt.value = precio.toFixed(2);
        opt.textContent = `${nombre} — ${precio.toFixed(2)} €/ml`;
        cantoSelect.appendChild(opt);
      });
    })
    .catch(() => console.warn("No se pudo cargar tarifa_cantos.csv"));

  // 🧮 Utilidades
  const ajustarPorTabla = (m2) => {
    if (!multiplos.length) return Math.ceil(m2 * 100) / 100;
    for (const m of multiplos){ if (m2 <= m) return m; }
    return multiplos[multiplos.length - 1];
  };
  const aplicarMargen = (precio, margen) => margen ? precio * (1 + margen/100) : precio;

  // 4️⃣ Calcular TARIFA
  const outTarifa = document.getElementById("resultadoTarifa");
  document.getElementById("btnCalcularTarifa").addEventListener("click", ()=>{
    const ancho = parseFloat(document.getElementById("anchoTarifa").value) || 0;
    const alto  = parseFloat(document.getElementById("altoTarifa").value) || 0;
    const uds   = parseInt(document.getElementById("unidadesTarifa").value) || 1;
    const margen= parseFloat(document.getElementById("margenTarifa").value) || 0;

    if (!ancho || !alto){
      alert("Introduce medidas válidas");
      return;
    }

    // precios de vidrios
    const pVid1 = parseFloat(vidrioSelect.value || 0);
    const pVid2 = parseFloat(vidrioSelect2.value || 0);
    const precioVidrio = pVid1 + (isNaN(pVid2) ? 0 : pVid2);

    // precios de canto
    const usarTarifaCanto = document.getElementById("usarTarifaCanto").checked;
    const precioCanto = usarTarifaCanto ? parseFloat(cantoSelect.value || 0)
                                        : parseFloat(document.getElementById("precioCanto").value || 0);

    // redondeos
    const Ared = Math.ceil(ancho / 0.06) * 0.06;
    const Bred = Math.ceil(alto  / 0.06) * 0.06;
    const area = ajustarPorTabla(Ared * Bred);
    const pVidFinal = aplicarMargen(precioVidrio, margen);

    // cantos seleccionados
    const a1 = document.getElementById("ancho1").checked;
    const a2 = document.getElementById("ancho2").checked;
    const l1 = document.getElementById("largo1").checked;
    const l2 = document.getElementById("largo2").checked;
    let ml = 0;
    if (a1) ml += Ared;
    if (a2) ml += 2*Ared;
    if (l1) ml += Bred;
    if (l2) ml += 2*Bred;

    // cálculos finales
    const costeCantos = ml * precioCanto * uds;
    const subtotalVid = area * pVidFinal * uds;
    const subtotal = subtotalVid + costeCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    // guardar
    const nombreVid1 = vidrioSelect.selectedOptions[0]?.textContent || "";
    const nombreVid2 = vidrioSelect2.selectedOptions[0]?.textContent || "";
    listaPresupuesto.push({ nombreVid1, nombreVid2, area, uds, subtotal, iva, total });

    mostrarPresupuesto();

    // limpiar campos (sin borrar resultados)
    document.querySelectorAll("#tarifa input").forEach(i=>{
      if(i.type==="number") i.value="";
      if(i.type==="checkbox") i.checked=false;
    });
  });

  // 5️⃣ Mostrar presupuesto acumulado
  function mostrarPresupuesto(){
    let html = "";
    let totalFinal = 0;
    listaPresupuesto.forEach((v,i)=>{
      html += `
      <div class="bloque-vidrio">
        <b>${i+1}. ${v.nombreVid1}${v.nombreVid2 ? " + " + v.nombreVid2 : ""}</b><br>
        Superficie: ${v.area.toFixed(2)} m² — Unidades: ${v.uds}<br>
        Subtotal: ${v.subtotal.toFixed(2)} € — IVA: ${v.iva.toFixed(2)} €<br>
        <b>Total: ${v.total.toFixed(2)} €</b>
      </div><hr>`;
      totalFinal += v.total;
    });
    html += `<h3>Total general del presupuesto: ${totalFinal.toFixed(2)} €</h3>`;
    outTarifa.innerHTML = html;
  }

  // 6️⃣ Nuevo cálculo (solo limpia campos)
  document.getElementById("btnNuevoTarifa").addEventListener("click", ()=>{
    document.querySelectorAll("#tarifa input").forEach(i=>{
      if(i.type==="number") i.value="";
      if(i.type==="checkbox") i.checked=false;
    });
  });

  // 7️⃣ Exportar PDF con todos los vidrios
  document.getElementById("btnExportarPDF").addEventListener("click", ()=>{
    if (!window.jspdf){ alert("Falta jsPDF para exportar."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString("es-ES");

    let texto = "Presupuesto completo:\n\n";
    let totalFinal = 0;
    listaPresupuesto.forEach((v,i)=>{
      texto += `${i+1}. ${v.nombreVid1}${v.nombreVid2 ? " + " + v.nombreVid2 : ""}\n`;
      texto += `Superficie: ${v.area.toFixed(2)} m² — Unidades: ${v.uds}\n`;
      texto += `Subtotal: ${v.subtotal.toFixed(2)} € — IVA: ${v.iva.toFixed(2)} €\n`;
      texto += `Total: ${v.total.toFixed(2)} €\n\n`;
      totalFinal += v.total;
    });
    texto += `\nTOTAL GENERAL: ${totalFinal.toFixed(2)} €`;

    doc.setFont("helvetica","bold"); doc.setFontSize(16);
    doc.text("Vidres Sosa - Presupuesto", 20, 20);
    doc.setFontSize(10); doc.text(`Fecha: ${fecha}`, 20, 28);
    doc.setFont("helvetica","normal");
    doc.text(texto, 20, 40, { maxWidth: 170 });
    doc.save(`Presupuesto_VidresSosa_${fecha.replace(/\//g,"-")}.pdf`);
  });
}
