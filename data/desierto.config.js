/* Datos del mundo. Las preguntas se cargan desde la partida configurada por el docente. */
window.DESIERTO_CONFIG = {
  nombre: 'Desierto',
  semilla: 20261001,
  tamano: 256,
  cantidadCactus: 240,
  cantidadRocas: 170,
  cantidadArbustos: 650,
  cantidadPiedritas: 1000,
  cantidadNubes: 32,
  clima: {
    modo: 'auto',
    calma: 65,
    aviso: 10,
    entrada: 12,
    tormenta: 35,
    salida: 14
  },
  inicio: { x: 0, z: 10 },
  tiempoPregunta: 30,
  cajas: [
    { id: 'verde-1', tipo: 'pregunta', x: -3, z: 2 },
    { id: 'roja-1', tipo: 'equipo', x: 3, z: 2, objeto: 'Arco' },
    { id: 'verde-2', tipo: 'pregunta', x: 17, z: -19 },
    { id: 'roja-2', tipo: 'equipo', x: -20, z: -15, objeto: 'Hacha' },
    { id: 'verde-3', tipo: 'pregunta', x: -35, z: -39 },
    { id: 'roja-3', tipo: 'equipo', x: 40, z: -46, objeto: 'Espada' },
    { id: 'verde-4', tipo: 'pregunta', x: 50, z: 30 },
    { id: 'roja-4', tipo: 'equipo', x: -48, z: 42, objeto: 'Pistola' },
    { id: 'verde-5', tipo: 'pregunta', x: 75, z: -75 },
    { id: 'roja-5', tipo: 'equipo', x: -70, z: -65, objeto: 'Metralleta' }
  ]
};
