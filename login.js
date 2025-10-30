// ======== VIDRES SOSA · login.js v1.3 ======== //
// Controla el acceso, navegación entre menús y modos de cálculo

document.addEventListener("DOMContentLoaded", () => {
  // Secciones principales
  const loginSection = document.getElementById("login-section");
  const menuSection = document.getElementById("menu-section");
  const manualSection = document.getElementById("manual-section");
  const tarifaSection = document.getElementById("tarifa-section");

  // Elementos de login
  const passwordInput = document.getElementById("password");
  const btnLogin = document.getElementById("btnLogin");
  const loginError = document.getElementById("login-error");

  // Botones del menú
  const btnManual = document.getElementById("btnManual");
  const btnTarifa = document.getElementById("btnTarifa");
  const backToMenu1 = document.getElementById("backToMenu1");
  const backToMenu2 = document.getElementById("backToMenu2");

  const PASSWORD_CORRECTA = "123"; // Cambia aquí la contraseña si lo deseas

  // ----- LOGIN -----
  btnLogin.addEventListener("click", () => {
    const password = passwordInput.value.trim();

    if (password === PASSWORD_CORRECTA) {
      loginSection.classList.add("hidden");
      menuSection.classList.remove("hidden");
      loginError.textContent = "";
      passwordInput.value = "";
    } else {
      loginError.textContent = "Contraseña incorrecta.";
    }
  });

  // Permitir Enter para entrar
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btnLogin.click();
  });

  // ----- MENÚ PRINCIPAL -----
  btnManual.addEventListener("click", () => {
    menuSection.classList.add("hidden");
    manualSection.classList.remove("hidden");
  });

  btnTarifa.addEventListener("click", () => {
    menuSection.classList.add("hidden");
    tarifaSection.classList.remove("hidden");
  });

  // ----- BOTONES VOLVER -----
  backToMenu1.addEventListener("click", () => {
    manualSection.classList.add("hidden");
    menuSection.classList.remove("hidden");
  });

  backToMenu2.addEventListener("click", () => {
    tarifaSection.classList.add("hidden");
    menuSection.classList.remove("hidden");
  });
});