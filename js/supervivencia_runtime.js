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
