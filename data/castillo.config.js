// Datos del mundo. Las preguntas se leen de juegoPreguntas, igual que en desierto.
// clima.modo: auto / clear / storm. También se cambia con T o en el menú.
// primerEvento, intervalo y duracion: segundos de juego activo.
// luzMinima solo afecta al castillo; nunca deja la escena completamente negra.
// Mantener los nombres de los archivos y guardar los cuatro juntos en /data.
window.CASTILLO_CONFIG = {
  "nombre": "Castillo de las Sombras",
  "semilla": 20261004,
  "tamano": 160,
  "inicio": {
    "x": 0,
    "z": 70,
    "yaw": 0
  },
  "tiempoPregunta": 30,
  "clima": {
    "activo": true,
    "primerEvento": 25,
    "intervalo": 75,
    "duracion": 12,
    "luzMinima": 0.26,
    "modo": "auto"
  },
  "islas": [
    {
      "id": "inicio",
      "nombre": "Vestíbulo",
      "x": 0,
      "z": 70,
      "y": 2,
      "rx": 3,
      "rz": 3
    },
    {
      "id": "punto-1",
      "nombre": "Biblioteca",
      "x": -52,
      "z": 34,
      "y": 2,
      "rx": 3,
      "rz": 3
    },
    {
      "id": "punto-2",
      "nombre": "Galería de retratos",
      "x": 52,
      "z": 0,
      "y": 2,
      "rx": 3,
      "rz": 3
    },
    {
      "id": "punto-3",
      "nombre": "Salón del trono",
      "x": 0,
      "z": -62,
      "y": 2,
      "rx": 3,
      "rz": 3
    }
  ],
  "puentes": [],
  "saltos": [],
  "preguntas": [],
  "cajas": [
    {
      "id": "castillo-p-01",
      "tipo": "pregunta",
      "x": -8,
      "z": 62,
      "pregunta": 0
    },
    {
      "id": "castillo-p-02",
      "tipo": "pregunta",
      "x": 8,
      "z": 62,
      "pregunta": 1
    },
    {
      "id": "castillo-p-03",
      "tipo": "pregunta",
      "x": -8,
      "z": 42,
      "pregunta": 2
    },
    {
      "id": "castillo-p-04",
      "tipo": "pregunta",
      "x": 8,
      "z": 42,
      "pregunta": 3
    },
    {
      "id": "castillo-p-05",
      "tipo": "pregunta",
      "x": -8,
      "z": 22,
      "pregunta": 4
    },
    {
      "id": "castillo-p-06",
      "tipo": "pregunta",
      "x": 8,
      "z": 22,
      "pregunta": 5
    },
    {
      "id": "castillo-p-07",
      "tipo": "pregunta",
      "x": -8,
      "z": 2,
      "pregunta": 6
    },
    {
      "id": "castillo-p-08",
      "tipo": "pregunta",
      "x": 8,
      "z": 2,
      "pregunta": 7
    },
    {
      "id": "castillo-p-09",
      "tipo": "pregunta",
      "x": -8,
      "z": -18,
      "pregunta": 8
    },
    {
      "id": "castillo-p-10",
      "tipo": "pregunta",
      "x": 8,
      "z": -18,
      "pregunta": 9
    },
    {
      "id": "castillo-p-11",
      "tipo": "pregunta",
      "x": -8,
      "z": -38,
      "pregunta": 10
    },
    {
      "id": "castillo-p-12",
      "tipo": "pregunta",
      "x": 8,
      "z": -38,
      "pregunta": 11
    },
    {
      "id": "castillo-p-13",
      "tipo": "pregunta",
      "x": -8,
      "z": -58,
      "pregunta": 12
    },
    {
      "id": "castillo-p-14",
      "tipo": "pregunta",
      "x": 8,
      "z": -58,
      "pregunta": 13
    },
    {
      "id": "castillo-p-15",
      "tipo": "pregunta",
      "x": -44,
      "z": 60,
      "pregunta": 14
    },
    {
      "id": "castillo-p-16",
      "tipo": "pregunta",
      "x": -60,
      "z": 60,
      "pregunta": 15
    },
    {
      "id": "castillo-p-17",
      "tipo": "pregunta",
      "x": -44,
      "z": 38,
      "pregunta": 16
    },
    {
      "id": "castillo-p-18",
      "tipo": "pregunta",
      "x": -60,
      "z": 38,
      "pregunta": 17
    },
    {
      "id": "castillo-p-19",
      "tipo": "pregunta",
      "x": -44,
      "z": 0,
      "pregunta": 18
    },
    {
      "id": "castillo-p-20",
      "tipo": "pregunta",
      "x": -60,
      "z": 0,
      "pregunta": 19
    },
    {
      "id": "castillo-p-21",
      "tipo": "pregunta",
      "x": -44,
      "z": -40,
      "pregunta": 20
    },
    {
      "id": "castillo-p-22",
      "tipo": "pregunta",
      "x": -60,
      "z": -40,
      "pregunta": 21
    },
    {
      "id": "castillo-p-23",
      "tipo": "pregunta",
      "x": 44,
      "z": 52,
      "pregunta": 22
    },
    {
      "id": "castillo-p-24",
      "tipo": "pregunta",
      "x": 60,
      "z": 52,
      "pregunta": 23
    },
    {
      "id": "castillo-p-25",
      "tipo": "pregunta",
      "x": 44,
      "z": 32,
      "pregunta": 24
    },
    {
      "id": "castillo-p-26",
      "tipo": "pregunta",
      "x": 60,
      "z": 32,
      "pregunta": 25
    },
    {
      "id": "castillo-p-27",
      "tipo": "pregunta",
      "x": 44,
      "z": 0,
      "pregunta": 26
    },
    {
      "id": "castillo-p-28",
      "tipo": "pregunta",
      "x": 60,
      "z": 0,
      "pregunta": 27
    },
    {
      "id": "castillo-p-29",
      "tipo": "pregunta",
      "x": 44,
      "z": -38,
      "pregunta": 28
    },
    {
      "id": "castillo-p-30",
      "tipo": "pregunta",
      "x": 60,
      "z": -38,
      "pregunta": 29
    },
    {
      "id": "castillo-r-1",
      "tipo": "equipo",
      "x": -4,
      "z": 66,
      "objeto": "Arco",
      "botiquines": 2,
      "escudos": 2
    },
    {
      "id": "castillo-r-2",
      "tipo": "equipo",
      "x": 4,
      "z": 66,
      "objeto": "Espada",
      "botiquines": 2,
      "escudos": 2
    },
    {
      "id": "castillo-r-3",
      "tipo": "equipo",
      "x": -12,
      "z": 66,
      "objeto": "Escudo"
    },
    {
      "id": "castillo-r-4",
      "tipo": "equipo",
      "x": 12,
      "z": 66,
      "objeto": "Botiquín"
    },
    {
      "id": "castillo-r-5",
      "tipo": "equipo",
      "x": -16,
      "z": 16,
      "objeto": "Hacha",
      "botiquines": 2,
      "escudos": 2
    },
    {
      "id": "castillo-r-6",
      "tipo": "equipo",
      "x": 16,
      "z": -16,
      "objeto": "Pistola",
      "botiquines": 2,
      "escudos": 2
    },
    {
      "id": "castillo-r-7",
      "tipo": "equipo",
      "x": 12,
      "z": -62,
      "objeto": "Metralleta",
      "botiquines": 2,
      "escudos": 2
    }
  ]
};
