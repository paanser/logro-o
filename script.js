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
          const precio = parseFloat(columnas[columnas.length - 2].replace(',', '.')) || 0;
          const canto = parseFloat(columnas[columnas.length - 1].replace(',', '.')) || 0;
          tarifa.push({ nombre, precio, canto });
          const option = document.createElement('option');
          option.value = JSON.stringify({ precio, canto });
          option.textContent = `${nombre} — ${precio.toFixed(2).replace('.', ',')} €/m²`;
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
  const subtotal = ajustado * precio;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  resultado.innerHTML = `
    Medidas: ${ancho.toFixed(2)} × ${alto.toFixed(2)} m = ${area.toFixed(2)} m²<br>
    Superficie ajustada: <b>${ajustado.toFixed(2)} m²</b><br>
    Precio unitario: <b>${precio.toFixed(2).replace('.', ',')} €/m²</b><br>
    Subtotal: <b>${subtotal.toFixed(2).replace('.', ',')} €</b><br>
    IVA (21%): <b>${iva.toFixed(2).replace('.', ',')} €</b><br>
    Total: <b>${total.toFixed(2).replace('.', ',')} €</b>`;
}

function calcularTarifa() {
  const ancho = parseFloat(document.getElementById('anchoTarifa').value) || 0;
  const alto = parseFloat(document.getElementById('altoTarifa').value) || 0;
  const vidrio = JSON.parse(document.getElementById('vidrioSelect').value);
  const precio = vidrio.precio;
  const cantoTarifa = vidrio.canto;
  const precioCantoManual = parseFloat(document.getElementById('precioCanto').value) || cantoTarifa || 0;

  const cantosSeleccionados = [
    document.getElementById('cantoIzq').checked,
    document.getElementById('cantoDer').checked,
    document.getElementById('cantoArr').checked,
    document.getElementById('cantoAba').checked
  ].filter(Boolean).length;

  const resultado = document.getElementById('resultadoTarifa');

  if (!ancho || !alto || !precio) {
    resultado.textContent = "Introduce todos los valores.";
    return;
  }

  let area = ancho * alto;
  let ajustado = ajustarMultiplos(area);
  const subtotalVidrio = ajustado * precio;
  const subtotalCantos = cantosSeleccionados * precioCantoManual;
  const subtotal = subtotalVidrio + subtotalCantos;
  const iva = subtotal * 0.21;
  const total = subtotal + iva;

  resultado.innerHTML = `
    Vidrio: <b>${document.getElementById('vidrioSelect').selectedOptions[0].textContent}</b><br>
    Medidas: ${ancho.toFixed(2)} × ${alto.toFixed(2)} m = ${area.toFixed(2)} m²<br>
    Superficie ajustada: <b>${ajustado.toFixed(2)} m²</b><br>
    Precio m²: <b>${precio.toFixed(2).replace('.', ',')} €/m²</b><br>
    Cantos pulidos: <b>${cantosSeleccionados}</b> × ${precioCantoManual.toFixed(2).replace('.', ',')} € = <b>${subtotalCantos.toFixed(2).replace('.', ',')} €</b><br>
    Subtotal: <b>${subtotal.toFixed(2).replace('.', ',')} €</b><br>
    IVA (21%): <b>${iva.toFixed(2).replace('.', ',')} €</b><br>
    Total: <b>${total.toFixed(2).replace('.', ',')} €</b>`;
}