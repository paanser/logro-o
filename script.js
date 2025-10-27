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
  // Botones y secciones
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

  // Datos
  const vidrioSelect = document.getElementById("vidrioSelect");
  let multiplos = [];
  let tarifa    = [];

  // 1) Cargar múltiplos (lista de m² ascendentes: 0.06, 0.12, ...)
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

  // 2) Cargar tarifa (SEPARADOR ';' FIJO + decimales con coma)
  fetch("tarifa_mapfre_completa.csv")
    .then(r => r.text())
    .then(text => {
      const lineas = text.trim().split(/\r?\n/);
      vidrioSelect.innerHTML = "";
      tarifa = [];
      // Esperamos formato: NOMBRE;PRECIO;CANTO
      lineas.forEach((linea, i) => {
        if (!linea.trim()) return;
        if (i === 0 && /nombre/i.test(linea)) return; // cabecera
        const cols = linea.split(";"); // muy importante: SOLO ';'
        const nombre = (cols[0] || "").trim();
        const precio = parseFloat((cols[1] || "0").replace(",", ".")) || 0;
        const canto  = parseFloat((cols[2] || "0").replace(",", ".")) || 0;

        if (!nombre) return;
        tarifa.push({ nombre, precio, canto });

        const opt = document.createElement("option");
        opt.value = JSON.stringify({ precio, canto });
        opt.textContent = `${nombre} — ${precio.toFixed(2)} €/m²`;
        vidrioSelect.appendChild(opt);
      });
    })
    .catch(() => console.warn("No se pudo cargar tarifa_mapfre_completa.csv"));

  // Utilidades
  const ajustarPorTabla = (m2) => {
    if (!multiplos.length) return Math.ceil(m2 * 100) / 100;
    for (const m of multiplos){ if (m2 <= m) return m; }
    return multiplos[multiplos.length - 1];
  };
  const aplicarMargen = (precio, margen) => margen ? precio * (1 + margen/100) : precio;

  // MANUAL
  document.getElementById("btnCalcularManual").addEventListener("click", () => calcular("manual"));
  document.getElementById("btnNuevoManual").addEventListener("click", () => clearInputs("manual"));

  // TARIFA
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

    if (isManual){
      precioVidrio = parseFloat(document.getElementById("precioManual").value) || 0;
      precioCanto  = parseFloat(document.getElementById("precioCantoM").value) || 0;
    } else {
      const vidrio = JSON.parse(document.getElementById("vidrioSelect").value || "{}");
      precioVidrio = parseFloat(vidrio.precio || 0) || 0;
      precioCanto  = parseFloat(document.getElementById("precioCanto").value) || parseFloat(vidrio.canto || 0) || 0;
    }

    if (!ancho || !alto || !precioVidrio){
      out.textContent = "Introduce todos los valores.";
      return;
    }

    // 1) Redondear CADA lado a múltiplos de 6 cm
    const Ared = Math.ceil(ancho / 0.06) * 0.06;
    const Bred = Math.ceil(alto  / 0.06) * 0.06;

    // 2) Área con lados ya redondeados + ajuste a tabla de múltiplos
    const areaLados = Ared * Bred;
    const m2Ajust   = ajustarPorTabla(areaLados);

    // 3) Precio con margen
    const pVidrioFinal = aplicarMargen(precioVidrio, margen);

    // 4) Cálculo de cantos (Ancho/Largo 1 ó 2)
    const a1 = document.getElementById(isManual ? "ancho1M":"ancho1").checked;
    const a2 = document.getElementById(isManual ? "ancho2M":"ancho2").checked;
    const l1 = document.getElementById(isManual ? "largo1M":"largo1").checked;
    const l2 = document.getElementById(isManual ? "largo2M":"largo2").checked;

    let ml = 0;
    if (a1) ml += Ared;     // Ancho 1
    if (a2) ml += 2*Ared;   // Ancho 2
    if (l1) ml += Bred;     // Largo 1
    if (l2) ml += 2*Bred;   // Largo 2

    const costeCantos   = ml * precioCanto * uds;
    const subtotalVid   = m2Ajust * pVidrioFinal * uds;
    const subtotal      = subtotalVid + costeCantos;
    const iva           = subtotal * 0.21;
    const total         = subtotal + iva;

    const titulo = isManual ? "Cálculo Manual"
                            : document.getElementById("vidrioSelect").selectedOptions[0]?.textContent || "Vidrio por tarifa";

    out.innerHTML = `
      <b>${titulo}</b><br>
      Medidas introducidas: ${ancho.toFixed(3)} × ${alto.toFixed(3)} m<br>
      Medidas ajustadas: ${Ared.toFixed(2)} × ${Bred.toFixed(2)} m<br>
      Superficie ajustada: ${m2Ajust.toFixed(2)} m²<br>
      Precio vidrio: ${pVidrioFinal.toFixed(2)} €/m²<br>
      Cantos: ${ml.toFixed(2)} m × ${precioCanto.toFixed(2)} € = ${costeCantos.toFixed(2)} €<br>
      Unidades: ${uds}<br>
      Subtotal: ${subtotal.toFixed(2)} €<br>
      IVA (21%): ${iva.toFixed(2)} €<br>
      <b>Total: ${total.toFixed(2)} €</b>`;
  }

  function clearInputs(mode){
    document.querySelectorAll(`#${mode} input`).forEach(i=>{
      if(i.type==="number") i.value="";
      if(i.type==="checkbox") i.checked=false;
    });
    clearResults();
  }

  // Exportar PDF
  document.getElementById("btnExportarPDF").addEventListener("click", ()=>{
    if (!window.jspdf){ alert("Falta jsPDF para exportar."); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString("es-ES");
    const contenido = document.getElementById("resultadoManual").innerText
                   || document.getElementById("resultadoTarifa").innerText
                   || "Sin resultados para exportar.";
    doc.setFont("helvetica","bold"); doc.setFontSize(16);
    doc.text("Vidres Sosa - Presupuesto", 20, 20);
    doc.setFontSize(10); doc.text(`Fecha: ${fecha}`, 20, 28);
    doc.setFont("helvetica","normal");
    doc.text(contenido, 20, 40, { maxWidth: 170 });
    doc.save(`Presupuesto_VidresSosa_${fecha.replace(/\//g,"-")}.pdf`);
  });
}