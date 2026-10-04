// =========================================
// DATOS DEL JUGADOR
// =========================================

const nombre =
    sessionStorage.getItem("nombreJugador");

const grado =
    sessionStorage.getItem("gradoJugador");

const seccion =
    sessionStorage.getItem("seccionJugador");


// =========================================
// ELEMENTOS
// =========================================

const datosJugador =
    document.getElementById("datosJugador");

const listaSalas =
    document.getElementById("listaSalas");

const btnIniciarJuego =
    document.getElementById("btnIniciarJuego");

const btnVolver =
    document.getElementById("btnVolver");

const btnSupervivencia =
    document.getElementById("btnSupervivencia");

const detalleSala =
    document.getElementById("detalleSala");

let personajeSeleccionado =
    sessionStorage.getItem("personajeSeleccionado");

let salaSeleccionada = null;

const mensajeCargarJuego =
    document.getElementById("mensajeCargarJuego");


// =========================================
// VERIFICAR DATOS DEL JUGADOR
// =========================================

if (!nombre || !grado || !seccion) {

    window.location.href = "../index.html";

} else {

    datosJugador.textContent =
        `Jugador: ${nombre} | Grado: ${grado}.º | Sección: ${seccion}`;

}


// =========================================
// CARGAR GRUPOS
// =========================================

const configuracionJuego = JSON.parse(
    sessionStorage.getItem("configuracionJuego") || "null"
);

function restaurarConfiguracionJuego() {
    const escenarioId = configuracionJuego?.escenario?.id;
    if (typeof escenarioId === "string" && escenarioId) {
        sessionStorage.setItem("juegoEscenario", escenarioId);
    }

    const preguntas = configuracionJuego?.preguntas;
    if (Array.isArray(preguntas) && preguntas.length > 0) {
        sessionStorage.setItem("juegoPreguntas", JSON.stringify(preguntas));
    }

    const gruposConfigurados = configuracionJuego?.grupos;
    if (Array.isArray(gruposConfigurados)) {
        sessionStorage.setItem("juegoGrupos", JSON.stringify(gruposConfigurados));
    }

    const duracion = String(configuracionJuego?.tiempoEvaluacionMinutos ?? "");
    if (["30", "45", "60"].includes(duracion)) {
        sessionStorage.setItem("tiempoEvaluacionMinutos", duracion);
    }
}

restaurarConfiguracionJuego();

const gruposGuardados = configuracionJuego?.grupos
    ?? JSON.parse(sessionStorage.getItem("gruposFreeSIMON") || "[]");
const grupos = Array.isArray(gruposGuardados) ? gruposGuardados : [];


// =========================================
// MOSTRAR GRUPOS
// =========================================

if (grupos.length === 0) {

    listaSalas.innerHTML = `

        <div class="sin-grupos">

            <p>
                No hay grupos creados todavía.
            </p>

        </div>

    `;

} else {

    grupos.forEach(grupo => {

        mostrarGrupo(grupo);

    });

}


// =========================================
// MOSTRAR CADA GRUPO
// =========================================

function mostrarGrupo(grupo) {

    const tarjeta =
        document.createElement("button");

    tarjeta.classList.add("tarjeta-grupo");
    tarjeta.type = "button";
    tarjeta.setAttribute("aria-pressed", "false");


    const titulo = document.createElement("h3");
    titulo.textContent = `Grupo ${grupo.numero}: ${grupo.nombre}`;
    tarjeta.appendChild(titulo);

    const numero = document.createElement("p");
    numero.textContent = `Número de grupo: ${grupo.numero}`;
    tarjeta.appendChild(numero);

    const nombreSala = document.createElement("p");
    nombreSala.textContent = `Nombre: ${grupo.nombre}`;
    tarjeta.appendChild(nombreSala);

    const integrantesPermitidos = document.createElement("p");
    integrantesPermitidos.textContent =
        `Estudiantes permitidos: ${grupo.cantidad}`;
    tarjeta.appendChild(integrantesPermitidos);

    tarjeta.addEventListener("click", () => {
        listaSalas.querySelectorAll(".tarjeta-grupo").forEach((elemento) => {
            const seleccionada = elemento === tarjeta;
            elemento.classList.toggle("seleccionada", seleccionada);
            elemento.setAttribute("aria-pressed", String(seleccionada));
        });

        salaSeleccionada = grupo;
        mensajeCargarJuego.textContent = "";
        mostrarDetalleSala(grupo);
    });


    listaSalas.appendChild(tarjeta);

}

