document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.getElementById("btnLogin");
  const passwordInput = document.getElementById("password");
  const errorText = document.getElementById("error");
  const loginScreen = document.getElementById("login-screen");
  const modeScreen = document.getElementById("mode-screen");

  btnLogin.addEventListener("click", () => {
    const password = passwordInput.value.trim();
    if (password === "123") {
      loginScreen.classList.add("hidden");
      modeScreen.classList.remove("hidden");
    } else {
      errorText.textContent = "Contraseña incorrecta";
      passwordInput.value = "";
      passwordInput.focus();
    }
  });

  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btnLogin.click();
  });
});