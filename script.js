/* VIDRES SOSA — SCRIPT PRINCIPAL v8+ (revisado y mejorado) */
(() => {
  // Formateadores
  const nfCurrency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const nfNumber = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Helpers
  function toNum(value) {
    if (value === null || value === undefined) return NaN;
    const v = String(value).trim().replace(',', '.');
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  }
  function fmtMoney(v) { return Number.isFinite(v) ? nfCurrency.format(v) : '-'; }
  function fmtNum(v) { return Number.isFinite(v) ? nfNumber.format(v) : '-'; }
  function round2(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }

  // Estado
  let multiplos = [];
  let listaPresupuesto = [];
  let appInitialized = false;

  // DOM
  document.addEventListener('DOMContentLoaded', () => {
    const loginDiv = document.getElementById('login');
    const appDiv = document.getElementById('app');
    const btnLogin = document.getElementById('btnLogin');
    const passInput = document.getElementById('password');
    const errorMsg = document.getElementById('error');

    // Cargar multiplos CSV (no bloqueante)
    loadMultiplosCSV('multiplos.csv');

    // Restaurar sesión si corresponde
    if (sessionStorage.getItem('logged') === 'true') {
      loginDiv.classList.add('hidden');
      loginDiv.setAttribute('aria-hidden', 'true');
      appDiv.classList.remove('hidden');
      appDiv.setAttribute('aria-hidden', 'false');
      initAppOnce();
    }

    // Login
    btnLogin.addEventListener('click', checkPassword);
    passInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkPassword(); });

    function checkPassword() {
      const input = (passInput.value || '').trim();
      // AVISO: validar la contraseña en cliente es inseguro. Mantener solo para demo/local.
      const demoReal = atob('MTIz'); // "123" (solo demo)
      if (!input) {
        errorMsg.textContent = 'Introduce la contraseña.';
        return;
      }
      if (input === demoReal) {
        sessionStorage.setItem('logged', 'true');
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

  // Carga de multiplos (async)
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
      // Si quieres depurar:
      // console.log('Multiplos cargados:', multiplos);
    } catch (err) {
      multiplos = [];
      console.warn('No se pudo cargar multiplos.csv:', err);
    }
  }

  // Init app solo una vez
  function initAppOnce() {
    if (appInitialized) return;
    appInitialized = true;
    initApp();
  }

  // Lógica principal
  function initApp() {
    // Elementos
    const btnManual = document.getElementById('btnManual');
    const btnTarifa = document.getElementById('btnTarifa');
    const manualDiv = document.getElementById('manual');
    const tarifaDiv = document.getElementById('tarifa');

    const outManual = document.getElementById('resultadoManual');
    const outTarifa = document.getElementById('resultadoTarifa');

    // Cambiar modo (usar clases .hidden)
    btnManual.addEventListener('click', () => setMode('manual'));
    btnTarifa.addEventListener('click', () => setMode('tarifa'));
    function setMode(mode) {
      const isManual = mode === 'manual';
      manualDiv.classList.toggle('hidden', !isManual);
      tarifaDiv.classList.toggle('hidden', isManual);
      btnManual.classList.toggle('active', isManual);
      btnTarifa.classList.toggle('active', !isManual);
      btnManual.setAttribute('aria-pressed', isManual ? 'true' : 'false');
      btnTarifa.setAttribute('aria-pressed', !isManual ? 'true' : 'false');
    }

    // Auxiliares de cálculo
    const ajustarPorTabla = (m2) => {
      if (!multiplos || multiplos.length === 0) return round2(m2);
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
      try {
        // Leer inputs
        const ancho = toNum(document.getElementById('anchoManual').value);
        const alto = toNum(document.getElementById('altoManual').value);
        const uds = Number.isInteger(parseInt(document.getElementById('unidadesManual').value, 10)) ? parseInt(document.getElementById('unidadesManual').value, 10) : 1;
        const pBase = toNum(document.getElementById('precioManual').value);
        const pCanto = toNum(document.getElementById('precioCantoM').value) || 0;
        const margen = toNum(document.getElementById('margenManual').value) || 0;

        if (!(Number.isFinite(ancho) && ancho > 0 && Number.isFinite(alto) && alto > 0)) {
          alert('Introduce ancho y alto válidos (> 0).');
          return;
        }
        if (!Number.isFinite(pBase) || pBase <= 0) {
          alert('Introduce el precio €/m² del vidrio.');
          return;
        }

        // Redondeo al escalón 0.06
        const Ared = round2(Math.ceil(ancho / 0.06) * 0.06);
        const Bred = round2(Math.ceil(alto / 0.06) * 0.06);

        // Área ajustada mediante tabla de múltiplos
        const areaBruta = round2(Ared * Bred);
        const area = ajustarPorTabla(areaBruta);

        // Precio vidrio con margen aplicado
        const pVidFinal = aplicarMargen(pBase, margen);
        const subtotalVid = round2(area * pVidFinal * uds);

        // Cantos seleccionados (misma lógica previa: ancho checkbox suma Ared, largo suma Bred)
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

        // Construir bloque resultado de manera segura
        const bloque = document.createElement('div');
        bloque.className = 'bloque-vidrio';
        bloque.innerHTML = `
          <b>Cálculo Manual</b><br>
          Medidas introducidas: ${fmtNum(ancho)} × ${fmtNum(alto)} m<br>
          Ajustadas: ${fmtNum(Ared)} × ${fmtNum(Bred)} m = ${fmtNum(area)} m²<br>
          Precio vidrio: ${fmtMoney(pVidFinal)} €/m² — Unidades: ${uds}<br>
          Cantos: ${fmtNum(ml)} m × ${fmtMoney(pCanto)} = ${fmtMoney(costeCantos)}<br>
          Subtotal: ${fmtMoney(subtotal)} — IVA (21%): ${fmtMoney(iva)}<br>
          <b>Total: ${fmtMoney(total)}</b>
        `;
        // Separador
        const hr = document.createElement('hr');

        outManual.appendChild(bloque);
        outManual.appendChild(hr);

        // Añadir al presupuesto general
        listaPresupuesto.push({
          nombreVid1: `Manual (${pBase.toFixed(2)} €/m²${margen ? ` +${margen}%` : ''})`,
          nombreVid2: '',
          area, uds, subtotal, iva, total
        });

        mostrarPresupuesto();

        // Limpiar inputs número/checkbox en el formulario manual
        document.querySelectorAll('#manual input').forEach(i => {
          if (i.type === 'number') i.value = '';
          if (i.type === 'checkbox') i.checked = false;
        });
      } catch (err) {
        console.error('Error en calculo manual:', err);
        alert('Error inesperado al calcular. Mira la consola.');
      }
    });

    btnNuevoManual.addEventListener('click', () => {
      document.querySelectorAll('#manual input').forEach(i => {
        if (i.type === 'number') i.value = '';
        if (i.type === 'checkbox') i.checked = false;
      });
      // Limpiar salida manual si lo deseas:
      // outManual.innerHTML = '';
    });

    // Mostrar presupuesto general
    function mostrarPresupuesto() {
      // Construir HTML de resultados en memoria y luego colocar en el DOM
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
        container.appendChild(b);
        container.appendChild(document.createElement('hr'));
        totalFinal += (Number.isFinite(v.total) ? v.total : 0);
      });
      const resumen = document.createElement('h3');
      resumen.textContent = `Total general del presupuesto: ${fmtMoney(round2(totalFinal))}`;
      // Reemplazar contenido de outTarifa
      outTarifa.innerHTML = '';
      outTarifa.appendChild(container);
      outTarifa.appendChild(resumen);
    }
  }

  // Exportar funciones públicas si se necesita (opcional)
  window.vidresSosaHelpers = {
    toNum, fmtMoney, fmtNum
  };
})();
