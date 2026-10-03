(() => {
    const estado = JSON.parse(sessionStorage.getItem("supervivenciaEstado") || "null");
    if (!estado || !Array.isArray(estado.escenarios) || !Number.isInteger(estado.indiceEscenario)) {
        document.getElementById("siguienteEscenario").textContent =
            "No se encontró una partida de Supervivencia activa.";
        document.getElementById("continuarSupervivencia").disabled = true;
        return;
    }

    const rutas = {
        desierto: "../data/escenario.html",
        mar: "../data/mar.html",
        cielo: "../data/cielo.html",
        inframundo: "../data/inframundo.html",
        ciudad: "../data/ciudad.html",
        bosque: "../data/bosque.html"
    };
    const mapa = estado.escenarios[estado.indiceEscenario];
    const nombre = estado.nombres?.[mapa] || mapa;
    document.getElementById("siguienteEscenario").textContent =
        `El siguiente desafío será ${nombre}.`;

    const continuar = () => {
        if (rutas[mapa]) window.location.href = rutas[mapa];
    };
    document.getElementById("continuarSupervivencia").addEventListener("click", continuar);
    window.setTimeout(continuar, 3500);
})();
