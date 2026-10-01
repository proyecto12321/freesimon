(() => {
    const contenedor = document.getElementById("selectorPersonajes");
    const portada = document.getElementById("personajePortada");

    if (!contenedor && !portada) {
        return;
    }

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
        document.dispatchEvent(new CustomEvent("personajeSeleccionado", {
            detail: { id: personaje.id, nombre: personaje.nombre }
        }));
    }

    for (let inicio = 0; inicio < personajes.length; inicio += 9) {
        const pagina = document.createElement("div");
        pagina.className = "pagina-personajes";
        pagina.setAttribute("role", "group");
        pagina.setAttribute(
            "aria-label",
            `Personajes ${inicio + 1} a ${Math.min(inicio + 9, personajes.length)}`
        );

        personajes.slice(inicio, inicio + 9).forEach((personaje) => {
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
            ayuda.textContent = "Haz clic para seleccionar";

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
