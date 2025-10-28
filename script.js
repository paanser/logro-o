(() => {
  const { jsPDF } = window.jspdf;

  document.addEventListener('DOMContentLoaded', () => {
    // LOGIN
    const btnLogin = document.getElementById('btnLogin');
    const pass = document.getElementById('password');
    const err = document.getElementById('error');
    const login = document.getElementById('login');
    const app = document.getElementById('app');

    btnLogin.addEventListener('click', checkLogin);
    pass.addEventListener('keypress', e => { if (e.key === 'Enter') checkLogin(); });

    function checkLogin() {
      const val = pass.value.trim();
      const real = atob('MTIz'); // 123
      if (!val) { err.textContent = 'Introduce la contraseña.'; return; }
      if (val === real) {
        login.classList.add('hidden');
        app.classList.remove('hidden');
      } else {
        err.textContent = 'Contraseña incorrecta.';
      }
    }

    // CAMBIO DE MODO
    const btnManual = document.getElementById('btnManual');
    const btnTarifa = document.getElementById('btnTarifa');
    const manual = document.getElementById('manual');
    const tarifa = document.getElementById('tarifa');

    function setMode(mode) {
      const manualActivo = mode === 'manual';
      manual.classList.toggle('hidden', !manualActivo);
      tarifa.classList.toggle('hidden', manualActivo);
      btnManual.classList.toggle('active', manualActivo);
      btnTarifa.classList.toggle('active', !manualActivo);
    }

    btnManual.addEventListener('click', () => setMode('manual'));
    btnTarifa.addEventListener('click', () => setMode('tarifa'));
    setMode('manual'); // Estado inicial

    // PDF
    const btnPDF = document.getElementById('btnExportarPDF');
    btnPDF.addEventListener('click', () => {
      const doc = new jsPDF();
      const fecha = new Date().toLocaleDateString('es-ES');
      const descripcion = document.getElementById('descripcionPresupuesto').value.trim() || '';
      const empresa = [
        'Domingo Sosa Ribas',
        'C/ De la Plata 8 parcela 185 Nau 4',
        '43006 Tarragona',
        'Telf. 644965156 - 977202819',
        'info@vidressosa.com'
      ];

      doc.setFontSize(18);
      doc.text('PRESUPUESTO', 105, 25, { align: 'center' });

      doc.setFontSize(11);
      doc.text(`Fecha presupuesto: ${fecha}`, 20, 40);
      doc.text('Concepto:', 20, 55);
      doc.text(descripcion || '—', 20, 65, { maxWidth: 170 });

      doc.setFontSize(10);
      let y = 260;
      empresa.forEach(linea => {
        doc.text(linea, 20, y);
        y += 5;
      });

      doc.save(`Presupuesto_VidresSosa_${fecha}.pdf`);
    });
  });
})();
