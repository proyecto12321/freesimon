// =====================================================
// VIDA DEL JUGADOR — FreeSIMON
// Cinco corazones, protección, daño y regreso a la sala.
// Compartido por todos los escenarios.
// =====================================================

(() => {
    "use strict";

    // Evitar crear el sistema dos veces si se repite el script.
    if (window.VidaJugador) return;

    // =====================================================
    // 1. CONFIGURACIÓN GENERAL
    // =====================================================

    const CONFIG = {
        corazones: 5,
        proteccionTrasGolpe: 1000, // Milisegundos de inmunidad.
        esperaAlMorir: 3000,

        // Ruta relativa al HTML del escenario, ubicado en data.
        rutaSala: "../html/panel_sala.html"
    };

    // El escenario conectará estas funciones al iniciar.
    const conexiones = {
        puedeRecibirGolpe: () => false,
        alMorir: () => { }
    };

    // =====================================================
    // 2. ESTADO DE LA VIDA
    // Cada carga del escenario comienza con cinco corazones.
    // No se cambia el personaje seleccionado.
    // =====================================================

    let corazones = CONFIG.corazones;
    let muerto = false;
    let protegidoPorPregunta = false;
    let protegidoHasta = 0;

    let interfaz = null;
    let temporizadorDestello = null;
    let contextoAudio = null;

    // =====================================================
    // 3. ESTILOS DEL INDICADOR
    // Se insertan desde JS; no necesitas modificar tu CSS.
    // Puedes cambiar top y right para mover los corazones.
    // =====================================================

    function crearEstilos() {
        const estilo = document.createElement("style");

        estilo.textContent = `
      #fs-vida-panel {
        position: fixed;
        top: 176px;
        left: 32px;
        z-index: 1000;
        padding: 6px 8px;
        border: 1px solid rgba(255,255,255,.25);
        border-radius: 9px;
        background: rgba(17,24,39,.86);
        color: white;
        font: 10px Arial, sans-serif;
        box-shadow: 0 3px 10px rgba(0,0,0,.25);
        pointer-events: none;
      }

      .overlay {
        z-index: 1001;
      }

      #fs-vida-corazones {
        display: flex;
        gap: 3px;
      }

      #fs-vida-corazones svg {
        width: 18px;
        height: 18px;
        fill: #fa4760;
        stroke: #ffb7c1;
        stroke-width: 1.5;
      }

      #fs-vida-corazones svg.vacio {
        fill: #354052;
        stroke: #8792a3;
      }

      #fs-vida-estado {
        display: block;
        margin-top: 3px;
        font-size: 10px;
        text-align: center;
      }

      #fs-vida-panel.critico #fs-vida-corazones {
        animation: fs-vida-latido 1.2s ease-in-out infinite;
      }

      @keyframes fs-vida-latido {
        50% { opacity: .5; }
      }

      #fs-vida-destello {
        position: fixed;
        inset: 0;
        z-index: 1100;
        pointer-events: none;
        opacity: 0;
        box-shadow: inset 0 0 100px 35px rgba(220,30,50,.55);
        transition: opacity .15s;
      }

      #fs-vida-destello.activo {
        opacity: 1;
      }

      #fs-vida-derrota {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: grid;
        place-items: center;
        background: rgba(10,15,25,.8);
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
      }

      #fs-vida-derrota[hidden] {
        display: none;
      }

      #fs-vida-derrota > div {
        max-width: 420px;
        margin: 20px;
        padding: 28px;
        border: 2px solid #fa4760;
        border-radius: 18px;
        background: #172033;
      }

      #fs-vida-derrota h2 {
        margin-top: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        #fs-vida-panel.critico #fs-vida-corazones {
          animation: none;
        }
      }

      @media (max-width: 650px) {
        #fs-vida-panel {
          top: 158px;
          left: 14px;
          padding: 5px 7px;
        }

        #fs-vida-corazones {
          gap: 3px;
        }

        #fs-vida-corazones svg {
          width: 16px;
          height: 16px;
        }
      }
    `;

        document.head.appendChild(estilo);
    }

    // =====================================================
    // 4. CREACIÓN DE LOS CINCO CORAZONES
    // Usamos SVG para que no dependan de emojis o fuentes.
    // =====================================================

    function crearInterfaz() {
        crearEstilos();

        const panel = document.createElement("div");
        panel.id = "fs-vida-panel";

        panel.innerHTML = `
      <div id="fs-vida-corazones" role="img"></div>
      <span id="fs-vida-estado" role="status"
            aria-live="polite"></span>
    `;

        const fila = panel.querySelector("#fs-vida-corazones");

        for (let i = 0; i < CONFIG.corazones; i++) {
            fila.insertAdjacentHTML("beforeend", `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="
            M12 21
            L3.5 12.6
            C-2 7.2 5.5 .8 12 7
            C18.5 .8 26 7.2 20.5 12.6
            Z
          "></path>
        </svg>
      `);
        }

        const destello = document.createElement("div");
        destello.id = "fs-vida-destello";
        destello.setAttribute("aria-hidden", "true");

        const derrota = document.createElement("div");
        derrota.id = "fs-vida-derrota";
        derrota.hidden = true;
        derrota.setAttribute("role", "alert");

        derrota.innerHTML = `
      <div>
        <h2>Te has quedado sin vida</h2>
        <p>Volviendo a la sala…</p>
        <p>Podrás entrar nuevamente con el mismo
           personaje o elegir otro.</p>
      </div>
    `;

        document.body.append(panel, destello, derrota);

        interfaz = {
            panel,
            fila,
            corazones: [...fila.querySelectorAll("svg")],
            estado: panel.querySelector("#fs-vida-estado"),
            destello,
            derrota
        };

        actualizarInterfaz();

        // Por seguridad, reflejar también una derrota que
        // haya ocurrido antes de terminar de cargar el HTML.
        derrota.hidden = !muerto;
    }

    // =====================================================
    // 5. ACTUALIZACIÓN VISUAL DE LA VIDA
    // =====================================================

    function actualizarInterfaz() {
        if (!interfaz) return;

        interfaz.corazones.forEach((corazon, indice) => {
            corazon.classList.toggle("vacio", indice >= corazones);
        });

        interfaz.fila.setAttribute(
            "aria-label",
            `Vida: ${corazones} de ${CONFIG.corazones} corazones`
        );

        interfaz.panel.classList.toggle(
            "critico",
            corazones === 1 && !muerto
        );

        interfaz.estado.textContent = muerto
            ? "Sin vida"
            : protegidoPorPregunta
                ? "Escudo activo · respondiendo"
                : `${corazones} / ${CONFIG.corazones} corazones`;
    }

    // =====================================================
    // 6. SONIDO CORTO DE DAÑO
    // Generado localmente, sin archivos de audio externos.
    // Si el navegador bloquea audio, la vida sigue funcionando.
    // =====================================================

    function reproducirSonido() {
        try {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (!Audio) return;

            contextoAudio ??= new Audio();

            if (contextoAudio.state === "suspended") {
                contextoAudio.resume().catch(() => { });
            }

            const oscilador = contextoAudio.createOscillator();
            const volumen = contextoAudio.createGain();
            const ahora = contextoAudio.currentTime;

            oscilador.type = "triangle";
            oscilador.frequency.setValueAtTime(180, ahora);
            oscilador.frequency.exponentialRampToValueAtTime(
                65, ahora + 0.12
            );

            volumen.gain.setValueAtTime(0.08, ahora);
            volumen.gain.exponentialRampToValueAtTime(
                0.001, ahora + 0.15
            );

            oscilador.connect(volumen);
            volumen.connect(contextoAudio.destination);

            oscilador.onended = () => {
                oscilador.disconnect();
                volumen.disconnect();
            };

            oscilador.start(ahora);
            oscilador.stop(ahora + 0.16);
        } catch {
            // Un problema de audio no debe interrumpir el juego.
        }
    }

    // =====================================================
    // 7. EFECTO ROJO AL RECIBIR UN GOLPE
    // =====================================================

    function mostrarDanio() {
        if (interfaz) {
            interfaz.destello.classList.add("activo");

            clearTimeout(temporizadorDestello);

            temporizadorDestello = setTimeout(() => {
                interfaz.destello.classList.remove("activo");
            }, 180);
        }

        reproducirSonido();
    }

    // =====================================================
    // 8. PROTECCIÓN MIENTRAS RESPONDE UNA PREGUNTA
    // =====================================================

    function establecerProteccion(activa) {
        protegidoPorPregunta = Boolean(activa);
        actualizarInterfaz();
    }

    // Tu desierto ya emite este evento al abrir/cerrar preguntas.
    window.addEventListener("escenario:proteccion", evento => {
        establecerProteccion(evento.detail?.activa);
    });

    // =====================================================
    // 9. RECIBIR UN GOLPE
    // Cada llamada aceptada quita exactamente un corazón.
    // Devuelve true si hubo daño y false si fue rechazado.
    // =====================================================

    function recibirGolpe() {
        if (
            muerto ||
            protegidoPorPregunta ||
            performance.now() < protegidoHasta ||
            !conexiones.puedeRecibirGolpe()
        ) {
            return false;
        }

        corazones = Math.max(0, corazones - 1);

        protegidoHasta =
            performance.now() + CONFIG.proteccionTrasGolpe;

        actualizarInterfaz();
        mostrarDanio();

        if (corazones === 0) {
            morir();
        }

        return true;
    }

    function recuperarCorazon() {
        if (muerto || corazones >= CONFIG.corazones) {
            return false;
        }

        corazones += 1;
        actualizarInterfaz();
        return true;
    }

    // =====================================================
    // 10. DERROTA Y REGRESO A LA SALA
    // Solo puede ejecutarse una vez por participación.
    // =====================================================

    function morir() {
        if (muerto) return;

        muerto = true;
        actualizarInterfaz();

        if (interfaz) {
            interfaz.derrota.hidden = false;
        }

        // Programar el regreso incluso si falla una conexión externa.
        setTimeout(() => {
            window.location.replace(CONFIG.rutaSala);
        }, CONFIG.esperaAlMorir);

        // ESPACIO PARA UNA MEJORA FUTURA:
        // Aquí se podría registrar la eliminación en el servidor
        // y consultar si el docente autoriza el reingreso.
        // Actualmente NO se restringe el reingreso.

        try {
            // El escenario detiene movimiento e interacciones.
            conexiones.alMorir();
        } finally {
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
    }

    // =====================================================
    // 11. PARPADEO DEL PERSONAJE TRAS RECIBIR DAÑO
    // El escenario consulta esto antes de dibujar el cuerpo.
    // =====================================================

    function debeDibujarPersonaje() {
        const ahora = performance.now();

        if (muerto || ahora >= protegidoHasta) {
            return true;
        }

        return Math.floor(ahora / 100) % 2 === 0;
    }

    // =====================================================
    // 12. FUNCIONES PÚBLICAS PARA CONECTAR LOS ESCENARIOS
    // =====================================================

    window.VidaJugador = Object.freeze({
        configurar(opciones = {}) {
            if (typeof opciones.puedeRecibirGolpe === "function") {
                conexiones.puedeRecibirGolpe = opciones.puedeRecibirGolpe;
            }

            if (typeof opciones.alMorir === "function") {
                conexiones.alMorir = opciones.alMorir;
            }
        },

        recibirGolpe,
        recuperarCorazon,
        establecerProteccion,
        debeDibujarPersonaje,

        estaMuerto: () => muerto,
        obtenerCorazones: () => corazones
    });

    // =====================================================
    // 13. INICIAR CUANDO EL HTML ESTÉ DISPONIBLE
    // =====================================================

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            crearInterfaz,
            { once: true }
        );
    } else {
        crearInterfaz();
    }
})();