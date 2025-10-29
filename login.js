// =========================================
//  LOGIN VIDRES SOSA · revisión completa
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("btnLogin");
  const errorMsg = document.getElementById("error");
  const loginDiv = document.getElementById("login");
  const appDiv = document.getElementById("app"); // contenedor principal (manual/tarifa)

  // contraseña correcta
  const PASSWORD_CORRECTA = "123";

  // al cargar, ocultamos todo el contenido detrás del login
  if (appDiv) appDiv.style.display = "none";

  // función de validación
  function validarPassword() {
    const valor = passwordInput.value.trim();
    if (valor === PASSWORD_CORRECTA) {
      // ocultamos login y mostramos el contenido principal
      loginDiv.style.opacity = "0";
      loginDiv.style.pointerEvents = "none";

      setTimeout(() => {
        loginDiv.style.display = "none";
        if (appDiv) appDiv.style.display = "block";
        window.scrollTo({ top: 0, behavior: "instant" });
      }, 200);
    } else {
      errorMsg.textContent = "Contraseña incorrecta.";
      passwordInput.value = "";
      passwordInput.focus();
    }
  }

  // evento al hacer click
  loginBtn.addEventListener("click", validarPassword);

  // evento al presionar Enter
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") validarPassword();
  });
});