const btnJugar = document.getElementById("btnJugar");
const btnPanelDocente = document.getElementById("btnPanelDocente");
const btnSalir = document.getElementById("btnSalir");


// ===============================
// BOTÓN JUGAR
// ===============================

btnJugar.addEventListener("click", () => {

    const nombre = document.getElementById("nombre").value.trim();
    const grado = document.getElementById("grado").value;
    const seccion = document.getElementById("seccion").value;

    // Verificar que los tres datos estén completos
    if (nombre === "" || grado === "" || seccion === "") {

        alert("Debes ingresar tu nombre, grado y sección para continuar.");

        return;
    }

    // Guardar temporalmente los datos del jugador
    sessionStorage.setItem("nombreJugador", nombre);
    sessionStorage.setItem("gradoJugador", grado);
    sessionStorage.setItem("seccionJugador", seccion);

    // Ir al panel de sala
    window.location.href = "html/panel_sala.html";
});


// ===============================
// PANEL DOCENTE
// ===============================

btnPanelDocente.addEventListener("click", () => {

    window.location.href = "html/panel_docente.html";

});


// ===============================
// BOTÓN SALIR
// ===============================

btnSalir.addEventListener("click", () => {

    // Por ahora no tiene acción.
    // La programaremos posteriormente.

});