(() => {
    const status = document.getElementById("estadoSupervivencia");
    const rutas = {
        desierto: "../data/escenario.html",
        mar: "../data/mar.html",
        cielo: "../data/cielo.html",
        inframundo: "../data/inframundo.html",
        ciudad: "../data/ciudad.html",
        bosque: "../data/bosque.html"
    };
    const nombres = {
        desierto: "Desierto",
        mar: "Mar",
        cielo: "Cielo",
        inframundo: "Inframundo",
        ciudad: "Ciudad",
        bosque: "Bosque"
    };

    try {
        const preguntas = JSON.parse(sessionStorage.getItem("juegoPreguntas") || "null");
        if (!Array.isArray(preguntas) || preguntas.length === 0) {
            throw new Error("No hay preguntas del docente cargadas. Regresa a la sala y configura la evaluación.");
        }

        const escenarios = Object.keys(rutas);
        for (let i = escenarios.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [escenarios[i], escenarios[j]] = [escenarios[j], escenarios[i]];
        }

        const estado = {
            escenarios,
            nombres,
            indiceEscenario: 0,
            cajasCompletadas: 0,
            correctas: 0,
            incorrectas: 0
        };
        sessionStorage.setItem("supervivenciaEstado", JSON.stringify(estado));
        sessionStorage.setItem("modoSupervivencia", "true");
        status.textContent = `Tu primer escenario será ${nombres[escenarios[0]]}.`;
        window.location.replace(rutas[escenarios[0]]);
    } catch (error) {
        status.textContent = error.message;
        sessionStorage.removeItem("modoSupervivencia");
        sessionStorage.removeItem("supervivenciaEstado");
    }
})();
