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
  document.getElementById('btnManual').style.background = (mode === 'manual') ? '#00994d' : '#006e3b';
  document.getElementById('btnTarifa').style.background = (mode === 'tarifa') ? '#00994d' : '#006e3b';
}

let multiplos = [];
let tarifa = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarMultiplos();
  cargarTarifa();
});

function cargarMultiplos() {
  fetch('multiplos.csv')
    .then(response => response.text())
    .then(data => {
      multiplos = data.trim().split('\n').map(line => parseFloat(line.replace(',', '.')));
    })
    .catch(err => console.error("Error al cargar múltiplos:", err));
}

function cargarTarifa() {
  fetch('tarifa_mapfre_completa.csv')
    .then(response => response.text())
    .then(data => {
      const lineas = data.trim().split('\n');
      const select = document.getElementById('vidrioSelect');
      lineas.forEach((linea, i) => {
        if (i > 0) {
          const columnas = linea.split(';');
          const nombre = columnas[0];
          const precio = parseFloat(columnas[columnas.length - 1].replace(',', '.'));
          tarifa.push({ nombre, precio });
          const option = document.createElement('option');
          option.value = precio;
          option.textContent = nombre;
          select.appendChild(option);
        }
      });
    })
    .catch(err => console.error("Error al cargar tarifa:", err));
}

function ajustarMultiplos(area) {
  let ajustado = multiplos.find(m => m >= area);
  if (!ajustado) ajustado = Math.ceil(area * 100) / 100;
  return ajustado;
}

function calcularManual() {
  const ancho = parseFloat(document.getElementById('anchoManual').value) || 0;
  const alto = parseFloat(document.getElementById('altoManual').value) || 0;
  const precio = parseFloat(document.getElementById('precioManual').value) || 0;
  const resultado = document.getElementById('resultadoManual');

  if (!ancho || !alto || !precio) {
    resultado.textContent = "Introduce todos los valores.";
    return;
  }

  let area = ancho * alto;
  let ajustado = ajustarMultiplos(area);
  const total = ajustado * precio;

  resultado.innerHTML = `
    Medidas: ${ancho.toFixed(2)} × ${alto.toFixed(2)} m = ${area.toFixed(2)} m²<br>
    Superficie ajustada: <b>${ajustado.toFixed(2)} m²</b><br>
    Precio unitario: <b>${precio.toFixed(2)} €/m²</b><br>
    Total: <b>${total.toFixed(2)} €</b>`;
}

function calcularTarifa() {
  const ancho = parseFloat(document.getElementById('anchoTarifa').value) || 0;
  const alto = parseFloat(document.getElementById('altoTarifa').value) || 0;
  const precio = parseFloat(document.getElementById('vidrioSelect').value) || 0;
  const nombreVidrio = document.getElementById('vidrioSelect').selectedOptions[0].textContent;
  const resultado = document.getElementById('resultadoTarifa');

  if (!ancho || !alto || !precio) {
    resultado.textContent = "Introduce todos los valores.";
    return;
  }

  let area = ancho * alto;
  let ajustado = ajustarMultiplos(area);
  const total = ajustado * precio;

  resultado.innerHTML = `
    Vidrio: <b>${nombreVidrio}</b><br>
    Medidas: ${ancho.toFixed(2)} × ${alto.toFixed(2)} m = ${area.toFixed(2)} m²<br>
    Superficie ajustada: <b>${ajustado.toFixed(2)} m²</b><br>
    Precio tarifa: <b>${precio.toFixed(2)} €/m²</b><br>
    Total: <b>${total.toFixed(2)} €</b>`;
}