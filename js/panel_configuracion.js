// =================================
// VERIFICAR ACCESO DOCENTE
// =================================

const accesoDocente =
    sessionStorage.getItem("accesoDocente");

if (accesoDocente !== "true") {

    window.location.href = "panel_docente.html";

}


// =================================
// ELEMENTOS
// =================================

const btnPreguntas =
    document.getElementById("btnPreguntas");

const btnAgregarPreguntas =
    document.getElementById("btnAgregarPreguntas");

const btnCrearGrupos =
    document.getElementById("btnCrearGrupos");

const btnCargarJuego =
    document.getElementById("btnCargarJuego");

const btnVolver =
    document.getElementById("btnVolver");

const cantidadSeleccionada =
    document.getElementById("cantidadSeleccionada");

const preguntasRegistradas =
    document.getElementById("preguntasRegistradas");


// =================================
// ELEMENTOS DEL MODAL
// =================================

const modalPreguntas =
    document.getElementById("modalPreguntas");

const cantidadPreguntas =
    document.getElementById("cantidadPreguntas");

const mensajePreguntas =
    document.getElementById("mensajePreguntas");

const btnGuardarPreguntas =
    document.getElementById("btnGuardarPreguntas");

const btnCancelarPreguntas =
    document.getElementById("btnCancelarPreguntas");


// =================================
// CARGAR CANTIDAD GUARDADA
// =================================

const cantidadGuardada =
    sessionStorage.getItem("cantidadPreguntas");

if (cantidadGuardada) {

    cantidadSeleccionada.textContent =
        `${cantidadGuardada} preguntas`;

}

const preguntasGuardadas = JSON.parse(
    sessionStorage.getItem("preguntasFreeSIMON") || "[]"
);

if (preguntasGuardadas.length > 0) {

    preguntasRegistradas.textContent =
        preguntasGuardadas.length === 1
            ? "1 pregunta agregada"
            : `${preguntasGuardadas.length} preguntas agregadas`;

}


// =================================
// ABRIR EDITOR DE PREGUNTAS
// =================================

btnAgregarPreguntas.addEventListener("click", () => {

    window.location.href = "panel_pregunta.html";

});


// =================================
// ABRIR VENTANA DE PREGUNTAS
// =================================

btnPreguntas.addEventListener("click", () => {

    mensajePreguntas.textContent = "";

    cantidadPreguntas.value =
        sessionStorage.getItem("cantidadPreguntas") || "";

    modalPreguntas.classList.remove("oculto");

    cantidadPreguntas.focus();

});


// =================================
// GUARDAR CANTIDAD
// =================================

btnGuardarPreguntas.addEventListener("click", () => {

    const cantidad =
        Number(cantidadPreguntas.value);


    // ===============================
    // VALIDAR
    // ===============================

    if (
        cantidad < 1 ||
        cantidad > 30 ||
        !Number.isInteger(cantidad)
    ) {

        mensajePreguntas.textContent =
            "La cantidad debe estar entre 1 y 30.";

        cantidadPreguntas.focus();

        return;
    }


    // ===============================
    // GUARDAR
    // ===============================

    sessionStorage.setItem(
        "cantidadPreguntas",
        cantidad
    );


    cantidadSeleccionada.textContent =
        `${cantidad} preguntas`;


    // ===============================
    // CERRAR
    // ===============================

    modalPreguntas.classList.add("oculto");

});


// =================================
// CANCELAR
// =================================

btnCancelarPreguntas.addEventListener("click", () => {

    modalPreguntas.classList.add("oculto");

});


// =================================
// CREAR GRUPOS
// =================================

btnCrearGrupos.addEventListener("click", () => {

    window.location.href = "panel_grupo.html";

});


// =================================
// CARGAR JUEGO
// =================================

// Por ahora sin funcionalidad.

btnCargarJuego.addEventListener("click", () => {

    // Se programará posteriormente.

});


// =================================
// VOLVER
// =================================

btnVolver.addEventListener("click", () => {

    window.location.href = "../index.html";

});