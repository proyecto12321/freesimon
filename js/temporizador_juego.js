(() => {
    "use strict";

    const DURACIONES_VALIDAS = new Set([30, 45, 60]);
    const almacenamientoFin = "juegoTiempoFin";
    const elemento = document.getElementById("temporizadorJuego");
    const texto = document.getElementById("textoTiempo");
    const progreso = document.getElementById("progresoTiempo");

    if (!elemento || !texto || !progreso) {
        throw new Error("Falta el componente visual del temporizador en el escenario.");
    }

    const circunferencia = 2 * Math.PI * 46;
    progreso.style.strokeDasharray = String(circunferencia);

    let intervalo = null;
    let fin = null;
    let duracionMs = null;

    function redirigirAlFinal() {
        if (intervalo !== null) {
            window.clearInterval(intervalo);
            intervalo = null;
        }
        const final = sessionStorage.getItem("modoSupervivencia") === "true"
            ? "../html/final_supervivencia.html?tiempo=agotado"
            : "../html/final.html";
        window.location.href = final;
    }

    function actualizar() {
        const restante = Math.max(0, fin - Date.now());
        const segundos = Math.ceil(restante / 1000);
        const minutosTexto = String(Math.floor(segundos / 60)).padStart(2, "0");
        const segundosTexto = String(segundos % 60).padStart(2, "0");
        const fraccion = Math.max(0, Math.min(1, restante / duracionMs));

        texto.textContent = `${minutosTexto}:${segundosTexto}`;
        elemento.setAttribute("aria-label", `Tiempo restante: ${minutosTexto} minutos y ${segundosTexto} segundos`);
        progreso.style.strokeDashoffset = String(circunferencia * (1 - fraccion));
        elemento.classList.toggle("por-agotarse", restante <= 5 * 60 * 1000);

        if (restante <= 0) {
            redirigirAlFinal();
        }
    }

    function iniciar() {
        const minutos = Number(sessionStorage.getItem("tiempoEvaluacionMinutos") || 30);
        const duracion = DURACIONES_VALIDAS.has(minutos) ? minutos : 30;
        const finGuardado = Number(sessionStorage.getItem(almacenamientoFin));

        if (Number.isFinite(finGuardado) && finGuardado > 0) {
            fin = finGuardado;
            duracionMs = Math.max(duracion * 60 * 1000, fin - Date.now());
        } else {
            duracionMs = duracion * 60 * 1000;
            fin = Date.now() + duracionMs;
            sessionStorage.setItem(almacenamientoFin, String(fin));
        }

        elemento.hidden = false;
        actualizar();
        if (intervalo === null) {
            intervalo = window.setInterval(actualizar, 250);
        }
    }

    window.TemporizadorJuego = Object.freeze({ iniciar });
})();
