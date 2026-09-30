// FreeSIMON

const btnJugar = document.getElementById("btnJugar");
const btnPanelDocente = document.getElementById("btnPanelDocente");
const btnSalir = document.getElementById("btnSalir");

// Panel docente
btnPanelDocente.addEventListener("click", () => {
    window.location.href = "html/panel_docente.html";
});

// Las acciones de Jugar y Salir se programarán posteriormente.