// login.js
document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnLogin');
  const passwordInput = document.getElementById('password');
  const errorEl = document.getElementById('error');

  // 🔐 Contraseña correcta (configurada por Pau)
  const CONTRASEÑA_CORRECTA = '123';

  function iniciarSesion() {
    const password = passwordInput.value.trim();
    if (password === CONTRASEÑA_CORRECTA) {
      try {
        sessionStorage.setItem('logueado', 'true');
      } catch (e) {
        console.warn('El almacenamiento de sesión no está disponible');
      }
      // Redirige a la calculadora (ajusta el nombre del archivo si es distinto)
      window.location.href = 'calculadora.html';
    } else {
      errorEl.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  btnLogin.addEventListener('click', iniciarSesion);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') iniciarSesion();
  });
});