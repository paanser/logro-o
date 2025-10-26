document.addEventListener('DOMContentLoaded', () => {
  const PASSWORD = '123';
  const input = document.getElementById('pwd');
  const btn = document.getElementById('btnEntrar');

  btn.addEventListener('click', login);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

  const tarifa = [
    { desc: 'Climalit 4+10+4', precio: 45 },
    { desc: 'Laminado 5+5 transparente', precio: 60 },
    { desc: 'Laminado 6+6 mate', precio: 68 },
    { desc: 'Templado 8 mm', precio: 75 },
    { desc: 'Cámara bajo emisivo 4+12+4', precio: 70 },
  ];

  const select = document.getElementById('selectVidrio');
  select.innerHTML = tarifa.map(t => `<option value="${t.precio}">${t.desc} - ${t.precio} €/m²</option>`).join('');

  let ancho_m = 0, alto_m = 0, area_corregida = 0, precio_m2 = 0, precio_total = 0, total_canto = 0;

  function login() {
    if (input.value.trim() === PASSWORD) {
      document.getElementById('lockscreen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
    } else {
      document.getElementById('loginMsg').textContent = 'Contraseña incorrecta';
      input.value = '';
    }
  }

  window.calcularArea = () => {
    ancho_m = parseFloat(document.getElementById('ancho').value);
    alto_m = parseFloat(document.getElementById('alto').value);
    if (!ancho_m || !alto_m) return alert('Introduce ambas medidas');
    const ancho_cm = Math.ceil(ancho_m * 100 / 6) * 6;
    const alto_cm = Math.ceil(alto_m * 100 / 6) * 6;
    area_corregida = (ancho_cm * alto_cm) / 10000;
    document.getElementById('resultadoArea').innerHTML =
      `<b>Área corregida:</b> ${area_corregida.toFixed(2)} m²<br><b>Medidas ajustadas:</b> ${ancho_cm} × ${alto_cm} cm`;
  };

  window.calcularPrecio = () => {
    precio_m2 = parseFloat(document.getElementById('precioManual').value) || parseFloat(select.value);
    if (!precio_m2 || !area_corregida) return alert('Faltan datos');
    precio_total = +(precio_m2 * area_corregida).toFixed(2);
    document.getElementById('resultadoPrecio').innerHTML = `<b>Precio total vidrio:</b> ${precio_total.toFixed(2)} €`;
  };

  window.toggleCanto = () => {
    const visible = document.getElementById('chkCanto').checked;
    document.getElementById('cantoContainer').style.display = visible ? 'block' : 'none';
  };

  window.calcularCanto = () => {
    const ladosA = parseInt(document.getElementById('ladosAnchos').value) || 0;
    const ladosL = parseInt(document.getElementById('ladosLargos').value) || 0;
    const precioCanto = parseFloat(document.getElementById('precioCanto').value) || 0;
    const ml_total = ((ancho_m * ladosA) + (alto_m * ladosL)).toFixed(2);
    total_canto = +(ml_total * precioCanto).toFixed(2);
    document.getElementById('resultadoCanto').innerHTML =
      `<b>Total metros lineales:</b> ${ml_total} ml<br><b>Total canto:</b> ${total_canto.toFixed(2)} €`;
  };

  window.mostrarResumen = () => {
    const subtotal = precio_total + total_canto;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    document.getElementById('resumen').innerHTML =
      `<b>Vidrio:</b> ${precio_total.toFixed(2)} €<br>` +
      `<b>Canto:</b> ${total_canto.toFixed(2)} €<br>` +
      `<b>IVA (21%):</b> ${iva.toFixed(2)} €<br>` +
      `<h3>Total: ${total.toFixed(2)} €</h3>`;
  };
});