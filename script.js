function checkPassword() {
  const pass = document.getElementById('password').value;
  const error = document.getElementById('error');
  if (pass === "123") {
    document.getElementById('login').style.display = "none";
    document.body.style.height = "auto";
    document.getElementById('app').style.display = "block";
  } else {
    error.textContent = "Contraseña incorrecta.";
  }
}

function setMode(mode) {
  document.getElementById('manual').style.display = (mode === 'manual') ? 'block' : 'none';
  document.getElementById('tarifa').style.display = (mode === 'tarifa') ? 'block' : 'none';
}

function calcularManual() {
  const ancho = parseFloat(document.getElementById('anchoManual').value) || 0;
  const alto = parseFloat(document.getElementById('altoManual').value) || 0;
  const precio = parseFloat(document.getElementById('precioManual').value) || 0;

  let m2 = (ancho * alto) / 1000000;
  m2 = Math.ceil(m2 / 0.06) * 0.06;
  const total = m2 * precio;

  document.getElementById('resultadoManual').textContent =
    `Superficie ajustada: ${m2.toFixed(2)} m² | Total: ${total.toFixed(2)} €`;
}

function calcularTarifa() {
  const ancho = parseFloat(document.getElementById('anchoTarifa').value) || 0;
  const alto = parseFloat(document.getElementById('altoTarifa').value) || 0;
  const precio = parseFloat(document.getElementById('precioTarifa').value) || 0;

  let m2 = (ancho * alto) / 1000000;
  m2 = Math.ceil(m2 / 0.06) * 0.06;
  const total = m2 * precio;

  document.getElementById('resultadoTarifa').textContent =
    `Superficie ajustada: ${m2.toFixed(2)} m² | Total: ${total.toFixed(2)} €`;
}