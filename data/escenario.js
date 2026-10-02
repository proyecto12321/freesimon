/* Escenario independiente · WebGL 1 · sin dependencias ni peticiones de red.
   API de integración al final. El servidor futuro debe validar toda acción. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const canvas = $('mundo');
  const config = window.DESIERTO_CONFIG;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  function fail(message) {
    $('error').hidden = false;
    $('error').textContent = message;
    $('play').disabled = true;
  }
  if (!gl) { fail('No se pudo iniciar WebGL. Prueba con la aceleración gráfica del navegador activada y un controlador compatible.'); return; }
  if (!config) { fail('Falta desierto.config.js. Mantén todos los archivos juntos.'); return; }
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
        alternativas: alternativas.map((alternativa) => alternativa.trim()),
        correcta: pregunta.correcta
      };
    });
  }

  let preguntasDocente;
  try {
    preguntasDocente = cargarPreguntasDocente();
  } catch (error) {
    fail(error.message);
    return;
  }
  const presets = { low: { distance: 65, scale: .65 }, medium: { distance: 95, scale: .85 }, high: { distance: 140, scale: 1 } };
  let quality = presets.low, qualityName = 'low', seed = config.semilla >>> 0;
  const climate = Object.assign({ modo: 'auto', calma: 65, aviso: 10, entrada: 12, tormenta: 35, salida: 14 }, config.clima);
  let weatherMode = climate.modo, weatherTime = 0, storm = 0, worldTime = 0, weatherPhase = 'clear';
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
  const half = config.tamano / 2, tile = 4, chunkSize = 32, chunks = new Map(), obstacles = [], boxes = [];
  const player = { x: config.inicio.x, z: config.inicio.z, y: 0, yaw: 0, pitch: -.08, jump: 0, vy: 0, protected: false };
  let active = false, points = 0, inventory = [], keys = new Set(), nearest = null, questionBox = null, deadline = 0, solved = false, returnAt = 0;

  //implementando vida
  // =====================================================
  // CONECTAR LA VIDA CON EL ESTADO DEL ESCENARIO
  // =====================================================

  VidaJugador.configurar({
    // Solo aceptar golpes durante el juego y fuera de preguntas.
    puedeRecibirGolpe: () => {
      return active && !player.protected;
    },

    // Detener al jugador cuando pierde el último corazón.
    alMorir: () => {
      active = false;
      keys.clear();
      player.vy = 0;

      // Liberar el ratón y detener el arrastre.
      release();

      // Ocultar avisos de interacción y menú de pausa.
      $('hint').hidden = true;
      $('overlay').hidden = true;
    }
  });// fin de la implementacion

  let previous = 0, fpsStart = 0, frames = 0, lastUI = 0, toastTimer, drag = false;
  function ground(x, z) {
    const cx = Math.floor(x / tile) * tile + tile / 2, cz = Math.floor(z / tile) * tile + tile / 2;
    const fade = Math.min(1, Math.max(0, (Math.hypot(cx, cz) - 14) / 30));
    return Math.floor((2.7 + Math.sin(cx * .043) * 1.7 + Math.cos(cz * .054) * 1.5 + Math.sin((cx + cz) * .027)) * fade * 2) / 2;
  }
  player.y = ground(player.x, player.z) + 1.7;
  function shader(type, source) { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  // Precisión explícita e idéntica en toda variable compartida entre shaders.
  function makeProgram(vs, fs) { const p = gl.createProgram(); gl.attachShader(p, shader(gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
  let program, skyProgram, dustProgram;
  try {
    program = makeProgram(`
 attribute vec3 position; attribute vec3 color;
 uniform vec3 camera;
uniform vec3 offset;
uniform vec2 turn;
uniform float modelScale;
uniform vec3 modelRotation; 
uniform float aspect; 
uniform mediump float distanceMax;
 varying mediump vec3 vColor; varying mediump float depth;
 void main(){
 vec3 p=position+offset-camera;
 float c=cos(turn.x),s=sin(turn.x);
 vec3 q=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
 c=cos(turn.y);s=sin(turn.y);
 q=vec3(q.x,c*q.y+s*q.z,-s*q.y+c*q.z);
 float d=-q.z; float n=0.08; float f=distanceMax+40.0;
 gl_Position=vec4(q.x*1.3/aspect,q.y*1.3,(f+n)/(f-n)*d-2.0*f*n/(f-n),d);
 vColor=color;depth=length(p);
 }`, `
 precision mediump float; varying mediump vec3 vColor; varying mediump float depth;
 uniform mediump float distanceMax; uniform float storm;
 void main(){
 float reach=mix(distanceMax,22.0,storm);
 float fog=smoothstep(reach*mix(0.52,0.16,storm),reach,depth);
 vec3 haze=mix(vec3(0.79,0.83,0.77),vec3(0.66,0.49,0.29),storm);
 vec3 shade=vColor*mix(1.0,0.78,storm);
 gl_FragColor=vec4(mix(shade,haze,fog),1.0);}`);
    const screenVS = `attribute vec2 position; varying mediump vec2 uv; void main(){uv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}`;
    skyProgram = makeProgram(screenVS, `
 precision mediump float; varying mediump vec2 uv;
 uniform vec2 turn; uniform float aspect; uniform float storm;
 void main(){
 vec2 p=uv*2.0-1.0;vec3 q=normalize(vec3(p.x*aspect/1.3,p.y/1.3,-1.0));
 float c=cos(turn.y),s=sin(turn.y);q=vec3(q.x,c*q.y-s*q.z,s*q.y+c*q.z);
 c=cos(turn.x);s=sin(turn.x);vec3 ray=vec3(c*q.x-s*q.z,q.y,s*q.x+c*q.z);
 float elevation=max(0.0,ray.y);
 vec3 sky=mix(vec3(0.79,0.83,0.77),vec3(0.29,0.61,0.78),smoothstep(0.0,0.8,elevation));
 float sun=dot(ray,normalize(vec3(-0.42,0.52,-0.65)));
 sky+=vec3(0.14,0.10,0.01)*pow(max(sun,0.0),24.0);
 sky=mix(sky,vec3(1.0,0.94,0.69),smoothstep(0.9980,0.9992,sun));
 sky=mix(sky,vec3(0.66,0.49,0.29)*(1.0-elevation*0.12),storm);
 gl_FragColor=vec4(sky,1.0);}`);
    dustProgram = makeProgram(screenVS, `
 precision mediump float; varying mediump vec2 uv;
 uniform float storm; uniform float time; uniform float aspect;
 float hash(vec2 p){p=fract(p*vec2(0.1031,0.11369));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}
 void main(){
 vec2 v=vec2(uv.x*aspect,uv.y);
 vec2 p=v*vec2(32.0,78.0)+vec2(time*16.0,-time*5.0);
 vec2 cell=floor(p);vec2 f=fract(p);
 float grain=step(0.82,hash(cell))*smoothstep(0.05,0.22,f.y)*(1.0-smoothstep(0.25,0.44,f.y))*(1.0-smoothstep(0.45,0.97,f.x));
 float bands=0.5+0.5*sin(uv.y*28.0+uv.x*4.0+time*2.1);
 float gust=0.5+0.5*sin(uv.x*6.0+uv.y*9.0-time*0.9);
 float opacity=storm*(0.045+bands*gust*0.12+grain*0.25);
 gl_FragColor=vec4(vec3(0.86,0.68,0.40),opacity);}`);
  } catch (error) { fail('No se pudo preparar el escenario: ' + error.message); return; }
  gl.useProgram(program); gl.enable(gl.DEPTH_TEST); gl.clearColor(.79, .83, .77, 1);
  const loc = {};['position', 'color'].forEach(k => loc[k] = gl.getAttribLocation(program, k));
  ['camera', 'offset', 'turn', 'aspect', 'distanceMax', 'storm'].forEach(k => loc[k] = gl.getUniformLocation(program, k));
  const skyLoc = {}, dustLoc = {};
  for (const [p, l, names] of [[skyProgram, skyLoc, ['turn', 'aspect', 'storm']], [dustProgram, dustLoc, ['storm', 'time', 'aspect']]]) { l.position = gl.getAttribLocation(p, 'position'); for (const n of names) l[n] = gl.getUniformLocation(p, n); }
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
  // Terreno: solo superficies y escalones, agrupados por sectores.
  for (let x = -half; x < half; x += tile)for (let z = -half; z < half; z += tile) {
    const h = ground(x, z), arr = dataAt(x, z), v = .94 + random() * .09, col = [.84 * v, .66 * v, .40 * v];
    quad(arr, [x, h, z], [x + tile, h, z], [x + tile, h, z + tile], [x, h, z + tile], col);
    const hn = ground(x + tile, z), hs = ground(x, z + tile);
    if (h !== hn) quad(arr, [x + tile, h, z], [x + tile, h, z + tile], [x + tile, hn, z + tile], [x + tile, hn, z], col, .76);
    if (h !== hs) quad(arr, [x, h, z + tile], [x + tile, h, z + tile], [x + tile, hs, z + tile], [x, hs, z + tile], col, .85);
  }
  function freeSpot(x, z, r) { return [[-22, -34], [38, -20], [2, 67], [-42, 20], [25, 43], [-54, -78], [69, -13], [-90, 67], [85, 78]].every(p => Math.hypot(x - p[0], z - p[1]) > r + 7) && Math.hypot(x - player.x, z - player.z) > 12 && config.cajas.every(b => Math.hypot(x - b.x, z - b.z) > r + 4) && obstacles.every(o => Math.hypot(x - o.x, z - o.z) > r + o.r + 1); }
  function populate(count, type) {
    for (let i = 0, tries = 0; i < count && tries < count * 10; tries++) {
      const x = (random() - .5) * (config.tamano - 16), z = (random() - .5) * (config.tamano - 16), r = type === 'cactus' ? .8 : 1.5;
      if (!freeSpot(x, z, r)) continue; i++; const y = ground(x, z), arr = dataAt(x, z);
      if (type === 'cactus') {
        const h = 2.5 + random() * 3.2, col = [.26, .46 + random() * .1, .29];
        cube(arr, x, y, z, .85, h, .85, col); cube(arr, x - .8, y + h * .45, z, 1.4, .65, .65, col); cube(arr, x - 1.25, y + h * .45, z, .62, h * .38, .62, col);
        cube(arr, x + .7, y + h * .65, z, 1.2, .6, .6, col); cube(arr, x + 1.05, y + h * .65, z, .58, h * .27, .58, col);
        // Rayas en relieve sin texturas externas.
        cube(arr, x + .2, y + .15, z + .431, .07, h - .3, .025, [.42, .62, .34]);
        const detail = detailAt(x, z);
        for (const side of [-1, 1]) cube(detail, x + side * .22, y + .1, z + .44, .04, h - .2, .03, [.52, .65, .32]);
        if (random() > .65) { cube(detail, x, y + h, z, .3, .23, .3, [.91, .52, .45]); cube(detail, x, y + h + .23, z, .14, .08, .14, [1, .82, .34]); }
        obstacles.push({ x, z, r: 1.6, height: h });
      } else { const h = .7 + random() * 1.8; cube(arr, x, y, z, 2.5, h, 2.2, [.52, .43, .33]); cube(arr, x - .2, y + h, z, 1.6, .45, 1.5, [.59, .48, .36]); obstacles.push({ x, z, r: 1.7, height: h + .45 }); }
    }
  }
  populate(config.cantidadCactus, 'cactus'); populate(config.cantidadRocas, 'roca');
  // Detalles de suelo: una malla por sector, sin objetos de dibujo individuales.
  for (let i = 0; i < (config.cantidadArbustos || 0) + (config.cantidadPiedritas || 0); i++) {
    const x = (random() - .5) * (config.tamano - 18), z = (random() - .5) * (config.tamano - 18);
    if (config.cajas.some(b => Math.hypot(b.x - x, b.z - z) < 2.6) || Math.hypot(x, z - 10) < 5) continue;
    const y = ground(x, z), a = detailAt(x, z);
    if (i < (config.cantidadArbustos || 0)) {
      const h = .2 + random() * .55, col = [.52 + random() * .12, .44, .23];
      cube(a, x, y, z, .075, h, .075, col);
      cube(a, x - .16, y + h * .35, z, .4, .065, .075, col); cube(a, x + .14, y + h * .6, z, .35, .06, .08, col);
      cube(a, x - .3, y + h * .35, z, .06, h * .45, .07, col); cube(a, x + .3, y + h * .6, z, .06, h * .3, .06, col);
    } else { const size = .12 + random() * .25; cube(a, x, y, z, size, size * .48, size * .8, [.65, .53, .36]); }
  }
  // Ondas de arena, distribuidas en parches para evitar un patrón uniforme.
  for (let i = 0; i < 180; i++) {
    const x = (random() - .5) * (config.tamano - 24), z = (random() - .5) * (config.tamano - 24), a = detailAt(x, z);
    for (let j = 0; j < 4; j++) { const zz = z + j * .36, y = ground(x, zz) + .012; quad(a, [x - 1, y, zz], [x + 1.3, y, zz], [x + 1.3, y, zz + .045], [x - 1, y, zz + .045], [.76, .59, .35]); }
  }
  function pillar(x, z, h, w) {
    const y = ground(x, z), a = dataAt(x, z);
    for (let layer = 0; layer < h; layer += .65) { const tone = layer % 1.3 < .65 ? 1 : .92; cube(a, x, y + layer, z, w, .62, w, [.73 * tone, .55 * tone, .34 * tone]); }
    cube(a, x, y, z, w + .45, .28, w + .45, [.60, .44, .29]); cube(a, x, y + h, z, w + .3, .26, w + .3, [.82, .65, .42]);
    obstacles.push({ x, z, r: w * .75 + .25, height: h + .26 }); return y + h;
  }
  // Tres portales de piedra, visibles al explorar. Los huecos se pueden atravesar.
  for (const [x, z] of [[-22, -34], [38, -20], [2, 67]]) {
    // Estas áreas se reservaron al distribuir los cactus y las rocas.
    const y1 = pillar(x - 3, z, 5.2, 1.65), y2 = pillar(x + 3, z, 5.2, 1.65), top = Math.max(y1, y2);
    cube(dataAt(x, z), x, top, z, 8.3, .8, 2.05, [.72, .52, .31]);
    cube(detailAt(x, z), x, top + .8, z, 5, .25, 1.5, [.84, .66, .4]);
    // Losas y fragmentos de un camino antiguo.
    for (let j = 0; j < 7; j++) { const px = x + (random() - .5) * 1.2, pz = z + 4 + j * 1.8; cube(detailAt(px, pz), px, ground(px, pz) + .02, pz, 1.7, .05, 1, [.72, .61, .44]); }
  }
  // Agujas de arenisca y estratos, con colisión independiente del detalle visual.
  for (const [x, z] of [[-42, 20], [25, 43], [-54, -78], [69, -13], [-90, 67], [85, 78]]) {
    const a = dataAt(x, z), base = ground(x, z), h = 6 + random() * 6;
    for (let j = 0; j < 5; j++)cube(a, x + j * .13, base + j * h / 5, z, 5 - j * .65, h / 5 - .045, 4 - j * .48, [.67 + j * .025, .43 + j * .023, .27 + j * .015]);
    obstacles.push({ x, z, r: 3.5, height: h });
  }
  // Mesetas en los bordes; los límites físicos usan el tamaño del mapa.
  for (let i = 0; i < 64; i++) { const side = i % 4, t = (i / 4 | 0) / 15 * (config.tamano - 12) - half + 6; let x = side < 2 ? t : (side === 2 ? -half + 2 : half - 2), z = side < 2 ? (side === 0 ? -half + 2 : half - 2) : t; cube(dataAt(x, z), x, ground(x, z), z, 9, 5 + random() * 11, 9, [.66, .43, .28]); }
  function upload(data) { const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); return { buffer, count: data.length / 6 }; }
  for (const c of chunks.values()) { Object.assign(c, upload(c.data)); c.detailMesh = upload(c.details); delete c.data; delete c.details; }
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
  let siguientePregunta = 0;
  for (const item of config.cajas) {
    const b = { ...item, y: ground(item.x, item.z), opened: false };
    if (b.tipo === 'pregunta') {
      b.pregunta = siguientePregunta % preguntasDocente.length;
      siguientePregunta += 1;
    }
    Object.assign(b, upload(chestGeometry(b, false)));
    b.openMesh = upload(chestGeometry(b, true));
    boxes.push(b);
    obstacles.push({ x: b.x, z: b.z, r: 1.05, height: 1.5, box: b });
  }
  const botiquines = BotiquinesJugador.crear({
    cube, upload, ground, obstacles, boxes, inicio: config.inicio,
    tamano: config.tamano, semilla: config.semilla
  });
  // Nubes volumétricas sencillas: todas agrupadas en una única malla.
  const cloudData = [];
  for (let i = 0; i < (config.cantidadNubes || 32); i++) {
    const x = (random() - .5) * 460, z = (random() - .5) * 460, y = 38 + random() * 22, w = 12 + random() * 12;
    for (let j = 0; j < 4; j++) {
      const dx = (j - 1.5) * w * .28, dy = j === 1 || j === 2 ? 2 : 0;
      const cx = x + dx, cy = y + dy, cz = z + (j % 2) * 3, cw = w * .6, ch = 2.4 + random() * 2, cd = 8 + random() * 6;
      cube(cloudData, cx, cy, cz, cw, ch, cd, [.98, .97, .89]);
      quad(cloudData, [cx - cw / 2, cy, cz - cd / 2], [cx + cw / 2, cy, cz - cd / 2], [cx + cw / 2, cy, cz + cd / 2], [cx - cw / 2, cy, cz + cd / 2], [.82, .85, .80]);
    }
  }
  const clouds = upload(cloudData);
  function draw(mesh) { gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer); gl.enableVertexAttribArray(loc.position); gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(loc.color); gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, 24, 12); gl.drawArrays(gl.TRIANGLES, 0, mesh.count); }
  function resize() { const scale = quality.scale; canvas.width = Math.max(1, Math.floor(innerWidth * scale)); canvas.height = Math.max(1, Math.floor(innerHeight * scale)); gl.viewport(0, 0, canvas.width, canvas.height); }
  addEventListener('resize', resize); resize();
  $('quality').onchange = () => { qualityName = $('quality').value; quality = presets[qualityName]; $('qualityLabel').textContent = 'Calidad ' + ({ low: 'baja', medium: 'media', high: 'alta' }[$('quality').value]); resize(); };
  $('weather').value = weatherMode;
  function setWeather(mode) { if (!['auto', 'clear', 'storm'].includes(mode)) return; weatherMode = mode; weatherTime = 0; $('weather').value = mode; notify(mode === 'storm' ? 'Se aproxima una tormenta de arena…' : mode === 'clear' ? 'El viento se calma…' : 'Ciclo de tormentas automático activado'); emit('escenario:clima', { modo: mode }); }
  $('weather').onchange = () => setWeather($('weather').value);
  function updateWeather(dt) {
    worldTime += dt; weatherTime += dt; let target = 0, phase = 'clear';
    if (weatherMode === 'storm') { target = 1; phase = 'storm'; }
    else if (weatherMode === 'auto') {
      const cycle = climate.calma + climate.aviso + climate.entrada + climate.tormenta + climate.salida, t = weatherTime % cycle;
      if (t >= climate.calma && t < climate.calma + climate.aviso) { phase = 'warning'; }
      else if (t >= climate.calma + climate.aviso && t < cycle - climate.salida) { target = 1; phase = 'storm'; }
      else if (t >= cycle - climate.salida) { phase = 'clearing'; }
    }
    const rate = target > storm ? 1 / climate.entrada : 1 / climate.salida;
    storm = Math.max(0, Math.min(1, storm + Math.sign(target - storm) * Math.min(Math.abs(target - storm), dt * rate)));
    if (phase !== weatherPhase) { weatherPhase = phase; if (phase === 'warning') notify('El viento aumenta. Tormenta de arena en ' + climate.aviso + ' segundos.'); }
    $('weatherName').textContent = storm > .65 ? 'Tormenta de arena' : storm > .04 ? (target > storm ? 'Viento en aumento' : 'El cielo se despeja') : phase === 'warning' ? 'Tormenta en camino' : 'Cielo despejado';
    $('weatherIcon').textContent = storm > .1 ? '≋' : '☀'; $('weatherBadge').classList.toggle('storm', storm > .25);
    $('weatherHelp').textContent = storm > .1 ? 'Visibilidad reducida · T clima · R daño' : 'T · clima · R · daño';
  }
  function notify(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 3500); }
  function release() { if (document.pointerLockElement === canvas) document.exitPointerLock(); keys.clear(); drag = false; }
  function resume() { if (VidaJugador.estaMuerto() || $('quiz').open) return; TemporizadorJuego.iniciar(); active = true; $('overlay').hidden = true; previous = performance.now(); try { const req = canvas.requestPointerLock(); if (req && req.catch) req.catch(() => notify('Arrastra con el ratón o usa las flechas para mirar.')); } catch { notify('Arrastra con el ratón para mirar.'); } }
  function pause() { active = false; $('overlay').hidden = false; $('play').firstChild.textContent = 'Continuar exploración '; $('hint').hidden = true; release(); }
  $('play').onclick = resume; $('menuBtn').onclick = pause;
  $('returnRooms').onclick = () => { release(); window.location.href = '../html/panel_sala.html'; };
  document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== canvas && active && !$('quiz').open) pause(); });
  canvas.addEventListener('mousedown', e => { if (active && e.button === 0) drag = true; }); addEventListener('mouseup', () => drag = false);
  addEventListener('mousemove', e => { if (!active || $('quiz').open) return; if (document.pointerLockElement === canvas || drag) { player.yaw -= e.movementX * .0025; player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch - e.movementY * .0025)); } });
  addEventListener('blur', () => { keys.clear(); if (active) pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && active) pause(); });
  const movement = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight'];
  addEventListener('keydown', e => { if (!active || $('quiz').open) return; if (movement.includes(e.code)) e.preventDefault(); keys.add(e.code); if (e.code === 'Escape') { pause(); } if (e.code === 'KeyE' && !e.repeat) interact(); if (e.code === 'KeyT' && !e.repeat) setWeather(weatherMode === 'storm' ? 'clear' : weatherMode === 'clear' ? 'auto' : 'storm'); if (e.code === 'Space' && !e.repeat && player.jump === 0) player.vy = 5; });
  addEventListener('keyup', e => keys.delete(e.code));
  function allowed(x, z) { if (Math.abs(x) > half - 7 || Math.abs(z) > half - 7) return false; return !obstacles.some(o => Math.hypot(x - o.x, z - o.z) < o.r + .25); }
  function emit(name, detail) { window.dispatchEvent(new CustomEvent(name, { detail })); }
  function interact() {
    if (!nearest || !active) return;
    const caja = nearest;

    if (caja.tipo === 'equipo') {
      equipoJugador.recoger(caja);
      return;
    }

    const pregunta = preguntasDocente[caja.pregunta];
    if (!pregunta) {
      notify('Esta caja no tiene una pregunta del docente asignada.');
      return;
    }

    questionBox = caja;
    solved = false;
    returnAt = 0;
    player.protected = true;
    active = false;
    release();
    deadline = performance.now() + config.tiempoPregunta * 1000;
    $('question').textContent = pregunta.texto;
    $('answers').replaceChildren();
    $('feedback').textContent = '';
    $('hint').hidden = true;

    pregunta.alternativas.forEach((alternativa, indice) => {
      const boton = document.createElement('button');
      boton.textContent = String.fromCharCode(65 + indice) + '. ' + alternativa;
      boton.onclick = () => answer(indice);
      $('answers').append(boton);
    });

    $('quiz').showModal();
    emit('escenario:proteccion', { activa: true, id: caja.id });
  }
  function answer(indiceSeleccionado) {
    if (solved || !questionBox) return;

    solved = true;
    returnAt = performance.now() + 3000;
    const pregunta = preguntasDocente[questionBox.pregunta];
    const correcta = indiceSeleccionado === pregunta.correcta;
    questionBox.opened = true;

    if (correcta) points += 100;
    $('score').textContent = points + ' puntos';
    $('feedback').textContent = correcta
      ? '¡Correcto! +100 puntos'
      : (indiceSeleccionado === null ? 'Tiempo terminado. ' : '')
      + 'Respuesta correcta: ' + pregunta.alternativas[pregunta.correcta];
    [...$('answers').children].forEach((boton) => {
      boton.disabled = true;
    });
    $('shield').textContent = 'Respuesta registrada · regreso automático en 3 segundos';
    emit('escenario:respuesta', {
      id: questionBox.id,
      seleccion: indiceSeleccionado,
      correcta,
      puntos: points
    });
  }
  function closeQuiz() { if (!solved) answer(null); $('quiz').close(); player.protected = false; emit('escenario:proteccion', { activa: false }); questionBox = null; resume(); }
  $('closeQuiz').onclick = closeQuiz; $('quiz').addEventListener('cancel', e => { e.preventDefault(); closeQuiz(); });
  function update(dt) {
    if (keys.has('ArrowLeft')) player.yaw += dt * 1.6; if (keys.has('ArrowRight')) player.yaw -= dt * 1.6;
    if (keys.has('ArrowUp')) player.pitch = Math.min(1.35, player.pitch + dt); if (keys.has('ArrowDown')) player.pitch = Math.max(-1.35, player.pitch - dt);
    let f = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0), s = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0), len = Math.hypot(f, s) || 1;
    const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 8 : 4.5) * dt;
    const dx = (-Math.sin(player.yaw) * f + Math.cos(player.yaw) * s) / len * speed, dz = (-Math.cos(player.yaw) * f - Math.sin(player.yaw) * s) / len * speed;
    if (allowed(player.x + dx, player.z)) player.x += dx; if (allowed(player.x, player.z + dz)) player.z += dz;
    if (player.jump > 0 || player.vy > 0) { player.vy -= 13 * dt; player.jump = Math.max(0, player.jump + player.vy * dt); if (player.jump === 0) player.vy = 0; }
    player.y += (ground(player.x, player.z) + 1.7 + player.jump - player.y) * Math.min(1, dt * 18);
    const curacion = botiquines.recoger(player, player.y - 1.7, VidaJugador.recuperarCorazon);
    if (curacion !== null) notify(curacion ? 'Recuperaste un corazón.' : 'Ya tienes todos los corazones.');
    nearest = null; let min = 3.7; for (const b of boxes) { const d = Math.hypot(player.x - b.x, player.z - b.z); if (!b.opened && d < min) { nearest = b; min = d; } }
    $('hint').hidden = !nearest; if (nearest) $('hint').textContent = '[ E ] ' + (nearest.tipo === 'pregunta' ? 'Responder pregunta · escudo activo al abrir' : 'Abrir caja de equipamiento');
  }
  const map = $('mapa').getContext('2d');
  function minimap() {
    map.fillStyle = '#d6b078'; map.fillRect(0, 0, 160, 160); const mx = x => (x / config.tamano + .5) * 160;
    map.strokeStyle = '#ac8e62'; map.lineWidth = .5; for (let i = 0; i <= 160; i += 20) { map.beginPath(); map.moveTo(i, 0); map.lineTo(i, 160); map.moveTo(0, i); map.lineTo(160, i); map.stroke(); }
    map.fillStyle = '#798050'; for (const o of obstacles) { map.fillRect(mx(o.x) - .6, mx(o.z) - .6, 1.2, 1.2); }
    for (const b of boxes) { map.fillStyle = b.opened ? '#756b56' : b.tipo === 'pregunta' ? '#178b4f' : '#c3362e'; map.fillRect(mx(b.x) - 2.5, mx(b.z) - 2.5, 5, 5); }
    botiquines.dibujarEnMinimapa(map, mx);
    map.save(); map.translate(mx(player.x), mx(player.z)); map.rotate(-player.yaw); map.fillStyle = '#fff'; map.strokeStyle = '#26372f'; map.lineWidth = 1.5; map.beginPath(); map.moveTo(0, -7); map.lineTo(4, 5); map.lineTo(0, 3); map.lineTo(-4, 5); map.closePath(); map.fill(); map.stroke(); map.restore();
    $('coords').textContent = Math.round(player.x) + ' / ' + Math.round(player.z);
  }

  //integracion del personaje en el escenario
  // Crear una sola instancia para toda la partida.
  const equipoJugador = new EquipoJugador({
    inventario: inventory,
    avisar: notify,
    puedeUsar: () => active && !player.protected && !VidaJugador.estaMuerto(),
    puedeRecibirDano: () => active && !player.protected && !VidaJugador.estaMuerto()
  });

  window.addEventListener('keydown', evento => {
    if (!active || player.protected || VidaJugador.estaMuerto()) return;
    if (evento.code === 'KeyR') {
      evento.preventDefault();
      if (!evento.repeat) equipoJugador.recibirDano(1);
      return;
    }
    equipoJugador.manejarTecla(evento);
  });

  canvas.addEventListener('mousedown', evento => {
    if (evento.button === 0 && document.pointerLockElement === canvas &&
        active && !player.protected && !VidaJugador.estaMuerto()) {
      equipoJugador.usarArma();
    }
  });

  const terceraPersona = new PersonajeTerceraPersona(gl, {
    equipo: equipoJugador,
    distancia: 8, // Aumenta a 10 si quieres verlo más alejado.
    altura: 1.85,

    // Esta comprobación utiliza el terreno y los obstáculos
    // registrados por tu escenario del desierto.
    bloqueado: (x, y, z) => {
      if (y < ground(x, z) + 0.25) {
        return true;
      }

      return obstacles.some(o => {
        const base = o.box?.y ?? ground(o.x, o.z);

        return (
          y > base - 0.2 &&
          y < base + o.height + 0.3 &&
          Math.hypot(x - o.x, z - o.z) < o.r + 0.3
        );
      });
    }
  });//final de la integracion


  function render(time) {
    const dt = Math.min(.04, (time - previous) / 1000 || 0); previous = time;
    if (active) { update(dt); updateWeather(dt); }
    equipoJugador.actualizar(dt);

    //integración del personaje en escenario
    // En este desierto, player.y representa la altura de los ojos.
    // Restamos 1.7 para obtener la posición de los pies.
    const vista = terceraPersona.actualizar(
      player,
      dt,
      player.y - 1.7
    );//fin de integración

    if ($('quiz').open && solved && returnAt && time >= returnAt) closeQuiz();
    if ($('quiz').open && !solved) { const left = Math.max(0, Math.ceil((deadline - time) / 1000)); $('shield').textContent = 'Escudo activo · ' + left + ' s · movimiento bloqueado'; if (!left) answer(null); }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);

    // Cielo: usar la orientación de la cámara en tercera persona.
    screenPass(skyProgram, skyLoc);
    gl.uniform2f(skyLoc.turn, vista.yaw, vista.pitch);
    gl.uniform1f(skyLoc.aspect, canvas.width / canvas.height);
    gl.uniform1f(skyLoc.storm, storm);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Escenario: usar la posición y orientación de la misma cámara.
    gl.useProgram(program);
    gl.uniform3f(loc.camera, vista.x, vista.y, vista.z);
    gl.uniform2f(loc.turn, vista.yaw, vista.pitch);
    gl.uniform1f(loc.aspect, canvas.width / canvas.height);
    gl.uniform1f(loc.storm, storm);

    gl.enable(gl.DEPTH_TEST);

    // Resolver profundidad entre nubes;
    // limpiar después para el plano del terreno.
    gl.depthMask(true);
    gl.uniform1f(loc.distanceMax, 300);

    gl.uniform3f(
      loc.offset,
      Math.sin(worldTime * .015) * 12,
      0,
      Math.sin(worldTime * .008) * 8
    );

    draw(clouds);

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.depthMask(true);
    gl.uniform3f(loc.offset, 0, 0, 0);
    gl.uniform1f(loc.distanceMax, quality.distance);

    const visibleDistance = quality.distance * (1 - storm) + 28 * storm;
    for (const c of chunks.values()) if (Math.hypot(c.x - player.x, c.z - player.z) < visibleDistance + 24) { draw(c); if (qualityName !== 'low') draw(c.detailMesh); }
    for (const b of boxes) if (Math.hypot(b.x - player.x, b.z - player.z) < visibleDistance + 3) draw(b.opened ? b.openMesh : b);
    botiquines.dibujar(draw, player, visibleDistance);
    // Dibujar el personaje dentro del mundo.
    // La tormenta se dibuja después para cubrirlo también.

    // Parpadear durante el segundo de protección tras un golpe.
    if (VidaJugador.debeDibujarPersonaje()) {
      terceraPersona.dibujar(program, loc);
    }
    if (storm > .005) {
      gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      screenPass(dustProgram, dustLoc); gl.uniform1f(dustLoc.storm, storm); gl.uniform1f(dustLoc.time, worldTime % 120); gl.uniform1f(dustLoc.aspect, canvas.width / canvas.height); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disable(gl.BLEND); gl.depthMask(true); gl.enable(gl.DEPTH_TEST);
    }
    frames++; if (time - fpsStart >= 1000) { $('fps').textContent = Math.round(frames * 1000 / (time - fpsStart)) + ' FPS'; frames = 0; fpsStart = time; }
    if (time - lastUI > 120) { minimap(); lastUI = time; }
    requestAnimationFrame(render);
  }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); pause(); fail('Se perdió el contexto gráfico. Recarga la página para continuar.'); });
  // Contrato pequeño para conectar después el proyecto. No implementa autoridad de servidor.
  window.EscenarioDesierto = Object.freeze({
    version: '2.0.0',
    getState: () => ({ mapa: 'desierto', semilla: config.semilla, clima: { modo: weatherMode, intensidad: storm, tiempo: weatherTime }, jugador: { ...player }, puntos: points, inventario: [...inventory], cajasAbiertas: boxes.filter(b => b.opened).map(b => b.id) }),
    pause, resume, setWeather,
    reset: () => location.reload()
  });
  requestAnimationFrame(render);
})();
