// =========================================================
// VIDRES SOSA · SISTEMA DE ACCESO Y NAVEGACIÓN ENTRE MODOS
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // === SECCIONES PRINCIPALES ===
  const loginSection = document.getElementById("login-section");
  const menuSection = document.getElementById("menu-section");
  const manualSection = document.getElementById("manual-section");
  const tarifaSection = document.getElementById("tarifa-section");

  // === ELEMENTOS DE LOGIN ===
  const btnLogin = document.getElementById("btnLogin");
  const passwordInput = document.getElementById("password");
  const loginError = document.getElementById("login-error");

  // === EVENTO DE LOGIN ===
  btnLogin.addEventListener("click", () => {
    const clave = passwordInput.value.trim();

    if (clave === "123") {
      loginSection.classList.add("hidden");
      menuSection.classList.remove("hidden");
    } else {
      loginError.textContent = "❌ Contraseña incorrecta.";
      passwordInput.value = "";
      passwordInput.focus();
    }
  });

  // === BOTONES DE MENÚ ===
  const btnManual = document.getElementById("btnManual");
  const btnTarifa = document.getElementById("btnTarifa");
  const backToMenu1 = document.getElementById("backToMenu1");
  const backToMenu2 = document.getElementById("backToMenu2");

  // Ir a modo manual
  btnManual.addEventListener("click", () => {
    menuSection.classList.add("hidden");
    manualSection.classList.remove("hidden");
    manualSection.scrollIntoView({ behavior: "smooth" });
  });

  // Ir a modo tarifa
  btnTarifa.addEventListener("click", () => {
    menuSection.classList.add("hidden");
    tarifaSection.classList.remove("hidden");
    tarifaSection.scrollIntoView({ behavior: "smooth" });
  });

  // Volver al menú desde modo manual
  backToMenu1.addEventListener("click", () => {
    manualSection.classList.add("hidden");
    menuSection.classList.remove("hidden");
    window.scrollTo({ top: 0 });
  });

  // Volver al menú desde modo tarifa
  backToMenu2.addEventListener("click", () => {
    tarifaSection.classList.add("hidden");
    menuSection.classList.remove("hidden");
    window.scrollTo({ top: 0 });
  });
});
