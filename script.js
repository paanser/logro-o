let tarifa = [];
let tablaMultiplos = {};
let ancho_m = 0, alto_m = 0, area_real = 0, area_corregida = 0;
let precio_m2 = 0, precio_total = 0, total_canto = 0;

async function loadCSVs() {
    const tResp = await fetch('tarifa_mapfre_completa.csv');
    const tText = await tResp.text();
    const rows = tText.trim().split('\n').slice(1);
    tarifa = rows.map(r => {
        const [desc, precio] = r.split(',');
        return { desc, precio: parseFloat(precio) };
    });

    const tablaResp = await fetch('tabla_multiplos_6x6_hasta_5m.csv');
    const tablaText = await tablaResp.text();
    const lines = tablaText.trim().split('\n');
    const headers = lines[0].split(',').slice(1).map(Number);
    lines.slice(1).forEach(line => {
        const parts = line.split(',');
        const rowKey = Number(parts[0]);
        tablaMultiplos[rowKey] = {};
        headers.forEach((h, i) => {
            tablaMultiplos[rowKey][h] = parseFloat(parts[i + 1]);
        });
    });

    const selectVidrio = document.getElementById('selectVidrio');
    tarifa.forEach(item => {
        if (!item.desc.toLowerCase().includes('canto pulido'))
            selectVidrio.innerHTML += `<option value="${item.precio}">${item.desc}</option>`;
    });

    const selectCanto = document.getElementById('selectCanto');
    tarifa.forEach(item => {
        if (item.desc.toLowerCase().includes('canto pulido'))
            selectCanto.innerHTML += `<option value="${item.precio}">${item.desc}</option>`;
    });
}

function siguienteMultiplo(valor) {
    return Math.ceil(valor / 6) * 6;
}

function calcularArea() {
    ancho_m = parseFloat(document.getElementById('ancho').value);
    alto_m = parseFloat(document.getElementById('alto').value);
    if (!ancho_m || !alto_m) return alert("Introduce ambas medidas");

    const ancho_cm = ancho_m * 100;
    const alto_cm = alto_m * 100;
    area_real = (ancho_cm * alto_cm) / 10000;
    const ancho_corr = siguienteMultiplo(ancho_cm);
    const alto_corr = siguienteMultiplo(alto_cm);
    area_corregida = tablaMultiplos[ancho_corr]?.[alto_corr] || 0;

    let html = `<b>Área real:</b> ${area_real.toFixed(2)} m²<br>`;
    html += `<b>Medidas ajustadas:</b> ${ancho_corr} × ${alto_corr} cm<br>`;
    html += `<b>Área corregida:</b> ${area_corregida.toFixed(2)} m²`;
    if (area_corregida < 0.5) html += `<br><span style='color:red'>⚠ Área inferior a 0.5 m²</span>`;
    document.getElementById('resultadoArea').innerHTML = html;
}

function togglePrecioManual() {
    const metodo = document.getElementById('metodoPrecio').value;
    document.getElementById('tarifaContainer').style.display = metodo === 'tarifa' ? 'block' : 'none';
    document.getElementById('manualContainer').style.display = metodo === 'manual' ? 'block' : 'none';
}

function calcularPrecio() {
    const metodo = document.getElementById('metodoPrecio').value;
    precio_m2 = metodo === 'tarifa'
        ? parseFloat(document.getElementById('selectVidrio').value)
        : parseFloat(document.getElementById('precioManual').value || 0);
    if (!precio_m2 || !area_corregida) return alert("Faltan datos para calcular");
    precio_total = +(precio_m2 * area_corregida).toFixed(2);
    document.getElementById('resultadoPrecio').innerHTML = `<b>Precio m²:</b> ${precio_m2.toFixed(2)} €<br><b>Precio total:</b> ${precio_total.toFixed(2)} €`;
}

function toggleCanto() {
    document.getElementById('cantoContainer').style.display = document.getElementById('chkCanto').checked ? 'block' : 'none';
}

function toggleCantoManual() {
    const metodo = document.getElementById('metodoCanto').value;
    document.getElementById('tarifaCantoContainer').style.display = metodo === 'tarifa' ? 'block' : 'none';
    document.getElementById('manualCantoContainer').style.display = metodo === 'manual' ? 'block' : 'none';
}

function calcularCanto() {
    const metodo = document.getElementById('metodoCanto').value;
    const precioCanto = metodo === 'tarifa'
        ? parseFloat(document.getElementById('selectCanto').value)
        : parseFloat(document.getElementById('precioCantoManual').value || 0);
    const ladosA = parseInt(document.getElementById('ladosAnchos').value || 0);
    const ladosL = parseInt(document.getElementById('ladosLargos').value || 0);
    const ml_total = ((ancho_m * ladosA) + (alto_m * ladosL)).toFixed(2);
    total_canto = +(ml_total * precioCanto).toFixed(2);
    document.getElementById('resultadoCanto').innerHTML = `<b>Total metros lineales:</b> ${ml_total} ml<br><b>Total canto:</b> ${total_canto.toFixed(2)} €`;
}

function mostrarResumen() {
    const subtotal = precio_total + total_canto;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    const html = `
        <b>Vidrio:</b> ${precio_total.toFixed(2)} €<br>
        <b>Canto pulido:</b> ${total_canto.toFixed(2)} €<br>
        <b>Subtotal:</b> ${subtotal.toFixed(2)} €<br>
        <b>IVA (21%):</b> ${iva.toFixed(2)} €<br>
        <h3>Total: ${total.toFixed(2)} €</h3>
    `;
    document.getElementById('resumen').innerHTML = html;
}

window.onload = loadCSVs;
