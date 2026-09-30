const CODIGO_ACCESO = "70602726";

const codigo = document.getElementById("codigo");
const btnIngresar = document.getElementById("btnIngresar");
const btnVolver = document.getElementById("btnVolver");
const mensaje = document.getElementById("mensaje");

// Botón ingresar
btnIngresar.addEventListener("click", () => {
    window.location.href = "panel_configuracion.html";
    if (codigo.value === CODIGO_ACCESO) {

        mensaje.textContent = "Código correcto.";

        // Posteriormente aquí enviaremos al panel docente.

    } else {

        mensaje.textContent = "Código incorrecto.";
        codigo.value = "";
        codigo.focus();

    }

});

// Permitir ingresar presionando Enter
codigo.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        btnIngresar.click();
    }

});

// Botón volver
btnVolver.addEventListener("click", () => {
    window.location.href = "../index.html";
});