/* VIDRES SOSA — SCRIPT PRINCIPAL V2 */

document.addEventListener("DOMContentLoaded", () => {
  const loginDiv = document.getElementById("login");
  const appDiv   = document.getElementById("app");
  const btnLogin = document.getElementById("btnLogin");
  const passInput= document.getElementById("password");
  const errorMsg = document.getElementById("error");

  // Control de sesión
  if (sessionStorage.getItem("logged") === "true") {
    loginDiv.style.display = "none";
    appDiv.style.display   = "block";
    initApp();
  }

  btnLogin.addEventListener("click", checkPassword);
  passInput.addEventListener("keypress", e => { if (e.key === "Enter") checkPassword(); });

  function checkPassword(){
    const input = passInput.value.trim();
    const real  = atob("MTIz"); // contraseña: 123
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
  // Botones de modo
  const btnManual = document.getElementById("btnManual");
  const btnTarifa = document.getElementById("btnTarifa");
  const manualDiv = document.getElementById("manual");
  const tarifaDiv = document.getElementById("tarifa");

  btnManual.addEventListener("click", () => setMode("manual"));
  btnTarifa.addEventListener("click", () => setMode("tarifa"));

  function setMode(mode){
    const manual = mode === "manual";
    manualDiv.style.display = manual ? "block" : "none";
    tarifaDiv.style.display = manual ? "none" : "block";
    btnManual.classList.toggle("active", manual);
    btnTarifa.classList.toggle("active", !manual);
    clearResults();
  }

  function clearResults(){
    document.getElementById("resultadoManual").innerHTML = "";
    document.getElementById("resultadoTarifa").innerHTML = "";
  }

  // Cargar datos
  const vidrioSelect  = document.getElementById("vidrioSelect");
  const vidrioSelect2 = document.getElementById("vidrioSelect2");
  const cantoSelect   = document.getElementById("cantoSelect");

  let multiplos = [];
  let tarifaVidrios = [];
  let tarifaCantos  = [];

  // --- Cargar múltiplos ---
  fetch("multiplos.csv")
    .then(r => r.text())
    .then(text => {
      multiplos = text.trim()
        .split(/\r?\n/)
        .map(v => parseFloat(v.replace(",", ".")))
        .filter(v => !Number.isNaN(v))
        .sort((a,b)=>a-b);
    });

  // --- Cargar TARIFA VIDRIOS ---
  fetch("tarifa_vidrios.csv")
    .then(r => r.text())
    .then(text => {
      const lineas = text.trim().split(/\r?\n/);
      tarifaVidrios = [];
      [vidrioSelect, vidrioSelect2].forEach(sel => sel.innerHTML = "");
      lineas.forEach((linea, i) => {
        if (!linea.trim() || i === 0) return;
        const [nombre, precioStr] = linea.split(";");
        const precio = parseFloat(precioStr.replace(",", ".")) || 0;
        if (!nombre) return;
        tarifaVidrios.push({ nombre, precio });
        const opt = document.createElement("option");
        opt.value = precio.toFixed(2);
        opt.textContent = `${nombre} — ${precio.toFixed(2)} €/m²`;
        vidrioSelect.appendChild(opt.cloneNode(true));
        vidrioSelect2.appendChild(opt);
      });
    });

  // --- Cargar TARIFA CANTOS ---
  fetch("tarifa_cantos.csv")
    .then(r => r.text())
    .then(text => {
      const lineas = text.trim().split(/\r?\n/);
      cantoSelect.innerHTML = "";
      tarifaCantos = [];
      lineas.forEach((linea, i) => {
        if (!linea.trim() || i === 0) return;
        const [nombre, precioStr] = linea.split(";");
        const precio = parseFloat(precioStr.replace(",", ".")) || 0;
        tarifaCantos.push({ nombre, precio });
        const opt = document.createElement("option");
        opt.value = precio.toFixed(2);
        opt.textContent = `${nombre} — ${precio.toFixed(2)} €/ml`;
        cantoSelect.appendChild(opt);
      });
    });

  // Funciones útiles
  const ajustarPorTabla = (m2) => {
    if (!multiplos.length) return Math.ceil(m2 * 100) / 100;
    for (const m of multiplos){ if (m2 <= m) return m; }
    return multiplos[multiplos.length - 1];
  };
  const aplicarMargen = (precio, margen) => margen ? precio * (1 + margen/100) : precio;

  // --- CALCULAR TARIFA ---
  document.getElementById("btnCalcularTarifa").addEventListener("click", ()=>{
    const ancho = parseFloat(document.getElementById("anchoTarifa").value) || 0;
    const alto  = parseFloat(document.getElementById("altoTarifa").value) || 0;
    const uds   = parseInt(document.getElementById("unidadesTarifa").value) || 1;
    const margen= parseFloat(document.getElementById("margenTarifa").value) || 0;
    const out   = document.getElementById("resultadoTarifa");

    if (!ancho || !alto){
      out.textContent = "Introduce medidas válidas.";
      return;
    }

    const pVid1 = parseFloat(vidrioSelect.value || 0);
    const pVid2 = parseFloat(vidrioSelect2.value || 0);
    const precioVidrio = pVid1 + (isNaN(pVid2) ? 0 : pVid2);

    const usarTarifaCanto = document.getElementById("usarTarifaCanto").checked;
    const precioCanto = usarTarifaCanto ? parseFloat(cantoSelect.value || 0)
                                        : parseFloat(document.getElementById("precioCanto").value || 0);

    const Ared = Math.ceil(ancho / 0.06) * 0.06;
    const Bred = Math.ceil(alto  / 0.06) * 0.06;
    const area  = ajustarPorTabla(Ared * Bred);
    const pVidFinal = aplicarMargen(precioVidrio, margen);

    const a1 = document.getElementById("ancho1").checked;
    const a2 = document.getElementById("ancho2").checked;
    const l1 = document.getElementById("largo1").checked;
    const l2 = document.getElementById("largo2").checked;
    let ml = 0;
    if (a1) ml += Ared;
    if (a2) ml += 2*Ared;
    if (l1) ml += Bred;
    if (l2) ml += 2*Bred;

    const costeCantos = ml * precioCanto * uds;
    const subtotalVid = area * pVidFinal * uds;
    const subtotal = subtotalVid + costeCantos;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    out.innerHTML = `
      <b>Presupuesto Vidrio</b><br>
      Medidas: ${ancho.toFixed(3)} × ${alto.toFixed(3)} m<br>
      Ajustadas: ${Ared.toFixed(2)} × ${Bred.toFixed(2)} m<br>
      Superficie: ${area.toFixed(2)} m²<br>
      Precio vidrio total: ${pVidFinal.toFixed(2)} €/m²<br>
      Cantos: ${ml.toFixed(2)} m × ${precioCanto.toFixed(2)} € = ${costeCantos.toFixed(2)} €<br>
      Unidades: ${uds}<br>
      Subtotal: ${subtotal.toFixed(2)} €<br>
      IVA (21%): ${iva.toFixed(2)} €<br>
      <b>Total: ${total.toFixed(2)} €</b>`;
  });

  // Exportar PDF
  document.getElementById("btnExportarPDF").addEventListener("click", ()=>{
    if (!window.jspdf){ alert("Falta jsPDF para exportar."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString("es-ES");
    const contenido = document.getElementById("resultadoManual").innerText
                   || document.getElementById("resultadoTarifa").innerText
                   || "Sin resultados.";
    doc.setFont("helvetica","bold"); doc.setFontSize(16);
    doc.text("Vidres Sosa - Presupuesto", 20, 20);
    doc.setFontSize(10); doc.text(`Fecha: ${fecha}`, 20, 28);
    doc.setFont("helvetica","normal");
    doc.text(contenido, 20, 40, { maxWidth: 170 });
    doc.save(`Presupuesto_VidresSosa_${fecha.replace(/\//g,"-")}.pdf`);
  });
}
