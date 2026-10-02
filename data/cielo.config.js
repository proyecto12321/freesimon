/* Cielo: todos los datos son locales. No necesita internet ni bibliotecas. */
window.CIELO_CONFIG = {
  nombre: 'Cielo', semilla: 10102026, tamano: 240,
  inicio: {x:0, z:38, yaw:0}, tiempoPregunta:30,
  islas: [
    {id:'inicio',nombre:'Jardín de llegada',x:0,z:34,rx:14,rz:12,y:24},
    {id:'jardin',nombre:'Jardín suspendido',x:0,z:0,rx:13,rz:11,y:28},
    {id:'templo',nombre:'Templo de las nubes',x:10,z:-55,rx:24,rz:19,y:34},
    {id:'oeste',nombre:'Ruinas del viento',x:-36,z:-13,rx:12,rz:12,y:27},
    {id:'este',nombre:'Mirador del alba',x:40,z:-12,rx:12,rz:10,y:30},
    {id:'saltos',nombre:'Isla de los saltos',x:-33,z:33,rx:9,rz:8,y:25},
    {id:'cascada',nombre:'Jardín de la cascada',x:50,z:-57,rx:10,rz:9,y:32}
  ],
  puentes: [
    {ax:0,az:24,ay:24,bx:0,bz:9,by:28,ancho:2.8},
    {ax:0,az:-9,ay:28,bx:10,bz:-38,by:34,ancho:2.8},
    {ax:-11,az:-3,ay:28,bx:-26,bz:-12,by:27,ancho:2.8},
    {ax:11,az:-2,ay:28,bx:30,bz:-10,by:30,ancho:2.8},
    {ax:41,az:-20,ay:30,bx:49,bz:-49,by:32,ancho:2.8},
    {ax:31,az:-55,ay:34,bx:42,bz:-56,by:32,ancho:2.8}
  ],
  saltos: [
    {x:-15,z:33,y:24,w:2.2,d:2.8},
    {x:-18.8,z:33,y:24.4,w:2.2,d:2.8},
    {x:-22.6,z:33,y:24.8,w:2.2,d:2.8}
  ],
  cajas: [
    {id:'cielo-v1',tipo:'pregunta',x:-3,z:32,pregunta:0},
    {id:'cielo-r1',tipo:'equipo',x:3,z:32,objeto:'Arco'},
    {id:'cielo-v2',tipo:'pregunta',x:-4,z:0,pregunta:1},
    {id:'cielo-r2',tipo:'equipo',x:5,z:-3,objeto:'Espada'},
    {id:'cielo-v3',tipo:'pregunta',x:-37,z:-13,pregunta:2},
    {id:'cielo-r3',tipo:'equipo',x:42,z:-11,objeto:'Hacha'},
    {id:'cielo-v4',tipo:'pregunta',x:-33,z:32,pregunta:3},
    {id:'cielo-r4',tipo:'equipo',x:51,z:-57,objeto:'Pistola'},
    {id:'cielo-v5',tipo:'pregunta',x:10,z:-59,pregunta:4},
    {id:'cielo-r5',tipo:'equipo',x:17,z:-55,objeto:'Metralleta'}
  ],
  preguntas: [
    {texto:'¿De qué están formadas principalmente las nubes?',opciones:['De humo','De pequeñas gotas de agua o cristales de hielo','De arena'],correcta:1},
    {texto:'¿Qué fuerza nos atrae hacia la Tierra?',opciones:['La gravedad','El sonido','La luz'],correcta:0},
    {texto:'¿Cuánto es 9 × 6?',opciones:['45','63','54'],correcta:2},
    {texto:'¿Cuál de estos animales puede volar?',opciones:['El cóndor','La tortuga','El delfín'],correcta:0},
    {texto:'¿Cómo se llama el cambio de agua líquida a vapor?',opciones:['Congelación','Evaporación','Condensación'],correcta:1}
  ]
};
