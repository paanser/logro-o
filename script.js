(() => {
  const { jsPDF } = window.jspdf;

  // --- LOGIN ---
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnLogin');
    const pass = document.getElementById('password');
    const err = document.getElementById('error');
    const login = document.getElementById('login');
    const app = document.getElementById('app');

    btn.addEventListener('click', check);
    pass.addEventListener('keypress', e => { if (e.key === 'Enter') check(); });

    function check() {
      const val = pass.value.trim();
      const real = atob('MTIz'); // 123
      if (!val) { err.textContent = 'Introduce la contraseña.'; return; }
      if (val === real) {
        login.classList.add('hidden');
        app.classList.remove('hidden');
        err.textContent = '';
      } else {
        err.textContent = 'Contraseña incorrecta.';
      }
    }
  });

  // --- GENERAR PDF PLANTILLA VIDRES SOSA ---
  document.addEventListener('DOMContentLoaded', () => {
    const btnPDF = document.getElementById('btnExportarPDF');
    if (!btnPDF) return;

    btnPDF.addEventListener('click', () => {
      const doc = new jsPDF();
      const fecha = new Date().toLocaleDateString('es-ES');
      const descripcion = document.getElementById('descripcionPresupuesto').value.trim();
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
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha presupuesto: ${fecha}`, 20, 40);

      // Descripción
      const texto = descripcion || '—';
      doc.setFontSize(12);
      doc.text('Concepto:', 20, 55);
      doc.setFontSize(11);
      doc.text(texto, 20, 65, { maxWidth: 170 });

      // Pie de página
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
