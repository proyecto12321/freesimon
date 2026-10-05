/* Escenario independiente · WebGL 1 · sin dependencias ni peticiones de red.
   API de integración al final. El servidor futuro debe validar toda acción. */
(() => {
   'use strict';
   const $ = id => document.getElementById(id), canvas = $('mundo'), config = window.CIELO_CONFIG;
   const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
   function fail(message) { $('error').hidden = false; $('error').textContent = message; $('play').disabled = true; }
   if (!gl) { fail('No se pudo iniciar WebGL. Prueba con la aceleración gráfica del navegador activada y un controlador compatible.'); return; }
   if (!config) { fail('Falta cielo.config.js. Mantén todos los archivos juntos.'); return; }
   function cargarPreguntasDocente() {
      const preguntasGuardadas = sessionStorage.getItem('juegoPreguntas');
      if (!preguntasGuardadas) {
         throw new Error('No hay preguntas del docente cargadas. Vuelve al panel de configuración y carga el juego.');
      }

      let preguntas;
      try {
         preguntas = JSON.parse(preguntasGuardadas);
      } catch {
         throw new Error('No se pudieron leer las preguntas cargadas. Vuelve al panel de configuración y carga el juego.');
      }

      if (!Array.isArray(preguntas) || preguntas.length === 0) {
         throw new Error('El docente todavía no ha cargado preguntas para esta partida.');
      }

      return preguntas.map((pregunta, indice) => {
         const numeroPregunta = indice + 1;
         const alternativas = pregunta?.alternativas;
         const respuestaValida = Number.isInteger(pregunta?.correcta)
            && pregunta.correcta >= 0
            && pregunta.correcta < 4;

         if (typeof pregunta?.texto !== 'string' || !pregunta.texto.trim()) {
            throw new Error(`La pregunta ${numeroPregunta} no tiene un enunciado válido.`);
         }
         if (!Array.isArray(alternativas) || alternativas.length !== 4
            || alternativas.some((alternativa) => typeof alternativa !== 'string' || !alternativa.trim())) {
            throw new Error(`La pregunta ${numeroPregunta} debe tener cuatro alternativas válidas.`);
         }
         if (!respuestaValida) {
            throw new Error(`La pregunta ${numeroPregunta} no tiene una alternativa correcta válida.`);
         }

         return {
            texto: pregunta.texto.trim(),
            opciones: alternativas.map((alternativa) => alternativa.trim()),
            correcta: pregunta.correcta
         };
      });
   }

   try {
      config.preguntas = cargarPreguntasDocente();
   } catch (error) {
      fail(error.message);
      return;
   }
   const presets = { low: { distance: 170, scale: .65 }, medium: { distance: 210, scale: .85 }, high: { distance: 260, scale: 1 } };
   let quality = presets.low, qualityName = 'low', seed = config.semilla >>> 0;
   let worldTime = 0;
   const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
   const half = config.tamano / 2, chunkSize = 32, chunks = new Map(), obstacles = [], boxes = [], surfaces = [], waterData = [];
   const player = {
      x: config.inicio.x,
      z: config.inicio.z,
      y: 0,
      yaw: 0,
      pitch: 0,
      feet: 24,
      grounded: true,
      vy: 0,
      protected: false
   };
   let active = false, points = 0, inventory = [], keys = new Set(), nearest = null, questionBox = null, deadline = 0, solved = false, returnAt = 0;

   VidaJugador.configurar({
      puedeRecibirGolpe: () => active && !player.protected,
      alMorir: () => {
         active = false;
         keys.clear();
         player.vy = 0;
         release();
         $('hint').hidden = true;
         $('overlay').hidden = true;
      }
   });

   let previous = 0, fpsStart = 0, frames = 0, lastUI = 0, toastTimer, drag = false;
   let checkpoint = { x: config.inicio.x, z: config.inicio.z, y: 24 }, falls = 0, currentIsland = 'inicio';
   function surfaceAt(x, z) {
      let best = null;
      for (const p of surfaces) {
         let y;
         if (p.type === 'bridge') {
            const dx = x - p.ax, dz = z - p.az, t = (dx * p.ux + dz * p.uz) / p.length, side = Math.abs(dx * (-p.uz) + dz * p.ux);
            if (t < 0 || t > 1 || side > p.width / 2) continue; y = p.ay + (p.by - p.ay) * t - Math.sin(t * Math.PI) * .55;
         } else { if (Math.abs(x - p.x) > p.w / 2 || Math.abs(z - p.z) > p.d / 2) continue; y = p.y; }
         if (!best || y > best.y) best = { y, island: p.island || null };
      }
      return best;
   }
   function ground(x, z) { return surfaceAt(x, z)?.y ?? -100; }
   function shader(type, source) { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
   // Precisión explícita e idéntica en toda variable compartida entre shaders.
   function makeProgram(vs, fs) { const p = gl.createProgram(); gl.attachShader(p, shader(gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
   let program, skyProgram, waterProgram;
   try {
      const worldVS = `
 attribute vec3 position; attribute vec3 color;
 uniform vec3 camera; uniform vec3 offset; uniform vec2 turn; uniform float aspect; uniform mediump float distanceMax;
 varying mediump vec3 vColor; varying mediump float depth; varying mediump vec3 vWorld;
 void main(){
 vec3 p=position+offset-camera;
 float c=cos(turn.x),s=sin(turn.x);
 vec3 q=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);
 c=cos(turn.y);s=sin(turn.y);
 q=vec3(q.x,c*q.y+s*q.z,-s*q.y+c*q.z);
 float d=-q.z; float n=0.08; float f=distanceMax+40.0;
 gl_Position=vec4(q.x*1.3/aspect,q.y*1.3,(f+n)/(f-n)*d-2.0*f*n/(f-n),d);
 vColor=color;depth=length(p);vWorld=position+offset;
 }`;
      program = makeProgram(worldVS, `
 precision mediump float; varying mediump vec3 vColor; varying mediump float depth;
 uniform mediump float distanceMax;
 void main(){float fog=smoothstep(distanceMax*0.40,distanceMax,depth);gl_FragColor=vec4(mix(vColor,vec3(0.77,0.88,0.96),fog),1.0);}`);
      waterProgram = makeProgram(worldVS, `
 precision mediump float; varying mediump vec3 vColor; varying mediump float depth; varying mediump vec3 vWorld;
 uniform mediump float distanceMax; uniform float time;
 void main(){
 float flow=0.5+0.5*sin(vWorld.y*3.4+vWorld.x*1.5+vWorld.z*0.7+time*5.0);
 float thin=pow(flow,9.0)*0.32;
 vec3 water=mix(vColor,vec3(0.84,0.97,1.0),thin);
 float fog=smoothstep(distanceMax*0.4,distanceMax,depth);
 gl_FragColor=vec4(mix(water,vec3(0.77,0.88,0.96),fog),1.0);
 }`);
      const screenVS = `attribute vec2 position; varying mediump vec2 uv; void main(){uv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}`;
      skyProgram = makeProgram(screenVS, `
 precision mediump float; varying mediump vec2 uv;
 uniform vec2 turn; uniform float aspect;
 void main(){
 vec2 p=uv*2.0-1.0;vec3 q=normalize(vec3(p.x*aspect/1.3,p.y/1.3,-1.0));
 float c=cos(turn.y),s=sin(turn.y);q=vec3(q.x,c*q.y-s*q.z,s*q.y+c*q.z);
 c=cos(turn.x);s=sin(turn.x);vec3 ray=vec3(c*q.x-s*q.z,q.y,s*q.x+c*q.z);
 float elevation=max(0.0,ray.y);
 vec3 sky=mix(vec3(0.77,0.88,0.96),vec3(0.24,0.59,0.86),smoothstep(0.0,0.8,elevation));
 vec2 sunLocal=vec2(ray.x,ray.y)/max(0.01,-ray.z)-vec2(-0.646,0.8);
 float square=max(abs(sunLocal.x),abs(sunLocal.y));
 float halo=(1.0-smoothstep(0.06,0.28,length(sunLocal)))*step(0.0,-ray.z);
 sky+=vec3(0.10,0.06,0.01)*halo;
 if(ray.z<0.0&&square<0.065)sky=vec3(1.0,0.95,0.70);
 sky=mix(sky,vec3(0.85,0.93,0.98),(1.0-smoothstep(-0.7,-0.05,ray.y)));
 gl_FragColor=vec4(sky,1.0);}`);
   } catch (error) { fail('No se pudo preparar el escenario: ' + error.message); return; }
   gl.useProgram(program); gl.enable(gl.DEPTH_TEST); gl.clearColor(.79, .83, .77, 1);
   const loc = {};['position', 'color'].forEach(k => loc[k] = gl.getAttribLocation(program, k));
   ['camera', 'offset', 'turn', 'aspect', 'distanceMax'].forEach(k => loc[k] = gl.getUniformLocation(program, k));
   const skyLoc = {}, waterLoc = {};
   for (const [p, l, names] of [[skyProgram, skyLoc, ['turn', 'aspect']], [waterProgram, waterLoc, ['camera', 'offset', 'turn', 'aspect', 'distanceMax', 'time']]]) { l.position = gl.getAttribLocation(p, 'position'); if (p === waterProgram) l.color = gl.getAttribLocation(p, 'color'); for (const n of names) l[n] = gl.getUniformLocation(p, n); }
   const screenBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
   function screenPass(p, l) { gl.useProgram(p); gl.disableVertexAttribArray(loc.position); gl.disableVertexAttribArray(loc.color); gl.bindBuffer(gl.ARRAY_BUFFER, screenBuffer); gl.enableVertexAttribArray(l.position); gl.vertexAttribPointer(l.position, 2, gl.FLOAT, false, 0, 0); }
   function dataAt(x, z) { const key = Math.floor((x + half) / chunkSize) + ',' + Math.floor((z + half) / chunkSize); if (!chunks.has(key)) chunks.set(key, { x: Math.floor((x + half) / chunkSize) * chunkSize - half + 16, z: Math.floor((z + half) / chunkSize) * chunkSize - half + 16, data: [], details: [] }); return chunks.get(key).data; }
   function detailAt(x, z) { dataAt(x, z); return chunks.get(Math.floor((x + half) / chunkSize) + ',' + Math.floor((z + half) / chunkSize)).details; }
   function quad(arr, a, b, c, d, col, light = 1) { for (const v of [a, b, c, a, c, d]) arr.push(...v, col[0] * light, col[1] * light, col[2] * light); }
   function cube(arr, x, y, z, w, h, d, col) {
      const a = x - w / 2, b = x + w / 2, c = z - d / 2, e = z + d / 2, t = y + h;
      quad(arr, [a, t, c], [b, t, c], [b, t, e], [a, t, e], col, 1);
      quad(arr, [a, y, e], [b, y, e], [b, t, e], [a, t, e], col, .78);
      quad(arr, [b, y, c], [a, y, c], [a, t, c], [b, t, c], col, .64);
      quad(arr, [a, y, c], [a, y, e], [a, t, e], [a, t, c], col, .72);
      quad(arr, [b, y, e], [b, y, c], [b, t, c], [b, t, e], col, .88);
   }
   const grass = [.40, .66, .20], stone = [.66, .72, .72], cream = [.86, .86, .76], wood = [.55, .36, .19], gold = [.89, .69, .30];
   function blockSurface(x, z, y, w, d, island) { surfaces.push({ x, z, y, w, d, island }); }
   function solid(x, z, y, r, h) { obstacles.push({ x, z, y, r, h }); }
   // Islas de contorno escalonado: césped arriba, tierra y roca afilada debajo.
   for (const island of config.islas) {
      for (let ix = -island.rx; ix < island.rx; ix += 2)for (let iz = -island.rz; iz < island.rz; iz += 2) {
         const u = (ix + 1) / island.rx, v = (iz + 1) / island.rz, rad = Math.hypot(u, v);
         if (rad > 1 - .025 * Math.sin(ix * 1.4 + iz)) continue;
         const x = island.x + ix + 1, z = island.z + iz + 1, y = island.y, a = dataAt(x, z), detail = detailAt(x, z), depth = 3 + (1 - rad) * 18 + random() * 2.6;
         const c = .87 + random() * .20;
         cube(a, x, y - depth, z, 1.99, depth - 1.8, 1.99, stone.map(t => t * c));
         cube(a, x, y - 1.8, z, 2, 1.35, 2, [.43 * c, .35 * c, .24 * c]);
         cube(a, x, y - .45, z, 2, .45, 2, grass.map(t => t * c));
         // Cara inferior cerrada para ver las puntas al mirar desde abajo.
         quad(a, [x - 1, y - depth, z - 1], [x + 1, y - depth, z - 1], [x + 1, y - depth, z + 1], [x - 1, y - depth, z + 1], [.43, .49, .52]);
         blockSurface(x, z, y, 2, 2, island.id);
         if (rad > .77 && random() > .60) {
            const length = 1.5 + random() * 5;
            const vx = x + u * 1.01, vz = z + v * 1.01;
            cube(detail, vx, y - length, vz, .15, length, .15, [.24, .48, .18]);
            for (let l = 0; l < length; l += .65)cube(detail, vx + .09 * Math.sin(l * 5), y - l - .2, vz, .4, .20, .3, [.33, .59, .20]);
         }
         if (rad < .90 && random() > .62 && Math.abs(x - island.x) > 3 && config.cajas.every(b => Math.hypot(b.x - x, b.z - z) > 2)) {
            const fx = x + (random() - .5), fz = z + (random() - .5);
            cube(detail, fx, y, fz, .06, .34, .06, [.27, .50, .19]);
            const col = random() > .5 ? [.99, .94, .68] : [.85, .56, .66];
            cube(detail, fx, y + .30, fz, .28, .07, .10, col); cube(detail, fx, y + .30, fz, .10, .07, .28, col); cube(detail, fx, y + .38, fz, .07, .035, .07, [1, .74, .23]);
         }
      }
   }
   // Plataformas de salto: el soporte físico corresponde a su superficie visible.
   for (const p of config.saltos) {
      const a = dataAt(p.x, p.z);
      cube(a, p.x, p.y - 2, p.z, p.w * .6, 1.5, p.d * .6, [.59, .67, .70]); cube(a, p.x, p.y - .5, p.z, p.w, .25, p.d, [.48, .37, .23]); cube(a, p.x, p.y - .25, p.z, p.w, .25, p.d, grass);
      blockSurface(p.x, p.z, p.y, p.w, p.d, null);
   }
   function orientedCube(a, x, y, z, w, h, d, col, ux, uz) {
      const temp = []; cube(temp, 0, 0, 0, w, h, d, col);
      for (let i = 0; i < temp.length; i += 6) { const lx = temp[i], lz = temp[i + 2]; a.push(x - lx * uz + lz * ux, y + temp[i + 1], z + lx * ux + lz * uz, temp[i + 3], temp[i + 4], temp[i + 5]); }
   }
   function beam(a, p, q, width, col) {
      const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], len = Math.hypot(dx, dy, dz) || 1, flat = Math.hypot(dx, dz) || 1;
      const u = [-dz / flat * width / 2, 0, dx / flat * width / 2], v = [-dx * dy / (flat * len) * width / 2, flat / len * width / 2, -dz * dy / (flat * len) * width / 2];
      const verts = []; for (const c of [p, q]) for (const [s, t] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) verts.push(c.map((x, i) => x + s * u[i] + t * v[i]));
      for (const f of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) quad(a, ...f.map(i => verts[i]), col, .85);
   }
   function lantern(x, z, y) {
      const a = dataAt(x, z); cube(a, x, y, z, .24, 2.6, .24, wood); cube(a, x + .3, y + 2.35, z, .85, .18, .18, wood);
      cube(a, x + .58, y + 1.72, z, .5, .12, .5, [.28, .27, .20]); cube(a, x + .58, y + 1.84, z, .35, .53, .35, [1, .80, .37]); cube(a, x + .58, y + 2.34, z, .5, .11, .5, [.36, .31, .19]);
      for (const dx of [-.2, .2]) for (const dz of [-.2, .2]) cube(a, x + .58 + dx, y + 1.84, z + dz, .06, .53, .06, wood);
      solid(x, z, y, .25, 2.6);
   }
   // Ajustar cada extremo a la orilla real para evitar escalones altos al entrar.
   for (const bridge of config.puentes) {
      const original = { ...bridge }, dx = original.bx - original.ax, dz = original.bz - original.az;
      const startIsland = surfaceAt(original.ax, original.az)?.island, endIsland = surfaceAt(original.bx, original.bz)?.island;
      let ta = 0, tb = 1;
      for (let j = 0; j <= 512; j++) { const t = j / 512; if (surfaceAt(original.ax + dx * t, original.az + dz * t)?.island === startIsland) ta = t; else break; }
      for (let j = 512; j >= 0; j--) { const t = j / 512; if (surfaceAt(original.ax + dx * t, original.az + dz * t)?.island === endIsland) tb = t; else break; }
      ta = Math.max(0, ta - .008); tb = Math.min(1, tb + .008);
      if (tb > ta) { bridge.ax = original.ax + dx * ta; bridge.az = original.az + dz * ta; bridge.bx = original.ax + dx * tb; bridge.bz = original.az + dz * tb; }
   }
   for (const bridge of config.puentes) {
      const dx = bridge.bx - bridge.ax, dz = bridge.bz - bridge.az, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, n = Math.ceil(len / .55);
      const p = { ...bridge, type: 'bridge', length: len, ux, uz, width: bridge.ancho }; surfaces.push(p);
      for (let j = 0; j < n; j++) {
         const t = (j + .5) / n, x = bridge.ax + dx * t, z = bridge.az + dz * t, y = bridge.ay + (bridge.by - bridge.ay) * t - Math.sin(t * Math.PI) * .55, a = dataAt(x, z);
         orientedCube(a, x, y - .16, z, bridge.ancho, .16, len / n - .028, [.66 + (j % 3) * .018, .46, .26], ux, uz);
      }
      const segments = Math.ceil(len / 2);
      for (let j = 0; j < segments; j++)for (const side of [-1, 1]) {
         const t = j / segments, nt = (j + 1) / segments;
         const pos = t => [bridge.ax + dx * t - uz * side * (bridge.ancho / 2 + .06), bridge.ay + (bridge.by - bridge.ay) * t - Math.sin(t * Math.PI) * .55, bridge.az + dz * t + ux * side * (bridge.ancho / 2 + .06)];
         const p1 = pos(t), p2 = pos(nt), a = dataAt(p1[0], p1[2]);
         cube(a, p1[0], p1[1], p1[2], .16, 1.12, .16, wood); beam(a, [p1[0], p1[1] + 1.05, p1[2]], [p2[0], p2[1] + 1.05, p2[2]], .085, [.76, .64, .42]);
         beam(a, [p1[0], p1[1] + .48, p1[2]], [p2[0], p2[1] + .48, p2[2]], .065, [.64, .50, .30]);
      }
   }
   function tree(x, z, h) {
      const y = ground(x, z); if (y < -50) return; const a = dataAt(x, z);
      cube(a, x, y, z, .8, h, .8, [.41, .28, .17]); cube(a, x + .6, y + h * .6, z, 1.5, .35, .4, [.44, .29, .18]);
      cube(a, x, y + h - 1, z, 4.6, 2.0, 4, [.29, .52, .17]); cube(a, x - .5, y + h + .9, z - .2, 3.5, 1.4, 3.2, [.37, .62, .20]);
      cube(a, x + 1.5, y + h - .3, z + .6, 2.1, 1.4, 2.6, [.40, .64, .22]); solid(x, z, y, .62, h);
      const detail = detailAt(x, z); for (let j = 0; j < 6; j++) { const dx = (random() - .5) * 4, dz = (random() - .5) * 3.4; cube(detail, x + dx, y + h + random() * 1.5, z + dz, .65, .38, .7, [.48, .68, .25]); }
   }
   for (const [x, z, h] of [[-8, 35, 4.8], [8, 38, 5], [7, 28, 3.7], [-7, 4, 4.8], [7, 4, 4.1], [-6, -6, 4.5], [-41, -7, 5], [-32, -20, 4.6], [44, -9, 4.4], [37, -16, 4.1], [-37, 34, 3.8], [54, -59, 4.5], [-5, -55, 5.8], [25, -64, 6.4], [-2, -66, 5.2], [22, -43, 4.7]]) tree(x, z, h);
   for (const [x, z] of [[-4, 39], [4, 25], [-3, 9], [3, -9], [8, -39], [-28, -12], [31, -9], [-29, 34], [45, -53]]) lantern(x, z, ground(x, z));
   function column(x, z, y, h) {
      const a = dataAt(x, z); cube(a, x, y, z, 1.7, .3, 1.7, cream);
      for (let j = 0; j < h; j += .7)cube(a, x, y + .3 + j, z, 1.05, .67, 1.05, [.81 + (j % 1.4) * .04, .84, .80]);
      cube(a, x, y + h + .3, z, 1.65, .35, 1.65, cream); solid(x, z, y, .8, h + .65);
   }
   // Templo elevado, con escalinata accesible y sala abierta entre columnas.
   const temple = { x: 10, z: -60, y: 34 }, aTemple = dataAt(10, -60);
   cube(aTemple, 10, 34, -60, 17, .9, 14, [.77, .80, .75]); blockSurface(10, -60, 34.9, 17, 14, 'templo');
   for (let j = 0; j < 3; j++) { const z = -50.4 - j * 1.05, y = 34 + (j + 1) * .30; cube(dataAt(10, z), 10, 34, z, 6, y - 34, 1.12, [.87, .86, .75]); blockSurface(10, z, y, 6, 1.12, 'templo'); }
   for (const x of [4, 16]) for (const z of [-54, -60, -66]) column(x, z, 34.9, 9.1);
   for (const z of [-54, -60, -66]) cube(aTemple, 10, 44.3, z, 14.5, .7, 1.8, cream);
   cube(aTemple, 10, 45.0, -60, 15.4, .5, 15.6, [.83, .86, .79]);
   for (let j = 0; j < 5; j++)cube(aTemple, 10, 45.5 + j * .48, -60, 14.7 - j * 2.2, .47, 14.7 - j * 2.2, [.68 + j * .02, .77 + j * .014, .77]);
   cube(aTemple, 10, 47.9, -60, 2.6, .4, 2.6, cream); cube(aTemple, 10, 48.3, -60, .45, 1.8, .45, gold); cube(aTemple, 10, 50.1, -60, .8, .6, .8, [.96, .84, .48]);
   // Mosaico y dos arriates junto al templo.
   for (let x = 5; x <= 15; x += 1)for (let z = -64; z <= -56; z += 1)if ((x + z) % 2 === 0) cube(detailAt(x, z), x, 34.905, z, .82, .015, .82, [.68, .78, .77]);
   for (const x of [1, 19]) cube(dataAt(x, -52), x, 34, -52, 2, .8, 2, [.71, .77, .66]);
   // Ruinas y pórticos en islas secundarias.
   for (const [x, z] of [[-37, -16], [41, -14], [-33, 29]]) {
      const y = ground(x, z); for (const dx of [-2.4, 2.4]) column(x + dx, z, y, 3.2);
      cube(dataAt(x, z), x, y + 3.85, z, 6.8, .55, 1.7, cream);
   }
   // Caminos de piedra: decoración al ras, sin escalones invisibles.
   for (const island of config.islas) { for (let z = island.z - 6; z < island.z + 7; z += 1.8) { const y = ground(island.x, z); cube(detailAt(island.x, z), island.x, y + .018, z, 1.4, .035, 1.1, [.75, .81, .71]); } }
   function waterfall(x, z, top, bottom, width, axis) {
      const tint = [.37, .74, .92], foam = [.84, .96, 1];
      if (axis === 'x') {
         cube(waterData, x, bottom, z, .09, top - bottom, width, tint);
         for (let j = 0; j < 5; j++)cube(waterData, x + .07, bottom, z - width / 2 + (j + .5) * width / 5, .03, top - bottom, .11, foam.map(v => v * (.90 + j * .018)));
      } else {
         cube(waterData, x, bottom, z, width, top - bottom, .09, tint);
         for (let j = 0; j < 5; j++)cube(waterData, x - width / 2 + (j + .5) * width / 5, bottom, z + .07, .10, top - bottom, .025, foam);
      }
   }
   // Caídas de agua en los bordes: cintas de geometría opaca con flujo animado.
   waterfall(34.04, -55, 34.04, -1, 3.6, 'x'); cube(waterData, 32.4, 34.01, -55, 3.4, .045, 3.6, [.28, .68, .86]);
   waterfall(-13.04, 0, 28.04, 0, 2.8, 'x'); cube(waterData, -12, 28.01, 0, 2.2, .045, 2.8, [.35, .75, .89]);
   waterfall(50, -47.96, 32.04, 0, 3.1, 'z'); cube(waterData, 50, 32.01, -49, 3.1, .045, 2.1, [.31, .72, .91]);
   function upload(data) { const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); return { buffer, count: data.length / 6 }; }
   for (const c of chunks.values()) { Object.assign(c, upload(c.data)); c.detailMesh = upload(c.details); delete c.data; delete c.details; }
   const water = upload(waterData);
   player.feet = ground(player.x, player.z); player.y = player.feet + 1.7; checkpoint.y = player.feet;

   // Cofres con tablillas, cantoneras, remaches, asas y emblema de cada tipo.
   function chestGeometry(b, opened) {
      const a = [], lid = [], x = b.x, y = b.y, z = b.z;
      const color = b.tipo === 'pregunta' ? [.16, .53, .29] : [.66, .19, .14], iron = [.25, .29, .27], brass = [.91, .70, .32];
      cube(a, x, y, z, 1.62, .14, 1.42, iron);
      for (let i = 0; i < 4; i++)cube(a, x, y + .15 + i * .195, z, 1.5, .18, 1.3, color.map(v => v * (i % 2 ? .95 : 1.08)));
      cube(a, x, y + .94, z, 1.5, .04, 1.3, [.12, .17, .12]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
         cube(a, x + sx * .70, y + .12, z + sz * .59, .16, .85, .16, iron);
         for (const h of [.24, .76]) cube(a, x + sx * .7, y + h, z + sz * .688, .055, .06, .035, brass);
      }
      for (const sx of [-1, 1]) { cube(a, x + sx * .79, y + .48, z, .08, .13, .45, brass); cube(a, x + sx * .84, y + .32, z, .055, .2, .055, iron); }
      cube(a, x, y + .42, z + .70, .22, .33, .10, brass); cube(a, x, y + .55, z + .76, .07, .10, .015, [.13, .15, .13]);
      // Tapa local, que se gira alrededor de la bisagra al quedar consumido el cofre.
      cube(lid, 0, 0, 0, 1.66, .18, 1.46, color.map(v => Math.min(1, v * 1.25)));
      cube(lid, 0, .18, 0, 1.35, .12, 1.25, color.map(v => Math.min(1, v * 1.15)));
      for (const sx of [-1, 1]) cube(lid, sx * .57, 0, 0, .12, .31, 1.49, brass);
      for (const sx of [-1, 1]) cube(lid, sx * .52, -.06, -.72, .25, .15, .12, iron);
      const symbol = [1, .92, .68];
      if (b.tipo === 'pregunta') {
         cube(lid, -.15, .315, 0, .25, .025, .48, symbol); cube(lid, .15, .315, 0, .25, .025, .48, symbol); cube(lid, 0, .315, 0, .035, .03, .51, brass);
      } else { cube(lid, 0, .315, -.05, .085, .03, .65, symbol); cube(lid, 0, .315, .19, .4, .035, .085, brass); cube(lid, 0, .315, .34, .10, .035, .2, iron); }
      const angle = opened ? 1.13 : 0, c = Math.cos(angle), sn = Math.sin(angle);
      for (let i = 0; i < lid.length; i += 6) { const ly = lid[i + 1], lz = lid[i + 2] + .73; a.push(lid[i] + x, ly * c + lz * sn + y + .99, -ly * sn + lz * c + z - .73, lid[i + 3], lid[i + 4], lid[i + 5]); }
      return a;
   }
   let indicePreguntaCaja = 0;
   for (const item of config.cajas) {
      const b = { ...item, y: ground(item.x, item.z), opened: false };
      // Cada caja roja entrega el arma configurada + 2 botiquines + 2 escudos.
      // Se prepara la copia de la caja; no se modifica el archivo .config.js.
      // EquipoJugador.recoger mantiene la entrega única por caja.
      if (b.tipo === 'equipo') {
         b.botiquines = 2;
         b.escudos = 2;
      }
      if (b.tipo === 'pregunta') b.pregunta = indicePreguntaCaja++ % config.preguntas.length;
      Object.assign(b, upload(chestGeometry(b, false))); b.openMesh = upload(chestGeometry(b, true)); boxes.push(b); obstacles.push({ x: b.x, z: b.z, r: 1.05, height: 1.5, y: b.y, h: 1.5, box: b });
   }
   let modoSupervivencia;
   try { modoSupervivencia = Supervivencia.prepararCajas('cielo', boxes.filter(b => b.tipo === 'pregunta')); } catch (error) { fail(error.message); return; }
   const botiquines = BotiquinesJugador.crear({ cube, upload, ground, obstacles, boxes, surfaces, inicio: config.inicio, tamano: config.tamano, semilla: config.semilla });
   // Mar de nubes inferior y nubes altas. Todo se dibuja en una sola malla.
   const cloudData = [];
   function cloud(x, y, z, w, d, h) {
      cube(cloudData, x, y, z, w, h, d, [.99, .99, .97]);
      quad(cloudData, [x - w / 2, y, z - d / 2], [x + w / 2, y, z - d / 2], [x + w / 2, y, z + d / 2], [x - w / 2, y, z + d / 2], [.83, .90, .96]);
   }
   for (let i = 0; i < 110; i++) {
      const x = (random() - .5) * 390, z = (random() - .5) * 390, y = -10 + random() * 7, w = 13 + random() * 17;
      for (let j = 0; j < 4; j++)cloud(x + (j - 1.5) * w * .35, y + (j % 2) * 1.4, z + (j % 2) * 4, w * .78, 12 + random() * 10, 3 + random() * 3);
   }
   for (let i = 0; i < 22; i++) {
      const x = (random() - .5) * 440, z = (random() - .5) * 440, y = 61 + random() * 19, w = 10 + random() * 15;
      for (let j = 0; j < 3; j++)cloud(x + (j - 1) * w * .45, y + (j === 1 ? 2 : 0), z, w * .8, 8 + random() * 6, 3 + random() * 2);
   }
   const clouds = upload(cloudData);

   function draw(mesh, attributes = loc) { gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer); gl.enableVertexAttribArray(attributes.position); gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(attributes.color); gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 24, 12); gl.drawArrays(gl.TRIANGLES, 0, mesh.count); }
   function resize() { const scale = quality.scale; canvas.width = Math.max(1, Math.floor(innerWidth * scale)); canvas.height = Math.max(1, Math.floor(innerHeight * scale)); gl.viewport(0, 0, canvas.width, canvas.height); }
   addEventListener('resize', resize); resize();
   $('quality').onchange = () => { qualityName = $('quality').value; quality = presets[qualityName]; $('qualityLabel').textContent = 'Calidad ' + ({ low: 'baja', medium: 'media', high: 'alta' }[$('quality').value]); resize(); };
   function notify(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 3500); }
   function release() { if (document.pointerLockElement === canvas) document.exitPointerLock(); keys.clear(); drag = false; }
   function resume() { if ($('quiz').open || VidaJugador.estaMuerto()) return; TemporizadorJuego.iniciar(); active = true; $('overlay').hidden = true; previous = performance.now(); try { const req = canvas.requestPointerLock(); if (req && req.catch) req.catch(() => notify('Arrastra con el ratón o usa las flechas para mirar.')); } catch { notify('Arrastra con el ratón para mirar.'); } }
   function pause() { active = false; $('overlay').hidden = false; $('play').firstChild.textContent = 'Continuar exploración '; $('hint').hidden = true; release(); }
   $('play').onclick = resume; $('menuBtn').onclick = pause;
   $('returnRooms').onclick = () => { release(); window.location.href = '../html/panel_sala.html'; };
   document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== canvas && active && !$('quiz').open) pause(); });
   canvas.addEventListener('mousedown', e => { if (active && e.button === 0) drag = true; }); addEventListener('mouseup', () => drag = false);
   addEventListener('mousemove', e => {
      if (!active || $('quiz').open) return; if (document.pointerLockElement === canvas || drag) {
         player.yaw -= e.movementX * .0025;
         player.pitch = Math.max(
            -.85,
            Math.min(.55, player.pitch - e.movementY * .0025)
         );
      }
   });
   addEventListener('blur', () => { keys.clear(); if (active) pause(); });
   document.addEventListener('visibilitychange', () => { if (document.hidden && active) pause(); });
   const movement = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight'];
   addEventListener('keydown', e => { if (!active || $('quiz').open || player.protected || VidaJugador.estaMuerto()) return; if (movement.includes(e.code)) e.preventDefault(); keys.add(e.code); if (e.code === 'Escape') { pause(); } if (e.code === 'KeyE' && !e.repeat) interact(); if (equipoJugador.manejarTecla(e)) return; if (e.code === 'KeyR' && !e.repeat) equipoJugador.recibirDano(1); if (e.code === 'KeyV' && !e.repeat) respawn(false); if (e.code === 'Space' && !e.repeat && player.grounded) { player.vy = 7.5; player.grounded = false; window.SonidosJuego?.reproducir("salto"); } });
   addEventListener('keyup', e => keys.delete(e.code));
   function allowed(x, z) {
      const floor = surfaceAt(x, z);
      if (floor && floor.y > player.feet + .55) return false;
      for (const b of config.puentes) {
         const dx = b.bx - b.ax, dz = b.bz - b.az, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, t = ((x - b.ax) * ux + (z - b.az) * uz) / len;
         if (t <= .04 || t >= .96) continue;
         const side = Math.abs((x - b.ax) * (-uz) + (z - b.az) * ux), deck = b.ay + (b.by - b.ay) * t - Math.sin(t * Math.PI) * .55;
         if (side > b.ancho / 2 - .22 && side < b.ancho / 2 + .25 && player.feet < deck + 1.12 && player.feet + 1.6 > deck) return false;
      }
      return !obstacles.some(o => !o.box?.supervivenciaOculta && player.feet < o.y + o.h && player.feet + 1.65 > o.y && Math.hypot(x - o.x, z - o.z) < o.r + .22);
   }
   function respawn(fell = true) {
      player.x = checkpoint.x; player.z = checkpoint.z; player.feet = checkpoint.y; player.y = checkpoint.y + 1.7; player.vy = 0; player.grounded = true; keys.clear();
      if (fell) falls++;
      notify(fell ? 'Volviste a la última isla segura. ¡Inténtalo otra vez!' : 'Regresaste a la última isla segura.');
      emit('escenario:reaparicion', { mapa: 'cielo', caida: fell, caidas: falls });
   }
   function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail })); }
   function interact() {
      if (!nearest || !active || !player.grounded) return; const b = nearest;
      if (b.tipo === 'equipo') { equipoJugador.recoger(b); return; }
      const q = config.preguntas[b.pregunta]; if (!q) { notify('Esta caja todavía no tiene una pregunta válida.'); return; }
      questionBox = b; solved = false; returnAt = 0; player.protected = true; active = false; release(); deadline = performance.now() + config.tiempoPregunta * 1000;
      $('question').textContent = q.texto; $('answers').replaceChildren(); $('feedback').textContent = ''; $('hint').hidden = true;
      q.opciones.forEach((option, i) => { const btn = document.createElement('button'); btn.textContent = String.fromCharCode(65 + i) + '. ' + option; btn.onclick = () => answer(i); $('answers').append(btn); });
      $('quiz').showModal(); emit('escenario:proteccion', { activa: true, id: b.id });
   }
   function answer(index) {
      if (solved || !questionBox) return; solved = true; returnAt = performance.now() + 3000; const q = config.preguntas[questionBox.pregunta], correct = index === q.correcta; if (!modoSupervivencia || correct) questionBox.opened = true; if (modoSupervivencia) Supervivencia.registrarRespuesta(questionBox, correct);
      if (correct) points += 100; $('score').textContent = points + ' puntos';
      $('feedback').textContent = correct ? '¡Correcto! +100 puntos' : modoSupervivencia ? (index === null ? 'Tiempo terminado. ' : 'Respuesta incorrecta. ') + 'La caja conserva esta pregunta. Inténtalo de nuevo.' : (index === null ? 'Tiempo terminado. ' : '') + 'Respuesta correcta: ' + q.opciones[q.correcta];
      [...$('answers').children].forEach(b => b.disabled = true); $('shield').textContent = 'Respuesta registrada · regreso automático en 3 segundos';
      emit('escenario:respuesta', { id: questionBox.id, seleccion: index, correcta: correct, puntos: points });
   }
   function closeQuiz() { if (!solved) answer(null); $('quiz').close(); player.protected = false; emit('escenario:proteccion', { activa: false }); questionBox = null; if (Supervivencia.alCerrarPregunta()) return; resume(); }
   $('closeQuiz').onclick = closeQuiz; $('quiz').addEventListener('cancel', e => { e.preventDefault(); closeQuiz(); });
   function update(dt) {
      worldTime += dt;
      if (keys.has('ArrowLeft')) player.yaw += dt * 1.6; if (keys.has('ArrowRight')) player.yaw -= dt * 1.6;
      if (keys.has('ArrowUp')) player.pitch = Math.min(.55, player.pitch + dt); if (keys.has('ArrowDown')) player.pitch = Math.max(-.85, player.pitch - dt);
      const f = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0), s = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0), len = Math.hypot(f, s) || 1;
      const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 7 : 4.5) * dt;
      const dx = (-Math.sin(player.yaw) * f + Math.cos(player.yaw) * s) / len * speed, dz = (-Math.cos(player.yaw) * f - Math.sin(player.yaw) * s) / len * speed;
      if (allowed(player.x + dx, player.z)) player.x += dx; if (allowed(player.x, player.z + dz)) player.z += dz;
      const floor = surfaceAt(player.x, player.z), oldFeet = player.feet;
      if (player.grounded && floor && Math.abs(floor.y - player.feet) < .6) { player.feet = floor.y; player.vy = 0; }
      else {
         player.grounded = false; player.vy -= 13 * dt; player.feet += player.vy * dt;
         if (floor && player.vy <= 0 && oldFeet >= floor.y - .08 && player.feet <= floor.y) { player.feet = floor.y; player.vy = 0; player.grounded = true; }
      }
      player.y = player.feet + 1.7;
      if (player.feet < -12) { respawn(); return; }
      if (player.grounded && floor?.island && floor.island !== currentIsland) {
         const island = config.islas.find(i => i.id === floor.island); if (island) {
            currentIsland = island.id;
            // Guardar una posición ya alcanzada, transitable y libre de obstáculos.
            checkpoint = { x: player.x, z: player.z, y: player.feet }; $('weatherName').textContent = island.nombre; notify('Punto seguro: ' + island.nombre);
         }
      }
      const curacion = botiquines.recoger(player, player.feet, () => (VidaJugador.recuperarCorazon || VidaJugador.recuperarCorazones).call(VidaJugador, 1));
      if (curacion !== null) notify(curacion ? 'Recuperaste un corazón.' : 'Ya tienes todos los corazones.');
      nearest = null; let min = 3.7; for (const b of boxes) { if (b.supervivenciaOculta) continue; const d = Math.hypot(player.x - b.x, player.z - b.z); if (!b.opened && d < min && Math.abs(player.feet - b.y) < 2 && player.grounded) { nearest = b; min = d; } }
      $('hint').hidden = !nearest; if (nearest) $('hint').textContent = '[ E ] ' + (nearest.tipo === 'pregunta' ? 'Responder pregunta · escudo activo' : 'Abrir cofre de equipamiento');
   }
   const map = $('mapa').getContext('2d');
   function minimap() {
      map.fillStyle = '#9ed3ed'; map.fillRect(0, 0, 160, 160); const mx = x => (x / config.tamano + .5) * 160;
      map.strokeStyle = '#b99766'; map.lineWidth = 2; for (const b of config.puentes) { map.beginPath(); map.moveTo(mx(b.ax), mx(b.az)); map.lineTo(mx(b.bx), mx(b.bz)); map.stroke(); }
      for (const p of config.saltos) { map.fillStyle = '#8fb953'; map.fillRect(mx(p.x) - 1, mx(p.z) - 1, 2, 2); }
      for (const island of config.islas) { map.fillStyle = island.id === currentIsland ? '#8bbe57' : '#659851'; map.beginPath(); map.ellipse(mx(island.x), mx(island.z), island.rx / config.tamano * 160, island.rz / config.tamano * 160, 0, 0, Math.PI * 2); map.fill(); }
      for (const b of boxes) { if (b.supervivenciaOculta) continue; map.fillStyle = b.opened ? '#5d7b81' : b.tipo === 'pregunta' ? '#20bd69' : '#d74736'; map.fillRect(mx(b.x) - 2, mx(b.z) - 2, 4, 4); }
      botiquines.dibujarEnMinimapa(map, mx);
      map.save(); map.translate(mx(player.x), mx(player.z)); map.rotate(-player.yaw); map.fillStyle = '#fff'; map.strokeStyle = '#24445a'; map.lineWidth = 1.5; map.beginPath(); map.moveTo(0, -6); map.lineTo(4, 4); map.lineTo(0, 2); map.lineTo(-4, 4); map.closePath(); map.fill(); map.stroke(); map.restore();
      $('coords').textContent = Math.round(player.x) + ' / ' + Math.round(player.z);
   }
   const equipoJugador = new EquipoJugador({
      inventario: inventory,
      avisar: notify,
      puedeUsar: () => active && !player.protected && !VidaJugador.estaMuerto(),
      puedeRecibirDano: () => active && !player.protected && !VidaJugador.estaMuerto()
   });
   canvas.addEventListener('mousedown', e => { if (e.button === 0 && document.pointerLockElement === canvas && active && !player.protected && !VidaJugador.estaMuerto()) equipoJugador.usarArma(); });
   const terceraPersona = new PersonajeTerceraPersona(gl, {
      equipo: equipoJugador,
      distancia: 8,
      altura: 1.85,
      bloqueado: (x, y, z) => {
         if (y < ground(x, z) + .25) return true;
         return obstacles.some(o => {
            const base = o.box?.y ?? o.y ?? ground(o.x, o.z);
            const altura = o.height ?? o.h ?? 0;
            return y > base - .2 && y < base + altura + .3 && Math.hypot(x - o.x, z - o.z) < (o.r ?? 0) + .3;
         });
      }
   });
   const flechas = new FlechasEscenario(gl, { cube, ground, obstacles, limite: half });
   const enemigos = new EnemigosSistema(gl, { config: ENEMIGOS_CONFIG, ground, obstacles, limite: half, player, cube, upload, draw, avisar: notify });
   const combate = new CombateSistema({ enemigos, proyectiles: flechas, player, personaje: terceraPersona, equipo: equipoJugador, permitido: () => active && !player.protected && !VidaJugador.estaMuerto() });
   let ataquePendiente = null;
   window.addEventListener('escenario:uso-arma', evento => { if (active && !player.protected && !VidaJugador.estaMuerto()) ataquePendiente = evento.detail?.arma || null; });
   function render(time) {
      const dt = Math.min(.04, (time - previous) / 1000 || 0); previous = time;
      if (active) update(dt);
      equipoJugador.actualizar(dt);
      const vista = terceraPersona.actualizar(player, dt, player.y - 1.7);
      if (active && !player.protected && !VidaJugador.estaMuerto()) {
         if (ataquePendiente) combate.ataqueDelJugador(ataquePendiente, vista);
         flechas.actualizar(dt);
         if (!VidaJugador.estaMuerto()) enemigos.actualizar(dt, (a, b) => combate.visionLibre(a, b));
      }
      ataquePendiente = null;
      if ($('quiz').open && solved && returnAt && time >= returnAt) closeQuiz();
      if ($('quiz').open && !solved) { const left = Math.max(0, Math.ceil((deadline - time) / 1000)); $('shield').textContent = 'Escudo activo · ' + left + ' s · movimiento bloqueado'; if (!left) answer(null); }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
      screenPass(skyProgram, skyLoc); gl.uniform2f(skyLoc.turn, vista.yaw, vista.pitch); gl.uniform1f(skyLoc.aspect, canvas.width / canvas.height); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.useProgram(program); gl.uniform3f(loc.camera, vista.x, vista.y, vista.z); gl.uniform2f(loc.turn, vista.yaw, vista.pitch); gl.uniform1f(loc.aspect, canvas.width / canvas.height);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      gl.uniform1f(loc.distanceMax, 460); gl.uniform3f(loc.offset, Math.sin(worldTime * .014) * 9, 0, Math.sin(worldTime * .01) * 5); draw(clouds);
      gl.clear(gl.DEPTH_BUFFER_BIT); gl.uniform3f(loc.offset, 0, 0, 0); gl.uniform1f(loc.distanceMax, quality.distance);
      for (const c of chunks.values()) if (Math.hypot(c.x - player.x, c.z - player.z) < quality.distance + 24) { draw(c); if (qualityName !== 'low') draw(c.detailMesh); }
      for (const b of boxes) if (!b.supervivenciaOculta && Math.hypot(b.x - player.x, b.z - player.z) < quality.distance) draw(b.opened ? b.openMesh : b);
      botiquines.dibujar(draw, player, quality.distance);
      gl.useProgram(waterProgram); gl.uniform3f(waterLoc.camera, vista.x, vista.y, vista.z); gl.uniform3f(waterLoc.offset, 0, 0, 0); gl.uniform2f(waterLoc.turn, vista.yaw, vista.pitch); gl.uniform1f(waterLoc.aspect, canvas.width / canvas.height); gl.uniform1f(waterLoc.distanceMax, quality.distance); gl.uniform1f(waterLoc.time, worldTime % 120); draw(water, waterLoc);
      if (VidaJugador.debeDibujarPersonaje()) terceraPersona.dibujar(program, loc);
      enemigos.dibujar(program, loc, quality.distance);
      flechas.dibujar(program, loc);
      frames++; if (time - fpsStart >= 1000) { $('fps').textContent = Math.round(frames * 1000 / (time - fpsStart)) + ' FPS'; frames = 0; fpsStart = time; }
      if (time - lastUI > 120) { minimap(); lastUI = time; }
      requestAnimationFrame(render);
   }
   canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); pause(); fail('Se perdió el contexto gráfico. Recarga la página para continuar.'); });
   // Contrato pequeño para conectar después el proyecto. No implementa autoridad de servidor.
   window.EscenarioCielo = Object.freeze({
      version: '1.0.0',
      getState: () => ({ mapa: 'cielo', semilla: config.semilla, caidas: falls, puntoSeguro: { ...checkpoint }, jugador: { ...player }, puntos: points, inventario: [...inventory], cajasAbiertas: boxes.filter(b => b.opened).map(b => b.id) }),
      pause, resume,
      returnToCheckpoint: () => { if (!$('quiz').open) respawn(false); },
      reset: () => location.reload()
   });
   requestAnimationFrame(render);
})();
