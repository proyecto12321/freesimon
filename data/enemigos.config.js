// Ajusta solo este archivo para cambiar la dificultad.
window.ENEMIGOS_CONFIG = Object.freeze({
  cantidad: 12,                 // Prueba 12, después 15. Máximo permitido: 20.
  reaparicion: 5,               // Segundos de juego activo tras cada eliminación.
  distanciaMinimaAparicion: 18,
  distanciaMaximaAparicion: 65,
  deteccion: 28,
  perderRastro: 38,
  distanciaDibujo: 75,
  velocidadPatrulla: 1.1,
  velocidadPersecucion: 2.5,
  intervaloAtaque: 2.8,
  avisoAtaque: 0.55,            // Preparación visible antes del ataque enemigo.
  armas: ['Espada', 'Hacha', 'Arco', 'Pistola', 'Metralleta']
});
