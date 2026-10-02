// personajeD.js
// Módulo compartido para dibujar el personaje y usar tercera persona.
// Requiere cargar personaje.js antes de este archivo.

(() => {
    "use strict";

    class PersonajeTerceraPersona {
        constructor(gl, opciones = {}) {
            this.gl = gl;

            // Puedes cambiar la distancia al crear la instancia.
            this.distancia = opciones.distancia ?? 8;
            this.altura = opciones.altura ?? 1.85;

            // Cada escenario proporciona su comprobación de obstáculos.
            this.bloqueado = opciones.bloqueado ?? (() => false);

            const catalogo = window.PersonajesKaku;

            if (!catalogo) {
                throw new Error(
                    "Carga personaje.js antes de personajeD.js."
                );
            }

            // Tu selector guarda el nombre. También admitimos un ID.
            const elegido =
                sessionStorage.getItem("personajeSeleccionado") ||
                sessionStorage.getItem("juegoPersonaje");

            const modelo =
                catalogo.obtenerPorId(elegido) ||
                catalogo.obtenerPorNombre(elegido) ||
                catalogo.obtenerTodos()[0];

            if (!modelo?.partes?.length) {
                throw new Error("No hay un modelo de personaje válido.");
            }

            this.nombre = modelo.nombre;

            const partes = modelo.partes;
            const arriba = Math.min(...partes.map(p => p.y));
            const abajo = Math.max(...partes.map(p => p.y + p.h));

            // Convertir las dimensiones CSS a unidades del escenario.
            this.escala = this.altura / (abajo - arriba);
            this.piezas = [];

            const agregarParte = p => {
                const vertices = [];

                const x0 = p.x - p.w / 2;
                const x1 = p.x + p.w / 2;

                // Invertir Y y colocar los pies en la altura cero.
                const y0 = abajo - p.y - p.h;
                const y1 = abajo - p.y;

                // El frente apunta hacia -Z, igual que avanzar en el juego.
                const z0 = -(p.z ?? 0) - p.d / 2;
                const z1 = -(p.z ?? 0) + p.d / 2;

                // Frente, espalda, derecha, izquierda, arriba y abajo.
                const caras = [
                    [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]],
                    [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]],
                    [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]],
                    [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]],
                    [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]],
                    [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]]
                ];

                caras.forEach((cara, i) => {
                    const color = p.colores[i] || p.colores[0];

                    const rgb = typeof color === "string"
                        ? [1, 3, 5].map(
                            n => parseInt(color.slice(n, n + 2), 16) / 255
                        )
                        : color;

                    // Cada cara contiene dos triángulos.
                    for (const j of [0, 1, 2, 0, 2, 3]) {
                        vertices.push(...cara[j], ...rgb);
                    }
                });

                // Brazos y piernas se mueven en sentidos alternados.
                const signo = /izquierd/.test(p.nombre) ? 1 : -1;

                const movimiento = /^(brazo|pierna)-/.test(p.nombre)
                    ? signo * (p.nombre.startsWith("brazo") ? -1 : 1)
                    : 0;

                this.piezas.push({
                    vertices,
                    pivote: y1,
                    movimiento
                });
            };

            partes.forEach(agregarParte);

            // En el selector, ojos y boca son elementos HTML.
            // Aquí les damos geometría para que aparezcan en WebGL.
            const cara = partes.find(p => p.rostro);

            if (cara) {
                const agregarRasgo = (nombre, x, y, w, h, color) => {
                    agregarParte({
                        nombre,
                        x,
                        y,
                        w,
                        h,
                        d: 1,
                        z: cara.d / 2 + 1,
                        colores: Array(6).fill(color)
                    });
                };

                for (const lado of [-1, 1]) {
                    agregarRasgo(
                        "ojo",
                        cara.x + lado * 15,
                        cara.y + 25,
                        8,
                        9,
                        cara.ojos
                    );
                }

                agregarRasgo(
                    "boca",
                    cara.x,
                    cara.y + 49,
                    17,
                    4,
                    cara.boca
                );
            }

            // Reutilizamos el mismo buffer durante toda la partida.
            this.datos = new Float32Array(
                this.piezas.reduce(
                    (cantidad, pieza) => cantidad + pieza.vertices.length,
                    0
                )
            );

            this.buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                this.datos.byteLength,
                gl.DYNAMIC_DRAW
            );

            this.anterior = null;
            this.giro = 0;
            this.fase = 0;
            this.paso = 0;
            this.visible = true;
        }

        actualizar(player, dt, pies) {
            dt = Math.max(0, Math.min(0.05, dt));

            const dx = this.anterior
                ? player.x - this.anterior.x
                : 0;

            const dz = this.anterior
                ? player.z - this.anterior.z
                : 0;

            const recorrido = Math.hypot(dx, dz);
            const andando = recorrido > 0.0001 && recorrido < 1;

            if (!this.anterior) {
                this.giro = player.yaw;
            }

            // Orientar el cuerpo hacia la dirección de movimiento.
            const destino = andando
                ? Math.atan2(-dx, -dz)
                : this.giro;

            const diferencia = Math.atan2(
                Math.sin(destino - this.giro),
                Math.cos(destino - this.giro)
            );

            this.giro += diferencia * Math.min(1, dt * 14);

            this.paso += (
                (andando ? 0.55 : 0) - this.paso
            ) * Math.min(1, dt * 12);

            if (andando) {
                this.fase += recorrido * 5;
            }

            this.anterior = { x: player.x, z: player.z };
            this.posicion = { x: player.x, y: pies, z: player.z };

            // La cámara mira hacia el torso desde detrás del jugador.
            const yaw = player.yaw;

            const pitch = Math.max(
                -0.85,
                Math.min(0.12, player.pitch - 0.22)
            );

            const objetivo = {
                x: player.x,
                y: pies + this.altura * 0.68,
                z: player.z
            };

            const direccion = {
                x: Math.sin(yaw) * Math.cos(pitch),
                y: -Math.sin(pitch),
                z: Math.cos(yaw) * Math.cos(pitch)
            };

            let distancia = this.distancia;

            // Acercar la cámara si existe un obstáculo entre ella
            // y el personaje.
            for (let d = 0.30; d <= this.distancia; d += 0.15) {
                const bloqueada = this.bloqueado(
                    objetivo.x + direccion.x * d,
                    objetivo.y + direccion.y * d,
                    objetivo.z + direccion.z * d
                );

                if (bloqueada) {
                    distancia = Math.max(0.1, d - 0.3);
                    break;
                }
            }

            // En espacios estrechos, ocultar el cuerpo para evitar
            // mirar desde dentro de la cabeza.
            this.visible = distancia > 0.85;

            return {
                x: objetivo.x + direccion.x * distancia,
                y: objetivo.y + direccion.y * distancia,
                z: objetivo.z + direccion.z * distancia,
                yaw,
                pitch
            };
        }

        dibujar(program, loc) {
            if (!this.visible || !this.posicion) return;

            const gl = this.gl;
            const c = Math.cos(this.giro);
            const s = Math.sin(this.giro);

            let indice = 0;

            for (const pieza of this.piezas) {
                const angulo =
                    Math.sin(this.fase) * this.paso * pieza.movimiento;

                const ca = Math.cos(angulo);
                const sa = Math.sin(angulo);
                const v = pieza.vertices;

                // Aplicar animación, escala, giro y posición.
                for (let i = 0; i < v.length; i += 6) {
                    const x = v[i] * this.escala;
                    const dy = v[i + 1] - pieza.pivote;

                    const y = (
                        pieza.pivote + dy * ca - v[i + 2] * sa
                    ) * this.escala;

                    const z = (
                        dy * sa + v[i + 2] * ca
                    ) * this.escala;

                    this.datos[indice++] = this.posicion.x + c * x + s * z;
                    this.datos[indice++] = this.posicion.y + y;
                    this.datos[indice++] = this.posicion.z - s * x + c * z;

                    this.datos[indice++] = v[i + 3];
                    this.datos[indice++] = v[i + 4];
                    this.datos[indice++] = v[i + 5];
                }
            }

            // Usar el programa del escenario: misma cámara y niebla.
            gl.useProgram(program);
            gl.uniform3f(loc.offset, 0, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.datos);

            gl.enableVertexAttribArray(loc.position);
            gl.vertexAttribPointer(
                loc.position, 3, gl.FLOAT, false, 24, 0
            );

            gl.enableVertexAttribArray(loc.color);
            gl.vertexAttribPointer(
                loc.color, 3, gl.FLOAT, false, 24, 12
            );

            gl.drawArrays(
                gl.TRIANGLES,
                0,
                this.datos.length / 6
            );
        }

        destruir() {
            this.gl.deleteBuffer(this.buffer);
        }
    }

    window.PersonajeTerceraPersona = PersonajeTerceraPersona;
})();