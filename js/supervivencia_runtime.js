(() => {
    "use strict";

    const estadoKey = "supervivenciaEstado";
    const esSupervivencia = () => sessionStorage.getItem("modoSupervivencia") === "true";
    let cajasPregunta = [];

    function leerEstado() {
        const raw = sessionStorage.getItem(estadoKey);
        if (!raw) {
            throw new Error("No se encontró el progreso de Supervivencia. Inicia una partida nueva desde la sala.");
        }
        const estado = JSON.parse(raw);
        if (!Array.isArray(estado.escenarios) || !Number.isInteger(estado.indiceEscenario)
            || !Number.isInteger(estado.cajasCompletadas) || estado.cajasCompletadas < 0
            || !Number.isInteger(estado.correctas) || !Number.isInteger(estado.incorrectas)) {
            throw new Error("El progreso de Supervivencia no es válido. Inicia una partida nueva desde la sala.");
        }
        return estado;
    }

    function guardarEstado(estado) {
        sessionStorage.setItem(estadoKey, JSON.stringify(estado));
    }

    function avanzarEscenario(estado) {
        const siguienteIndice = estado.indiceEscenario + 1;
        if (siguienteIndice >= estado.escenarios.length) {
            sessionStorage.setItem("modoSupervivencia", "false");
            window.location.href = "../html/final_supervivencia.html";
            return;
        }

        estado.indiceEscenario = siguienteIndice;
        estado.cajasCompletadas = 0;
        guardarEstado(estado);
        window.location.href = "../html/transicion_supervivencia.html";
    }

    function actualizarIndicador(estado) {
        const indicador = document.getElementById("objective");
        if (indicador) {
            indicador.textContent = `Supervivencia · escenario ${estado.indiceEscenario + 1}/${estado.escenarios.length} · caja ${Math.min(estado.cajasCompletadas + 1, 5)}/5`;
        }
    }

    window.Supervivencia = Object.freeze({
        estaActiva: esSupervivencia,

        prepararCajas(mapa, cajas) {
            if (!esSupervivencia()) return false;

            const estado = leerEstado();
            const mapaEsperado = estado.escenarios[estado.indiceEscenario];
            if (mapa !== mapaEsperado) {
                throw new Error(`El recorrido esperaba ${mapaEsperado}, pero se abrió ${mapa}. Inicia una partida nueva.`);
            }
            cajasPregunta = cajas;
            if (cajasPregunta.length < 5) {
                throw new Error(`El escenario ${mapa} necesita al menos cinco cajas de preguntas.`);
            }

            if (estado.cajasCompletadas >= 5) {
                cajasPregunta.forEach(caja => {
                    caja.supervivenciaOculta = true;
                });
                avanzarEscenario(estado);
                return true;
            }

            // Reparto continuo entre escenarios: los motores vuelven a asignar
            // 0, 1, 2... al cargar, por eso aquí corregimos caja.pregunta.
            // correctas ya persiste durante toda la partida. Restamos las de
            // este mapa para reconstruir su lote incluso después de recargar.
            let preguntas;
            try {
                preguntas = JSON.parse(sessionStorage.getItem("juegoPreguntas") || "null");
            } catch {
                throw new Error("No se pudieron leer las preguntas de la partida. Vuelve a cargar el juego desde el panel docente.");
            }
            if (!Array.isArray(preguntas) || preguntas.length === 0) {
                throw new Error("No hay preguntas cargadas para Supervivencia. Carga el juego desde el panel docente.");
            }
            const respondidasAntesDelMapa = estado.correctas - estado.cajasCompletadas;
            if (respondidasAntesDelMapa < 0) {
                throw new Error("El avance de preguntas no es válido. Inicia una partida nueva desde la sala.");
            }
            cajasPregunta.forEach((caja, indice) => {
                if (indice < 5) {
                    // El módulo permite repetir solo al agotar TODA la lista.
                    // Ejemplo con 12 preguntas: 1–5, 6–10, 11–12–1–2–3.
                    caja.pregunta = (respondidasAntesDelMapa + indice) % preguntas.length;
                }
            });

            const indiceActual = Math.min(estado.cajasCompletadas, 4);
            cajasPregunta.forEach((caja, indice) => {
                caja.supervivenciaOculta = indice !== indiceActual;
            });
            actualizarIndicador(estado);
            return true;
        },

        registrarRespuesta(caja, correcta) {
            if (!esSupervivencia()) return;

            const estado = leerEstado();
            // Un callback repetido no debe contar dos veces ni saltar preguntas.
            if (estado.cajasCompletadas >= 5
                || caja !== cajasPregunta[estado.cajasCompletadas]
                || caja.supervivenciaOculta) return;
            if (correcta) {
                estado.correctas += 1;
                estado.cajasCompletadas += 1;
                caja.supervivenciaOculta = true;
                const siguiente = cajasPregunta[estado.cajasCompletadas];
                if (siguiente && estado.cajasCompletadas < 5) {
                    siguiente.supervivenciaOculta = false;
                }
            } else {
                estado.incorrectas += 1;
            }
            guardarEstado(estado);
            actualizarIndicador(estado);
        },

        alCerrarPregunta() {
            if (!esSupervivencia()) return false;
            const estado = leerEstado();
            if (estado.cajasCompletadas < 5) return false;

            avanzarEscenario(estado);
            return true;
        }
    });
})();
