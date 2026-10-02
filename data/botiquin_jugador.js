// Cajas de curación compartidas por todos los escenarios.
(() => {
    "use strict";

    function crear({ cube, upload, ground, obstacles, boxes, surfaces = [], hazards = [], rects = [], inicio, tamano, semilla }) {
        const botiquines = [];
        const datos = [];
        let seed = (semilla ^ 0x5f3759df) >>> 0;
        const random = () => {
            seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
            return seed / 4294967296;
        };
        const limite = Math.min(tamano / 2 - 5, 60);
        const considerar = punto => {
            if (botiquines.length === 2) return;
            const y = ground(punto.x, punto.z);
            if (!Number.isFinite(y) || y <= -50) return;

            const distanciaInicio = Math.hypot(punto.x - inicio.x, punto.z - inicio.z);
            if (distanciaInicio < 12 || distanciaInicio > limite) return;
            if (botiquines.some(caja => Math.hypot(punto.x - caja.x, punto.z - caja.z) < 18)) return;
            if (boxes.some(caja => Math.hypot(punto.x - caja.x, punto.z - caja.z) < 5)) return;
            if (hazards.some(hazard =>
                Math.abs(punto.x - hazard.x) < hazard.w / 2 + 1
                && Math.abs(punto.z - hazard.z) < hazard.d / 2 + 1
            )) return;
            if (rects.some(rect =>
                Math.abs(punto.x - rect.x) < rect.w / 2 + 1
                && Math.abs(punto.z - rect.z) < rect.d / 2 + 1
                && y < rect.top - 0.55
                && y + 1.65 > rect.bottom
            )) return;
            if (obstacles.some(obstaculo =>
                Math.hypot(punto.x - obstaculo.x, punto.z - obstaculo.z) < (obstaculo.r ?? 0) + 2.5
            )) return;

            botiquines.push({ x: punto.x, y, z: punto.z, recogido: false });
        };

        for (const superficie of surfaces) {
            if (superficie.type === "bridge") continue;
            const ancho = superficie.w ?? superficie.rx * 2;
            const fondo = superficie.d ?? superficie.rz * 2;
            if (!Number.isFinite(ancho) || !Number.isFinite(fondo)) continue;

            for (let intento = 0; intento < 16 && botiquines.length < 2; intento += 1) {
                considerar({
                    x: superficie.x + (random() - 0.5) * Math.max(0, ancho - 2),
                    z: superficie.z + (random() - 0.5) * Math.max(0, fondo - 2)
                });
            }
            if (botiquines.length === 2) break;
        }

        for (let intento = 0; intento < 30000 && botiquines.length < 2; intento += 1) {
            considerar({
                x: (random() - 0.5) * limite * 2,
                z: (random() - 0.5) * limite * 2
            });
        }

        if (botiquines.length !== 2) {
            throw new Error(`No se pudieron ubicar los dos botiquines del escenario (${botiquines.length}/2).`);
        }

        for (const caja of botiquines) {
            const blanco = [0.98, 0.99, 1];
            cube(datos, caja.x, caja.y, caja.z, 1.28, 0.9, 1.2, blanco);
            cube(datos, caja.x, caja.y + 0.9, caja.z, 1.42, 0.18, 1.34, [0.86, 0.9, 0.93]);
            cube(datos, caja.x, caja.y + 1.1, caja.z, 1.14, 0.1, 1.06, blanco);
            const rojo = [0.92, 0.08, 0.12];

            for (const lado of [-1, 1]) {
                const z = caja.z + lado * 0.613;
                cube(datos, caja.x, caja.y + 0.42, z, 0.2, 0.65, 0.05, rojo);
                cube(datos, caja.x, caja.y + 0.42, z, 0.72, 0.2, 0.05, rojo);

                const x = caja.x + lado * 0.653;
                cube(datos, x, caja.y + 0.42, caja.z, 0.05, 0.65, 0.2, rojo);
                cube(datos, x, caja.y + 0.42, caja.z, 0.05, 0.2, 0.72, rojo);
            }

            caja.mesh = upload(datos.splice(0));
        }

        return Object.freeze({
            dibujar(draw, jugador, distancia) {
                for (const caja of botiquines) {
                    if (!caja.recogido
                        && Math.hypot(caja.x - jugador.x, caja.z - jugador.z) < distancia) {
                        draw(caja.mesh);
                    }
                }
            },
            recoger(jugador, pies, recuperar) {
                const caja = botiquines.find(item =>
                    !item.recogido
                    && Math.hypot(item.x - jugador.x, item.z - jugador.z) < 1.35
                    && Math.abs(item.y - pies) < 1.4
                );
                if (!caja) return null;

                const vida = window.VidaJugador;
                const curar = typeof recuperar === "function"
                    ? recuperar
                    : typeof vida.recuperarCorazon === "function"
                        ? () => vida.recuperarCorazon()
                        : typeof vida.recuperarCorazones === "function"
                            ? () => vida.recuperarCorazones(1)
                            : null;
                if (!curar) {
                    throw new Error("VidaJugador no ofrece una función de recuperación compatible.");
                }

                caja.recogido = true;
                return curar();
            },
            dibujarEnMinimapa(contexto, convertir) {
                for (const caja of botiquines) {
                    if (caja.recogido) continue;
                    const x = convertir(caja.x);
                    const z = convertir(caja.z);
                    contexto.beginPath();
                    contexto.arc(x, z, 3.5, 0, Math.PI * 2);
                    contexto.fillStyle = "#fff";
                    contexto.strokeStyle = "#243746";
                    contexto.lineWidth = 1.5;
                    contexto.fill();
                    contexto.stroke();
                }
            }
        });
    }

    window.BotiquinesJugador = Object.freeze({ crear });
})();
