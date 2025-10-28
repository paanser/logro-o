/* VIDRES SOSA — SCRIPT PRINCIPAL v8.1 (corregido login y compatible con HTML actual) */
(() => {
  // ---------- Helpers y formateadores ----------
  const nfCurrency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const nfNumber = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function toNum(v) {
    if (v === null || v === undefined) return NaN;
    const x = String(v).trim().replace(',', '.');
    const n = parseFloat(x);
    return Number.isFinite(n) ? n : NaN;
  }
  const fmtMoney = v => Number.isFinite(v) ? nfCurrency.format(v) : '-';
  const fmtNum = v => Number.isFinite(v) ? nfNumber.format(v) : '-';
  const round2 = v => Math.round((v + Number.EPSILON) * 100) / 100;

  let multiplos = [];
  let listaPresupuesto = [];
  let appInitialized = false;

  // ---------- Login ----------
  document.addEventListener('DOMContentLoaded', () => {
    const loginDiv = document.getElementById('login');
    const appDiv = document.getElementById('app');
    const btnLogin = document.getElementById('btnLogin');
    const passInput = document.getElementById('password');
    const errorMsg = document.getElementById('error');

    // Intenta restaurar sesión anterior
    try {
      if (sessionStorage.getItem('logged') === 'true') {
        loginDiv.classList.add('hidden');
        appDiv.classList.remove('hidden');
        appDiv.setAttribute('aria-hidden', 'false');
        initAppOnce();
        return;
      }
    } catch { console.warn('sessionStorage no disponible'); }

    // --- evento de login ---
    btnLogin.addEventListener('click', checkPassword);
    passInput.addEventListener('keypress', e => { if (e.key === 'Enter') checkPassword(); });

    function checkPassword() {
      const input = (passInput.value || '').trim();
      const demoReal = atob('MTIz'); // "123"

      if (!input) {
        errorMsg.textContent = 'Introduce la contraseña.';
        return;
      }

      if (input === demoReal) {
        try { sessionStorage.setItem('logged', 'true'); } catch {}
        loginDiv.classList.add('hidden');
        loginDiv.setAttribute('aria-hidden', 'true');
        appDiv.classList.remove('hidden');
        appDiv.setAttribute('aria-hidden', 'false');
        errorMsg.textContent = '';
        initAppOnce();
      } else {
        errorMsg.textContent = 'Contraseña incorrecta.';
      }
    }
  });

  // ---------- Carga tabla de múltiplos ----------
  async function loadMultiplosCSV(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('no encontrado');
      const text = await res.text();
      multiplos = text
        .trim()
        .split(/\r?\n/)
        .map(s => parseFloat(s.trim().replace(',', '.')))
        .filter(n => Number.isFinite(n))
        .sort((a, b) => a - b);
    } catch (err) {
      console.warn('No se pudo cargar multiplos.csv:', err);
      multiplos = [];
    }
  }

  // ---------- Inicializar la app una sola vez ----------
  function initAppOnce() {
    if (appInitialized) return;
    appInitialized = true;
    loadMultiplosCSV('multiplos.csv');
    initApp();
  }

  // ---------- Lógica principal ----------
  function initApp() {
    const btnManual = document.getElementById('btnManual');
    const btnTarifa = document.getElementById('btnTarifa');
    const manualDiv = document.getElementById('manual');
    const tarifaDiv = document.getElementById('tarifa');
    const outManual = document.getElementById('resultadoManual');
    const outTarifa = document.getElementById('resultadoTarifa');

    // Cambiar modo (manual/tarifa)
    btnManual.addEventListener('click', () => setMode('manual'));
    btnTarifa.addEventListener('click', () => setMode('tarifa'));

    function setMode(mode) {
      const isManual = mode === 'manual';
      manualDiv.classList.toggle('hidden', !isManual);
      tarifaDiv.classList.toggle('hidden', isManual);
      btnManual.classList.toggle('active', isManual);
      btnTarifa.classList.toggle('active', !isManual);
      btnManual.setAttribute('aria-pressed', isManual);
      btnTarifa.setAttribute('aria-pressed', !isManual);
    }

    // Helpers cálculo
    const ajustarPorTabla = (m2) => {
      if (!multiplos.length) return round2(m2);
      for (const m of multiplos) if (m2 <= m) return m;
      return multiplos[multiplos.length - 1];
    };
    const aplicarMargen = (precio, margen) => {
      const m = toNum(margen);
      return Number.isFinite(m) ? precio * (1 + m / 100) : precio;
    };

    // Botones manual
    const btnCalcularManual = document.getElementById('btnCalcularManual');
    const btnNuevoManual = document.getElementById('btnNuevoManual');

    btnCalcularManual.addEventListener('click', () => {
      const ancho = toNum(document.getElementById('anchoManual').value);
      const alto = toNum(document.getElementById('altoManual').value);
      const uds = parseInt(document.getElementById('unidadesManual').value, 10) || 1;
      const pBase = toNum(document.getElementById('precioManual').value);
      const pCanto = toNum(document.getElementById('precioCantoM').value) || 0;
      const margen = toNum(document.getElementById('margenManual').value) || 0;

      if (!(ancho > 0 && alto > 0)) return alert('Introduce ancho y alto válidos.');
      if (!(pBase > 0)) return alert('Introduce el precio €/m² del vidrio.');

      const Ared = round2(Math.ceil(ancho / 0.06) * 0.06);
      const Bred = round2(Math.ceil(alto / 0.06) * 0.06);
      const areaBruta = round2(Ared * Bred);
      const area = ajustarPorTabla(areaBruta);

      const pVidFinal = aplicarMargen(pBase, margen);
      const subtotalVid = round2(area * pVidFinal * uds);

      const a1 = document.getElementById('ancho1M').checked;
      const a2 = document.getElementById('ancho2M').checked;
      const l1 = document.getElementById('largo1M').checked;
      const l2 = document.getElementById('largo2M').checked;

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

      const bloque = document.createElement('div');
      bloque.className = 'bloque-vidrio';
      bloque.innerHTML = `
        <b>Cálculo Manual</b><br>
        Medidas introducidas: ${fmtNum(ancho)} × ${fmtNum(alto)} m<br>
        Ajustadas: ${fmtNum(Ared)} × ${fmtNum(Bred)} = ${fmtNum(area)} m²<br>
        Precio vidrio: ${fmtMoney(pVidFinal)} €/m² — Unidades: ${uds}<br>
        Cantos: ${fmtNum(ml)} m × ${fmtMoney(pCanto)} = ${fmtMoney(costeCantos)}<br>
        Subtotal: ${fmtMoney(subtotal)} — IVA (21%): ${fmtMoney(iva)}<br>
        <b>Total: ${fmtMoney(total)}</b>
      `;
      outManual.append(bloque, document.createElement('hr'));

      listaPresupuesto.push({
        nombreVid1: `Manual (${pBase.toFixed(2)} €/m²${margen ? ` +${margen}%` : ''})`,
        area, uds, subtotal, iva, total
      });

      mostrarPresupuesto();

      document.querySelectorAll('#manual input').forEach(i => {
        if (i.type === 'number') i.value = '';
        if (i.type === 'checkbox') i.checked = false;
      });
    });

    btnNuevoManual.addEventListener('click', () => {
      document.querySelectorAll('#manual input').forEach(i => {
        if (i.type === 'number') i.value = '';
        if (i.type === 'checkbox') i.checked = false;
      });
    });

    function mostrarPresupuesto() {
      const container = document.createElement('div');
      let totalFinal = 0;
      listaPresupuesto.forEach((v, i) => {
        const b = document.createElement('div');
        b.className = 'bloque-vidrio';
        b.innerHTML = `
          <b>${i + 1}. ${v.nombreVid1}</b><br>
          Superficie: ${fmtNum(v.area)} m² — Unidades: ${v.uds}<br>
          Subtotal: ${fmtMoney(v.subtotal)} — IVA: ${fmtMoney(v.iva)}<br>
          <b>Total: ${fmtMoney(v.total)}</b>
        `;
        container.append(b, document.createElement('hr'));
        totalFinal += v.total;
      });
      const resumen = document.createElement('h3');
      resumen.textContent = `Total general: ${fmtMoney(round2(totalFinal))}`;
      outTarifa.innerHTML = '';
      outTarifa.append(container, resumen);
    }
  }

  // Exportar helpers si hace falta
  window.vidresSosaHelpers = { toNum, fmtMoney, fmtNum };
})();

