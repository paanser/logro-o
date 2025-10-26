// =========================
// Configuración y estado
// =========================
const PASSWORD = '123';

let tarifa = [];
let tablaMultiplos = {};
let ancho_m = 0, alto_m = 0, area_real = 0, area_corregida = 0;
let precio_m2 = 0, precio_total = 0, total_canto = 0;

// =========================
// Utilidades
// =========================
const toNumber = (s) => {
  if (s == null) return NaN;
  // limpia comillas, espacios y cambia coma decimal por punto
  return parseFloat(String(s).replace(/['"]/g,'').trim().replace(',', '.'));
};
const fmtEUR = (n) => isFinite(n) ? (Number(n).toFixed(2) + ' €') : '—';

function siguienteMultiplo(valor) { // valor en cm
  return Math.ceil(valor / 6) * 6;
}

// =========================
// Autenticación
// =========================
function login() {
  const input = document.getElementById('pwd');
  const msg = document.getElementById('loginMsg');
  if (!input) return;
  if (input.value === PASSWORD) {
    sessionStorage.setItem('vs_calc_auth', 'ok');
    document.getElementById('lockscreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    loadCSVs();
    const ancho = document.getElementById('ancho');
    if (ancho) ancho.focus();
  } else {
    msg.textContent = 'Contraseña incorrecta.';
    input.select();
  }
}

function checkAuthOnLoad() {
  const authed = sessionStorage.getItem('vs_calc_auth') === 'ok';
  if (authed) {
    document.getElementById('lockscreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    loadCSVs();
  } else {
    document.getElementById('lockscreen').style.display = 'grid';
    document.getElementById('app').style.display = 'none';
    const pwd = document.getElementById('pwd');
    if (pwd) {
      pwd.addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
    }
  }
}

// =========================
// Carga de CSVs robusta
// =========================
async function loadCSVs() {
  try {
    // --- Tarifa MAPFRE ---
    const tResp = await fetch('tarifa_mapfre_completa.csv');
    const tRaw = await tResp.text();
    const tText = tRaw.replace(/^\uFEFF/, ''); // quita BOM
    const tLines = tText.trim().split(/\r?\n/);
    if (tLines.length < 2) throw new Error('Tarifa vacía');

    // Detecta delimitador por la cabecera
    const delimTarifa = (tLines[0].includes(';')) ? ';' : ',';
    const headerT = tLines[0].split(delimTarifa).map(h => h.trim().toLowerCase());

    // Localiza índices por nombre (flexible)
    const idxDesc = headerT.findIndex(h => /(descrip|nombre|vidrio)/.test(h));
    // Si no encuentra, asume col 1 (segunda columna)
    const descIndex = idxDesc >= 0 ? idxDesc : 1;

    const idxPrecio = headerT.findIndex(h => /(precio|€/i.test(h)));
    // Si no encuentra, asume última columna
    const precioIndex = idxPrecio >= 0 ? idxPrecio : (headerT.length - 1);

    tarifa = tLines.slice(1).map(line => {
      const parts = line.split(delimTarifa);
      if (parts.length < 2) return null;
      const desc = (parts[descIndex] ?? '').replace(/['"]/g,'').trim();
      const precio = toNumber(parts[precioIndex]);
      if (!desc || !isFinite(precio)) return null;
      return { desc, precio };
    }).filter(Boolean);

    // --- Tabla de múltiplos 6x6 ---
    const tablaResp = await fetch('tabla_multiplos_6x6_hasta_5m.csv');
    const tabRaw = await tablaResp.text();
    const tabText = tabRaw.replace(/^\uFEFF/, '');
    const lines = tabText.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('Tabla múltiplos vacía');

    const delimTabla = (lines[0].includes(';')) ? ';' : ',';
    const headers = lines[0].split(delimTabla).slice(1).map(toNumber);

    tablaMultiplos = {};
    lines.slice(1).forEach(line => {
      const cols = line.split(delimTabla);
      const rowKey = toNumber(cols[0]);
      if (!isFinite(rowKey)) return;
      tablaMultiplos[rowKey] = {};
      headers.forEach((h, i) => {
        tablaMultiplos[rowKey][h] = toNumber(cols[i + 1]) || 0;
      });
    });

    // Rellenar selects
    const selectVidrio = document.getElementById('selectVidrio');
    const selectCanto  = document.getElementById('selectCanto');
    selectVidrio.innerHTML = '';
    selectCanto.innerHTML  = '';

    tarifa.forEach(item => {
      const opt = document.createElement('option');
      opt.value = String(item.precio);
      opt.textContent = item.desc;
      if (item.desc.toLowerCase().includes('canto pulido')) {
        selectCanto.appendChild(opt);
      } else {
        selectVidrio.appendChild(opt);
      }
    });

  } catch (e) {
    console.error(e);
    alert('❌ Error al cargar CSVs. Revisa que ambos CSV estén junto a index.html y tengan encabezados.');
  }
}

// =========================
// Cálculos
// =========================
function calcularArea() {
  ancho_m = toNumber(document.getElementById('ancho').value);
  alto_m  = toNumber(document.getElementById('alto').value);
  if (!isFinite(ancho_m) || !isFinite(alto_m) || ancho_m <= 0 || alto_m <= 0) {
    alert('Introduce ambas medidas en metros (> 0).');
    return;
  }

  const ancho_cm = Math.round(ancho_m * 100);
  const alto_cm  = Math.round(alto_m * 100);

  area_real = (ancho_cm * alto_cm) / 10000; // m²
  const ancho_corr = siguienteMultiplo(ancho_cm);
  const alto_corr  = siguienteMultiplo(alto_cm);

  // Busca en la tabla; si no hay celda, calcula m² corregida por simple producto
  const celda = tablaMultiplos?.[ancho_corr]?.[alto_corr];
  area_corregida = isFinite(celda) && celda > 0 ? celda : (ancho_corr * alto_corr) / 10000;

  let html = `<b>Área real:</b> ${area_real.toFixed(2)} m²<br>`;
  html += `<b>Medidas ajustadas (múltiplos 6 cm):</b> ${ancho_corr} × ${alto_corr} cm<br>`;
  html += `<b>Área corregida:</b> ${area_corregida.toFixed(2)} m²`;
  if (area_corregida < 0.5) html += `<br><span style="color:#b00020">⚠ Área inferior a 0,5 m²</span>`;
  document.getElementById('resultadoArea').innerHTML = html;

  // Desbloquea pasos siguientes
  document.getElementById('secVidrio').style.display = 'block';
  document.getElementById('secCanto').style.display  = 'block';
  document.getElementById('secResumen').style.display= 'block';
}

function togglePrecioManual() {
  const metodo = document.getElementById('metodoPrecio').value;
  document.getElementById('tarifaContainer').style.display = metodo === 'tarifa' ? 'block' : 'none';
  document.getElementById('manualContainer').style.display = metodo === 'manual' ? 'block' : 'none';
}

function calcularPrecio() {
  const metodo = document.getElementById('metodoPrecio').value;
  precio_m2 = metodo === 'tarifa'
    ? toNumber(document.getElementById('selectVidrio').value)
    : toNumber(document.getElementById('precioManual').value);

  if (!isFinite(precio_m2) || precio_m2 <= 0) return alert('Selecciona o introduce un precio válido (€/m²).');
  if (!isFinite(area_corregida) || area_corregida <= 0) return alert('Calcula primero el área.');

  precio_total = +(precio_m2 * area_corregida).toFixed(2);
  document.getElementById('resultadoPrecio').innerHTML =
    `<b>Precio m²:</b> ${fmtEUR(precio_m2)}<br><b>Precio total vidrio:</b> ${fmtEUR(precio_total)}`;
}

function toggleCanto() {
  document.getElementById('cantoContainer').style.display =
    document.getElementById('chkCanto').checked ? 'block' : 'none';
}

function toggleCantoManual() {
  const metodo = document.getElementById('metodoCanto').value;
  document.getElementById('tarifaCantoContainer').style.display = metodo === 'tarifa' ? 'block' : 'none';
  document.getElementById('manualCantoContainer').style.display = metodo === 'manual' ? 'block' : 'none';
}

function calcularCanto() {
  if (!document.getElementById('chkCanto').checked) {
    total_canto = 0;
    document.getElementById('resultadoCanto').innerHTML = 'Canto no seleccionado.';
    return;
  }
  const metodo = document.getElementById('metodoCanto').value;
  const precioCanto = metodo === 'tarifa'
    ? toNumber(document.getElementById('selectCanto').value)
    : toNumber(document.getElementById('precioCantoManual').value);

  const ladosA = Math.max(0, parseInt(document.getElementById('ladosAnchos').value || '0', 10));
  const ladosL = Math.max(0, parseInt(document.getElementById('ladosLargos').value || '0', 10));

  if (!isFinite(precioCanto) || precioCanto <= 0) return alert('Introduce/selecciona un precio válido para el canto (€/ml).');

  const ml_total = (ancho_m * ladosA) + (alto_m * ladosL);
  total_canto = +(ml_total * precioCanto).toFixed(2);

  document.getElementById('resultadoCanto').innerHTML =
    `<b>Metros lineales:</b> ${ml_total.toFixed(2)} ml<br><b>Total canto:</b> ${fmtEUR(total_canto)}`;
}

function mostrarResumen() {
  const subtotal = (precio_total || 0) + (total_canto || 0);
  const iva = +(subtotal * 0.21).toFixed(2);
  const total = +(subtotal + iva).toFixed(2);
  const html = `
    <b>Vidrio:</b> ${fmtEUR(precio_total)}<br>
    <b>Canto pulido:</b> ${fmtEUR(total_canto)}<br>
    <b>Subtotal:</b> ${fmtEUR(subtotal)}<br>
    <b>IVA (21%):</b> ${fmtEUR(iva)}<br>
    <h3>Total: ${fmtEUR(total)}</h3>
  `;
  document.getElementById('resumen').innerHTML = html;
}

// Eventos
window.onload = checkAuthOnLoad;
