// Datos del mundo. Las preguntas se leen de juegoPreguntas, igual que en desierto.
// clima.modo: auto / clear / storm. También se cambia con T o en el menú.
// primerEvento, intervalo y duracion: segundos de juego activo.
// luzMinima solo afecta al castillo; nunca deja la escena completamente negra.
// Mantener los nombres de los archivos y guardar los cuatro juntos en /data.
window.HIELO_CONFIG = {
  "nombre": "Reino de Hielo",
  "semilla": 20261005,
  "tamano": 180,
  "inicio": {
    "x": 0,
    "z": 70,
    "yaw": 0
  },
  "tiempoPregunta": 30,
  "clima": {
    "activo": true,
    "primerEvento": 25,
    "intervalo": 90,
    "duracion": 28,
    "modo": "auto"
  },
  "islas": [
    {
      "id": "inicio",
      "nombre": "Campamento nevado",
      "x": 0,
      "z": 70,
      "y": 2,
      "rx": 3,
      "rz": 3
    },
    {
      "id": "punto-1",
      "nombre": "Iglú del oeste",
      "x": -48,
      "z": 28,
      "y": 2,
      "rx": 3,
      "rz": 3
    },
    {
      "id": "punto-2",
      "nombre": "Iglú del este",
      "x": 48,
      "z": -35,
      "y": 2,
      "rx": 3,
      "rz": 3
    },
    {
      "id": "punto-3",
      "nombre": "Arcos de hielo",
      "x": 0,
      "z": -70,
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
      "id": "hielo-p-01",
      "tipo": "pregunta",
      "x": -6,
      "z": 54,
      "pregunta": 0
    },
    {
      "id": "hielo-p-02",
      "tipo": "pregunta",
      "x": 6,
      "z": 54,
      "pregunta": 1
    },
    {
      "id": "hielo-p-03",
      "tipo": "pregunta",
      "x": -6,
      "z": 34,
      "pregunta": 2
    },
    {
      "id": "hielo-p-04",
      "tipo": "pregunta",
      "x": 6,
      "z": 34,
      "pregunta": 3
    },
    {
      "id": "hielo-p-05",
      "tipo": "pregunta",
      "x": -6,
      "z": 14,
      "pregunta": 4
    },
    {
      "id": "hielo-p-06",
      "tipo": "pregunta",
      "x": 6,
      "z": 14,
      "pregunta": 5
    },
    {
      "id": "hielo-p-07",
      "tipo": "pregunta",
      "x": -6,
      "z": -6,
      "pregunta": 6
    },
    {
      "id": "hielo-p-08",
      "tipo": "pregunta",
      "x": 6,
      "z": -6,
      "pregunta": 7
    },
    {
      "id": "hielo-p-09",
      "tipo": "pregunta",
      "x": -6,
      "z": -26,
      "pregunta": 8
    },
    {
      "id": "hielo-p-10",
      "tipo": "pregunta",
      "x": 6,
      "z": -26,
      "pregunta": 9
    },
    {
      "id": "hielo-p-11",
      "tipo": "pregunta",
      "x": -6,
      "z": -46,
      "pregunta": 10
    },
    {
      "id": "hielo-p-12",
      "tipo": "pregunta",
      "x": 6,
      "z": -46,
      "pregunta": 11
    },
    {
      "id": "hielo-p-13",
      "tipo": "pregunta",
      "x": -6,
      "z": -68,
      "pregunta": 12
    },
    {
      "id": "hielo-p-14",
      "tipo": "pregunta",
      "x": 6,
      "z": -68,
      "pregunta": 13
    },
    {
      "id": "hielo-p-15",
      "tipo": "pregunta",
      "x": -44,
      "z": 64,
      "pregunta": 14
    },
    {
      "id": "hielo-p-16",
      "tipo": "pregunta",
      "x": 44,
      "z": 64,
      "pregunta": 15
    },
    {
      "id": "hielo-p-17",
      "tipo": "pregunta",
      "x": -44,
      "z": 44,
      "pregunta": 16
    },
    {
      "id": "hielo-p-18",
      "tipo": "pregunta",
      "x": 44,
      "z": 44,
      "pregunta": 17
    },
    {
      "id": "hielo-p-19",
      "tipo": "pregunta",
      "x": -44,
      "z": 4,
      "pregunta": 18
    },
    {
      "id": "hielo-p-20",
      "tipo": "pregunta",
      "x": 44,
      "z": 4,
      "pregunta": 19
    },
    {
      "id": "hielo-p-21",
      "tipo": "pregunta",
      "x": -44,
      "z": -16,
      "pregunta": 20
    },
    {
      "id": "hielo-p-22",
      "tipo": "pregunta",
      "x": 44,
      "z": -16,
      "pregunta": 21
    },
    {
      "id": "hielo-p-23",
      "tipo": "pregunta",
      "x": -44,
      "z": -56,
      "pregunta": 22
    },
    {
      "id": "hielo-p-24",
      "tipo": "pregunta",
      "x": 44,
      "z": -56,
      "pregunta": 23
    },
    {
      "id": "hielo-p-25",
      "tipo": "pregunta",
      "x": -44,
      "z": -72,
      "pregunta": 24
    },
    {
      "id": "hielo-p-26",
      "tipo": "pregunta",
      "x": 44,
      "z": -72,
      "pregunta": 25
    },
    {
      "id": "hielo-p-27",
      "tipo": "pregunta",
      "x": -48,
      "z": 28,
      "pregunta": 26
    },
    {
      "id": "hielo-p-28",
      "tipo": "pregunta",
      "x": 48,
      "z": -35,
      "pregunta": 27
    },
    {
      "id": "hielo-p-29",
      "tipo": "pregunta",
      "x": -66,
      "z": 46,
      "pregunta": 28
    },
    {
      "id": "hielo-p-30",
      "tipo": "pregunta",
      "x": 65,
      "z": -50,
      "pregunta": 29
    },
    {
      "id": "hielo-r-1",
      "tipo": "equipo",
      "x": -4,
      "z": 66,
      "objeto": "Arco",
      "botiquines": 2,
      "escudos": 2
    },
    {
      "id": "hielo-r-2",
      "tipo": "equipo",
      "x": 4,
      "z": 66,
      "objeto": "Espada",
      "botiquines": 2,
      "escudos": 2
    },
    {
      "id": "hielo-r-3",
      "tipo": "equipo",
      "x": -12,
      "z": 66,
      "objeto": "Escudo"
    },
    {
      "id": "hielo-r-4",
      "tipo": "equipo",
      "x": 12,
      "z": 66,
      "objeto": "Botiquín"
    },
    {
      "id": "hielo-r-5",
      "tipo": "equipo",
      "x": -16,
      "z": 16,
      "objeto": "Hacha",
      "botiquines": 2,
      "escudos": 2
    },
    {
      "id": "hielo-r-6",
      "tipo": "equipo",
      "x": 16,
      "z": -16,
      "objeto": "Pistola",
      "botiquines": 2,
      "escudos": 2
    },
    {
      "id": "hielo-r-7",
      "tipo": "equipo",
      "x": 12,
      "z": -62,
      "objeto": "Metralleta",
      "botiquines": 2,
      "escudos": 2
    }
  ]
};
