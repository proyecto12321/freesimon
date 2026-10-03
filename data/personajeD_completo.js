// personajeD_completo.js — PERSONAJE, ARMAS, BOTIQUINES Y ESCUDOS
// Controles: Q guardar/sacar, F usar, H curar, G escudo, 1–5 armas.
// VidaJugador es la única autoridad de vida. No reaparece dentro del mapa.
// Módulo compartido para dibujar el personaje y usar tercera persona.
// Requiere cargar personaje.js antes de este archivo.

(() => {
    "use strict";

    class PersonajeTerceraPersona {
        constructor(gl, opciones = {}) {
            this.gl = gl;
            this.soloModelo = opciones.soloModelo ?? false;

            // Puedes cambiar la distancia al crear la instancia.
            this.distancia = opciones.distancia ?? 8;
            this.altura = opciones.altura ?? 1.85;

            // Cada escenario proporciona su comprobación de obstáculos.
            this.bloqueado = opciones.bloqueado ?? (() => false);

            // El inventario aporta el objeto y la pose; el personaje solo los dibuja.
            this.equipo = opciones.equipo ?? null;

            const catalogo = window.PersonajesKaku;

            if (!catalogo) {
                throw new Error(
                    "Carga personaje.js antes de personajeD.js."
                );
            }

            // Tu selector guarda el nombre. También admitimos un ID.
            const elegido = opciones.modeloId ||
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

            // Los modelos especiales nombran sus brazos por especie. Si no tienen
            // brazos, usar el ala del mismo lado, sin confundirla con un adorno.
            const buscarExtremidad = lado =>
                partes.find(p => /^brazo-/.test(p.nombre) && lado.test(p.nombre)) ||
                partes.find(p => /^ala-/.test(p.nombre) && lado.test(p.nombre));
            this.extremidades = {
                derecha: buscarExtremidad(/-derech[oa]$/),
                izquierda: buscarExtremidad(/-izquierd[oa]$/)
            };

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

                // Manos, garras y vendas comparten el pivote de su brazo para
                // acompañar la pose del arma y del botiquín sin quedar flotando.
                const lado = /-derech[oa]$/.test(p.nombre) ? 'derecha' : 'izquierda';
                const extremidad = this.extremidades[lado];
                const unidaAlBrazo = extremidad && (
                    p.nombre === extremidad.nombre ||
                    /^(mano|garra|venda-brazo)-/.test(p.nombre)
                );
                const parteAnimada = unidaAlBrazo ? extremidad : p;

                // Brazos y piernas se mueven en sentidos alternados.
                const signo = /izquierd/.test(p.nombre) ? 1 : -1;

                const movimiento = /^(brazo|pierna)-/.test(parteAnimada.nombre)
                    ? signo * (parteAnimada.nombre.startsWith("brazo") ? -1 : 1)
                    : 0;

                this.piezas.push({
                    nombre: p.nombre,
                    vertices,
                    pivote: unidaAlBrazo ? abajo - extremidad.y : y1,
                    ladoEquipo: unidaAlBrazo ? lado : null,
                    movimiento
                });
            };

            partes.forEach(agregarParte);

            // Anclar el equipo a la mano del modelo elegido, incluidas sus variantes.
            const brazo = this.extremidades.derecha;
            const mano = partes.find(p => /^(mano|garra)-(?:.*-)?derech[oa]$/.test(p.nombre));
            this.mano = brazo ? {
                x: mano?.x ?? brazo.x,
                y: mano ? abajo - mano.y - mano.h / 2 : abajo - brazo.y - brazo.h + Math.min(8, brazo.h / 2),
                pivote: abajo - brazo.y,
                z: -(mano?.z ?? brazo.z ?? 0)
            } : { x: 49, y: 70, pivote: 140, z: 0 };
            // El escudo tiene su propia geometría para no reconstruir el arma.
            const izquierdo = this.extremidades.izquierda;
            this.anclajeEscudo = izquierdo ? {
                x: izquierdo.x,
                y: abajo - izquierdo.y - izquierdo.h / 2,
                z: -(izquierdo.z ?? 0) - izquierdo.h / 2
            } : { x: -49, y: 110, z: -30 };
            this.bufferEscudo = gl.createBuffer();
            this.verticesEscudo = this.crearEquipo('Escudo');
            this.datosEscudo = new Float32Array(this.verticesEscudo.length);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferEscudo);
            gl.bufferData(gl.ARRAY_BUFFER, this.datosEscudo.byteLength, gl.DYNAMIC_DRAW);
            this.bufferEquipo = gl.createBuffer();
            this.objetoDibujado = null;
            this.verticesEquipo = [];
            this.datosEquipo = new Float32Array(0);

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

            // La orientación corporal responde al movimiento igual con o sin arma.
            const destino = andando ? Math.atan2(-dx, -dz) : this.giro;
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

            // Los NPC animan su cuerpo sin calcular una cámara por enemigo.
            if (this.soloModelo) return null;

            // La cámara mira hacia el torso desde detrás del jugador.
            const yaw = player.yaw;

            // Mismo límite en entrada y cámara, sin inclinación oculta acumulada.
            const pitch = Math.max(-0.85, Math.min(0.55, player.pitch));
            player.pitch = pitch;

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
            const estadoEquipo = this.equipo?.getState?.();

            let indice = 0;

            for (const pieza of this.piezas) {
                // Sostener el objeto y animar su uso sin alterar las piernas al caminar.
                let angulo = Math.sin(this.fase) * this.paso * pieza.movimiento;
                if (pieza.ladoEquipo === "derecha" && estadoEquipo?.objetoEnMano) {
                    angulo = this.anguloEquipo(estadoEquipo);
                } else if (pieza.ladoEquipo === "izquierda" && (estadoEquipo?.curando || estadoEquipo?.escudoActivo)) {
                    angulo = 1.05;
                }

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
            this.dibujarEquipo(loc, estadoEquipo);
            if (estadoEquipo?.escudoActivo) this.dibujarEscudo(loc);
        }

        // Punto de salida en la flecha del arco, transformado como el equipo.
        obtenerOrigenFlecha() {
            if (!this.posicion) return null;
            const estado=this.equipo?.getState?.() || {};
            const a=this.anguloEquipo(estado), ca=Math.cos(a), sa=Math.sin(a);
            const ajuste=-1.25, cy=Math.cos(ajuste), sy=Math.sin(ajuste);
            // Punta del modelo de flecha colocado sobre el arco.
            const ly=1*cy-(-68)*sy, lz=1*sy+(-68)*cy;
            const x=this.mano.x*this.escala;
            const dy=this.mano.y+ly-this.mano.pivote, dz=this.mano.z+lz;
            const y=(this.mano.pivote+dy*ca-dz*sa)*this.escala;
            const z=(dy*sa+dz*ca)*this.escala;
            const c=Math.cos(this.giro), s=Math.sin(this.giro);
            return {x:this.posicion.x+c*x+s*z,y:this.posicion.y+y,z:this.posicion.z-s*x+c*z};
        }

        // La mano y el objeto comparten el mismo pivote y ángulo del brazo.
        anguloEquipo(estado) {
            if (estado.curando) return 1.1 + Math.sin((estado.progresoCuracion ?? 0) * Math.PI * 4) * 0.08;
            const golpe = Math.sin((estado.progresoUso ?? 0) * Math.PI);
            if (["Espada", "Hacha"].includes(estado.objetoEnMano)) return 0.45 + golpe * 1.35;
            return 1.25 + golpe * 0.18;
        }

        // Modelos de bloques locales: no se descargan imágenes ni modelos externos.
        crearEquipo(nombre, ocultarFlecha = false) {
            const vertices = [];
            const bloque = (x, y, z, w, h, d, color) => {
                const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255);
                const x0 = x - w / 2, x1 = x + w / 2;
                const y0 = y - h / 2, y1 = y + h / 2;
                const z0 = z - d / 2, z1 = z + d / 2;
                const caras = [
                    [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],
                    [[x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1]],
                    [[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],
                    [[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1]],
                    [[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],
                    [[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0]]
                ];
                caras.forEach((cara, i) => {
                    const luz = [0.95, 0.7, 0.85, 0.75, 1, 0.6][i];
                    for (const j of [0,1,2,0,2,3]) vertices.push(...cara[j], ...rgb.map(c => c * luz));
                });
            };
            if (nombre === "Escudo") {
                // Escudo azul con borde metálico, visible en el brazo izquierdo.
                bloque(0, 0, 0, 57, 65, 9, "#c8d4df");
                bloque(0, 0, -6, 45, 53, 6, "#2876ab");
                bloque(0, -36, 0, 35, 12, 9, "#c8d4df");
                bloque(0, 0, -10, 8, 42, 4, "#f2ce67");
                bloque(0, 4, -10, 30, 8, 4, "#f2ce67");
            } else if (nombre === "Espada") {
                bloque(0, 0, 0, 10, 30, 10, "#79543a");
                bloque(0, 17, 0, 36, 7, 13, "#e2b64f");
                bloque(0, 58, 0, 15, 76, 7, "#c9e2e5");
                bloque(0, 100, 0, 8, 10, 7, "#edfaff");
            } else if (nombre === "Hacha") {
                bloque(0, 30, 0, 10, 100, 10, "#936039");
                bloque(16, 67, 0, 40, 35, 10, "#a6bdc5");
                bloque(36, 67, 0, 7, 43, 10, "#e2eef0");
            } else if (nombre === "Arco") {
                bloque(0, 0, 0, 10, 28, 9, "#9c673c");
                for (const lado of [-1, 1]) {
                    bloque(0, lado * 29, 5, 9, 30, 9, "#ad793f");
                    bloque(0, lado * 48, 16, 9, 16, 9, "#ad793f");
                    bloque(0, lado * 57, 25, 9, 9, 9, "#ad793f");
                }
                bloque(0, 0, 29, 2, 114, 2, "#f5e8b9");
                if (!ocultarFlecha) {
                    bloque(0, 1, -15, 3, 3, 100, "#e0bc7a");
                    bloque(0, 1, -68, 8, 6, 10, "#b8d4df");
                }
            } else if (nombre === "Pistola" || nombre === "Metralleta") {
                bloque(0, 0, 0, 13, 29, 14, "#483e35");
                bloque(0, 17, -15, 17, 17, nombre === "Pistola" ? 49 : 79, "#596b76");
                bloque(0, 20, nombre === "Pistola" ? -45 : -61, 10, 10, 16, "#263238");
                if (nombre === "Metralleta") {
                    bloque(0, 0, -24, 12, 29, 16, "#384b48");
                    bloque(0, 32, -10, 7, 12, 15, "#d6b86e");
                }
            } else if (nombre === "Botiquín") {
                bloque(0, 0, -7, 42, 32, 20, "#f0ece2");
                bloque(0, 20, -7, 23, 6, 8, "#d05e59");
                bloque(0, 1, -18, 7, 23, 2, "#d34242");
                bloque(0, 1, -18, 23, 7, 2, "#d34242");
                // La cruz trasera permite reconocer el botiquín desde la cámara del jugador.
                bloque(0, 1, 4, 7, 23, 2, "#d34242");
                bloque(0, 1, 4, 23, 7, 2, "#d34242");
            }
            // Compensar la inclinación del brazo para mantener arco y cañón orientados al frente.
            const ajuste = ['Arco', 'Pistola', 'Metralleta'].includes(nombre) ? -1.25 : nombre === 'Botiquín' ? -1.1 : 0;
            if (ajuste) {
                const c = Math.cos(ajuste), s = Math.sin(ajuste);
                for (let i = 0; i < vertices.length; i += 6) {
                    const y = vertices[i + 1], z = vertices[i + 2];
                    vertices[i + 1] = y * c - z * s;
                    vertices[i + 2] = y * s + z * c;
                }
            }
            return vertices;
        }

        // Reutilizar el buffer: solo cambiar la geometría cuando cambia el objeto.
        dibujarEquipo(loc, estado) {
            const nombre = estado?.objetoEnMano;
            if (!nombre) return;
            const gl = this.gl;
            const ocultarFlecha = nombre === 'Arco' && (estado.usandoArma || estado.progresoUso > 0);
            const clave = nombre + (ocultarFlecha ? ':disparando' : '');
            if (clave !== this.objetoDibujado) {
                this.objetoDibujado = clave;
                this.verticesEquipo = this.crearEquipo(nombre, ocultarFlecha);
                this.datosEquipo = new Float32Array(this.verticesEquipo.length);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferEquipo);
                gl.bufferData(gl.ARRAY_BUFFER, this.datosEquipo.byteLength, gl.DYNAMIC_DRAW);
            }
            const v = this.verticesEquipo, mano = this.mano;
            const a = this.anguloEquipo(estado), ca = Math.cos(a), sa = Math.sin(a);
            const c = Math.cos(this.giro), s = Math.sin(this.giro);
            for (let i = 0; i < v.length; i += 6) {
                const x = (mano.x + v[i]) * this.escala;
                const dy = mano.y + v[i + 1] - mano.pivote;
                const dz = mano.z + v[i + 2];
                const y = (mano.pivote + dy * ca - dz * sa) * this.escala;
                const z = (dy * sa + dz * ca) * this.escala;
                this.datosEquipo[i] = this.posicion.x + c * x + s * z;
                this.datosEquipo[i + 1] = this.posicion.y + y;
                this.datosEquipo[i + 2] = this.posicion.z - s * x + c * z;
                this.datosEquipo[i + 3] = v[i + 3];
                this.datosEquipo[i + 4] = v[i + 4];
                this.datosEquipo[i + 5] = v[i + 5];
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferEquipo);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.datosEquipo);
            gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 24, 0);
            gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, 24, 12);
            gl.drawArrays(gl.TRIANGLES, 0, this.datosEquipo.length / 6);
        }

        // Dibujar el escudo con la misma escala y orientación del personaje.
        dibujarEscudo(loc) {
            const gl = this.gl, v = this.verticesEscudo, mano = this.anclajeEscudo;
            const c = Math.cos(this.giro), s = Math.sin(this.giro);
            for (let i = 0; i < v.length; i += 6) {
                const x = (mano.x + v[i]) * this.escala;
                const y = (mano.y + v[i + 1]) * this.escala;
                const z = (mano.z + v[i + 2]) * this.escala;
                this.datosEscudo[i] = this.posicion.x + c*x + s*z;
                this.datosEscudo[i + 1] = this.posicion.y + y;
                this.datosEscudo[i + 2] = this.posicion.z - s*x + c*z;
                this.datosEscudo[i + 3] = v[i + 3];
                this.datosEscudo[i + 4] = v[i + 4];
                this.datosEscudo[i + 5] = v[i + 5];
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferEscudo);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.datosEscudo);
            gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 24, 0);
            gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, 24, 12);
            gl.drawArrays(gl.TRIANGLES, 0, this.datosEscudo.length / 6);
        }

        destruir() {
            this.gl.deleteBuffer(this.bufferEscudo);
            this.gl.deleteBuffer(this.buffer);
            this.gl.deleteBuffer(this.bufferEquipo);
        }
    }

    class VistaArmasJugador {
        constructor(inventario = []) {
            this.inventario = inventario;
            this.armasPermitidas = ['Espada', 'Hacha', 'Arco', 'Pistola', 'Metralleta'];
            this.arma = null;
            this.visible = false;
            this.uso = 0;
            this.duracionUso = 0;
        }

        recoger(nombre) {
            if (!this.armasPermitidas.includes(nombre)) return false;
            this.arma = nombre;
            this.visible = true;
            this.uso = 0;
            return true;
        }

        manejarTecla(evento) {
            if (evento.code === 'KeyQ') {
                if (this.arma) this.visible = !this.visible;
            } else if (evento.code === 'KeyF') {
                if (this.arma) {
                    this.visible = true;
                    this.duracionUso = ['Pistola', 'Metralleta'].includes(this.arma) ? 0.22 : 0.55;
                    this.uso = this.duracionUso;
                }
            } else if (/^Digit[1-5]$/.test(evento.code)) {
                const armas = [...new Set(this.inventario.filter(nombre => this.armasPermitidas.includes(nombre)))];
                const nombre = armas[Number(evento.code.slice(-1)) - 1];
                if (nombre) {
                    this.arma = nombre;
                    this.visible = true;
                    this.uso = 0;
                }
            } else {
                return false;
            }
            evento.preventDefault();
            return true;
        }

        actualizar(dt) {
            this.uso = Math.max(0, this.uso - Math.max(0, dt));
        }

        getState() {
            return {
                objetoEnMano: this.visible ? this.arma : null,
                progresoUso: this.uso > 0 ? 1 - this.uso / this.duracionUso : 0
            };
        }
    }

    // Inventario, vida y acciones compartidos por los seis mapas, sin duplicar reglas.
    class EquipoJugador {
        constructor({ inventario = [], avisar = () => {}, puedeUsar = () => false,
            puedeRecibirDano = puedeUsar } = {}) {
            if (window.VidaJugador?.versionEquipo !== 2) {
                throw new Error("Carga vida_jugador.js versión 2 antes de crear EquipoJugador.");
            }
            if (document.getElementById('equipmentHUD')) {
                throw new Error("Crea una sola instancia de EquipoJugador por escenario.");
            }
            this.inventario = inventario;
            this.avisar = avisar;
            this.puedeUsar = () => !window.VidaJugador.estaMuerto() && puedeUsar();
            this.puedeRecibirDano = puedeRecibirDano;
            this.arma = null;
            this.enMano = false;
            // Consultar los corazones compartidos; no mantener otra vida paralela.
            Object.defineProperty(this, 'vida', {
                get: () => window.VidaJugador.obtenerCorazones()
            });
            this.curacion = 0;
            this.uso = 0;
            this.duracionUso = 0;
            this.cajasRecogidas = new Set();
            this.escudoActivo = false;
            this.armasPermitidas = ['Espada', 'Hacha', 'Arco', 'Pistola', 'Metralleta'];

            // VidaJugador valida inmunidad y preguntas ANTES de consultar el escudo.
            window.VidaJugador.configurar({
                absorberGolpe: () => this.absorberGolpe()
            });

            // SVG locales: el nombre y su icono cambian juntos al equipar.
            this.iconos = {
                Arco: '<path d="M18 5Q48 32 18 59M18 5V59M12 32H52M44 24L52 32 44 40"/>',
                Hacha: '<path d="M25 59V9M25 11H47L53 29H25"/>',
                Espada: '<path d="M13 55L26 42M18 34L34 50M26 42L51 17 56 8 47 13 22 38"/>',
                Pistola: '<path d="M8 16H55V29H30L25 50H12L18 29H8ZM31 29V38H24"/>',
                Metralleta: '<path d="M5 18H48V32H29L25 51H13L18 32H5ZM48 22H60M29 32L38 48H46L40 32M26 18V10H38V18"/>',
                'Botiquín': '<rect x="8" y="18" width="48" height="36" rx="5"/><path d="M23 18V10H41V18M32 26V46M22 36H42"/>',
                Escudo: '<path d="M32 5L55 14V31Q54 49 32 59Q10 49 9 31V14ZM32 16V46M20 30H44"/>',
                vacio: '<circle cx="32" cy="32" r="22"/><path d="M17 47L47 17"/>'
            };

            // Panel de equipo independiente: no cambia la estructura del HTML.
            const estilo = document.createElement('style');
            estilo.textContent = `
              #equipmentHUD {position:fixed;top:228px;left:32px;right:auto;z-index:900;
                display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px;
                width:min(225px,calc(100vw - 64px));max-height:calc(100vh - 240px);
                overflow:auto;padding:6px;border-radius:9px;
                background:rgba(17,24,39,.9);color:#fff;font:9px Arial,sans-serif;}
              #equipmentHUD svg {width:18px;height:18px;fill:none;stroke:currentColor;
                stroke-width:3;flex-shrink:0;}
              #equipmentHUD .equipment-weapon {grid-column:1/-1;display:flex;
                align-items:center;gap:4px;margin:0;}
              #equipmentHUD .equipment-medkit {display:flex;align-items:center;
                justify-content:space-between;gap:3px;margin:0;min-width:0;}
              #equipmentHUD small,#equipmentHUD strong,#equipmentHUD span {display:block;}
              #equipmentHUD small {font-size:7px;}
              #equipmentHUD #weaponStatus,#equipmentHUD #shieldStatus {display:none;}
              #equipmentHUD .equipment-medkit > span {font-size:8px;}
              #equipmentHUD button {padding:2px 4px;margin:1px;border:1px solid #687890;
                border-radius:5px;background:#30435e;color:white;cursor:pointer;font-size:8px;}
              #equipmentHUD button:disabled {opacity:.45;cursor:default;}
              #equipmentHUD button[aria-pressed="true"] {background:#356a53;}
              #equipmentHUD progress,#weaponChoices {grid-column:1/-1;width:100%;}
              #equipmentHUD #weaponChoices {display:flex;flex-wrap:wrap;}
              #equipmentHUD #weaponChoices button {font-size:8px;}
              #equipmentHUD #useWeapon {grid-column:1/-1;justify-self:start;}
              @media(max-width:650px) {
                #equipmentHUD {top:208px;left:14px;width:min(210px,calc(100vw - 28px));
                  max-height:calc(100vh - 220px);}
              }
            `;
            document.head.appendChild(estilo);
            // Los cinco corazones siguen perteneciendo a vida_jugador.js.
            const panel = document.createElement('aside');
            panel.id = 'equipmentHUD';
            panel.setAttribute('aria-label', 'Equipo del jugador');
            panel.innerHTML = `
                <div class="equipment-weapon">
                    <svg id="weaponIcon" viewBox="0 0 64 64" aria-hidden="true"></svg>
                    <div><small>ARMA EQUIPADA</small><strong id="weaponName">Sin arma</strong><span id="weaponStatus">Busca un cofre rojo</span></div>
                    <button id="toggleWeapon" type="button" title="Sacar o guardar arma (Q)">Q</button>
                </div>
                <div id="weaponChoices" aria-label="Armas de la mochila"></div>
                <div class="equipment-medkit"><svg id="medkitIcon" viewBox="0 0 64 64" aria-hidden="true"></svg><span>Botiquines <strong id="medkitCount">0</strong></span><button id="healButton" type="button" title="Usar botiquín (H)">H · Curar</button></div>
                <div class="equipment-medkit"><svg id="shieldIcon" viewBox="0 0 64 64" aria-hidden="true"></svg><span>Escudos <strong id="shieldCount">0</strong><span id="shieldStatus" role="status">Sin protección</span></span><button id="shieldButton" type="button" title="Activar escudo (G)">G · Escudo</button></div>
                <progress id="healingProgress" max="1" value="0" aria-label="Progreso de curación" hidden></progress>
                <button id="useWeapon" type="button">Clic / F · Usar arma</button>`;
            document.body.appendChild(panel);
            this.ui = Object.fromEntries([...panel.querySelectorAll('[id]')].map(el => [el.id, el]));
            this.ui.medkitIcon.innerHTML = this.iconos['Botiquín'];
            this.ui.shieldIcon.innerHTML = this.iconos.Escudo;
            this.ui.shieldButton.onclick = () => this.activarEscudo();
            this.ui.toggleWeapon.onclick = () => this.alternarArma();
            this.ui.useWeapon.onclick = () => this.usarArma();
            this.ui.healButton.onclick = () => this.curar();
            this.actualizarHUD();
        }

        emitir(nombre, detail) {
            window.dispatchEvent(new CustomEvent(nombre, { detail }));
        }

        getState() {
            return {
                armaEquipada: this.arma,
                armaEnMano: this.enMano,
                armas: [...new Set(this.inventario.filter(nombre => this.armasPermitidas.includes(nombre)))],
                botiquines: this.inventario.filter(nombre => nombre === 'Botiquín').length,
                escudos: this.inventario.filter(nombre => nombre === 'Escudo').length,
                escudoActivo: this.escudoActivo,
                vida: this.vida,
                curando: this.curacion > 0,
                usandoArma: this.uso > 0,
                objetoEnMano: this.curacion > 0 ? 'Botiquín' : (this.enMano ? this.arma : null),
                progresoCuracion: this.curacion > 0 ? 1 - this.curacion / 1.4 : 0,
                progresoUso: this.uso > 0 ? 1 - this.uso / this.duracionUso : 0
            };
        }

        // Una caja entrega sus objetos una vez, incluso si se pulsa E varias veces seguidas.
        recoger(caja) {
            if (!this.puedeUsar() || !caja || caja.opened || this.cajasRecogidas.has(caja.id ?? caja)) return false;
            if (!Object.hasOwn(this.iconos, caja.objeto) || caja.objeto === 'vacio') {
                this.avisar('Este cofre todavía no tiene un objeto válido.');
                return false;
            }
            caja.opened = true;
            this.cajasRecogidas.add(caja.id ?? caja);
            this.inventario.push(caja.objeto);
            const botiquines = Number.isInteger(caja.botiquines) && caja.botiquines > 0 ? caja.botiquines : 0;
            for (let i = 0; i < botiquines; i++) this.inventario.push('Botiquín');
            const escudos = Number.isInteger(caja.escudos) && caja.escudos > 0 ? caja.escudos : 0;
            for (let i = 0; i < escudos; i++) this.inventario.push('Escudo');
            if (this.armasPermitidas.includes(caja.objeto)) {
                this.arma = caja.objeto;
                this.enMano = true;
            }
            this.actualizarHUD();
            this.avisar('Recogiste: ' + caja.objeto + (botiquines ? ' + ' + botiquines + ' botiquín' : '') + (escudos ? ' + ' + escudos + ' escudo(s)' : '') + ' · H curar · G escudo');
            // Conservar id y objeto del evento existente para otras integraciones.
            this.emitir('escenario:equipo', { id: caja.id, objeto: caja.objeto, botiquines, escudos });
            return true;
        }

        equipar(nombre) {
            if (!this.puedeUsar() || this.curacion || !this.inventario.includes(nombre) || !this.armasPermitidas.includes(nombre)) return;
            this.arma = nombre;
            this.enMano = true;
            this.uso = 0;
            this.actualizarHUD();
        }

        alternarArma() {
            if (!this.puedeUsar() || this.curacion || !this.arma) return;
            this.enMano = !this.enMano;
            this.uso = 0;
            this.actualizarHUD();
        }

        // El uso anima el arma y emite una acción; no inventa enemigos ni daño remoto.
        usarArma() {
            if (!this.puedeUsar() || this.curacion || this.uso || this.vida <= 0) return;
            if (!this.arma) { this.avisar('Primero recoge un arma de un cofre rojo.'); return; }
            this.enMano = true;
            this.duracionUso = ['Pistola', 'Metralleta'].includes(this.arma) ? 0.22 : 0.55;
            this.uso = this.duracionUso;
            this.actualizarHUD();
            this.emitir('escenario:uso-arma', { arma: this.arma });
        }

        // Activar consume un escudo de la mochila. Protege contra un golpe
        // desde cualquier dirección, sin caducar ni acumular varias capas.
        activarEscudo() {
            if (!this.puedeUsar() || this.curacion || this.escudoActivo) return;
            const indice = this.inventario.indexOf('Escudo');
            if (indice < 0) { this.avisar('No tienes escudos. Busca un cofre rojo.'); return; }
            this.inventario.splice(indice, 1);
            this.escudoActivo = true;
            this.actualizarHUD();
            this.avisar('Escudo activo: absorberá el próximo golpe.');
            this.emitir('escenario:escudo', { activo: true });
        }

        // Solo VidaJugador debe llamar esto, después de validar el golpe.
        // Un ataque rechazado por inmunidad NO gasta el escudo.
        absorberGolpe() {
            this.cancelarUso();
            if (!this.escudoActivo) return false;
            this.escudoActivo = false;
            this.actualizarHUD();
            this.avisar('Tu escudo absorbió el golpe y se rompió.');
            this.emitir('escenario:escudo', { activo: false, roto: true });
            return true;
        }

        // Curar tarda 1.4 s y recupera un corazón mediante VidaJugador.
        curar() {
            if (!this.puedeUsar() || this.curacion || this.vida <= 0) return;
            if (this.vida >= 5) { this.avisar('Tu vida ya está completa.'); return; }
            if (typeof window.VidaJugador.recuperarCorazones !== 'function') {
                this.avisar('Falta agregar recuperarCorazones a vida_jugador.js.');
                return;
            }
            if (!this.inventario.includes('Botiquín')) { this.avisar('No tienes botiquines. Busca un cofre rojo.'); return; }
            this.uso = 0;
            this.curacion = 1.4;
            this.actualizarHUD();
            this.avisar('Usando botiquín…');
        }

        actualizar(dt) {
            const permitido = this.puedeUsar();
            let cambiarHUD = permitido !== this.controlesActivos;
            this.controlesActivos = permitido;
            if (!permitido && (this.curacion > 0 || this.uso > 0)) {
                // Pausa, pregunta o derrota cancelan el uso sin consumir objetos.
                this.curacion = 0;
                this.uso = 0;
                cambiarHUD = true;
            }
            if (permitido) {
                dt = Math.max(0, Math.min(0.05, dt));
                if (this.uso > 0) {
                    this.uso = Math.max(0, this.uso - dt);
                    if (!this.uso) cambiarHUD = true;
                }
                if (this.curacion > 0) {
                    this.curacion = Math.max(0, this.curacion - dt);
                    this.ui.healingProgress.value = 1 - this.curacion / 1.4;
                    if (!this.curacion) {
                        const indice = this.inventario.indexOf('Botiquín');
                        if (indice >= 0) {
                            const anterior = this.vida;
                            const recuperado = window.VidaJugador.recuperarCorazones(1);
                            // No gastar el botiquín si no se recuperó vida.
                            if (recuperado > 0) {
                                this.inventario.splice(indice, 1);
                                this.avisar('Recuperaste un corazón.');
                                this.emitir('escenario:curacion', { recuperado, vida: this.vida });
                                this.emitir('escenario:vida', { anterior, vida: this.vida });
                            }
                        }
                        cambiarHUD = true;
                    }
                }
            }
            if (cambiarHUD) this.actualizarHUD();
        }

        // Pausar, responder o recibir daño interrumpe el uso sin gastar el botiquín.
        cancelarUso() {
            this.curacion = 0;
            this.uso = 0;
            this.actualizarHUD();
        }

        // Compatibilidad con los ataques del compañero.
        // Cualquier cantidad positiva representa UN golpe = UN corazón.
        // Protección y derrota se resuelven exclusivamente en VidaJugador.
        recibirDano(cantidad = 1) {
            if (!this.puedeRecibirDano() || !Number.isFinite(cantidad) || cantidad <= 0) {
                return this.vida;
            }
            const anterior = this.vida;
            if (window.VidaJugador.recibirGolpe()) {
                this.cancelarUso();
                this.emitir('escenario:vida', { anterior, vida: this.vida });
            }
            return this.vida;
        }

        // Cada mapa conserva sus controles; solo delega estas teclas de equipo.
        manejarTecla(evento) {
            if (!['KeyQ', 'KeyF', 'KeyH', 'KeyG', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(evento.code)) return false;
            evento.preventDefault();
            if (evento.repeat) return true;
            if (evento.code === 'KeyQ') this.alternarArma();
            else if (evento.code === 'KeyF') this.usarArma();
            else if (evento.code === 'KeyH') this.curar();
            else if (evento.code === 'KeyG') this.activarEscudo();
            else {
                const nombre = this.getState().armas[Number(evento.code.slice(-1)) - 1];
                if (nombre) this.equipar(nombre);
            }
            return true;
        }

        actualizarHUD() {
            const estado = this.getState(), ui = this.ui;
            const disponible = this.puedeUsar() && this.vida > 0;
            ui.weaponName.textContent = this.arma || 'Sin arma';
            ui.weaponIcon.innerHTML = this.iconos[this.arma || 'vacio'];
            ui.weaponStatus.textContent = estado.curando ? 'Usando botiquín…' : this.arma ? (this.enMano ? 'En las manos · Q para guardar' : 'Guardada · Q para sacar') : 'Busca un cofre rojo';
            ui.medkitCount.textContent = estado.botiquines;
            ui.shieldCount.textContent = estado.escudos;
            ui.shieldStatus.textContent = estado.escudoActivo ? 'Activo · 1 golpe' : 'Sin protección';
            ui.shieldButton.disabled = !disponible || !estado.escudos || estado.escudoActivo || estado.curando;
            ui.healingProgress.hidden = !estado.curando;
            ui.healingProgress.value = estado.progresoCuracion;
            ui.toggleWeapon.disabled = !disponible || !this.arma || estado.curando;
            ui.useWeapon.disabled = !disponible || !this.arma || estado.curando || estado.usandoArma;
            ui.healButton.disabled = !disponible || !estado.botiquines || this.vida >= 5 || estado.curando;
            ui.weaponChoices.replaceChildren();
            estado.armas.forEach((nombre, indice) => {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.textContent = (indice + 1) + ' · ' + nombre;
                boton.setAttribute('aria-pressed', String(nombre === this.arma));
                boton.disabled = !disponible || estado.curando;
                boton.onclick = () => this.equipar(nombre);
                ui.weaponChoices.appendChild(boton);
            });
            const mochila = document.getElementById('inventory');
            const resumen = [...estado.armas];
            if (estado.botiquines) resumen.push('Botiquín × ' + estado.botiquines);
            if (estado.escudos) resumen.push('Escudo × ' + estado.escudos);
            if (mochila) mochila.textContent = resumen.join(' · ') || 'Vacía';
        }
    }

    window.EquipoJugador = EquipoJugador;
    window.VistaArmasJugador = VistaArmasJugador;
    window.PersonajeTerceraPersona = PersonajeTerceraPersona;
})();
