/* Mar: todos los datos son locales. No necesita internet ni bibliotecas. */
window.MAR_CONFIG = {
  nombre: 'Mar', semilla: 10102026, tamano: 240,
  inicio: {x:0, z:38, yaw:0}, tiempoPregunta:30,
  islas: [
    {id:'inicio',nombre:'Puerto de llegada',x:0,z:34,rx:14,rz:12,y:2},
    {id:'jardin',nombre:'Globo turquesa',tipo:'plataforma',x:0,z:0,rx:7,rz:6,y:4},
    {id:'templo',nombre:'Isla del faro',x:10,z:-55,rx:17,rz:15,y:3},
    {id:'oeste',nombre:'Globo coral',tipo:'plataforma',x:-36,z:-13,rx:7,rz:6,y:5},
    {id:'este',nombre:'Globo dorado',tipo:'plataforma',x:40,z:-12,rx:8,rz:6,y:4},
    {id:'saltos',nombre:'Isla de los saltos',x:-33,z:33,rx:9,rz:8,y:2.5},
    {id:'cascada',nombre:'Isla de las palmeras',x:50,z:-57,rx:10,rz:9,y:2.5}
  ],
  puentes: [
    {ax:0,az:24,ay:2,bx:0,bz:5,by:4,ancho:2.8},
    {ax:0,az:-5,ay:4,bx:10,bz:-42,by:3,ancho:2.8},
    {ax:-6,az:-2,ay:4,bx:-30,bz:-12,by:5,ancho:2.8},
    {ax:6,az:-2,ay:4,bx:33,bz:-10,by:4,ancho:2.8},
    {ax:41,az:-17,ay:4,bx:49,bz:-49,by:2.5,ancho:2.8},
    {ax:25,az:-55,ay:3,bx:42,bz:-56,by:2.5,ancho:2.8}
  ],
  saltos: [
    {x:-15,z:33,y:2,w:2.2,d:2.8},
    {x:-18.8,z:33,y:2.2,w:2.2,d:2.8},
    {x:-22.6,z:33,y:2.4,w:2.2,d:2.8}
  ],
  cajas: [
    {id:'mar-v1',tipo:'pregunta',x:-3,z:32,pregunta:0},
    {id:'mar-r1',tipo:'equipo',x:3,z:32,objeto:'Arco'},
    {id:'mar-v2',tipo:'pregunta',x:-4,z:0,pregunta:1},
    {id:'mar-r2',tipo:'equipo',x:5,z:-3,objeto:'Espada'},
    {id:'mar-v3',tipo:'pregunta',x:-40,z:-12,pregunta:2},
    {id:'mar-r3',tipo:'equipo',x:44,z:-12,objeto:'Hacha'},
    {id:'mar-v4',tipo:'pregunta',x:-33,z:32,pregunta:3},
    {id:'mar-r4',tipo:'equipo',x:51,z:-57,objeto:'Pistola'},
    {id:'mar-v5',tipo:'pregunta',x:6,z:-55,pregunta:4},
    {id:'mar-r5',tipo:'equipo',x:17,z:-55,objeto:'Metralleta'}
  ],
  preguntas: [
    {texto:'¿Qué característica tiene el agua del mar?',opciones:['Es siempre dulce','Contiene sales disueltas','No tiene sales'],correcta:1},
    {texto:'¿Cuál de estos animales es un mamífero?',opciones:['El delfín','La medusa','El cangrejo'],correcta:0},
    {texto:'¿Cuánto es 7 × 8?',opciones:['54','64','56'],correcta:2},
    {texto:'¿Qué ayuda a proteger los océanos?',opciones:['Reducir los residuos de plástico','Arrojar basura al agua','Dañar los corales'],correcta:0},
    {texto:'¿Para qué sirve un faro?',opciones:['Para cambiar las mareas','Para orientar a los navegantes','Para producir sal'],correcta:1}
  ]
};
