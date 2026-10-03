(() => {
    if (new URLSearchParams(window.location.search).get("tiempo") === "agotado") {
        document.getElementById("mensajeFinal").textContent =
            "El tiempo se agotó. La evaluación de Supervivencia ha culminado.";
        document.querySelector(".sobrelinea").textContent = "EVALUACIÓN CULMINADA";
        document.querySelector(".felicitacion").textContent =
            "Este es tu resultado al momento de finalizar el tiempo.";
    }
    sessionStorage.removeItem("juegoTiempoFin");

    const raw = sessionStorage.getItem("supervivenciaEstado");
    if (!raw) {
        document.getElementById("mensajeFinal").textContent =
            "No hay resultados de Supervivencia";
        document.querySelector(".felicitacion").textContent =
            "No se encontraron estadísticas para esta partida.";
        return;
    }

    try {
        const estado = JSON.parse(raw);
        const correctas = Number.isInteger(estado.correctas) ? estado.correctas : 0;
        const incorrectas = Number.isInteger(estado.incorrectas) ? estado.incorrectas : 0;
        const total = correctas + incorrectas;
        const porcentaje = total ? (correctas / total) * 100 : 0;
        const nota = porcentaje / 5;
        document.getElementById("respuestasCorrectas").textContent = String(correctas);
        document.getElementById("respuestasIncorrectas").textContent = String(incorrectas);
        document.getElementById("porcentajeSupervivencia").textContent = `${porcentaje.toFixed(1)}%`;
        document.getElementById("notaSupervivencia").textContent = `${nota.toFixed(2)} / 20`;
    } catch {
        document.querySelector(".felicitacion").textContent =
            "No se pudieron leer los resultados de esta partida.";
    }
})();
