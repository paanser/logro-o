(() => {
  const { jsPDF } = window.jspdf;

  document.addEventListener('DOMContentLoaded', () => {
    // === LOGIN ===
    const btn = document.getElementById('btnLogin');
    const pass = document.getElementById('password');
    const err = document.getElementById('error');
    const login = document.getElementById('login');
    const app = document.getElementById('app');

    btn?.addEventListener('click', check);
    pass?.addEventListener('keypress', e => { if (e.key === 'Enter') check(); });

    function check() {
      const val = pass.value.trim();
      const real = atob('MTIz'); // contraseña "123"

      if (!val) { err.textContent = 'Introduce la contraseña.'; return; }

      if (val === real) {
        err.textContent = '';
        login.classList.add('hidden');
        app.classList.remove('hidden');
      } else {
        err.textContent = 'Contraseña incorrecta.';
      }
    }

    // === SELECTOR DE MODO ===
    const btnManual = document.getElementById('btnManual');
    const btnTarifa = document.getElementById('btnTarifa');
    const manualDiv = document.getElementById('manual');
    const tarifaDiv = document.getElementById('tarifa');

    function setMode(mode) {
      const isManual = mode === 'manual';
      manualDiv.classList.toggle('hidden', !isManual);
      tarifaDiv.classList.toggle('hidden', isManual);
      btnManual.classList.toggle('active', isManual);
      btnTarifa.classList.toggle('active', !isManual);
    }

    btnManual?.addEventListener('click', () => setMode('manual'));
    btnTarifa?.addEventListener('click', () => setMode('tarifa'));

    // === BOTÓN PDF ===
    const btnPDF = document.getElementById('btnExportarPDF');
    btnPDF?.addEventListener('click', generarPDFVidresSosa);

    function generarPDFVidresSosa() {
      try {
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString('es-ES');
        const descripcion = document.getElementById('descripcionPresupuesto')?.value.trim() || '';
        const titulo = 'PRESUPUESTO';
        const empresa = [
          'Domingo Sosa Ribas',
          'C/ De la Plata 8 parcela 185 Nau 4',
          '43006 Tarragona',
          'Telf. 644965156 - 977202819',
          'info@vidressosa.com'
        ];

        // Encabezado
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(titulo, 105, 25, { align: 'center' });

        // Fecha
        doc.setFontSize(11);
        doc.text(`Fecha presupuesto: ${fecha}`, 20, 40);

        // Descripción o contenido
        doc.setFontSize(12);
        doc.text('Concepto:', 20, 55);
        doc.setFontSize(11);
        const texto = descripcion || '—';
        doc.text(texto, 20, 65, { maxWidth: 170 });

        // Pie
        doc.setFontSize(10);
        let y = 260;
        empresa.forEach(linea => {
          doc.text(linea, 20, y);
          y += 5;
        });

        doc.save(`Presupuesto_VidresSosa_${fecha}.pdf`);
      } catch (err) {
        alert('No se pudo generar el PDF. Revisa la consola.');
        console.error(err);
      }
    }
  });
})();
