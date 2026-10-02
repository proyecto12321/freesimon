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
        const limite = Math.min(tamano / 2 - 5, 100);
        const considerar = punto => {
            if (botiquines.length === 2) return;
            const y = ground(punto.x, punto.z);
            if (!Number.isFinite(y) || y <= -50) return;

            const distanciaInicio = Math.hypot(punto.x - inicio.x, punto.z - inicio.z);
            if (distanciaInicio < 13 || distanciaInicio > 105) return;
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
            cube(datos, caja.x, caja.y, caja.z, 0.95, 0.85, 0.85, [0.93, 0.95, 0.96]);
            const rojo = [0.92, 0.08, 0.12];

            for (const lado of [-1, 1]) {
                const z = caja.z + lado * 0.438;
                cube(datos, caja.x, caja.y + 0.18, z, 0.13, 0.5, 0.035, rojo);
                cube(datos, caja.x, caja.y + 0.36, z, 0.52, 0.13, 0.035, rojo);

                const x = caja.x + lado * 0.488;
                cube(datos, x, caja.y + 0.18, caja.z, 0.035, 0.5, 0.13, rojo);
                cube(datos, x, caja.y + 0.36, caja.z, 0.035, 0.13, 0.52, rojo);
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

                caja.recogido = true;
                return recuperar();
            }
        });
    }

    window.BotiquinesJugador = Object.freeze({ crear });
})();