function mostrarDetalleSala(grupo) {
    detalleSala.replaceChildren();

    const resumen = document.createElement("div");
    resumen.className = "resumen-sala";

    const titulo = document.createElement("h3");
    titulo.textContent = `Sala: ${grupo.nombre}`;
    resumen.appendChild(titulo);

    const integrantes = document.createElement("p");
    integrantes.textContent = "Integrantes seleccionados: 0";
    resumen.appendChild(integrantes);

    const personaje = document.createElement("p");
    personaje.textContent = `Personaje: ${personajeSeleccionado}`;
    resumen.appendChild(personaje);

    detalleSala.appendChild(resumen);
}

document.addEventListener("personajeSeleccionado", (event) => {
    personajeSeleccionado = event.detail.nombre;
    mensajeCargarJuego.textContent = "";

    const personaje = detalleSala.querySelector(".resumen-sala p:last-child");
    if (personaje) {
        personaje.textContent = `Personaje: ${personajeSeleccionado}`;
    }
});


// =========================================
// INICIAR JUEGO
// =========================================

btnIniciarJuego.addEventListener("click", () => {
    if (!personajeSeleccionado) {
        mensajeCargarJuego.textContent =
            "Selecciona un personaje antes de cargar el juego.";
        return;
    }

    if (!salaSeleccionada) {
        mensajeCargarJuego.textContent =
            "Selecciona una sala antes de cargar el juego.";
        return;
    }

    restaurarConfiguracionJuego();
    sessionStorage.removeItem("modoSupervivencia");
    sessionStorage.removeItem("supervivenciaEstado");
    sessionStorage.removeItem("juegoTiempoFin");

    const escenarioId = configuracionJuego?.escenario?.id
        || sessionStorage.getItem("juegoEscenario")
        || sessionStorage.getItem("escenarioSeleccionado");

    const rutas = {
        bosque: "../data/bosque.html",
        desierto: "../data/escenario.html",
        cielo: "../data/cielo.html",
        ciudad: "../data/ciudad.html",
        inframundo: "../data/inframundo.html",
        mar: "../data/mar.html",
        hielo: "../data/hielo.html",
        castillo: "../data/castillo.html"
    };

    if (!escenarioId) {
        mensajeCargarJuego.textContent =
            "Selecciona un escenario en el panel de configuración antes de cargar el juego.";
        return;
    }

    if (!Object.prototype.hasOwnProperty.call(rutas, escenarioId)) {
        mensajeCargarJuego.textContent =
            "El escenario seleccionado aún no está disponible. Puedes elegir Cielo, Mar o Desierto.";
        return;
    }

    sessionStorage.setItem("juegoPersonaje", personajeSeleccionado);
    sessionStorage.setItem("personajeSeleccionado", personajeSeleccionado);
    sessionStorage.setItem("juegoSala", JSON.stringify(salaSeleccionada));
    window.location.href = rutas[escenarioId];
});

// =========================================
// VOLVER
// =========================================

btnVolver.addEventListener("click", () => {

    window.location.href = "../index.html";

});

btnSupervivencia.addEventListener("click", () => {

    restaurarConfiguracionJuego();
    sessionStorage.removeItem("juegoTiempoFin");
    if (personajeSeleccionado) {
        sessionStorage.setItem("juegoPersonaje", personajeSeleccionado);
        sessionStorage.setItem("personajeSeleccionado", personajeSeleccionado);
    }
    if (salaSeleccionada) {
        sessionStorage.setItem("juegoSala", JSON.stringify(salaSeleccionada));
    }

    window.location.href = "supervivencia_escenario.html";

});