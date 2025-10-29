// login.js
document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnLogin');
  const passwordInput = document.getElementById('password');
  const errorEl = document.getElementById('error');

  // 🔐 Contraseña correcta (puedes cambiarla aquí)
  const CONTRASEÑA_CORRECTA = 'vidressosa';

  function iniciarSesion() {
    const password = passwordInput.value.trim();
    if (password === CONTRASEÑA_CORRECTA) {
      try {
        sessionStorage.setItem('logueado', 'true');
      } catch (e) {
        console.warn('El almacenamiento de sesión no está disponible');
      }
      // Redirige a la calculadora (puedes cambiar el nombre si tu archivo se llama distinto)
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