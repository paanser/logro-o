// ===== VIDRES SOSA · SCRIPT TARIFA TODO EN UNO v3.0 =====
document.addEventListener("DOMContentLoaded", () => {

  const anchoInput = document.getElementById("ancho");
  const altoInput = document.getElementById("alto");
  const tipoSelect = document.getElementById("tipoVidrio");
  const btnManualCanto = document.getElementById("btnManualCanto");
  const btnTarifaCanto = document.getElementById("btnTarifaCanto");
  const manualCantoInput = document.getElementById("manual-canto-input");
  const btnCalcular = document.getElementById("btnCalcular");
  const resultadoDiv = document.getElementById("resultado");
  const btnPDF = document.getElementById("btnPDF");
  const ladoBtns = document.querySelectorAll(".lado-btn");

  let ladosSeleccionados = [];
  let usarTarifaCantos = false;
  let precioCantoManual = 0;
  let multiplos = [];
  let tarifaVidrios = [];

  // ===== CARGA DE MÚLTIPLOS =====
  fetch("multiplos.csv")
    .then(r => r.text())
    .then(data => {
      const lineas = data.trim().split("\n").slice(1);
      multiplos = lineas.map(l => {
        const [minimo, maximo] = l.split(",").map(Number);
        return { minimo, maximo };
      });
    });

  // ===== CARGA DE TARIFA VIDRIOS (con punto y coma) =====
  fetch("tarifa_vidrios.csv")
    .then(r => r.text())
    .then(data => {
      const lineas = data.trim().split("\n").slice(1);
      tipoSelect.innerHTML = '<option value="">Selecciona tipo de vidrio...</option>';
      lineas.forEach(l => {
        const [nombre, precio] = l.split(";");
        if (!nombre || !precio) return;
        const nombreLimpio = nombre.trim();
        const precioNum = parseFloat(precio.replace(",", "."));
        tarifaVidrios.push({ nombre: nombreLimpio, precio: precioNum });

        const
