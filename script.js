function checkPassword() {
  const pass = document.getElementById('password').value.trim();
  const error = document.getElementById('error');
  if (pass === "123") {
    document.getElementById('login').style.display = "none";
    document.getElementById('app').style.display = "block";
  } else {
    error.textContent = "Contraseña incorrecta.";
  }
}

function setMode(mode) {
  document.getElementById('manual').style.display = (mode === 'manual') ? 'block' : 'none';
  document.getElementById('tarifa').style.display = (mode === 'tarifa') ? 'block' : 'none';
  document.getElementById('btnManual').style.background = (mode === 'manual') ? '#008cba' : '#444';
  document.getElementById('btnTarifa').style.background = (mode === 'tarifa') ? '#008cba' : '#444';
}

function calcularManual() {
  const ancho = parseFloat(document.getElementById('anchoManual').value) || 0;
  const alto = parseFloat(document.getElementById('altoManual').value) || 0;
  const precio = parseFloat(document.getElementById('precioManual').value) || 0;
  const resultado = document.getElementById('resultadoManual');

  if (!ancho || !alto || !precio) {
    resultado.textContent = "Por favor, introduce todos los valores.";
    return;
  }

  let m2 = (ancho * alto) / 1000000;
  m2 = Math.ceil(m2 / 0.06) * 0.06;
  const total = m2 * precio;

  resultado.innerHTML = `
    Superficie ajustada: <b>${m2.toFixed(2)} m²</b><br>
    Precio unitario: <b>${precio.toFixed(2)} €/m²</b><br>
    Total: <b>${total.toFixed(2)} €</b>`;
}

function calcularTarifa() {
  const ancho = parseFloat(document.getElementById('anchoTarifa').value) || 0;
  const alto = parseFloat(document.getElementById('altoTarifa').value) || 0;
  const precio = parseFloat(document.getElementById('precioTarifa').value) || 0;
  const resultado = document.getElementById('resultadoTarifa');

  if (!ancho || !alto || !precio) {
    resultado.textContent = "Por favor, introduce todos los valores.";
    return;
  }

  let m2 = (ancho * alto) / 1000000;
  m2 = Math.ceil(m2 / 0.06) * 0.06;
  const total = m2 * precio;

  resultado.innerHTML = `
    Superficie ajustada: <b>${m2.toFixed(2)} m²</b><br>
    Precio tarifa: <b>${precio.toFixed(2)} €/m²</b><br>
    Total: <b>${total.toFixed(2)} €</b>`;
}