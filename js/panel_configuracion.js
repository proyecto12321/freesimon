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

const mensajeCargarJuego =
    document.getElementById("mensajeCargarJuego");

const listaEscenarios =
    document.getElementById("listaEscenarios");

const estadoEscenario =
    document.getElementById("estadoEscenario");

const tiempoEvaluacion =
    document.getElementById("tiempoEvaluacion");

const DURACIONES_EVALUACION = new Set(["30", "45", "60"]);

const tiempoEvaluacionGuardado =
    sessionStorage.getItem("tiempoEvaluacionMinutos");

tiempoEvaluacion.value = DURACIONES_EVALUACION.has(tiempoEvaluacionGuardado)
    ? tiempoEvaluacionGuardado
    : "30";
sessionStorage.setItem("tiempoEvaluacionMinutos", tiempoEvaluacion.value);

tiempoEvaluacion.addEventListener("change", () => {
    if (!DURACIONES_EVALUACION.has(tiempoEvaluacion.value)) {
        tiempoEvaluacion.value = "30";
    }

    sessionStorage.setItem("tiempoEvaluacionMinutos", tiempoEvaluacion.value);
});

const escenarios = [
    { id: "bosque", nombre: "Bosque Encantado", imagen: "../img/bosque.png" },
    { id: "desierto", nombre: "Desierto tormentoso", imagen: "../img/desierto.png" },
    { id: "cielo", nombre: "Paraíso Celestial", imagen: "../img/cielo.png" },
    { id: "ciudad", nombre: "Metropolitano", imagen: "../img/ciudad.png" },
    { id: "inframundo", nombre: "Infierno de Dante", imagen: "../img/inframundo.png" },
    { id: "mar", nombre: "Mar de Globos", imagen: "../img/mar.png" }
];

function seleccionarEscenario(escenario, tarjeta) {
    listaEscenarios.querySelectorAll(".tarjeta-escenario").forEach((elemento) => {
        const seleccionado = elemento === tarjeta;
        elemento.classList.toggle("seleccionado", seleccionado);
        elemento.setAttribute("aria-pressed", String(seleccionado));
    });

    sessionStorage.setItem("escenarioSeleccionado", escenario.id);
    sessionStorage.setItem("nombreEscenarioSeleccionado", escenario.nombre);
    estadoEscenario.textContent = `Escenario seleccionado: ${escenario.nombre}`;
}

function mostrarEscenarios() {
    const escenarioGuardado = sessionStorage.getItem("escenarioSeleccionado");

    escenarios.forEach((escenario) => {
        const tarjeta = document.createElement("button");
        tarjeta.type = "button";
        tarjeta.className = "tarjeta-escenario";
        tarjeta.setAttribute("aria-label", `Seleccionar ${escenario.nombre}`);
        tarjeta.setAttribute("aria-pressed", String(escenario.id === escenarioGuardado));
        tarjeta.classList.toggle("seleccionado", escenario.id === escenarioGuardado);

        const imagen = document.createElement("img");
        imagen.className = "imagen-escenario";
        imagen.src = escenario.imagen;
        imagen.alt = `Escenario ${escenario.nombre}`;
        imagen.loading = "lazy";

        const nombre = document.createElement("span");
        nombre.className = "nombre-escenario";
        nombre.textContent = escenario.nombre;

        tarjeta.append(imagen, nombre);
        tarjeta.addEventListener("click", () => seleccionarEscenario(escenario, tarjeta));
        listaEscenarios.appendChild(tarjeta);
    });

    const escenarioElegido = escenarios.find(({ id }) => id === escenarioGuardado);
    if (escenarioElegido) {
        estadoEscenario.textContent =
            `Escenario seleccionado: ${escenarioElegido.nombre}`;
    }
}

mostrarEscenarios();


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

btnCargarJuego.addEventListener("click", () => {
    const escenarioId = sessionStorage.getItem("escenarioSeleccionado");
    const escenario = escenarios.find(({ id }) => id === escenarioId);

    if (!escenario) {
        mensajeCargarJuego.textContent =
            "Selecciona un escenario antes de cargar el juego.";
        return;
    }

    const preguntas = JSON.parse(
        sessionStorage.getItem("preguntasFreeSIMON") || "[]"
    );
    const grupos = JSON.parse(
        sessionStorage.getItem("gruposFreeSIMON") || "[]"
    );

    const configuracionJuego = {
        escenario: {
            id: escenario.id,
            nombre: escenario.nombre,
            imagen: escenario.imagen.replace("../", "")
        },
        tiempoEvaluacionMinutos: Number(tiempoEvaluacion.value),
        cantidadPreguntas: Number(
            sessionStorage.getItem("cantidadPreguntas") || preguntas.length
        ),
        preguntas,
        grupos
    };

    sessionStorage.setItem(
        "configuracionJuego",
        JSON.stringify(configuracionJuego)
    );
    sessionStorage.setItem("juegoEscenario", escenario.id);
    sessionStorage.setItem("juegoPreguntas", JSON.stringify(preguntas));
    sessionStorage.setItem("juegoGrupos", JSON.stringify(grupos));
    sessionStorage.setItem("tiempoEvaluacionMinutos", tiempoEvaluacion.value);
    sessionStorage.removeItem("juegoTiempoFin");

    window.location.href = "../index.html";
});


// =================================
// VOLVER
// =================================

btnVolver.addEventListener("click", () => {

    window.location.href = "../index.html";

});