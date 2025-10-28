/* VIDRES SOSA — SCRIPT PRINCIPAL v9.0 (login 100% estable + botón cerrar sesión) */
(() => {
  const nfCurrency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const nfNumber = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const toNum = v => Number.isFinite(+v) ? parseFloat(String(v).replace(',', '.')) : NaN;
  const fmtMoney = v => Number.isFinite(v) ? nfCurrency.format(v) : '-';
  const fmtNum = v => Number.isFinite(v) ? nfNumber.format(v) : '-';
  const round2 = v => Math.round((v + Number.EPSILON) * 100) / 100;

  let multiplos = [];
  let listaPresupuesto = [];
  let appInitialized = false;

  // Forzar inicio aunque defer falle (Safari iOS)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLogin);
  } else {
    initLogin();
  }

  function initLogin() {
    console.log("✅ Login cargado");
    const loginDiv = document.getElementById("login");
    const appDiv = document.getElementById("app");
    const btnLogin = document.getElementById("btnLogin");
    const passInput = document.getElementById("password");
    const errorMsg = document.getElementById("error");

    if (!loginDiv || !btnLogin || !passInput) {
      console.error("⚠️ No se encontraron los elementos del login.");
      return;
    }

    // Intentar restaurar sesión anterior
    let logged = false;
    try {
      logged = sessionStorage.getItem("logged") === "true";
    } catch {
      console.warn("sessionStorage no disponible");
    }

    if (logged) {
      mostrarApp();
      return;
    }

    btnLogin.addEventListener("click", checkPassword);
    passInput.addEventListener("keypress", e => { if (e.key === "Enter") checkPassword(); });

    function checkPassword() {
      const val = (passInput.value || "").trim();
      const real = atob("MTIz"); // "123"
      console.log("Intento de login con:", val);

      if (!val) {
        errorMsg.textContent = "Introduce la contraseña.";
        return;
      }
      if (val === real) {
        try { sessionStorage.setItem("logged", "true"); } catch {}
        mostrarApp();
      } else {
        errorMsg.textContent = "Contraseña incorrecta.";
      }
    }

    function mostrarApp() {
      loginDiv.classList.add("hidden");
      loginDiv.setAttribute("aria-hidden", "true");
      appDiv.classList.remove("hidden");
      appDiv.setAttribute("aria-hidden", "false");
      errorMsg.textContent = "";

      // Crear botón Cerrar sesión
      if (!document.getElementById("btnLogout")) {
        const logout = document.createElement("button");
        logout.id = "btnLogout";
        logout.textContent = "Cerrar sesión";
        logout.className = "secondary logout-btn";
        logout.style.margin = "10px 0";
        logout.addEventListener("click", () => {
          try { sessionStorage.removeItem("logged"); } catch {}
          appDiv.classList.add("hidden");
          appDiv.setAttribute("aria-hidden", "true");
          loginDiv.classList.remove("hidden");
          loginDiv.setAttribute("aria-hidden", "false");
          passInput.value = "";
        });
        appDiv.prepend(logout);
      }

      console.log("✅ Login correcto, iniciando app...");
      initAppOnce();
    }
  }

  // ---------- Carga de múltiplos ----------
  async function loadMultiplosCSV(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("no encontrado");
      const text = await res.text();
      multiplos = text
        .trim()
        .split(/\r?\n/)
        .map(s => parseFloat(s.trim().replace(",", ".")))
        .filter(n => Number.isFinite(n))
        .sort((a, b) => a - b);
      console.log("📄 Multiplos cargados:", multiplos.length);
    } catch (err) {
      console.warn("⚠️ No se pudo cargar multiplos.csv:", err);
      multiplos = [];
    }
  }

  // ---------- Inicialización única ----------
  function initAppOnce() {
    if (appInitialized) return;
    appInitialized = true;
    loadMultiplosCSV("multiplos.csv");
    initApp();
  }

  // ---------- APP PRINCIPAL ----------
  function initApp() {
    console.log("✅ App iniciada");
    const btnManual = document.getElementById("btnManual");
    const btnTarifa = document.getElementById("btnTarifa");
    const manualDiv = document.getElementById("manual");
    const tarifaDiv = document.getElementById("tarifa");
    const outManual = document.getElementById("resultadoManual");
    const outTarifa = document.getElementById("resultadoTarifa");

    btnManual.addEventListener("click", () => setMode("manual"));
    btnTarifa.addEventListener("click", () => setMode("tarifa"));

    function setMode(mode) {
      const isManual = mode === "manual";
      manualDiv.classList.toggle("hidden", !isManual);
      tarifaDiv.classList.toggle("hidden", isManual);
      btnManual.classList.toggle("active", isManual);
      btnTarifa.classList.toggle("active", !isManual);
      btnManual.setAttribute("aria-pressed", isManual);
      btnTarifa.setAttribute("aria-pressed", !isManual);
    }

    // Botones cálculo manual
    document.getElementById("btnCalcularManual").addEventListener("click", calcularManual);
    document.getElementById("btnNuevoManual").addEventListener("click", () => {
      document.querySelectorAll("#manual input").forEach(i => {
        if (i.type === "number") i.value = "";
        if (i.type === "checkbox") i.checked = false;
      });
    });

    function calcularManual() {
      const ancho = toNum(document.getElementById("anchoManual").value);
      const alto = toNum(document.getElementById("altoManual").value);
      const uds = parseInt(document.getElementById("unidadesManual").value, 10) || 1;
      const pBase = toNum(document.getElementById("precioManual").value);
      const pCanto = toNum(document.getElementById("precioCantoM").value) || 0;
      const margen = toNum(document.getElementById("margenManual").value) || 0;

      if (!(ancho > 0 && alto > 0)) return alert("Introduce ancho y alto válidos.");
      if (!(pBase > 0)) return alert("Introduce el precio €/m² del vidrio.");

      const Ared = round2(Math.ceil(ancho / 0.06) * 0.06);
      const Bred = round2(Math.ceil(alto / 0.06) * 0.06);
      const areaBruta = round2(Ared * Bred);
      const area = ajustarPorTabla(areaBruta);

      const pVidFinal = aplicarMargen(pBase, margen);
      const subtotalVid = round2(area * pVidFinal * uds);

      const a1 = document.getElementById("ancho1M").checked;
      const a2 = document.getElementById("ancho2M").checked;
      const l1 = document.getElementById("largo1M").checked;
      const l2 = document.getElementById("largo2M").checked;

      let ml = 0;
      if (a1) ml += Ared;
      if (a2) ml += Ared;
      if (l1) ml += Bred;
      if (l2) ml += Bred;
      ml = round2(ml);

      const costeCantos = round2(ml * pCanto * uds);
      const subtotal = round2(subtotalVid + costeCantos);
      const iva = round2(subtotal * 0.21);
      const total = round2(subtotal + iva);

      const bloque = document.createElement("div");
      bloque.className = "bloque-vidrio";
      bloque.innerHTML = `
        <b>Cálculo Manual</b><br>
        Medidas: ${fmtNum(ancho)} × ${fmtNum(alto)} m<br>
        Ajustadas: ${fmtNum(Ared)} × ${fmtNum(Bred)} = ${fmtNum(area)} m²<br>
        Vidrio: ${fmtMoney(pVidFinal)} €/m² — Uds: ${uds}<br>
        Cantos: ${fmtNum(ml)} m × ${fmtMoney(pCanto)} = ${fmtMoney(costeCantos)}<br>
        Subtotal: ${fmtMoney(subtotal)} — IVA: ${fmtMoney(iva)}<br>
        <b>Total: ${fmtMoney(total)}</b>
      `;
      outManual.append(bloque, document.createElement("hr"));

      listaPresupuesto.push({ area, uds, subtotal, iva, total });
      mostrarPresupuesto();
    }

    const ajustarPorTabla = m2 => {
      for (const m of multiplos) if (m2 <= m) return m;
      return multiplos.length ? multiplos[multiplos.length - 1] : m2;
    };

    const aplicarMargen = (precio, margen) => {
      const m = toNum(margen);
      return Number.isFinite(m) ? precio * (1 + m / 100) : precio;
    };

    function mostrarPresupuesto() {
      const container = document.createElement("div");
      let totalFinal = 0;
      listaPresupuesto.forEach((v, i) => {
        const b = document.createElement("div");
        b.className = "bloque-vidrio";
        b.innerHTML = `
          <b>${i + 1}.</b> Superficie: ${fmtNum(v.area)} m² — Uds: ${v.uds}<br>
          Subtotal: ${fmtMoney(v.subtotal)} — IVA: ${fmtMoney(v.iva)}<br>
          <b>Total: ${fmtMoney(v.total)}</b>
        `;
        container.append(b, document.createElement("hr"));
        totalFinal += v.total;
      });
      outTarifa.innerHTML = "";
      const resumen = document.createElement("h3");
      resumen.textContent = `Total general: ${fmtMoney(round2(totalFinal))}`;
      outTarifa.append(container, resumen);
    }
  }

  window.vidresSosaHelpers = { toNum, fmtMoney, fmtNum };
})();

})();
