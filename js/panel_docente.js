const CODIGO_ACCESO = "70602726";

const codigo = document.getElementById("codigo");
const btnIngresar = document.getElementById("btnIngresar");
const btnVolver = document.getElementById("btnVolver");
const mensaje = document.getElementById("mensaje");

btnIngresar.addEventListener("click", () => {
    if (codigo.value !== CODIGO_ACCESO) {
        mensaje.textContent = "Código incorrecto.";
        codigo.value = "";
        codigo.focus();
        return;
    }

    sessionStorage.setItem("accesoDocente", "true");
    window.location.href = "panel_configuracion.html";
});

codigo.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        btnIngresar.click();
    }
});

btnVolver.addEventListener("click", () => {
    window.location.href = "../index.html";
});
