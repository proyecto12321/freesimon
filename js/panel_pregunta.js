if (sessionStorage.getItem("accesoDocente") !== "true") {
    window.location.href = "panel_docente.html";
}

const formPregunta = document.getElementById("formPregunta");
const textoPregunta = document.getElementById("textoPregunta");
const mensaje = document.getElementById("mensaje");
const listaPreguntas = document.getElementById("listaPreguntas");
const sinPreguntas = document.getElementById("sinPreguntas");
const btnVolver = document.getElementById("btnVolver");
const limitePreguntas = document.getElementById("limitePreguntas");
const btnGuardarPregunta = formPregunta.querySelector('button[type="submit"]');

const preguntas = JSON.parse(
    sessionStorage.getItem("preguntasFreeSIMON") || "[]"
);
const cantidadConfigurada = Number(
    sessionStorage.getItem("cantidadPreguntas")
);
const cantidadValida = Number.isInteger(cantidadConfigurada)
    && cantidadConfigurada >= 1
    && cantidadConfigurada <= 30;

function guardarPreguntas() {
    sessionStorage.setItem("preguntasFreeSIMON", JSON.stringify(preguntas));
}

function actualizarLimite() {
    if (!cantidadValida) {
        limitePreguntas.textContent =
            "Primero configura la cantidad de preguntas en el panel de administración.";
        btnGuardarPregunta.disabled = true;
        formPregunta.querySelectorAll("input, textarea").forEach((campo) => {
            campo.disabled = true;
        });
        return;
    }

    limitePreguntas.textContent =
        `Preguntas registradas: ${preguntas.length} de ${cantidadConfigurada}.`;

    const limiteAlcanzado = preguntas.length >= cantidadConfigurada;
    btnGuardarPregunta.disabled = limiteAlcanzado;
    formPregunta.querySelectorAll("input, textarea").forEach((campo) => {
        campo.disabled = limiteAlcanzado;
    });

    if (limiteAlcanzado) {
        mensaje.textContent = "Ya alcanzaste la cantidad de preguntas configurada.";
    } else if (mensaje.textContent === "Ya alcanzaste la cantidad de preguntas configurada.") {
        mensaje.textContent = "";
    }
}

function mostrarPreguntas() {
    listaPreguntas.replaceChildren();
    sinPreguntas.hidden = preguntas.length > 0;

    preguntas.forEach((pregunta, indice) => {
        const tarjeta = document.createElement("li");
        tarjeta.className = "pregunta";

        const titulo = document.createElement("h3");
        titulo.textContent = pregunta.texto;
        tarjeta.appendChild(titulo);

        const alternativas = document.createElement("ol");
        alternativas.className = "lista-alternativas";

        pregunta.alternativas.forEach((alternativa, alternativaIndice) => {
            const opcion = document.createElement("li");
            opcion.textContent = alternativa;

            if (alternativaIndice === pregunta.correcta) {
                opcion.className = "alternativa-correcta";
                opcion.textContent += " (correcta)";
            }

            alternativas.appendChild(opcion);
        });

        tarjeta.appendChild(alternativas);

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn btn-eliminar";
        btnEliminar.textContent = "Eliminar pregunta";
        btnEliminar.setAttribute("aria-label", `Eliminar pregunta ${indice + 1}`);
        btnEliminar.addEventListener("click", () => {
            preguntas.splice(indice, 1);
            guardarPreguntas();
            mostrarPreguntas();
            actualizarLimite();
        });

        tarjeta.appendChild(btnEliminar);
        listaPreguntas.appendChild(tarjeta);
    });
}

formPregunta.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!cantidadValida) {
        mensaje.textContent =
            "Configura primero la cantidad de preguntas en el panel de administración.";
        return;
    }

    if (preguntas.length >= cantidadConfigurada) {
        mensaje.textContent =
            "Ya alcanzaste la cantidad de preguntas configurada.";
        actualizarLimite();
        return;
    }

    const alternativas = [1, 2, 3, 4].map((numero) =>
        document.getElementById(`alternativa${numero}`).value.trim()
    );
    const respuestaCorrecta = formPregunta.querySelector(
        'input[name="respuestaCorrecta"]:checked'
    );

    if (!textoPregunta.value.trim() || alternativas.some((alternativa) => !alternativa)) {
        mensaje.textContent = "Completa la pregunta y sus cuatro alternativas.";
        return;
    }

    if (!respuestaCorrecta) {
        mensaje.textContent = "Marca cuál de las cuatro alternativas es la correcta.";
        return;
    }

    preguntas.push({
        texto: textoPregunta.value.trim(),
        alternativas,
        correcta: Number(respuestaCorrecta.value)
    });

    guardarPreguntas();
    mostrarPreguntas();
    formPregunta.reset();
    mensaje.textContent = "Pregunta agregada.";
    actualizarLimite();
    textoPregunta.focus();
});

btnVolver.addEventListener("click", () => {
    window.location.href = "panel_configuracion.html";
});

mostrarPreguntas();
actualizarLimite();
