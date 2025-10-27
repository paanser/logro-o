/* VIDRES SOSA — SCRIPT PRINCIPAL */

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
    const real  = atob("MTIz"); // "123"
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
  const btnManual = document.getElementById("btnManual");
  const btnTarifa = document.getElementById("btnTarifa");
  const manualDiv = document.getElementById("manual");
  const tarifaDiv = document.getElementById("tarifa");
  const vidrioSelect = document.getElementById("vidrioSelect");

  let multiplos = [];
  let tarifa = [];
  let presupuestos = []; // 👈 varios vidrios

  // === Modo de visualización ===
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

  // === Cargar múltiplos ===
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

  // === Cargar tarifa Mapfre (CSV real con 4 columnas: Código, Unidad, Descripción, Precio (€)) ===
  fetch("tarifa_mapfre_completa.csv")
    .then(r => r.text())
    .then(text => {
      const lineas = text.trim().split(/\r?\n/);
      vidrioSelect.innerHTML = "";
      tarifa = [];

      lineas.forEach((linea, i) => {
        if (i === 0) return; // saltar cabecera
        const cols = linea.split(","); // separador coma
        if (cols.length < 4) return;

        const codigo = cols[0].trim();
        const unidad = cols[1].trim();
        const descripcion = cols[2].replace(/^m2\.?\s*/i, "").trim(); // eliminar "m2." del principio
        const precio = parseFloat(cols[3].replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;

        if (!descripcion || precio <= 0) return;
        tarifa.push({ codigo, unidad, descripcion, precio });

        const opt = document.createElement("option");
        opt.value = JSON.stringify({ codigo, unidad, precio });
        opt.textContent = `${descripcion} — ${precio.toFixed(2)} €/m²`;
        vidrioSelect.appendChild(opt);
      });
    })
    .catch(() => console.warn("No se pudo cargar tarifa_mapfre_completa.csv"));

  // === Funciones útiles ===
  const ajustarPorTabla = (m2) => {
    if (!multiplos.length) return Math.ceil(m2 * 100) / 100;
    for (const m of multiplos){ if (m2 <= m) return m; }
    return multiplos[multiplos.length - 1];
  };
  const aplicarMargen = (precio, margen) => margen ? precio * (1 + margen/100) : precio;

  // === Eventos de botones ===
  document.getElementById("btnCalcularManual").addEventListener("click", () => calcular("manual"));
  document.getElementById("btnNuevoManual").addEventListener("click", () => clearInputs("manual"));
  document.getElementById("btnCalcularTarifa").addEventListener("click", () => calcular("tarifa"));
  document.getElementById("btnNuevoTarifa").addEventListener("click", () => clearInputs("tarifa"));

  function calcular(mode){
    const isManual = mode === "manual";
    const ancho = parseFloat(document.getElementById(isManual ? "anchoManual":"anchoTarifa").value) || 0;
    const alto  = parseFloat(document.getElementById(isManual ? "altoManual":"altoTarifa").value) || 0;
    const uds   = parseInt(document.getElementById(isManual ? "unidadesManual":"unidadesTarifa").value) || 1;
    const margen= parseFloat(document.getElementById(isManual ? "margenManual":"margenTarifa").value) || 0;
    const out   = document.getElementById(isManual ? "resultadoManual":"resultadoTarifa");

    let precioVidrio = 0;
    let precioCanto  = 0;
    let tipoNombre   = "";

    if (isManual){
      precioVidrio = parseFloat(document.getElementById("precioManual").value) || 0;
      precioCanto  = parseFloat(document.getElementById("precioCantoM").value) || 0;
      tipoNombre   = "Vidrio manual";
    } else {
      const opt = document.getElementById("vidrioSelect").selectedOptions[0];
      const vidrio = opt ? JSON.parse(opt.value) : {};
      tipoNombre   = opt ? opt.textContent.split("—")[0].trim() : "Vidrio tarifa";
      precioVidrio = parseFloat(vidrio.precio || 0) || 0;
      precioCanto  = parseFloat(document.getElementById("precioCanto").value) || 0;
    }

    // Validación básica
    if (!ancho || !alto || !precioVidrio){
      out.textContent = "Introduce ancho, alto y tipo de vidrio.";
      return;
    }

    // Cálculos principales
    const Ared = Math.ceil(ancho / 0.06) * 0.06;
    const Bred = Math.ceil(alto  / 0.06) * 0.06;
    const areaLados = Ared * Bred;
    const m2Ajust   = ajustarPorTabla(areaLados);
    const pVidrioFinal = aplicarMargen(precioVidrio, margen);

    // Cantos
    const a1 = document.getElementById(isManual ? "ancho1M":"ancho1").checked;
    const a2 = document.getElementById(isManual ? "ancho2M":"ancho2").checked;
    const l1 = document.getElementById(isManual ? "largo1M":"largo1").checked;
    const l2 = document.getElementById(isManual ? "largo2M":"largo2").checked;

    let ml = 0;
    if (a1) ml += Ared;
    if (a2) ml += Ared;
    if (l1) ml += Bred;
    if (l2) ml += Bred;

    const costeCantos = ml * precioCanto * uds;
    const subtotalVid = m2Ajust * pVidrioFinal * uds;
    const subtotal    = subtotalVid + costeCantos;
    const iva         = subtotal * 0.21;
    const total       = subtotal + iva;

    // Mostrar resultado
    const texto = `
      <b>${tipoNombre}</b><br>
      Medidas: ${ancho.toFixed(2)} × ${alto.toFixed(2)} m<br>
      Ajustadas: ${Ared.toFixed(2)} × ${Bred.toFixed(2)} m → ${m2Ajust.toFixed(2)} m²<br>
      Precio vidrio: ${pVidrioFinal.toFixed(2)} €/m²<br>
      Cantos: ${ml.toFixed(2)} m × ${precioCanto.toFixed(2)} € = ${costeCantos.toFixed(2)} €<br>
      Unidades: ${uds}<br>
      Subtotal: ${subtotal.toFixed(2)} €<br>
      IVA (21%): ${iva.toFixed(2)} €<br>
      <b>Total: ${total.toFixed(2)} €</b><hr>`;

    out.innerHTML = texto;

    // Guardar en lista de presupuestos
    presupuestos.push({
      tipo: tipoNombre,
      ancho, alto, Ared, Bred,
      m2Ajust, uds, precioVidrio, precioCanto, costeCantos, subtotal, iva, total
    });

    // Preguntar si quiere añadir otro vidrio
    setTimeout(()=>{
      if (confirm("¿Quieres añadir otro vidrio al presupuesto?")) {
        clearInputs(mode);
      } else {
        mostrarPresupuestoFinal();
      }
    }, 200);
  }

  function clearInputs(mode){
    document.querySelectorAll(`#${mode} input`).forEach(i=>{
      if(i.type==="number") i.value="";
      if(i.type==="checkbox") i.checked=false;
    });
    clearResults();
  }

  function mostrarPresupuestoFinal(){
    let totalFinal = 0;
    let html = "<h3>Presupuesto completo</h3>";
    presupuestos.forEach((p, i) => {
      html += `<b>${i+1}. ${p.tipo}</b><br>
      ${p.Ared.toFixed(2)} × ${p.Bred.toFixed(2)} m → ${p.m2Ajust.toFixed(2)} m²<br>
      Subtotal: ${p.subtotal.toFixed(2)} € — IVA: ${p.iva.toFixed(2)} €<br>
      <b>Total: ${p.total.toFixed(2)} €</b><hr>`;
      totalFinal += p.total;
    });
    html += `<h2>Total general: ${totalFinal.toFixed(2)} €</h2>`;
    document.getElementById("resultadoTarifa").innerHTML = html;
  }

  // === Exportar PDF ===
  document.getElementById("btnExportarPDF").addEventListener("click", ()=>{
    if (!window.jspdf){ alert("Falta jsPDF para exportar."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString("es-ES");

    let contenido = "";
    if (presupuestos.length > 0){
      contenido = presupuestos.map((p,i)=>
        `${i+1}. ${p.tipo}: ${p.m2Ajust.toFixed(2)} m² — ${p.total.toFixed(2)} €`
      ).join("\n");
      contenido += `\n\nTOTAL GENERAL: ${presupuestos.reduce((a,b)=>a+b.total,0).toFixed(2)} €`;
    } else {
      contenido = document.getElementById("resultadoManual").innerText
               || document.getElementById("resultadoTarifa").innerText
               || "Sin resultados para exportar.";
    }

    doc.setFont("helvetica","bold"); doc.setFontSize(16);
    doc.text("Vidres Sosa - Presupuesto", 20, 20);
    doc.setFontSize(10); doc.text(`Fecha: ${fecha}`, 20, 28);
    doc.setFont("helvetica","normal");
    doc.text(contenido, 20, 40, { maxWidth: 170 });
    doc.save(`Presupuesto_VidresSosa_${fecha.replace(/\//g,"-")}.pdf`);
  });
}