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

const detalleSala =
    document.getElementById("detalleSala");

let personajeSeleccionado =
    sessionStorage.getItem("personajeSeleccionado") || "X";


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

const grupos = JSON.parse(
    sessionStorage.getItem("gruposFreeSIMON")
) || [];


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

    const personaje = detalleSala.querySelector(".resumen-sala p:last-child");
    if (personaje) {
        personaje.textContent = `Personaje: ${personajeSeleccionado}`;
    }
});


// =========================================
// INICIAR JUEGO
// =========================================

// Por ahora sin funcionalidad.

btnIniciarJuego.addEventListener("click", () => {

    // Se programará posteriormente.

});


// =========================================
// VOLVER
// =========================================

btnVolver.addEventListener("click", () => {

    window.location.href = "../index.html";

});