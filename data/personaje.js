(() => {
    const contenedor = document.getElementById("selectorPersonajes");
    const portada = document.getElementById("personajePortada");

    const crearParte = (nombre, x, y, w, h, d, colores, extras = {}) => ({
        nombre,
        x,
        y,
        w,
        h,
        d,
        colores,
        ...extras
    });

    const colores = {
        piel: ["#e5ad7f", "#b87956", "#f0c18f", "#c88966", "#f3c795", "#bd805d"],
        pielOscura: ["#9b6249", "#704532", "#b37758", "#80513b", "#bd805d", "#754936"],
        pielClara: ["#f0c7a5", "#bd8c6c", "#f8d8b8", "#d5a17f", "#ffe0bf", "#bd8c6c"],
        cabello: ["#40342d", "#302720", "#57463a", "#302720", "#241e1a", "#493a30"],
        cabelloRojo: ["#a95035", "#793823", "#c46643", "#86402b", "#d4774b", "#753722"],
        cabelloRubio: ["#d6a944", "#a77b27", "#ecc65e", "#b68a32", "#f3d47a", "#997022"],
        cabelloNegro: ["#302c3b", "#211e29", "#454052", "#282430", "#514b60", "#211e29"],
        verde: ["#32816c", "#205849", "#3b967b", "#286957", "#46a186", "#245b4c"],
        coral: ["#bd5571", "#86364f", "#d86b86", "#a74760", "#e77e98", "#84334b"],
        blanco: ["#d9e1e7", "#9caab5", "#f1f4f6", "#b9c5cd", "#ffffff", "#9caab5"],
        cafe: ["#916239", "#674225", "#ad794a", "#79502d", "#c18a54", "#613d23"],
        morado: ["#694b9a", "#453264", "#8061b2", "#554078", "#9474c5", "#3f2d5d"],
        pantalonesAzules: ["#39465e", "#293448", "#465674", "#303b52", "#52617d", "#293448"],
        pantalonesRojos: ["#563c55", "#39283e", "#6b4c68", "#463248", "#795a74", "#38263c"],
        pantalonesGrises: ["#59636b", "#3d454b", "#707b84", "#4a535a", "#87929a", "#3b4248"],
        pelajeGris: ["#777f88", "#535961", "#929aa2", "#626971", "#a8afb5", "#4c5259"],
        pelajeNaranja: ["#d47b35", "#995022", "#e89347", "#b9632d", "#f0a65b", "#8b481f"],
        pelajeBlanco: ["#e4e0d7", "#aaa69e", "#f5f1e8", "#c5c1b8", "#fffdf6", "#a6a29a"],
        pelajeCafe: ["#805334", "#573922", "#9d6c45", "#69452b", "#b07b50", "#4e331f"],
        negro: ["#383a40", "#25262a", "#4b4e54", "#2d2f34", "#5a5d63", "#222327"],
        crema: ["#e8c99e", "#b6956e", "#f4dcba", "#c5a47e", "#ffe8c8", "#ae8d67"],
        rosa: ["#d98b91", "#a65c65", "#e9a2a5", "#bc6e76", "#f2b8b7", "#99525b"]
    };

    const crearPersonaje = (id, nombre, tema, partes) => ({
        id,
        nombre,
        tema,
        partes: [
            ...partes.cabeza,
            crearParte("rostro", 0, 14, 70, 70, 70, partes.piel, {
                rostro: true,
                ojos: partes.ojos || "#292b30",
                boca: partes.boca || "#754639"
            }),
            crearParte("cuerpo", 0, 82, 68, 78, 38, partes.torso),
            crearParte("brazo-izquierdo", -49, 89, 27, 72, 34, partes.brazos || partes.torso),
            crearParte("brazo-derecho", 49, 89, 27, 72, 34, partes.brazos || partes.torso),
            crearParte("pierna-izquierda", -18, 153, 31, 72, 36, partes.pantalones),
            crearParte("pierna-derecha", 18, 153, 31, 72, 36, partes.pantalones),
            ...(partes.adornos || [])
        ]
    });

    const personajes = [
        crearPersonaje("explorador-voxel", "Explorador", "#39765c", {
            piel: colores.piel,
            torso: colores.verde,
            pantalones: colores.pantalonesAzules,
            cabeza: [
                crearParte("cabello", 0, 2, 76, 19, 76, colores.cabello)
            ]
        }),
        crearPersonaje("guardiana-voxel", "Guardiana", "#bd5571", {
            piel: colores.pielOscura,
            ojos: "#382832",
            torso: colores.coral,
            pantalones: colores.pantalonesRojos,
            cabeza: [
                crearParte("cabello", 0, 2, 76, 20, 76, colores.cabelloRojo),
                crearParte("cabello-lateral", -34, 17, 13, 43, 72, colores.cabelloRojo)
            ],
            adornos: [
                crearParte("hombrera", -48, 81, 31, 22, 40, colores.pantalonesRojos)
            ]
        }),
        crearPersonaje("astronauta-voxel", "Astronauta", "#4b91bd", {
            piel: colores.pielClara,
            ojos: "#315d79",
            boca: "#8a6656",
            torso: colores.blanco,
            pantalones: colores.pantalonesGrises,
            cabeza: [
                crearParte("casco-superior", 0, -1, 84, 19, 84, colores.blanco),
                crearParte("casco-lateral-izquierdo", -37, 19, 12, 53, 82, colores.blanco),
                crearParte("casco-lateral-derecho", 37, 19, 12, 53, 82, colores.blanco)
            ],
            adornos: [
                crearParte("mochila", 0, 91, 30, 49, 20, colores.pantalonesGrises)
            ]
        }),
        crearPersonaje("botanista-voxel", "Botanista", "#719544", {
            piel: colores.piel,
            torso: colores.cafe,
            pantalones: colores.verde,
            cabeza: [
                crearParte("sombrero-ala", 0, 0, 88, 12, 82, colores.cafe),
                crearParte("sombrero", 0, -12, 58, 18, 58, colores.cafe),
                crearParte("hoja-izquierda", -23, -15, 25, 12, 28, colores.verde),
                crearParte("hoja-derecha", 20, -18, 26, 12, 28, colores.verde)
            ],
            adornos: [
                crearParte("bolsa", -25, 110, 19, 24, 22, colores.cafe)
            ]
        }),
        crearPersonaje("mago-voxel", "Mago", "#8262b3", {
            piel: colores.pielClara,
            ojos: "#30263f",
            boca: "#69465b",
            torso: colores.morado,
            pantalones: colores.pantalonesGrises,
            cabeza: [
                crearParte("sombrero-base", 0, 2, 78, 13, 78, colores.morado),
                crearParte("sombrero-medio", 0, -11, 57, 15, 57, colores.morado),
                crearParte("sombrero-punta", 0, -25, 35, 16, 35, colores.morado),
                crearParte("banda-sombrero", 0, 5, 80, 7, 80, colores.cabelloRubio)
            ],
            adornos: [
                crearParte("capa", 0, 121, 76, 30, 40, colores.morado)
            ]
        }),
        crearPersonaje("gato-voxel", "Gato", "#777f88", {
            piel: colores.pelajeGris,
            ojos: "#374a65",
            boca: "#995b68",
            torso: colores.pelajeGris,
            pantalones: colores.negro,
            cabeza: [
                crearParte("oreja-izquierda", -25, -8, 25, 31, 30, colores.rosa),
                crearParte("oreja-derecha", 25, -8, 25, 31, 30, colores.rosa)
            ],
            adornos: [
                crearParte("hocico", 0, 49, 32, 20, 76, colores.pelajeBlanco),
                crearParte("nariz", 0, 50, 9, 7, 79, colores.rosa)
            ]
        }),
        crearPersonaje("zorro-voxel", "Zorro", "#d47b35", {
            piel: colores.pelajeNaranja,
            ojos: "#473126",
            torso: colores.pelajeNaranja,
            brazos: colores.pelajeBlanco,
            pantalones: colores.pantalonesRojos,
            cabeza: [
                crearParte("oreja-izquierda", -25, -9, 24, 33, 30, colores.negro),
                crearParte("oreja-derecha", 25, -9, 24, 33, 30, colores.negro)
            ],
            adornos: [
                crearParte("hocico", 0, 47, 32, 19, 78, colores.pelajeBlanco),
                crearParte("nariz", 0, 49, 9, 7, 81, colores.negro),
                crearParte("cola", 65, 132, 38, 30, 34, colores.pelajeNaranja),
                crearParte("punta-cola", 84, 137, 19, 20, 36, colores.pelajeBlanco)
            ]
        }),
        crearPersonaje("conejo-voxel", "Conejo", "#e4e0d7", {
            piel: colores.pelajeBlanco,
            ojos: "#594550",
            boca: "#a65c65",
            torso: colores.pelajeBlanco,
            brazos: colores.pelajeBlanco,
            pantalones: colores.pantalonesGrises,
            cabeza: [
                crearParte("oreja-izquierda", -21, -34, 19, 58, 23, colores.rosa),
                crearParte("oreja-derecha", 21, -34, 19, 58, 23, colores.rosa)
            ],
            adornos: [
                crearParte("hocico", 0, 49, 30, 19, 76, colores.crema),
                crearParte("nariz", 0, 48, 8, 7, 80, colores.rosa),
                crearParte("cola", 0, 143, 24, 24, 38, colores.pelajeBlanco)
            ]
        }),
        crearPersonaje("panda-voxel", "Panda", "#555961", {
            piel: colores.pelajeBlanco,
            ojos: "#25262a",
            torso: colores.pelajeBlanco,
            brazos: colores.negro,
            pantalones: colores.negro,
            cabeza: [
                crearParte("oreja-izquierda", -27, -5, 26, 25, 29, colores.negro),
                crearParte("oreja-derecha", 27, -5, 26, 25, 29, colores.negro),
                crearParte("parche-ojo-izquierdo", -19, 34, 20, 18, 73, colores.negro),
                crearParte("parche-ojo-derecho", 19, 34, 20, 18, 73, colores.negro)
            ],
            adornos: [
                crearParte("pupila-izquierda", -19, 38, 7, 8, 81, colores.pelajeBlanco),
                crearParte("pupila-derecha", 19, 38, 7, 8, 81, colores.pelajeBlanco),
                crearParte("hocico", 0, 49, 29, 18, 77, colores.pelajeBlanco),
                crearParte("nariz", 0, 49, 8, 7, 81, colores.negro)
            ]
        }),
        crearPersonaje("robot-voxel", "Robot", "#4b91bd", {
            piel: colores.blanco,
            ojos: "#35d5d0",
            boca: "#384957",
            torso: colores.pelajeGris,
            brazos: colores.pelajeGris,
            pantalones: colores.negro,
            cabeza: [
                crearParte("antena", 0, -13, 9, 18, 9, colores.coral),
                crearParte("antena-base", 0, 0, 28, 8, 28, colores.pelajeGris),
                crearParte("oreja-izquierda", -40, 33, 12, 20, 35, colores.coral),
                crearParte("oreja-derecha", 40, 33, 12, 20, 35, colores.coral)
            ],
            adornos: [
                crearParte("panel-pecho", 0, 96, 37, 29, 42, colores.verde),
                crearParte("boton-pecho-izquierdo", -11, 96, 6, 6, 45, colores.coral),
                crearParte("boton-pecho-derecho", 11, 96, 6, 6, 45, colores.cabelloRubio)
            ]
        }),
        crearPersonaje("alien-voxel", "Alien", "#6cae57", {
            piel: ["#76bd5c", "#4f873c", "#91d575", "#5a9846", "#a1e184", "#4a7f38"],
            ojos: "#263442",
            boca: "#426b3c",
            torso: ["#497eb2", "#345c86", "#6095c9", "#3d6b9a", "#76a8d6", "#305680"],
            brazos: ["#76bd5c", "#4f873c", "#91d575", "#5a9846", "#a1e184", "#4a7f38"],
            pantalones: colores.morado,
            cabeza: [
                crearParte("antena-izquierda", -19, -12, 9, 19, 9, colores.piel),
                crearParte("antena-derecha", 19, -12, 9, 19, 9, colores.piel),
                crearParte("punta-antena-izquierda", -19, -22, 15, 11, 15, colores.coral),
                crearParte("punta-antena-derecha", 19, -22, 15, 11, 15, colores.coral)
            ],
            adornos: [
                crearParte("ojo-izquierdo-alien", -18, 39, 17, 17, 76, colores.negro),
                crearParte("ojo-derecho-alien", 18, 39, 17, 17, 76, colores.negro)
            ]
        }),
        crearPersonaje("mono-voxel", "Mono", "#805334", {
            piel: colores.pelajeCafe,
            ojos: "#39302a",
            boca: "#725148",
            torso: colores.pelajeCafe,
            pantalones: colores.pantalonesAzules,
            cabeza: [
                crearParte("oreja-izquierda", -38, 29, 20, 25, 28, colores.crema),
                crearParte("oreja-derecha", 38, 29, 20, 25, 28, colores.crema),
                crearParte("cara", 0, 37, 51, 38, 73, colores.crema)
            ],
            adornos: [
                crearParte("hocico", 0, 51, 29, 18, 78, colores.pelajeCafe)
            ]
        })
    ];

    const paleta = (frente, atras, derecha, izquierda, arriba, abajo) => [
        frente,
        atras,
        derecha,
        izquierda,
        arriba,
        abajo
    ];
    const pielNuevos = colores.pielClara;
    const crearAventurero = (
        id,
        nombre,
        tema,
        { piel = pielNuevos, ojos = "#292b30", boca = "#754639", torso, brazos = torso, pantalones, cabeza, adornos = [] }
    ) => crearPersonaje(id, nombre, tema, {
        piel,
        ojos,
        boca,
        torso,
        brazos,
        pantalones,
        cabeza,
        adornos
    });

    personajes.push(
        crearAventurero("superheroe-voxel", "Súper Héroe", "#d34a4a", {
            torso: paleta("#d33443", "#8b202e", "#bd2c3a", "#7d202a", "#f05258", "#571b27"),
            pantalones: paleta("#244e91", "#172e5c", "#203d78", "#172c56", "#3c68ae", "#17264a"),
            cabeza: [crearParte("cabello", 0, 1, 76, 19, 76, colores.cabello)],
            adornos: [
                crearParte("capa", 0, 104, 83, 103, 12, paleta("#d33443", "#681b2d", "#a32639", "#741d30", "#f05258", "#511526"), { z: -28 }),
                crearParte("emblema", 0, 97, 25, 25, 43, paleta("#f3ca49", "#bd8427", "#d9a232", "#ae7524", "#ffe27b", "#906020"), { z: 22 }),
                crearParte("cinturon", 0, 146, 70, 12, 42, colores.cabelloRubio)
            ]
        }),
        crearAventurero("k1-voxel", "K1", "#e65d83", {
            torso: paleta("#e65782", "#9d2d55", "#c8406b", "#a3335a", "#ff83a4", "#72203f"),
            pantalones: colores.pantalonesAzules,
            cabeza: [
                crearParte("flequillo-k1", 0, -1, 79, 21, 78, colores.cabelloNegro),
                crearParte("mechon-k1", -23, 17, 25, 36, 76, colores.cabelloNegro)
            ],
            adornos: [
                crearParte("chaqueta-k1", 0, 84, 75, 30, 43, colores.coral),
                crearParte("microfono-k1", 60, 90, 8, 25, 8, colores.blanco)
            ]
        }),
        crearAventurero("k2-voxel", "K2", "#41a6a0", {
            torso: paleta("#36a89d", "#1c625f", "#298b83", "#216e6a", "#5ac9b9", "#174a4c"),
            pantalones: colores.negro,
            cabeza: [
                crearParte("cabello-k2", 0, -5, 79, 20, 78, colores.cabello),
                crearParte("flequillo-k2", 22, 13, 38, 17, 77, colores.cabello)
            ],
            adornos: [
                crearParte("chaqueta-k2", 0, 91, 76, 56, 43, colores.negro),
                crearParte("solapa-k2", -19, 91, 16, 49, 46, colores.blanco),
                crearParte("solapa-k2-derecha", 19, 91, 16, 49, 46, colores.blanco)
            ]
        }),
        crearAventurero("k3-voxel", "K3", "#7157c8", {
            torso: paleta("#7559c9", "#403175", "#5f49a2", "#493881", "#a18ae7", "#312454"),
            pantalones: colores.pantalonesGrises,
            cabeza: [
                crearParte("cabello-k3", 0, 1, 77, 20, 76, colores.cabelloRojo),
                crearParte("copete-k3", 3, -15, 48, 18, 48, colores.cabelloRojo)
            ],
            adornos: [
                crearParte("chaqueta-k3", 0, 86, 74, 54, 42, colores.morado),
                crearParte("camiseta-k3", 0, 104, 31, 41, 44, colores.blanco),
                crearParte("insignia-k3", 0, 96, 13, 13, 48, colores.cabelloRubio)
            ]
        }),
        crearAventurero("k4-voxel", "K4", "#ed9a43", {
            torso: paleta("#e99a3c", "#9c5428", "#c57b30", "#a9602b", "#ffc266", "#75401f"),
            pantalones: colores.pantalonesRojos,
            cabeza: [
                crearParte("cabello-k4", 0, 2, 79, 20, 76, colores.cabelloNegro),
                crearParte("cabello-largo-k4", -34, 31, 15, 69, 72, colores.cabelloNegro),
                crearParte("flequillo-k4", 16, 17, 46, 15, 78, colores.cabelloNegro)
            ],
            adornos: [
                crearParte("chaqueta-k4", 0, 92, 76, 52, 43, colores.cafe),
                crearParte("cuello-k4", 0, 84, 29, 17, 48, colores.crema),
                crearParte("pulsera-k4", 53, 134, 15, 10, 37, colores.cabelloRubio)
            ]
        }),
        crearAventurero("k5-voxel", "K5", "#4989d3", {
            torso: paleta("#448bd2", "#254f8a", "#3673b5", "#2c5e97", "#70b4f2", "#1d3b6d"),
            pantalones: colores.pantalonesGrises,
            cabeza: [
                crearParte("cabello-k5", 0, -1, 80, 20, 79, colores.cabelloRubio),
                crearParte("flequillo-izquierdo-k5", -20, 17, 30, 29, 78, colores.cabelloRubio),
                crearParte("flequillo-derecho-k5", 17, 15, 27, 20, 78, colores.cabelloRubio)
            ],
            adornos: [
                crearParte("chaqueta-k5", 0, 88, 76, 48, 44, colores.blanco),
                crearParte("ribete-k5", 0, 104, 78, 8, 47, colores.coral),
                crearParte("microfono-k5", -60, 88, 8, 23, 8, colores.cabelloRubio)
            ]
        }),
        crearAventurero("k6-voxel", "K6", "#55a65b", {
            torso: paleta("#4d9e55", "#2b5c36", "#3b8045", "#326b3b", "#79c879", "#20472e"),
            pantalones: colores.negro,
            cabeza: [
                crearParte("cabello-k6", 0, 1, 78, 20, 75, colores.cabello),
                crearParte("copete-k6", -4, -14, 43, 18, 48, colores.cabello),
                crearParte("banda-k6", 0, 12, 82, 8, 82, colores.cabelloRojo)
            ],
            adornos: [
                crearParte("chaqueta-k6", 0, 89, 75, 52, 43, colores.verde),
                crearParte("hombrera-k6", -45, 83, 24, 21, 44, colores.cabelloRubio),
                crearParte("hombrera-k6-derecha", 45, 83, 24, 21, 44, colores.cabelloRubio)
            ]
        }),
        crearAventurero("viajera-espacial-voxel", "Viajera espacial", "#44b9cb", {
            ojos: "#315d79",
            torso: paleta("#e6e9ed", "#8a98a7", "#b8c4ce", "#8797a6", "#ffffff", "#647483"),
            pantalones: paleta("#c8d2da", "#657484", "#a6b2be", "#788898", "#edf2f4", "#566575"),
            cabeza: [
                crearParte("casco-base", 0, -3, 89, 18, 87, colores.blanco),
                crearParte("casco-lateral-izquierdo", -39, 22, 12, 45, 87, colores.blanco),
                crearParte("casco-lateral-derecho", 39, 22, 12, 45, 87, colores.blanco),
                crearParte("visor-espacial", 0, 40, 54, 25, 91, paleta("#53c7df", "#185978", "#35a1bf", "#227893", "#99f0fa", "#16485f"), { z: 4 })
            ],
            adornos: [
                crearParte("mochila-espacial", 0, 91, 50, 58, 23, colores.pelajeGris, { z: -25 }),
                crearParte("panel-traje", 0, 108, 25, 25, 45, colores.coral)
            ]
        }),
        crearAventurero("hechicero-oscuro-voxel", "Hechicero oscuro", "#593b78", {
            piel: colores.pielOscura,
            ojos: "#9b6ce0",
            torso: paleta("#43304f", "#211b2c", "#362942", "#251e32", "#614879", "#171521"),
            pantalones: colores.negro,
            cabeza: [
                crearParte("capucha", 0, 1, 85, 19, 84, paleta("#302638", "#17141e", "#27202f", "#1c1824", "#493853", "#131119")),
                crearParte("punta-capucha", 0, -15, 47, 26, 48, paleta("#302638", "#17141e", "#27202f", "#1c1824", "#493853", "#131119"))
            ],
            adornos: [
                crearParte("manto-hechicero", 0, 118, 81, 80, 16, paleta("#362741", "#17131f", "#2b2036", "#1e1728", "#4d385c", "#14101b"), { z: -25 }),
                crearParte("amuleto-hechicero", 0, 94, 18, 24, 44, colores.cabelloRubio),
                crearParte("gema-hechicero", 0, 96, 9, 11, 48, colores.coral)
            ]
        }),
        crearAventurero("vikingo-voxel", "Vikinga", "#a76b42", {
            piel: colores.piel,
            torso: paleta("#805334", "#4e331f", "#704629", "#593922", "#a96f43", "#392618"),
            pantalones: paleta("#59636b", "#3d454b", "#4a535a", "#3b4248", "#87929a", "#30363b"),
            cabeza: [
                crearParte("casco-vikingo", 0, -4, 82, 18, 79, colores.pelajeGris),
                crearParte("cuerno-izquierdo", -45, 8, 18, 39, 21, colores.crema),
                crearParte("cuerno-derecho", 45, 8, 18, 39, 21, colores.crema),
                crearParte("barba-vikinga", 0, 65, 48, 26, 76, colores.cabelloRojo)
            ],
            adornos: [
                crearParte("capa-piel-vikinga", 0, 112, 83, 37, 45, colores.crema, { z: -25 }),
                crearParte("cinturon-vikingo", 0, 145, 72, 13, 45, colores.cabelloRubio),
                crearParte("hebilla-vikinga", 0, 145, 17, 16, 49, colores.cabelloRojo)
            ]
        }),
        crearAventurero("guerrero-medieval-voxel", "Guerrero medieval", "#718493", {
            torso: paleta("#667986", "#354550", "#566875", "#465660", "#8d9ba4", "#293640"),
            pantalones: colores.pantalonesGrises,
            cabeza: [
                crearParte("casco-medieval", 0, -3, 81, 20, 81, colores.pelajeGris),
                crearParte("protector-cara", 0, 39, 73, 11, 84, colores.negro),
                crearParte("pluma-casco", 0, -19, 17, 25, 15, colores.coral)
            ],
            adornos: [
                crearParte("armadura-medieval", 0, 90, 77, 49, 49, colores.pelajeGris),
                crearParte("emblema-medieval", 0, 101, 25, 27, 53, colores.cabelloRojo),
                crearParte("escudo-medieval", -66, 106, 34, 44, 13, colores.azul || colores.pantalonesAzules)
            ]
        }),
        crearAventurero("rey-voxel", "Rey", "#d3a747", {
            torso: paleta("#56427e", "#302448", "#483565", "#382a52", "#755d9e", "#251c3c"),
            pantalones: colores.pantalonesGrises,
            cabeza: [
                crearParte("cabello-rey", 0, 1, 76, 20, 76, colores.cabelloRubio),
                crearParte("corona-base", 0, -7, 79, 12, 78, colores.cabelloRubio),
                crearParte("punta-corona-1", -24, -19, 13, 20, 13, colores.cabelloRubio),
                crearParte("punta-corona-2", 0, -22, 13, 25, 13, colores.cabelloRubio),
                crearParte("punta-corona-3", 24, -19, 13, 20, 13, colores.cabelloRubio)
            ],
            adornos: [
                crearParte("manto-real", 0, 119, 80, 65, 15, colores.coral, { z: -25 }),
                crearParte("banda-real", 0, 98, 78, 11, 50, colores.cabelloRubio),
                crearParte("joya-real", 0, 99, 13, 15, 53, colores.verde)
            ]
        }),
        crearAventurero("troll-voxel", "Troll", "#71934b", {
            piel: paleta("#91b85b", "#557136", "#7b9d49", "#5e7c3d", "#b2d878", "#47602f"),
            ojos: "#493f27",
            torso: paleta("#6f8144", "#3f512e", "#5b6b38", "#495832", "#93a957", "#344327"),
            brazos: paleta("#91b85b", "#557136", "#7b9d49", "#5e7c3d", "#b2d878", "#47602f"),
            pantalones: colores.cafe,
            cabeza: [
                crearParte("oreja-troll-izquierda", -46, 31, 28, 19, 36, colores.verde),
                crearParte("oreja-troll-derecha", 46, 31, 28, 19, 36, colores.verde),
                crearParte("ceja-troll", 0, 21, 66, 13, 78, colores.pelajeCafe)
            ],
            adornos: [
                crearParte("colmillo-troll-izquierdo", -20, 69, 11, 18, 78, colores.crema),
                crearParte("colmillo-troll-derecho", 20, 69, 11, 18, 78, colores.crema),
                crearParte("chaleco-troll", 0, 91, 76, 48, 43, colores.cafe)
            ]
        }),
        crearAventurero("vampiro-voxel", "Vampiro", "#74436d", {
            piel: colores.pielClara,
            ojos: "#8b2639",
            boca: "#843044",
            torso: paleta("#342638", "#181820", "#2b202f", "#201a27", "#503b50", "#121219"),
            pantalones: colores.negro,
            cabeza: [
                crearParte("cabello-vampiro", 0, -2, 79, 20, 79, colores.cabelloNegro),
                crearParte("flequillo-vampiro", 0, 14, 72, 17, 82, colores.cabelloNegro)
            ],
            adornos: [
                crearParte("capa-vampiro", 0, 116, 82, 86, 15, paleta("#39263d", "#17131d", "#302033", "#201923", "#513653", "#121017"), { z: -25 }),
                crearParte("forro-capa-vampiro", 0, 117, 62, 70, 8, colores.coral, { z: -34 }),
                crearParte("colmillo-vampiro-izquierdo", -12, 71, 7, 14, 78, colores.blanco),
                crearParte("colmillo-vampiro-derecho", 12, 71, 7, 14, 78, colores.blanco)
            ]
        }),
        crearAventurero("momia-voxel", "Momia", "#a99d7b", {
            piel: paleta("#c8bd9a", "#81765e", "#b1a582", "#91876c", "#ded2ad", "#716850"),
            torso: paleta("#c8bd9a", "#81765e", "#b1a582", "#91876c", "#ded2ad", "#716850"),
            brazos: paleta("#d5c9a4", "#8e8267", "#b8ad8a", "#998d70", "#e8ddb9", "#716850"),
            pantalones: paleta("#b6aa88", "#716850", "#a39777", "#81765e", "#d3c7a1", "#655d49"),
            cabeza: [
                crearParte("venda-momia-1", 0, 6, 78, 12, 82, colores.crema),
                crearParte("venda-momia-2", 0, 30, 81, 10, 84, colores.pelajeBlanco),
                crearParte("venda-momia-3", 0, 55, 76, 11, 84, colores.crema),
                crearParte("ojo-momia-izquierdo", -18, 40, 9, 10, 88, colores.cabelloRojo),
                crearParte("ojo-momia-derecho", 18, 40, 9, 10, 88, colores.cabelloRojo)
            ],
            adornos: [
                crearParte("venda-pecho-1", 0, 91, 76, 10, 46, colores.pelajeBlanco),
                crearParte("venda-pecho-2", 0, 117, 76, 10, 46, colores.crema),
                crearParte("venda-pecho-3", 0, 140, 75, 10, 46, colores.pelajeBlanco),
                crearParte("venda-brazo-izquierdo", -50, 111, 30, 9, 39, colores.crema),
                crearParte("venda-brazo-derecho", 50, 111, 30, 9, 39, colores.pelajeBlanco)
            ]
        })
    );

    const crearPersonajeVoxel = (id, nombre, tema, partes) => ({
        id,
        nombre,
        tema,
        partes
    });

    personajes.push(
        crearPersonajeVoxel("hombre-lobo-voxel", "Hombre lobo", "#71806a", [
            crearParte("oreja-lobo-izquierda", -35, -12, 26, 35, 32, colores.pelajeGris),
            crearParte("oreja-lobo-derecha", 35, -12, 26, 35, 32, colores.pelajeGris),
            crearParte("rostro-lobo", 0, 16, 76, 68, 76, colores.pelajeGris, {
                rostro: true,
                ojos: "#f2bf45",
                boca: "#412b2a"
            }),
            crearParte("hocico-lobo", 0, 48, 38, 27, 84, colores.pelajeCafe, { z: 12 }),
            crearParte("nariz-lobo", 0, 43, 16, 13, 91, colores.negro, { z: 16 }),
            crearParte("cuerpo-lobo", 0, 94, 72, 78, 46, colores.pelajeGris),
            crearParte("brazo-lobo-izquierdo", -49, 100, 29, 76, 38, colores.pelajeGris),
            crearParte("brazo-lobo-derecho", 49, 100, 29, 76, 38, colores.pelajeGris),
            crearParte("garra-lobo-izquierda", -51, 146, 31, 19, 39, colores.crema),
            crearParte("garra-lobo-derecha", 51, 146, 31, 19, 39, colores.crema),
            crearParte("pierna-lobo-izquierda", -19, 171, 32, 61, 39, colores.negro),
            crearParte("pierna-lobo-derecha", 19, 171, 32, 61, 39, colores.negro),
            crearParte("cola-lobo", 0, 139, 28, 28, 76, colores.pelajeGris, { z: -47 })
        ]),
        crearPersonajeVoxel("pollo-voxel", "Pollo", "#f0ce55", [
            crearParte("cresta-pollo-izquierda", -16, -20, 18, 27, 20, colores.coral),
            crearParte("cresta-pollo-centro", 0, -27, 19, 34, 20, colores.coral),
            crearParte("cresta-pollo-derecha", 16, -20, 18, 27, 20, colores.coral),
            crearParte("rostro-pollo", 0, 17, 68, 62, 66, colores.pelajeBlanco, {
                rostro: true,
                ojos: "#292b30",
                boca: "#d58d16"
            }),
            crearParte("pico-pollo", 0, 50, 29, 20, 28, colores.cabelloRubio, { z: 43 }),
            crearParte("cuerpo-pollo", 0, 103, 86, 80, 62, colores.pelajeBlanco),
            crearParte("ala-pollo-izquierda", -50, 106, 28, 49, 45, colores.crema),
            crearParte("ala-pollo-derecha", 50, 106, 28, 49, 45, colores.crema),
            crearParte("pata-pollo-izquierda", -20, 174, 13, 54, 15, colores.cabelloRubio),
            crearParte("pata-pollo-derecha", 20, 174, 13, 54, 15, colores.cabelloRubio),
            crearParte("pie-pollo-izquierdo", -20, 201, 33, 12, 27, colores.cabelloRubio),
            crearParte("pie-pollo-derecho", 20, 201, 33, 12, 27, colores.cabelloRubio)
        ]),
        crearPersonajeVoxel("dinosaurio-voxel", "Dinosaurio", "#66a94e", [
            crearParte("rostro-dinosaurio", 0, 16, 76, 69, 78, colores.verde, {
                rostro: true,
                ojos: "#f4d34f",
                boca: "#354b32"
            }),
            crearParte("hocico-dinosaurio", 0, 51, 68, 30, 48, colores.verde, { z: 27 }),
            crearParte("nariz-dinosaurio-izquierda", -20, 51, 8, 8, 8, colores.negro, { z: 54 }),
            crearParte("nariz-dinosaurio-derecha", 20, 51, 8, 8, 8, colores.negro, { z: 54 }),
            crearParte("cuerpo-dinosaurio", 0, 103, 79, 82, 54, colores.verde),
            crearParte("brazo-dinosaurio-izquierdo", -52, 108, 24, 49, 33, colores.verde),
            crearParte("brazo-dinosaurio-derecho", 52, 108, 24, 49, 33, colores.verde),
            crearParte("pierna-dinosaurio-izquierda", -22, 171, 35, 61, 45, colores.pelajeCafe),
            crearParte("pierna-dinosaurio-derecha", 22, 171, 35, 61, 45, colores.pelajeCafe),
            crearParte("cola-dinosaurio", -62, 137, 66, 29, 37, colores.verde, { z: -24 }),
            crearParte("punta-cola-dinosaurio", -95, 140, 24, 22, 29, colores.cabelloRojo, { z: -34 }),
            crearParte("placa-dinosaurio-1", -29, 82, 18, 19, 20, colores.cabelloRubio),
            crearParte("placa-dinosaurio-2", -8, 77, 19, 24, 22, colores.cabelloRubio),
            crearParte("placa-dinosaurio-3", 14, 80, 18, 21, 20, colores.cabelloRubio),
            crearParte("placa-dinosaurio-4", 32, 86, 16, 17, 18, colores.cabelloRubio)
        ]),
        crearPersonajeVoxel("palo-con-patas-voxel", "Palo con patas", "#a4784f", [
            crearParte("cabeza-palo", 0, 0, 40, 40, 40, colores.cafe, {
                rostro: true,
                ojos: "#292b30",
                boca: "#754639"
            }),
            crearParte("tronco-palo", 0, 48, 13, 91, 14, colores.cafe),
            crearParte("brazo-palo-izquierdo", -26, 61, 10, 58, 12, colores.cafe),
            crearParte("brazo-palo-derecho", 26, 61, 10, 58, 12, colores.cafe),
            crearParte("mano-palo-izquierda", -29, 89, 16, 13, 16, colores.cafe),
            crearParte("mano-palo-derecha", 29, 89, 16, 13, 16, colores.cafe),
            crearParte("pierna-palo-izquierda", -15, 135, 11, 66, 13, colores.cafe),
            crearParte("pierna-palo-derecha", 15, 135, 11, 66, 13, colores.cafe),
            crearParte("pie-palo-izquierdo", -19, 165, 25, 11, 20, colores.negro),
            crearParte("pie-palo-derecho", 19, 165, 25, 11, 20, colores.negro)
        ]),
        crearPersonajeVoxel("caja-con-cara-voxel", "Caja con cara", "#bd8950", [
            crearParte("caja-cabeza", 0, 10, 88, 82, 86, colores.cafe, { z: -4 }),
            crearParte("rostro-caja", 0, 17, 70, 66, 72, colores.crema, {
                rostro: true,
                ojos: "#34312d",
                boca: "#a54840",
                z: 4
            }),
            crearParte("cinta-caja-vertical", 0, -1, 13, 22, 90, colores.cabelloRubio, { z: -1 }),
            crearParte("cinta-caja-horizontal", 0, 49, 90, 12, 90, colores.cabelloRubio, { z: -1 }),
            crearParte("cuerpo-caja", 0, 105, 73, 72, 55, colores.cafe),
            crearParte("pierna-caja-izquierda", -20, 168, 31, 61, 38, colores.pantalonesGrises),
            crearParte("pierna-caja-derecha", 20, 168, 31, 61, 38, colores.pantalonesGrises),
            crearParte("brazo-caja-izquierdo", -51, 108, 27, 61, 37, colores.cafe),
            crearParte("brazo-caja-derecho", 51, 108, 27, 61, 37, colores.cafe)
        ]),
        crearPersonajeVoxel("cactus-voxel", "Cactus", "#43834e", [
            crearParte("cabeza-cactus", 0, 5, 48, 42, 48, colores.verde),
            crearParte("flor-cactus-centro", 0, -13, 18, 16, 18, colores.coral),
            crearParte("flor-cactus-izquierda", -12, -8, 14, 14, 15, colores.coral),
            crearParte("flor-cactus-derecha", 12, -8, 14, 14, 15, colores.coral),
            crearParte("cuerpo-cactus", 0, 91, 53, 111, 51, colores.verde),
            crearParte("brazo-cactus-izquierdo", -43, 92, 25, 68, 25, colores.verde),
            crearParte("brazo-cactus-derecho", 43, 92, 25, 68, 25, colores.verde),
            crearParte("pierna-cactus-izquierda", -17, 183, 22, 44, 25, colores.pelajeCafe),
            crearParte("pierna-cactus-derecha", 17, 183, 22, 44, 25, colores.pelajeCafe),
            crearParte("espina-cactus-izquierda-1", -30, 71, 8, 8, 8, colores.crema, { z: 28 }),
            crearParte("espina-cactus-izquierda-2", -24, 119, 8, 8, 8, colores.crema, { z: 28 }),
            crearParte("espina-cactus-derecha-1", 29, 91, 8, 8, 8, colores.crema, { z: 28 }),
            crearParte("espina-cactus-derecha-2", 25, 143, 8, 8, 8, colores.crema, { z: 28 })
        ]),
        crearPersonajeVoxel("fantasma-voxel", "Fantasma", "#a9dce8", [
            crearParte("cabeza-fantasma", 0, 8, 83, 71, 76, paleta("#e5faff", "#9bc9d7", "#c3e9ef", "#a8d7e0", "#ffffff", "#7eafbd"), {
                rostro: true,
                ojos: "#405675",
                boca: "#697e99"
            }),
            crearParte("cuerpo-fantasma", 0, 94, 81, 82, 51, paleta("#e5faff", "#9bc9d7", "#c3e9ef", "#a8d7e0", "#ffffff", "#7eafbd")),
            crearParte("brazo-fantasma-izquierdo", -49, 103, 26, 55, 35, paleta("#e5faff", "#9bc9d7", "#c3e9ef", "#a8d7e0", "#ffffff", "#7eafbd")),
            crearParte("brazo-fantasma-derecho", 49, 103, 26, 55, 35, paleta("#e5faff", "#9bc9d7", "#c3e9ef", "#a8d7e0", "#ffffff", "#7eafbd")),
            crearParte("base-fantasma-izquierda", -28, 158, 27, 28, 50, paleta("#e5faff", "#9bc9d7", "#c3e9ef", "#a8d7e0", "#ffffff", "#7eafbd")),
            crearParte("base-fantasma-centro", 0, 164, 28, 22, 50, paleta("#e5faff", "#9bc9d7", "#c3e9ef", "#a8d7e0", "#ffffff", "#7eafbd")),
            crearParte("base-fantasma-derecha", 28, 158, 27, 28, 50, paleta("#e5faff", "#9bc9d7", "#c3e9ef", "#a8d7e0", "#ffffff", "#7eafbd"))
        ]),
        crearPersonajeVoxel("angel-voxel", "Ángel", "#f4d875", [
            crearParte("cabello-angel", 0, -2, 76, 18, 76, colores.cabelloRubio),
            crearParte("rostro-angel", 0, 15, 70, 68, 72, colores.pielClara, {
                rostro: true,
                ojos: "#536b91",
                boca: "#b76a70"
            }),
            crearParte("halo-angel-frente", 0, -21, 61, 8, 12, paleta("#f5d45c", "#b58931", "#e5bc48", "#c99e38", "#ffe99a", "#9b7128"), { z: 18 }),
            crearParte("halo-angel-lateral-izquierdo", -27, -18, 8, 12, 12, paleta("#f5d45c", "#b58931", "#e5bc48", "#c99e38", "#ffe99a", "#9b7128"), { z: 18 }),
            crearParte("halo-angel-lateral-derecho", 27, -18, 8, 12, 12, paleta("#f5d45c", "#b58931", "#e5bc48", "#c99e38", "#ffe99a", "#9b7128"), { z: 18 }),
            crearParte("toga-angel", 0, 91, 71, 91, 45, colores.blanco),
            crearParte("ala-angel-izquierda", -60, 95, 39, 82, 19, paleta("#ffffff", "#aebdce", "#e2eaf1", "#c9d7e3", "#ffffff", "#98aabe"), { z: -20 }),
            crearParte("ala-angel-derecha", 60, 95, 39, 82, 19, paleta("#ffffff", "#aebdce", "#e2eaf1", "#c9d7e3", "#ffffff", "#98aabe"), { z: -20 }),
            crearParte("tunica-angel-banda", 0, 107, 14, 77, 48, colores.cabelloRubio),
            crearParte("pie-angel-izquierdo", -18, 176, 27, 25, 35, colores.pielClara),
            crearParte("pie-angel-derecho", 18, 176, 27, 25, 35, colores.pielClara)
        ]),
        crearPersonajeVoxel("demonio-voxel", "Demonio", "#c84949", [
            crearParte("cuerno-demonio-izquierdo", -30, -15, 19, 40, 22, colores.cabelloRubio),
            crearParte("cuerno-demonio-derecho", 30, -15, 19, 40, 22, colores.cabelloRubio),
            crearParte("rostro-demonio", 0, 15, 72, 68, 76, paleta("#bd4949", "#752d39", "#a13a42", "#84323e", "#dc6460", "#682735"), {
                rostro: true,
                ojos: "#ffcf4a",
                boca: "#351c2b"
            }),
            crearParte("ceja-demonio-izquierda", -18, 27, 22, 8, 79, colores.negro, { z: 4 }),
            crearParte("ceja-demonio-derecha", 18, 27, 22, 8, 79, colores.negro, { z: 4 }),
            crearParte("colmillo-demonio-izquierdo", -13, 65, 9, 16, 81, colores.blanco, { z: 8 }),
            crearParte("colmillo-demonio-derecho", 13, 65, 9, 16, 81, colores.blanco, { z: 8 }),
            crearParte("cuerpo-demonio", 0, 96, 73, 78, 48, paleta("#542839", "#2d1b2c", "#462333", "#362030", "#713449", "#231626")),
            crearParte("brazo-demonio-izquierdo", -50, 105, 27, 69, 38, paleta("#bd4949", "#752d39", "#a13a42", "#84323e", "#dc6460", "#682735")),
            crearParte("brazo-demonio-derecho", 50, 105, 27, 69, 38, paleta("#bd4949", "#752d39", "#a13a42", "#84323e", "#dc6460", "#682735")),
            crearParte("pierna-demonio-izquierda", -19, 168, 32, 63, 40, colores.negro),
            crearParte("pierna-demonio-derecha", 19, 168, 32, 63, 40, colores.negro),
            crearParte("cola-demonio", -51, 153, 62, 16, 17, paleta("#bd4949", "#752d39", "#a13a42", "#84323e", "#dc6460", "#682735"), { z: -31 }),
            crearParte("punta-cola-demonio", -82, 148, 24, 25, 24, paleta("#542839", "#2d1b2c", "#462333", "#362030", "#713449", "#231626"), { z: -35 })
        ])
    );

    const caras = ["front", "back", "right", "left", "top", "bottom"];

    function crearModelo(personaje) {
        const modelo = document.createElement("span");
        modelo.className = "personaje-modelo";
        modelo.setAttribute("aria-hidden", "true");

        personaje.partes.forEach((parte) => {
            const cubo = document.createElement("span");
            cubo.className = "voxel-cuboid";
            cubo.dataset.parte = parte.nombre;
            cubo.style.setProperty("--x", `${parte.x}px`);
            cubo.style.setProperty("--y", `${parte.y}px`);
            cubo.style.setProperty("--z", `${parte.z || 0}px`);
            cubo.style.setProperty("--w", `${parte.w}px`);
            cubo.style.setProperty("--h", `${parte.h}px`);
            cubo.style.setProperty("--d", `${parte.d}px`);

            caras.forEach((cara, indice) => {
                const elementoCara = document.createElement("span");
                elementoCara.className = `voxel-face voxel-${cara}`;
                elementoCara.style.setProperty(`--${cara}`, parte.colores[indice]);

                if (parte.rostro && cara === "front") {
                    const ojoIzquierdo = document.createElement("span");
                    ojoIzquierdo.className = "cara-ojo cara-ojo-izquierdo";
                    ojoIzquierdo.style.backgroundColor = parte.ojos;

                    const ojoDerecho = document.createElement("span");
                    ojoDerecho.className = "cara-ojo cara-ojo-derecho";
                    ojoDerecho.style.backgroundColor = parte.ojos;

                    const boca = document.createElement("span");
                    boca.className = "cara-boca";
                    boca.style.backgroundColor = parte.boca;

                    elementoCara.append(ojoIzquierdo, ojoDerecho, boca);
                }

                cubo.appendChild(elementoCara);
            });

            modelo.appendChild(cubo);
        });

        return modelo;
    }

    window.PersonajesKaku = Object.freeze({
        obtenerTodos: () => personajes,
        obtenerPorId: (id) => personajes.find(personaje => personaje.id === id) || null,
        obtenerPorNombre: (nombre) =>
            personajes.find(personaje => personaje.nombre === nombre) || null,
        crearModelo
    });

    if (portada) {
        const escenario = document.createElement("div");
        escenario.className = "escenario-personaje";
        escenario.appendChild(crearModelo(personajes[0]));
        portada.appendChild(escenario);
    }

    if (!contenedor) {
        return;
    }

    function seleccionarPersonaje(personaje, tarjeta) {
        contenedor.querySelectorAll(".selector-personaje").forEach((elemento) => {
            const seleccionado = elemento === tarjeta;
            elemento.classList.toggle("seleccionado", seleccionado);
            elemento.setAttribute("aria-pressed", String(seleccionado));
        });

        sessionStorage.setItem("personajeSeleccionado", personaje.nombre);
        sessionStorage.setItem("juegoPersonaje", personaje.nombre);
        document.dispatchEvent(new CustomEvent("personajeSeleccionado", {
            detail: { id: personaje.id, nombre: personaje.nombre }
        }));
    }

    const personajesPorPagina = 12;
    for (let inicio = 0; inicio < personajes.length; inicio += personajesPorPagina) {
        const pagina = document.createElement("div");
        pagina.className = "pagina-personajes";
        pagina.setAttribute("role", "group");
        pagina.setAttribute(
            "aria-label",
            `Personajes ${inicio + 1} a ${Math.min(inicio + personajesPorPagina, personajes.length)}`
        );

        personajes.slice(inicio, inicio + personajesPorPagina).forEach((personaje) => {
            const tarjeta = document.createElement("button");
            tarjeta.type = "button";
            tarjeta.className = "selector-personaje";
            tarjeta.setAttribute("aria-label", `Seleccionar personaje ${personaje.nombre}`);
            tarjeta.style.setProperty("--tema-personaje", personaje.tema);
            tarjeta.setAttribute(
                "aria-pressed",
                String(sessionStorage.getItem("personajeSeleccionado") === personaje.nombre)
            );

            const escenario = document.createElement("span");
            escenario.className = "escenario-personaje";
            escenario.appendChild(crearModelo(personaje));

            const nombre = document.createElement("span");
            nombre.className = "nombre-personaje";
            nombre.textContent = personaje.nombre;

            const ayuda = document.createElement("span");
            ayuda.className = "ayuda-personaje";

            tarjeta.append(escenario, nombre, ayuda);
            tarjeta.classList.toggle(
                "seleccionado",
                sessionStorage.getItem("personajeSeleccionado") === personaje.nombre
            );
            tarjeta.addEventListener("click", () => seleccionarPersonaje(personaje, tarjeta));
            pagina.appendChild(tarjeta);
        });

        contenedor.appendChild(pagina);
    }

})();
