// =====================================================
// VIDA_JUGADOR.JS — Cinco corazones, inmunidad y derrota.
// Armas, botiquines y escudos usan esta única fuente de vida.
// =====================================================
(() => {
  'use strict';
  if (window.VidaJugador) return;

  // 1. REGLAS. Una nueva carga del escenario empieza con vida completa.
  const CONFIG = {
    corazones: 5,
    proteccionTrasGolpe: 1000,
    esperaAlMorir: 3000,
    rutaSala: '../html/panel_sala.html'
  };
  const conexiones = {
    puedeRecibirGolpe: () => false,
    alMorir: () => {},
    absorberGolpe: () => false
  };
  let corazones = CONFIG.corazones;
  let muerto = false;
  let protegidoPorPregunta = false;
  let protegidoHasta = 0;
  let interfaz = null, temporizadorDestello = null, contextoAudio = null;

  // 2. INTERFAZ. No cambia la distribución del HTML existente.
  function crearInterfaz() {
    const estilo = document.createElement('style');
    estilo.textContent = `
      #fs-vida-panel {position:fixed;top:176px;left:32px;z-index:1000;
        padding:12px 15px;border:2px solid #ffffff40;border-radius:14px;
        background:rgba(17,24,39,.86);color:white;font:12px Arial,sans-serif;
        box-shadow:0 6px 20px #0004;pointer-events:none;}
      .overlay {z-index:1001;}
      #fs-vida-corazones {display:flex;gap:5px;}
      #fs-vida-corazones svg {width:27px;height:27px;fill:#fa4760;stroke:#ffb7c1;stroke-width:1.5;}
      #fs-vida-corazones svg.vacio {fill:#354052;stroke:#8792a3;}
      #fs-vida-estado {display:block;margin-top:7px;text-align:center;}
      #fs-vida-panel.critico #fs-vida-corazones {animation:fs-vida-latido 1.2s ease-in-out infinite;}
      @keyframes fs-vida-latido {50% {opacity:.5;}}
      #fs-vida-destello {position:fixed;inset:0;z-index:1100;pointer-events:none;
        opacity:0;box-shadow:inset 0 0 100px 35px #dc1e328c;transition:opacity .15s;}
      #fs-vida-destello.activo {opacity:1;}
      #fs-vida-derrota {position:fixed;inset:0;z-index:10000;display:grid;place-items:center;
        background:#0a0f19cc;color:white;font:16px Arial,sans-serif;text-align:center;}
      #fs-vida-derrota[hidden] {display:none;}
      #fs-vida-derrota > div {max-width:420px;margin:20px;padding:28px;border:2px solid #fa4760;
        border-radius:18px;background:#172033;}
      #fs-vida-derrota h2 {margin-top:0;}
      @media(prefers-reduced-motion:reduce) {
        #fs-vida-panel.critico #fs-vida-corazones {animation:none;}
      }
    `;
    document.head.appendChild(estilo);
    const panel = document.createElement('div');
    panel.id = 'fs-vida-panel';
    panel.innerHTML = '<div id="fs-vida-corazones" role="img"></div><span id="fs-vida-estado" role="status" aria-live="polite"></span>';
    const fila = panel.querySelector('#fs-vida-corazones');
    for (let i = 0; i < CONFIG.corazones; i++) {
      fila.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21L3.5 12.6C-2 7.2 5.5 .8 12 7C18.5 .8 26 7.2 20.5 12.6Z"></path></svg>');
    }
    const destello = document.createElement('div');
    destello.id = 'fs-vida-destello';
    destello.setAttribute('aria-hidden','true');
    const derrota = document.createElement('div');
    derrota.id = 'fs-vida-derrota';
    derrota.hidden = !muerto;
    derrota.setAttribute('role','alert');
    derrota.innerHTML = '<div><h2>Te has quedado sin vida</h2><p>Volviendo a la sala…</p><p>Podrás entrar nuevamente con el mismo personaje o elegir otro.</p></div>';
    document.body.append(panel,destello,derrota);
    interfaz = {panel,fila,corazones:[...fila.querySelectorAll('svg')],
      estado:panel.querySelector('#fs-vida-estado'),destello,derrota};
    actualizarInterfaz();
  }

  // 3. ACTUALIZAR CORAZONES Y PROTECCIÓN POR PREGUNTAS.
  function actualizarInterfaz() {
    if (!interfaz) return;
    interfaz.corazones.forEach((c,i) => c.classList.toggle('vacio',i >= corazones));
    interfaz.fila.setAttribute('aria-label',`Vida: ${corazones} de ${CONFIG.corazones} corazones`);
    interfaz.panel.classList.toggle('critico',corazones === 1 && !muerto);
    interfaz.estado.textContent = muerto ? 'Sin vida' : protegidoPorPregunta
      ? 'Escudo activo · respondiendo' : `${corazones} / ${CONFIG.corazones} corazones`;
  }
  function establecerProteccion(activa) {
    protegidoPorPregunta = Boolean(activa);
    actualizarInterfaz();
  }
  window.addEventListener('escenario:proteccion', e => establecerProteccion(e.detail?.activa));

  // 4. EFECTO DE DAÑO Y SONIDO LOCAL; NO REQUIERE UN MP3.
  function mostrarDanio() {
    if (interfaz) {
      interfaz.destello.classList.add('activo');
      clearTimeout(temporizadorDestello);
      temporizadorDestello = setTimeout(() => interfaz.destello.classList.remove('activo'),180);
    }
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      contextoAudio ??= new Audio();
      if (contextoAudio.state === 'suspended') contextoAudio.resume().catch(() => {});
      const o = contextoAudio.createOscillator(), g = contextoAudio.createGain();
      const t = contextoAudio.currentTime;
      o.type = 'triangle';
      o.frequency.setValueAtTime(180,t);
      o.frequency.exponentialRampToValueAtTime(65,t+.12);
      g.gain.setValueAtTime(.08,t);
      g.gain.exponentialRampToValueAtTime(.001,t+.15);
      o.connect(g);g.connect(contextoAudio.destination);
      o.onended = () => {o.disconnect();g.disconnect();};
      o.start(t);o.stop(t+.16);
    } catch { /* El audio no debe interrumpir el juego. */ }
  }

  // 5. DAÑO CENTRALIZADO.
  // Primero validar protección; luego consultar el escudo del equipo.
  // Tanto un golpe absorbido como uno que quite vida dan 1 s de inmunidad.
  function recibirGolpe() {
    if (muerto || protegidoPorPregunta || performance.now() < protegidoHasta ||
        !conexiones.puedeRecibirGolpe()) return false;
    protegidoHasta = performance.now() + CONFIG.proteccionTrasGolpe;
    const absorbido = conexiones.absorberGolpe() === true;
    if (!absorbido) {
      corazones = Math.max(0,corazones-1);
      actualizarInterfaz();
      mostrarDanio();
      if (corazones === 0) morir();
    }
    // true = impacto aceptado; un escudo puede haber evitado perder vida.
    return true;
  }

  // 6. CURACIÓN. No revive ni permite superar cinco corazones.
  function recuperarCorazones(cantidad = 1) {
    if (muerto || !Number.isInteger(cantidad) || cantidad <= 0) return 0;
    const anterior = corazones;
    corazones = Math.min(CONFIG.corazones,corazones+cantidad);
    actualizarInterfaz();
    return corazones-anterior;
  }

  // 7. DERROTA. El escenario detiene controles; luego se vuelve a la sala.
  function morir() {
    if (muerto) return;
    muerto = true;
    actualizarInterfaz();
    if (interfaz) interfaz.derrota.hidden = false;
    setTimeout(() => window.location.replace(CONFIG.rutaSala),CONFIG.esperaAlMorir);
    // FUTURO: consultar al servidor si el docente restringe el reingreso.
    // Actualmente se permite volver a entrar con cualquier personaje.
    try {conexiones.alMorir();}
    finally {if (document.pointerLockElement) document.exitPointerLock();}
  }

  // 8. PARPADEO DURANTE LA INMUNIDAD POSTERIOR A UN IMPACTO.
  function debeDibujarPersonaje() {
    const t = performance.now();
    return muerto || t >= protegidoHasta || Math.floor(t/100)%2 === 0;
  }

  // 9. API COMPARTIDA. configurar() conserva las conexiones no indicadas.
  window.VidaJugador = Object.freeze({
    versionEquipo: 2,
    configurar(opciones = {}) {
      for (const clave of ['puedeRecibirGolpe','alMorir','absorberGolpe']) {
        if (typeof opciones[clave] === 'function') conexiones[clave] = opciones[clave];
      }
    },
    recibirGolpe, recuperarCorazones, establecerProteccion, debeDibujarPersonaje,
    estaMuerto: () => muerto,
    obtenerCorazones: () => corazones
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',crearInterfaz,{once:true});
  } else crearInterfaz();
})();
