// ========================================
// CARGAR LOS EFECTOS UNA VEZ POR ESCENARIO
// ========================================
(() => {
    "use strict";

    // Las rutas parten de la ubicación de este sonidos.js.
    const base = new URL(".", document.currentScript.src);

    const audios = {
        salto: new Audio(new URL("music/salto.mp3", base).href),
        caja: new Audio(new URL("music/caja.mp3", base).href)
    };

    Object.values(audios).forEach(audio => {
        audio.preload = "auto";
        audio.volume = 0.40;
    });

    // ========================================
    // REPRODUCIR UN EFECTO DESDE SU INICIO
    // ========================================
    window.SonidosJuego = {
        reproducir(nombre) {
            const audio = audios[nombre];
            if (!audio) return;

            try {
                audio.currentTime = 0;
                audio.play().catch(() => {
                    // Un fallo de audio no interrumpe el juego.
                });
            } catch {
                // El juego continúa si el audio no está disponible.
            }
        }
    };
})();