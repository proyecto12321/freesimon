/* Datos editables. Script clásico para poder abrir escenario.html con doble clic. */
window.DESIERTO_CONFIG = {
  nombre: 'Desierto', semilla: 20261001, tamano: 256,
  cantidadCactus: 150, cantidadRocas: 110,
  inicio: { x: 0, z: 10 }, tiempoPregunta: 30,
  cajas: [
    { id: 'verde-1', tipo: 'pregunta', x: -3, z: 2, pregunta: 0 },
    { id: 'roja-1', tipo: 'equipo', x: 3, z: 2, objeto: 'Arco' },
    { id: 'verde-2', tipo: 'pregunta', x: 17, z: -19, pregunta: 1 },
    { id: 'roja-2', tipo: 'equipo', x: -20, z: -15, objeto: 'Hacha' },
    { id: 'verde-3', tipo: 'pregunta', x: -35, z: -39, pregunta: 2 },
    { id: 'roja-3', tipo: 'equipo', x: 40, z: -46, objeto: 'Espada' },
    { id: 'verde-4', tipo: 'pregunta', x: 50, z: 30, pregunta: 3 },
    { id: 'roja-4', tipo: 'equipo', x: -48, z: 42, objeto: 'Pistola' },
    { id: 'verde-5', tipo: 'pregunta', x: 75, z: -75, pregunta: 4 },
    { id: 'roja-5', tipo: 'equipo', x: -70, z: -65, objeto: 'Metralleta' }
  ],
  preguntas: [
    { texto: '¿Qué adaptación ayuda al cactus a reducir la pérdida de agua?', opciones: ['Sus espinas en lugar de hojas grandes', 'Sus flores de colores', 'Su altura'], correcta: 0 },
    { texto: '¿Cuánto es 8 × 7?', opciones: ['54', '56', '64'], correcta: 1 },
    { texto: '¿Cómo se llama un lugar con agua y vegetación dentro de un desierto?', opciones: ['Glaciar', 'Acantilado', 'Oasis'], correcta: 2 },
    { texto: '¿Cuál de estos animales es un reptil?', opciones: ['Zorro', 'Lagartija', 'Águila'], correcta: 1 },
    { texto: '¿Cuál es la principal fuente de energía de la Tierra?', opciones: ['El Sol', 'La Luna', 'El viento'], correcta: 0 }
  ]
};
