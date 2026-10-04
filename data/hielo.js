// Integración corregida con escenario(5).js y escenario.html proporcionados.
// Cámara alineada con escenario.js: mundo, cielo y agua usan la misma orientación.
// Límites de inclinación: -0.85 / +0.55. El módulo general del personaje no cambia.
/* Mundo FreeSIMON · WebGL 1, recursos locales, sin CDN.
   Conserva los contratos del proyecto: personajes, vida, combate, preguntas,
   botiquines, temporizador y supervivencia. Consulta LEEME.md para el HTML. */
(() => {
'use strict';
const $ = id => document.getElementById(id), canvas = $('mundo'), config = window.HIELO_CONFIG;
const MAP_ID='hielo';
const gl = canvas.getContext('webgl', {antialias:false, alpha:false, powerPreference:'low-power'});
function fail(message) { $('error').hidden=false; $('error').textContent=message; $('play').disabled=true; }
if (!gl) { fail('No se pudo iniciar WebGL. Prueba con la aceleración gráfica del navegador activada y un controlador compatible.'); return; }
if (!config) { fail('Falta hielo.config.js. Mantén todos los archivos juntos.'); return; }
// 1. Dependencias: usa las mismas versiones compartidas de tu desierto.
const faltantes=[];
if(typeof PersonajesKaku==='undefined')faltantes.push('PersonajesKaku');
if(typeof VidaJugador==='undefined')faltantes.push('VidaJugador');
if(typeof PersonajeTerceraPersona==='undefined')faltantes.push('PersonajeTerceraPersona');
if(typeof EquipoJugador==='undefined')faltantes.push('EquipoJugador');
if(typeof BotiquinesJugador==='undefined')faltantes.push('BotiquinesJugador');
if(typeof TemporizadorJuego==='undefined')faltantes.push('TemporizadorJuego');
if(typeof Supervivencia==='undefined')faltantes.push('Supervivencia');
if(typeof FlechasEscenario==='undefined')faltantes.push('FlechasEscenario');
if(typeof EnemigosSistema==='undefined')faltantes.push('EnemigosSistema');
if(typeof CombateSistema==='undefined')faltantes.push('CombateSistema');
if(typeof ENEMIGOS_CONFIG==='undefined')faltantes.push('ENEMIGOS_CONFIG');
if(faltantes.length){fail('Faltan módulos del proyecto: '+faltantes.join(', ')+'. Comprueba que los módulos compartidos de tu proyecto estén en las rutas de este HTML.');return;}
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

try {
 config.preguntas = cargarPreguntasDocente();
} catch (error) {
 fail(error.message);
 return;
}
const presets={low:{distance:170,scale:.65},medium:{distance:210,scale:.85},high:{distance:260,scale:1}};
let quality=presets.low, qualityName='low', seed=config.semilla>>>0;
let worldTime=0;
const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const half=config.tamano/2, chunkSize=32, chunks=new Map(), obstacles=[], boxes=[], surfaces=[], waterData=[], solidRects=[], hazards=[];
const player={x:config.inicio.x,z:config.inicio.z,y:0,yaw:config.inicio.yaw||0,pitch:0,feet:24,grounded:true,vy:0,protected:false};
let active=false, points=0, inventory=[], keys=new Set(), nearest=null, questionBox=null, deadline=0, solved=false, returnAt=0;

VidaJugador.configurar({
 puedeRecibirGolpe:()=>active&&!player.protected,
 alMorir:()=>{
  active=false;
  keys.clear();
  player.vy=0;
  release();
  $('hint').hidden=true;
  $('overlay').hidden=true;
 }
});

let previous=0,fpsStart=0,frames=0,lastUI=0,toastTimer,drag=false;
let checkpoint={x:config.inicio.x,z:config.inicio.z,y:24},falls=0,currentIsland='inicio';
function surfaceAt(x,z,limit=Infinity){
 let best=null;
 for(const p of surfaces){
 let y;
 if(p.type==='bridge'){
 const dx=x-p.ax,dz=z-p.az,t=(dx*p.ux+dz*p.uz)/p.length,side=Math.abs(dx*(-p.uz)+dz*p.ux);
 if(t<0||t>1||side>p.width/2)continue;y=p.ay+(p.by-p.ay)*t-Math.sin(t*Math.PI)*.55;
 }else{if(Math.abs(x-p.x)>p.w/2||Math.abs(z-p.z)>p.d/2)continue;y=p.y;}
 if(y>limit)continue;
 if(!best||y>best.y)best={y,island:p.island||null};
 }
 return best;
}
function ground(x,z){return surfaceAt(x,z)?.y??-100;}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
// Precisión explícita e idéntica en toda variable compartida entre shaders.
function makeProgram(vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
let program,skyProgram,waterProgram;
try {
 const worldVS=`
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
 // 2. Luz y niebla. La oscuridad conserva un mínimo visible configurable.
 const materialFS=`precision mediump float;
 varying mediump vec3 vColor; varying mediump float depth;
 uniform mediump float distanceMax;
 uniform float ambiente; uniform float clima;
 void main(){
  vec3 fogColor=${MAP_ID==='castillo'?'vec3(0.075,0.064,0.11)':'vec3(0.73,0.85,0.92)'};
  float fog=smoothstep(distanceMax*mix(0.40,0.12,clima),distanceMax*mix(1.0,0.60,clima),depth);
  vec3 lit=vColor*ambiente;
  ${MAP_ID==='castillo'?`// Las llamas se apagan; queda una luz azulada para ver el recorrido.
  float flame=step(0.74,vColor.r)*step(0.30,vColor.g)*(1.0-step(0.26,vColor.b));
  lit=mix(lit,vColor*ambiente*1.3,flame);
  lit+=vColor*vec3(0.02,0.03,0.06)*(1.0-ambiente);`:''}
  gl_FragColor=vec4(mix(lit,fogColor*ambiente,fog),1.0);
 }`;
 program=makeProgram(worldVS,materialFS);
 waterProgram=makeProgram(worldVS,materialFS);
 const screenVS=`attribute vec2 position; varying mediump vec2 uv; void main(){uv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}`;
 skyProgram=makeProgram(screenVS,`
 precision mediump float; varying mediump vec2 uv;
 uniform vec2 turn; uniform float aspect; uniform float ambiente; uniform float clima;
 void main(){
 vec2 p=uv*2.0-1.0;vec3 q=normalize(vec3(p.x*aspect/1.3,p.y/1.3,-1.0));
 float c=cos(turn.y),s=sin(turn.y);q=vec3(q.x,c*q.y-s*q.z,s*q.y+c*q.z);
 c=cos(turn.x);s=sin(turn.x);vec3 ray=vec3(c*q.x+s*q.z,q.y,-s*q.x+c*q.z);
 float elevation=max(0.0,ray.y);
 vec3 sky=mix(vec3(0.73,0.85,0.92),vec3(0.30,0.57,0.78),smoothstep(0.0,0.8,elevation));
 vec2 sunLocal=vec2(ray.x,ray.y)/max(0.01,-ray.z)-vec2(-0.646,0.8);
 float square=max(abs(sunLocal.x),abs(sunLocal.y));
 float halo=(1.0-smoothstep(0.06,0.28,length(sunLocal)))*step(0.0,-ray.z);
 sky+=vec3(0.10,0.06,0.01)*halo;
 if(ray.z<0.0&&square<0.065)sky=vec3(1.0,0.95,0.70);
 sky=mix(sky,vec3(0.85,0.93,0.98),(1.0-smoothstep(-0.7,-0.05,ray.y)));
 sky=${MAP_ID==='castillo'?'vec3(0.055,0.06,0.10)':'mix(sky,vec3(0.78,0.87,0.94),clima*.72)'};
 gl_FragColor=vec4(sky*ambiente,1.0);}`);
} catch(error){fail('No se pudo preparar el escenario: '+error.message);return;}
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(.79,.83,.77,1);
const loc={};['position','color'].forEach(k=>loc[k]=gl.getAttribLocation(program,k));
['camera','offset','turn','aspect','distanceMax','ambiente','clima'].forEach(k=>loc[k]=gl.getUniformLocation(program,k));
const skyLoc={},waterLoc={};
for(const [p,l,names] of [[skyProgram,skyLoc,['turn','aspect','ambiente','clima']],[waterProgram,waterLoc,['camera','offset','turn','aspect','distanceMax','time','ambiente','clima']]]){l.position=gl.getAttribLocation(p,'position');if(p===waterProgram)l.color=gl.getAttribLocation(p,'color');for(const n of names)l[n]=gl.getUniformLocation(p,n);}
const screenBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,screenBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
function screenPass(p,l){gl.useProgram(p);gl.disableVertexAttribArray(loc.position);gl.disableVertexAttribArray(loc.color);gl.bindBuffer(gl.ARRAY_BUFFER,screenBuffer);gl.enableVertexAttribArray(l.position);gl.vertexAttribPointer(l.position,2,gl.FLOAT,false,0,0);}
function dataAt(x,z){const key=Math.floor((x+half)/chunkSize)+','+Math.floor((z+half)/chunkSize);if(!chunks.has(key))chunks.set(key,{x:Math.floor((x+half)/chunkSize)*chunkSize-half+16,z:Math.floor((z+half)/chunkSize)*chunkSize-half+16,data:[],details:[]});return chunks.get(key).data;}
function detailAt(x,z){dataAt(x,z);return chunks.get(Math.floor((x+half)/chunkSize)+','+Math.floor((z+half)/chunkSize)).details;}
function quad(arr,a,b,c,d,col,light=1){for(const v of [a,b,c,a,c,d])arr.push(...v,col[0]*light,col[1]*light,col[2]*light);}
function cube(arr,x,y,z,w,h,d,col){const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2,t=y+h;
quad(arr,[a,t,c],[b,t,c],[b,t,e],[a,t,e],col,1);
quad(arr,[a,y,e],[b,y,e],[b,t,e],[a,t,e],col,.78);
quad(arr,[b,y,c],[a,y,c],[a,t,c],[b,t,c],col,.64);
quad(arr,[a,y,c],[a,y,e],[a,t,e],[a,t,c],col,.72);
quad(arr,[b,y,e],[b,y,c],[b,t,c],[b,t,e],col,.88);
}
// =============================================================
// CONSTRUCCIÓN DEL MAPA. Geometría estática agrupada por sectores.
// Los detalles pequeños se omiten en calidad baja.
// =============================================================
const BIOME=MAP_ID;
function platform(x,z,y,w,d,color){
 cube(dataAt(x,z),x,y-.35,z,w,.35,d,color);
 surfaces.push({x,z,y,w,d});
 solidRects.push({x,z,w,d,bottom:y-.35,top:y});
}
function block(x,z,y,w,h,d,color,collision=true){
 cube(dataAt(x,z),x,y,z,w,h,d,color);
 if(!collision)return;
 solidRects.push({x,z,w,d,bottom:y,top:y+h});
 // El módulo NPC utiliza obstáculos circulares. Dividir las paredes evita
 // que atraviese la mampostería, sin cerrar los pasos abiertos.
 if(y>3.8)return; // Arcos y techos permiten el paso de los NPC por debajo.
 const nx=Math.max(1,Math.ceil(w/1.5)),nz=Math.max(1,Math.ceil(d/1.5));
 for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++)obstacles.push({
  x:x-w/2+(ix+.5)*w/nx,z:z-d/2+(iz+.5)*d/nz,y,r:Math.max(w/nx,d/nz)*.55,
  height:h,h
 });
}
function reserved(x,z,r=4){return Math.hypot(x-config.inicio.x,z-config.inicio.z)<7||config.cajas.some(b=>Math.hypot(x-b.x,z-b.z)<r)||config.islas.some(p=>Math.hypot(x-p.x,z-p.z)<r);}
function pillar(x,z,h,col){block(x,z,2,1.5,h,1.5,col);cube(dataAt(x,z),x,2,z,2,.4,2,col);cube(dataAt(x,z),x,2+h-.3,z,2,.4,2,col);}
function hazardOn(){return false;}
const apparitionData=[];
if(BIOME==='castillo'){
 // Una sola superficie de colisión; las baldosas son solo geometría.
 platform(0,0,2,160,160,[.43,.42,.48]);
 // Suelo por baldosas, corredores anchos y techo real (con cara inferior).
 for(let x=-78;x<80;x+=4)for(let z=-78;z<80;z+=4){
  const col=((x+z)/4)%2===0?[.39,.38,.44]:[.47,.46,.51];
  cube(dataAt(x,z),x,1.996,z,4,.009,4,col);

 }
 cube(dataAt(0,0),0,2.018,0,13,.02,158,[.36,.075,.16]);
 for(const x of [-6.4,6.4])cube(dataAt(0,0),x,2.041,0,.09,.012,158,[.61,.43,.23]);
 const stone=[.43,.42,.49];
 function masonry(x,z,w,d,h=11){
  block(x,z,2,w,h,d,stone);
  // Juntas de piedra y zócalos: se dibujan como detalles baratos.
  const a=detailAt(x,z),wide=w>=d;
  for(let yy=2.1;yy<2+h;yy+=1.35){
   cube(a,x,yy,z,wide?w+.02:w+.025,.055,wide?d+.025:d+.02,[.26,.26,.32]);
   for(let t=-(wide?w:d)/2+1;t<(wide?w:d)/2;t+=2.6)
    cube(a,x+(wide?t:0),yy,z+(wide?0:t),wide?.055:w+.04,1.3,wide?d+.04:.055,[.29,.28,.34]);
  }
  cube(dataAt(x,z),x,2,z,w+.12,.32,d+.12,[.28,.27,.33]);
 }
 masonry(0,-80,160,2);masonry(0,80,160,2);masonry(-80,0,2,160);masonry(80,0,2,160);
 // Galerías a ambos lados. Tres puertas anchas en cada pared longitudinal.
 for(const x of [-22,22])for(const [z,d] of [[-69,22],[-28,36],[28,36],[69,22]])masonry(x,z,1.6,d);
 for(const z of [-27,27])for(const x of [-65,-31,31,65])masonry(x,z,x===-65||x===65?28:18,1.6);
 // Arcos sin obstáculos a la altura de la cabeza.
 for(const x of [-22,22])for(const z of [-52,0,52]){
  block(x,z,9.4,2.2,3.6,12,stone);
  for(const side of [-1,1])block(x,z+side*5.3,2,2.2,7.4,1.3,[.54,.52,.60]);
 }
 for(let x=-72;x<=72;x+=16)for(let z=-72;z<=72;z+=16){
  // Bajo del techo: cube() no genera caras inferiores.
  quad(dataAt(x,z),[x-8,13,z-8],[x+8,13,z-8],[x+8,13,z+8],[x-8,13,z+8],[.24,.23,.30]);
  solidRects.push({x,z,w:16,d:16,bottom:13,top:14});
 }
 for(const z of [-68,-36,4,36,68])for(const x of [-15,15])pillar(x,z,10.8,[.51,.49,.57]);
 function candle(x,z,y){
  const a=dataAt(x,z);cube(a,x,y,z,.16,.65,.16,[.89,.80,.61]);
  cube(a,x,y+.65,z,.14,.25,.14,[1,.66,.18]);cube(a,x,y-.08,z,.45,.09,.45,[.40,.30,.17]);
 }
 // Candelabros suspendidos y antorchas. No se usan sombras en tiempo real.
 for(const z of [-54,-18,18,54]){
  const a=dataAt(0,z);cube(a,0,8.8,z,.12,4.2,.12,[.25,.23,.28]);cube(a,0,8.6,z,6,.16,.20,[.35,.29,.19]);
  cube(a,0,8.6,z,.2,.16,4,[.35,.29,.19]);for(const x of [-2.7,2.7])candle(x,z,8.75);for(const dz of [-1.7,1.7])candle(0,z+dz,8.75);
 }
 for(const x of [-19,19,-75,75])for(const z of [-65,-35,0,35,65]){
  const a=dataAt(x,z);cube(a,x,4.2,z,.22,1.1,.22,[.40,.24,.15]);cube(a,x,5.3,z,.35,.65,.35,[1,.65,.14]);
 }
 // Ventanas lunares y retratos inquietantes en las galerías laterales.
 for(const x of [-78.94,78.94])for(const z of [-64,-44,-4,16,48,68]){
  const a=dataAt(x,z);cube(a,x,4.6,z,.06,5,3,[.14,.25,.43]);
  cube(a,x+(x<0?.05:-.05),4.6,z,.07,5,.14,[.12,.11,.18]);
  cube(a,x+(x<0?.05:-.05),7,z,.07,.14,3,[.12,.11,.18]);
 }
 // Biblioteca: estanterías altas, libros multicolores y mesa central.
 for(const z of [34,43,62,71])for(const x of [-69,-35]){
  block(x,z,2,8,5.5,1.5,[.27,.17,.14]);const a=detailAt(x,z);
  for(let y=2.5;y<7;y+=1.4)for(let dx=-3.5;dx<4;dx+=.65){
   const colors=[[.48,.14,.19],[.18,.33,.28],[.34,.25,.46],[.56,.39,.18]];
   cube(a,x+dx,y,z+.81,.5,.85+random()*.3,.18,colors[Math.floor(random()*4)]);
  }
 }
 block(-52,51,2,9,1.1,3,[.35,.23,.16]);for(const x of [-55,-49])candle(x,51,3.1);
 // Cripta: sarcófagos, cruces y pequeños cráneos cúbicos.
 for(const z of [-12,12])for(const x of [-66,-50,-34]){
  block(x,z,2,3,1.3,6,[.38,.37,.44]);cube(dataAt(x,z),x,3.3,z,3.3,.28,6.3,[.54,.53,.58]);
  cube(dataAt(x,z),x,3.61,z,.23,.04,2.7,[.23,.21,.29]);cube(dataAt(x,z),x,3.61,z-.5,1.3,.04,.23,[.23,.21,.29]);
  const a=detailAt(x,z);cube(a,x,3.65,z+2,.52,.43,.45,[.79,.76,.65]);for(const dx of [-.14,.14])cube(a,x+dx,3.82,z+2.23,.1,.11,.03,[.10,.09,.13]);
 }
 // Comedor abandonado y celdas con entradas abiertas.
 for(const z of [40,64]){
  block(52,z,2,21,1.2,3,[.31,.21,.18]);for(const x of [44,52,60])candle(x,z,3.2);
  for(const x of [43,49,55,61])for(const side of [-1,1])block(x,z+side*3.1,2,1.3,.8,1.2,[.32,.22,.19]);
 }
 for(const x of [35,51,67]){
  block(x,-61,2,1,6,28,[.34,.33,.40]);
  for(let dx=1;dx<9;dx+=1.1)block(x+dx,-47,2,.12,5,.12,[.22,.23,.28]);
  block(x+5,-67,2,3,.55,5,[.26,.24,.30]);
 }
 // Trono al fondo, pendones y altar. La alfombra señala la ruta principal.
 block(0,-70,2,9,.45,7,[.48,.45,.52]);block(0,-72,2.45,3,1.3,2,[.34,.12,.22]);
 block(0,-73,3.2,3,4,.5,[.40,.13,.23]);for(const x of [-1.7,1.7])block(x,-72,2.45,.45,2.3,2,[.66,.47,.22]);
 for(const x of [-8,8]){cube(dataAt(x,-78),x,5,-78,3.2,5,.08,[.42,.07,.18]);cube(dataAt(x,-78),x,6,-77.94,.3,2.5,.04,[.73,.53,.27]);}
 // Telarañas geométricas. Decoración, sin bloquear el recorrido.
 for(const x of [-20,20,-77,77])for(const z of [-76,-25,25,76]){
  const a=detailAt(x,z);for(let i=1;i<=4;i++){
   cube(a,x,10+i*.45,z,3-i*.5,.025,.025,[.65,.67,.71]);
   cube(a,x+(i-2)*.4,10,z,.025,1.8,.025,[.65,.67,.71]);
  }
 }
 // Apariciones decorativas flotantes. No son NPC ni causan daño.
 for(const [x,z] of [[-52,-49],[52,8]]){
  cube(apparitionData,x,4,z,1.2,1.5,.7,[.49,.67,.73]);cube(apparitionData,x,5.5,z,.8,.55,.7,[.61,.76,.79]);
  for(const dx of [-.20,.20])cube(apparitionData,x+dx,5.67,z+.36,.13,.13,.03,[.035,.045,.07]);
  for(const dx of [-.4,0,.4])cube(apparitionData,x+dx,3.75,z,.25,.4,.6,[.42,.59,.67]);
 }
}else{
 // Hielo transitable; el lago es sólido, no agua que provoque caídas.
 platform(0,0,2,176,176,[.83,.92,.96]);
 for(let x=-84;x<88;x+=4)for(let z=-84;z<88;z+=4){
  const lake=(x/27)**2+((z+7)/37)**2<1;
  const v=random()*.055;
  cube(dataAt(x,z),x,1.996,z,4,.009,4,lake?[.37+v,.70+v,.82+v]:[.83+v,.91+v,.96]);
  if(lake){
   // Líneas de fractura bajo la superficie, puramente visuales.
   if(random()<.22)cube(detailAt(x,z),x,2.014,z,.035,.012,2.6,[.68,.88,.94]);
  }else if(random()<.10)cube(detailAt(x,z),x,2.01,z,.7,.055,.6,[.94,.98,1]);
 }
 function pine(x,z,h){
  block(x,z,2,.65,h*.7,.65,[.32,.24,.20]);
  const a=dataAt(x,z);
  for(let j=0;j<3;j++){
   const size=4.8-j*1.25,y=3+j*h*.22;
   cube(a,x,y,z,size,h*.22,size,[.19,.35,.37]);cube(a,x,y+h*.22-.10,z,size+.1,.20,size+.1,[.87,.95,.98]);
  }
  cube(a,x,3+h*.66,z,1.3,1.4,1.3,[.80,.92,.97]);
 }
 for(let i=0,tries=0;i<82&&tries<2000;tries++){
  const x=(random()-.5)*156,z=(random()-.5)*156;
  if(Math.abs(x)<31||reserved(x,z,7)||Math.hypot(x+48,z-28)<15||Math.hypot(x-48,z+35)<17||obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<6))continue;
  pine(x,z,5+random()*4);i++;
 }
 function snowman(x,z,hatColor){
  block(x,z,2,1.4,1.2,1.3,[.90,.97,1]);const a=dataAt(x,z);
  cube(a,x,3.2,z,1.05,.95,1.0,[.94,.99,1]);cube(a,x,4.15,z,.78,.7,.75,[.96,.99,1]);
  cube(a,x,4.10,z,1.13,.15,1.09,hatColor);cube(a,x+.43,3.60,z+.54,.2,.58,.12,hatColor);
  cube(a,x,4.86,z,1,.10,.95,[.16,.21,.28]);cube(a,x,4.96,z,.62,.5,.62,hatColor);
  for(const dx of [-.2,.2])cube(a,x+dx,4.55,z+.385,.10,.10,.045,[.10,.15,.20]);
  cube(a,x,4.35,z+.56,.15,.15,.45,[.96,.45,.12]);
  for(const yy of [3.4,3.7,3.95])cube(a,x,yy,z+.51,.10,.1,.04,[.13,.18,.22]);
  for(const side of [-1,1]){cube(a,x+side*.98,3.7,z,1.05,.09,.10,[.39,.29,.20]);cube(a,x+side*1.4,3.71,z,.09,.35,.1,[.39,.29,.20]);}
 }
 for(const [x,z] of [[-9,60],[9,60],[-32,42],[30,24],[-32,-16],[29,-42],[-48,-50],[52,52],[0,-59]])snowman(x,z,random()>.5?[.63,.14,.25]:[.15,.32,.56]);
 function igloo(x,z){
  for(let layer=0;layer<5;layer++){
   const r=6-layer*.7,y=2+layer*1.05,n=Math.ceil(r*6);
   for(let i=0;i<n;i++){
    const angle=i/n*Math.PI*2,dx=Math.sin(angle)*r,dz=Math.cos(angle)*r;
    if(layer<3&&dz>0&&Math.abs(dx)<2.1)continue; // Puerta mirando al sur.
    block(x+dx,z+dz,y,1.2,1.02,1.2,[.78+layer*.025,.89+layer*.012,.96]);
   }
  }
  const a=dataAt(x,z);cube(a,x,7.25,z,5,.5,5,[.88,.95,.99]);
  quad(a,[x-2.5,7.25,z-2.5],[x+2.5,7.25,z-2.5],[x+2.5,7.25,z+2.5],[x-2.5,7.25,z+2.5],[.65,.81,.89]);
  solidRects.push({x,z,w:5,d:5,bottom:7.25,top:7.75});
  for(const side of [-1,1])block(x+side*2.1,z+7,2,1,2.5,4,[.86,.94,.98]);
  block(x,z+7,4.5,5,1,4,[.88,.96,1]);
 }
 igloo(-48,28);igloo(48,-35);
 // Columnas azules y pasos alternos alrededor del lago.
 for(const [x,z,h] of [[-34,3,7],[34,-6,9],[-30,-35,5],[32,45,6],[-60,-27,8],[60,10,8]]){
  block(x,z,2,3,h,3,[.40,.72,.86]);cube(dataAt(x,z),x,2+h,z,3.15,.35,3.15,[.87,.97,1]);
  for(const dx of [-2.4,2.4])block(x+dx,z+1,2,1.3,h*.45,1.4,[.51,.80,.91]);
 }
 // Arcos helados y ruinas al norte. Pasos amplios para la cámara.
 for(const z of [-65,-76]){
  for(const x of [-10,10])block(x,z,2,2.5,7,2.5,[.41,.73,.86]);
  block(0,z,9,22,1.2,3,[.61,.86,.94]);
 }
 // Límite montañoso; cerrado para jugador y NPC.
 for(let side=0;side<4;side++)for(let t=-84;t<=84;t+=8){
  const x=side<2?t:(side===2?-88:88),z=side<2?(side===0?-88:88):t;
  const h=9+random()*10;block(x,z,0,8,h,8,[.54,.71,.80]);
  cube(dataAt(x,z),x,h-.8,z,8.1,1.2,8.1,[.88,.96,1]);cube(dataAt(x,z),x,h+.4,z,5,2,5,[.91,.97,1]);
 }
}

function upload(data){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer,count:data.length/6};}
for(const c of chunks.values()){Object.assign(c,upload(c.data));c.detailMesh=upload(c.details);delete c.data;delete c.details;}
const water=upload(waterData);for(const h of hazards){h.mesh=upload(h.data);delete h.data;}
player.feet=ground(player.x,player.z);player.y=player.feet+1.7;checkpoint.y=player.feet;
// Cofres con tablillas, cantoneras, remaches, asas y emblema de cada tipo.
function chestGeometry(b,opened){
 const a=[],lid=[],x=b.x,y=b.y,z=b.z;
 const color=b.tipo==='pregunta'?[.16,.53,.29]:[.66,.19,.14],iron=[.25,.29,.27],brass=[.91,.70,.32];
 cube(a,x,y,z,1.62,.14,1.42,iron);
 for(let i=0;i<4;i++)cube(a,x,y+.15+i*.195,z,1.5,.18,1.3,color.map(v=>v*(i%2?.95:1.08)));
 cube(a,x,y+.94,z,1.5,.04,1.3,[.12,.17,.12]);
 for(const sx of [-1,1])for(const sz of [-1,1]){
 cube(a,x+sx*.70,y+.12,z+sz*.59,.16,.85,.16,iron);
 for(const h of [.24,.76])cube(a,x+sx*.7,y+h,z+sz*.688,.055,.06,.035,brass);
 }
 for(const sx of [-1,1]){cube(a,x+sx*.79,y+.48,z,.08,.13,.45,brass);cube(a,x+sx*.84,y+.32,z,.055,.2,.055,iron);}
 cube(a,x,y+.42,z+.70,.22,.33,.10,brass);cube(a,x,y+.55,z+.76,.07,.10,.015,[.13,.15,.13]);
 // Tapa local, que se gira alrededor de la bisagra al quedar consumido el cofre.
 cube(lid,0,0,0,1.66,.18,1.46,color.map(v=>Math.min(1,v*1.25)));
 cube(lid,0,.18,0,1.35,.12,1.25,color.map(v=>Math.min(1,v*1.15)));
 for(const sx of [-1,1])cube(lid,sx*.57,0,0,.12,.31,1.49,brass);
 for(const sx of [-1,1])cube(lid,sx*.52,-.06,-.72,.25,.15,.12,iron);
 const symbol=[1,.92,.68];
 if(b.tipo==='pregunta'){
 cube(lid,-.15,.315,0,.25,.025,.48,symbol);cube(lid,.15,.315,0,.25,.025,.48,symbol);cube(lid,0,.315,0,.035,.03,.51,brass);
 }else{cube(lid,0,.315,-.05,.085,.03,.65,symbol);cube(lid,0,.315,.19,.4,.035,.085,brass);cube(lid,0,.315,.34,.10,.035,.2,iron);}
 const angle=opened?1.13:0,c=Math.cos(angle),sn=Math.sin(angle);
 for(let i=0;i<lid.length;i+=6){const ly=lid[i+1],lz=lid[i+2]+.73;a.push(lid[i]+x,ly*c+lz*sn+y+.99,-ly*sn+lz*c+z-.73,lid[i+3],lid[i+4],lid[i+5]);}
 return a;
}
let indicePreguntaCaja=0;
for(const item of config.cajas){const b={...item,y:ground(item.x,item.z),opened:false};
 if(b.tipo==='pregunta')b.pregunta=indicePreguntaCaja++%config.preguntas.length;
 Object.assign(b,upload(chestGeometry(b,false)));b.openMesh=upload(chestGeometry(b,true));boxes.push(b);obstacles.push({x:b.x,z:b.z,r:1.05,height:1.5,y:b.y,h:1.5,box:b});}
let modoSupervivencia;
try{modoSupervivencia=Supervivencia.prepararCajas(BIOME,boxes.filter(b=>b.tipo==='pregunta'));}catch(error){fail(error.message);return;}
const botiquines=BotiquinesJugador.crear({cube,upload,ground,obstacles,boxes,surfaces,hazards,rects:solidRects,inicio:config.inicio,tamano:config.tamano,semilla:config.semilla});
const cloudData=[];
if(BIOME==='hielo')for(let i=0;i<18;i++){const x=(random()-.5)*340,z=(random()-.5)*340,y=48+random()*12;cube(cloudData,x,y,z,16,3,9,[.96,.98,1]);quad(cloudData,[x-8,y,z-4.5],[x+8,y,z-4.5],[x+8,y,z+4.5],[x-8,y,z+4.5],[.76,.85,.91]);}
const clouds=upload(cloudData);
// =============================================================
// 3. APAGONES / NEVADAS. El reloj avanza solo mientras se juega.
// Cambia frecuencia, duración e intensidad desde el .config.js.
// =============================================================
const apariciones=upload(apparitionData);
let intensidadClima=0,luzAmbiente=1,ultimoEstadoClima='';
// Mismos modos y controles que escenario.js: auto, clear, storm y tecla T.
let weatherMode=['auto','clear','storm'].includes(config.clima?.modo)?config.clima.modo:'auto';
function setWeather(mode){
 if(!['auto','clear','storm'].includes(mode))return;
 weatherMode=mode;
 $('weather').value=mode;
 ultimoEstadoClima='';
 // La transición visual continúa suavemente cuando se reanuda el juego.
}
$('weather').value=weatherMode;
$('weather').onchange=()=>setWeather($('weather').value);
function actualizarAmbiente(dt){
 const c=config.clima||{},primero=Math.max(0,Number(c.primerEvento)||25);
 const duracion=Math.max(4,Number(c.duracion)||12);
 const intervalo=Math.max(duracion+8,Number(c.intervalo)||75);
 const t=worldTime-primero,fase=((t%intervalo)+intervalo)%intervalo;
 const ocurriendo=c.activo!==false&&(weatherMode==='storm'||(weatherMode==='auto'&&t>=0&&fase<duracion));
 // Entradas y salidas suaves: sin destellos repetidos ni pantalla negra.
 const objetivo=ocurriendo?(weatherMode==='storm'?1:Math.min(1,fase/1.4,(duracion-fase)/1.4)):0;
 intensidadClima+=(objetivo-intensidadClima)*Math.min(1,dt*5);
 const minimo=Math.min(.65,Math.max(.18,Number(c.luzMinima)||.26));
 luzAmbiente=BIOME==='castillo'?1-(1-minimo)*intensidadClima:1;
 const estado=BIOME==='castillo'?(ocurriendo?'Apagón · sigue la alfombra':'Antorchas encendidas'):(ocurriendo?'Nevada en curso':'Cielo despejado');
 if(estado!==ultimoEstadoClima){
  ultimoEstadoClima=estado;$('weatherName').textContent=estado;
  $('weatherHelp').textContent=BIOME==='castillo'?'T · cambiar luces | V · punto seguro':'T · cambiar clima | V · punto seguro';
  $('weatherBadge').classList.toggle('storm',ocurriendo);
  emit('escenario:clima',{mapa:MAP_ID,activo:ocurriendo});
 }
}
// Los copos existen en el mundo 3D: cambian de perspectiva con la cámara
// y respetan la profundidad de objetos y personajes. Una sola llamada de dibujo.
let nieveProgram=null,nieveLoc={},nieveBuffer=null;
if(BIOME==='hielo'){
 try{
 nieveProgram=makeProgram(`
 attribute vec3 position;
 uniform vec3 camera;uniform vec3 origin;uniform vec2 turn;
 uniform float aspect;uniform float time;uniform float scale;
 void main(){
  vec3 wp=vec3(mod(position.x+time*.6-origin.x+30.0,60.0)-30.0+origin.x,
   mod(position.y-time*4.0-origin.y+12.0,24.0)-12.0+origin.y,
   mod(position.z-origin.z+30.0,60.0)-30.0+origin.z);
  vec3 p=wp-camera;float c=cos(turn.x),s=sin(turn.x);
  vec3 q=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);
  c=cos(turn.y);s=sin(turn.y);q=vec3(q.x,c*q.y+s*q.z,-s*q.y+c*q.z);
  float d=-q.z,n=.08,f=160.0;
  gl_Position=vec4(q.x*1.3/aspect,q.y*1.3,(f+n)/(f-n)*d-2.0*f*n/(f-n),d);
  gl_PointSize=clamp(36.0/max(1.0,d),1.5,5.0)*scale;
 }`,`precision mediump float;uniform float intensity;
 void main(){float a=(1.0-smoothstep(.28,.5,length(gl_PointCoord-.5)))*intensity*.82;
 if(a<.02)discard;gl_FragColor=vec4(.93,.98,1.0,a);}`);
 }catch(error){fail('No se pudo preparar la nieve: '+error.message);return;}
 nieveLoc.position=gl.getAttribLocation(nieveProgram,'position');
 for(const k of ['camera','origin','turn','aspect','time','scale','intensity'])nieveLoc[k]=gl.getUniformLocation(nieveProgram,k);
 const particles=[];for(let i=0;i<700;i++)particles.push(random()*60,random()*24,random()*60);
 nieveBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,nieveBuffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(particles),gl.STATIC_DRAW);
}
function dibujarNieve(vista){
 if(!nieveProgram||intensidadClima<.01)return;
 gl.useProgram(nieveProgram);gl.enable(gl.DEPTH_TEST);gl.depthMask(false);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 gl.bindBuffer(gl.ARRAY_BUFFER,nieveBuffer);gl.disableVertexAttribArray(loc.color);
 gl.enableVertexAttribArray(nieveLoc.position);gl.vertexAttribPointer(nieveLoc.position,3,gl.FLOAT,false,12,0);
 gl.uniform3f(nieveLoc.camera,vista.x,vista.y,vista.z);
 gl.uniform3f(nieveLoc.origin,player.x,player.feet+8,player.z);
 gl.uniform2f(nieveLoc.turn,vista.yaw,vista.pitch);
 gl.uniform1f(nieveLoc.aspect,canvas.width/canvas.height);
 gl.uniform1f(nieveLoc.time,worldTime%600);gl.uniform1f(nieveLoc.scale,quality.scale);
 gl.uniform1f(nieveLoc.intensity,intensidadClima);
 gl.drawArrays(gl.POINTS,0,qualityName==='low'?220:qualityName==='medium'?420:700);
 gl.disable(gl.BLEND);gl.depthMask(true);
}

function draw(mesh,attributes=loc){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.enableVertexAttribArray(attributes.position);gl.vertexAttribPointer(attributes.position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(attributes.color);gl.vertexAttribPointer(attributes.color,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
function resize(){const scale=quality.scale;canvas.width=Math.max(1,Math.floor(innerWidth*scale));canvas.height=Math.max(1,Math.floor(innerHeight*scale));gl.viewport(0,0,canvas.width,canvas.height);}
addEventListener('resize',resize);resize();
$('quality').onchange=()=>{qualityName=$('quality').value;quality=presets[qualityName];$('qualityLabel').textContent='Calidad '+({low:'baja',medium:'media',high:'alta'}[$('quality').value]);resize();};
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
function release(){if(document.pointerLockElement===canvas)document.exitPointerLock();keys.clear();drag=false;}
function resume(){if($('quiz').open||VidaJugador.estaMuerto())return;TemporizadorJuego.iniciar();active=true;$('overlay').hidden=true;previous=performance.now();try{const req=canvas.requestPointerLock();if(req&&req.catch)req.catch(()=>notify('Arrastra con el ratón o usa las flechas para mirar.'));}catch{notify('Arrastra con el ratón para mirar.');}}
function pause(){active=false;$('overlay').hidden=false;$('play').firstChild.textContent='Continuar exploración ';$('hint').hidden=true;release();}
$('play').onclick=resume;$('menuBtn').onclick=pause;
$('returnRooms').onclick=()=>{release();window.location.href='../html/panel_sala.html';};
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&active&&!$('quiz').open)pause();});
canvas.addEventListener('mousedown',e=>{if(active&&e.button===0)drag=true;});addEventListener('mouseup',()=>drag=false);
addEventListener('mousemove',e=>{if(!active||$('quiz').open)return;if(document.pointerLockElement===canvas||drag){player.yaw-=e.movementX*.0025;player.pitch=Math.max(-.85,Math.min(.55,player.pitch-e.movementY*.0025));}});
addEventListener('blur',()=>{keys.clear();if(active)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause();});
const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'];
addEventListener('keydown',e=>{if(!active||$('quiz').open||player.protected||VidaJugador.estaMuerto())return;if(movement.includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Escape'){pause();}if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='KeyT'&&!e.repeat)setWeather(weatherMode==='storm'?'clear':weatherMode==='clear'?'auto':'storm');if(equipoJugador.manejarTecla(e))return;if(e.code==='KeyV'&&!e.repeat)respawn(false);if(e.code==='Space'&&!e.repeat&&player.grounded){player.vy=7.5;player.grounded=false;}});
addEventListener('keyup',e=>keys.delete(e.code));
function allowed(x,z){
 if(Math.abs(x)>half-3||Math.abs(z)>half-3)return false;
 if(solidRects.some(o=>Math.abs(x-o.x)<o.w/2+.20&&Math.abs(z-o.z)<o.d/2+.20&&player.feet<o.top-.55&&player.feet+1.65>o.bottom))return false;
 return !obstacles.some(o=>!o.box?.supervivenciaOculta&&player.feet<o.y+o.h&&player.feet+1.65>o.y&&Math.hypot(x-o.x,z-o.z)<o.r+.22);
}
function respawn(fell=true){
 player.x=checkpoint.x;player.z=checkpoint.z;player.feet=checkpoint.y;player.y=checkpoint.y+1.7;player.vy=0;player.grounded=true;keys.clear();
 if(fell)falls++;
 notify(fell?'Volviste al último punto seguro. ¡Inténtalo otra vez!':'Regresaste al último punto seguro.');
 emit('escenario:reaparicion',{mapa:'hielo',caida:fell,caidas:falls});
}
function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}
function interact(){if(!nearest||!active||!player.grounded)return;const b=nearest;
 if(b.tipo==='equipo'){equipoJugador.recoger(b);return;}
 const q=config.preguntas[b.pregunta];if(!q){notify('Esta caja todavía no tiene una pregunta válida.');return;}
 questionBox=b;solved=false;returnAt=0;player.protected=true;active=false;release();deadline=performance.now()+config.tiempoPregunta*1000;
 $('question').textContent=q.texto;$('answers').replaceChildren();$('feedback').textContent='';$('hint').hidden=true;
 q.alternativas.forEach((option,i)=>{const btn=document.createElement('button');btn.textContent=String.fromCharCode(65+i)+'. '+option;btn.onclick=()=>answer(i);$('answers').append(btn);});
 $('quiz').showModal();emit('escenario:proteccion',{activa:true,id:b.id});
}
function answer(index){if(solved||!questionBox)return;solved=true;returnAt=performance.now()+3000;const q=config.preguntas[questionBox.pregunta],correct=index===q.correcta;if(!modoSupervivencia||correct)questionBox.opened=true;if(modoSupervivencia)Supervivencia.registrarRespuesta(questionBox,correct);
 if(correct)points+=100;$('score').textContent=points+' puntos';
 $('feedback').textContent=correct?'¡Correcto! +100 puntos':modoSupervivencia?(index===null?'Tiempo terminado. ':'Respuesta incorrecta. ')+'La caja conserva esta pregunta. Inténtalo de nuevo.':(index===null?'Tiempo terminado. ':'')+'Respuesta correcta: '+q.alternativas[q.correcta];
 [...$('answers').children].forEach(b=>b.disabled=true);$('shield').textContent='Respuesta registrada · regreso automático en 3 segundos';
 emit('escenario:respuesta',{id:questionBox.id,seleccion:index,correcta:correct,puntos:points});
}
function closeQuiz(){if(!solved)answer(null);$('quiz').close();player.protected=false;emit('escenario:proteccion',{activa:false});questionBox=null;if(modoSupervivencia&&Supervivencia.alCerrarPregunta())return;resume();}
$('closeQuiz').onclick=closeQuiz;$('quiz').addEventListener('cancel',e=>{e.preventDefault();closeQuiz();});
function update(dt){
 worldTime+=dt;
 actualizarAmbiente(dt);
 if(keys.has('ArrowLeft'))player.yaw+=dt*1.6;if(keys.has('ArrowRight'))player.yaw-=dt*1.6;
 if(keys.has('ArrowUp'))player.pitch=Math.min(.55,player.pitch+dt);if(keys.has('ArrowDown'))player.pitch=Math.max(-.85,player.pitch-dt);
 const f=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),s=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),len=Math.hypot(f,s)||1;
 const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?7:4.5)*dt;
 const dx=(-Math.sin(player.yaw)*f+Math.cos(player.yaw)*s)/len*speed,dz=(-Math.cos(player.yaw)*f-Math.sin(player.yaw)*s)/len*speed;
 if(allowed(player.x+dx,player.z))player.x+=dx;if(allowed(player.x,player.z+dz))player.z+=dz;
 const floor=surfaceAt(player.x,player.z,player.feet+.55),oldFeet=player.feet;
 if(player.grounded&&floor&&Math.abs(floor.y-player.feet)<.6){player.feet=floor.y;player.vy=0;}
 else{player.grounded=false;player.vy-=13*dt;player.feet+=player.vy*dt;
 if(floor&&player.vy<=0&&oldFeet>=floor.y-.08&&player.feet<=floor.y){if(BIOME==='ciudad'&&player.vy<-11){respawn();notify('Caída desde una azotea. Vuelves al punto seguro.');return;}player.feet=floor.y;player.vy=0;player.grounded=true;}}
 player.y=player.feet+1.7;
 if(player.feet<(BIOME==='ciudad'?-8:.25)){respawn();return;}
 if(hazards.some(h=>hazardOn(h)&&Math.abs(player.x-h.x)<h.w/2&&Math.abs(player.z-h.z)<h.d/2&&player.feet<h.y+3&&player.feet+1.6>h.y)){respawn();notify('El géiser está activo. Espera a que se apague para cruzar.');return;}
 if(player.grounded){const cp=config.islas.find(i=>Math.hypot(i.x-player.x,i.z-player.z)<2.5&&Math.abs(i.y-player.feet)<.6);if(cp&&cp.id!==currentIsland){currentIsland=cp.id;checkpoint={x:cp.x,z:cp.z,y:cp.y};$('weatherName').textContent=cp.nombre;notify('Punto seguro: '+cp.nombre);}}
 const curacion=botiquines.recoger(player,player.feet,()=> (VidaJugador.recuperarCorazon || VidaJugador.recuperarCorazones).call(VidaJugador,1));
 if(curacion!==null)notify(curacion?'Recuperaste un corazón.':'Ya tienes todos los corazones.');
 nearest=null;let min=3.7;for(const b of boxes){if(b.supervivenciaOculta)continue;const d=Math.hypot(player.x-b.x,player.z-b.z);if(!b.opened&&d<min&&Math.abs(player.feet-b.y)<2&&player.grounded){nearest=b;min=d;}}
 $('hint').hidden=!nearest;if(nearest)$('hint').textContent='[ E ] '+(nearest.tipo==='pregunta'?'Responder pregunta · escudo activo':'Abrir cofre de equipamiento');
}
const map=$('mapa').getContext('2d');
function minimap(){map.fillStyle=BIOME==='castillo'?'#22202d':'#99c6dc';map.fillRect(0,0,160,160);const mx=x=>(x/config.tamano+.5)*160;
 for(const p of surfaces){map.fillStyle=BIOME==='castillo'?'#77707d':'#e2f2f7';map.fillRect(mx(p.x-p.w/2),mx(p.z-p.d/2),Math.max(1,p.w/config.tamano*160),Math.max(1,p.d/config.tamano*160));}
 for(const p of solidRects){if(p.bottom>3||p.top<3)continue;map.fillStyle=BIOME==='castillo'?'#38303f':'#668ca0';map.fillRect(mx(p.x-p.w/2),mx(p.z-p.d/2),Math.max(1,p.w/config.tamano*160),Math.max(1,p.d/config.tamano*160));}
 for(const b of boxes){if(b.supervivenciaOculta)continue;map.fillStyle=b.opened?'#626367':b.tipo==='pregunta'?'#4eff83':'#ff7661';map.fillRect(mx(b.x)-1.8,mx(b.z)-1.8,3.6,3.6);}
 botiquines.dibujarEnMinimapa(map,mx);
 for(const cp of config.islas){map.strokeStyle='#ffed9c';map.strokeRect(mx(cp.x)-2.5,mx(cp.z)-2.5,5,5);}
 map.save();map.translate(mx(player.x),mx(player.z));map.rotate(-player.yaw);map.fillStyle='#fff';map.beginPath();map.moveTo(0,-5);map.lineTo(3,4);map.lineTo(-3,4);map.closePath();map.fill();map.restore();$('coords').textContent=Math.round(player.x)+' / '+Math.round(player.z);
 if(!modoSupervivencia)$('objective').textContent=boxes.filter(b=>b.tipo==='pregunta'&&b.opened).length+' / '+boxes.filter(b=>b.tipo==='pregunta').length+' preguntas';
}
const equipoJugador=new EquipoJugador({
 inventario:inventory,
 avisar:notify,
 puedeUsar:()=>active&&!player.protected&&!VidaJugador.estaMuerto(),
 puedeRecibirDano:()=>active&&!player.protected&&!VidaJugador.estaMuerto()
});
canvas.addEventListener('mousedown',e=>{if(e.button===0&&document.pointerLockElement===canvas&&active&&!player.protected&&!VidaJugador.estaMuerto())equipoJugador.usarArma();});
const terceraPersona=new PersonajeTerceraPersona(gl,{
 equipo:equipoJugador,
 distancia:8,
 altura:1.85,
 bloqueado:(x,y,z)=>{
  // Las plataformas tienen espesor: se puede mirar por debajo de un puente.
  if(surfaces.some(p=>{
   let top;
   if(p.type==='bridge'){
    const dx=x-p.ax,dz=z-p.az,t=(dx*p.ux+dz*p.uz)/p.length;
    if(t<0||t>1||Math.abs(-dx*p.uz+dz*p.ux)>p.width/2+.25)return false;
    top=p.ay+(p.by-p.ay)*t-Math.sin(t*Math.PI)*.55;
   }else{
    if(Math.abs(x-p.x)>p.w/2+.25||Math.abs(z-p.z)>p.d/2+.25)return false;
    top=p.y;
   }
   return y>top-.6&&y<top+.25;
  }))return true;
  // Paredes, edificios y techos sólidos también detienen la cámara.
  if(solidRects.some(o=>Math.abs(x-o.x)<o.w/2+.25&&Math.abs(z-o.z)<o.d/2+.25&&y>o.bottom-.25&&y<o.top+.25))return true;
  return obstacles.some(o=>{
   if(o.box?.supervivenciaOculta)return false;
   const base=o.box?.y??o.y??ground(o.x,o.z);
   const altura=o.height??o.h??0;
   return y>base-.2&&y<base+altura+.3&&Math.hypot(x-o.x,z-o.z)<(o.r??0)+.3;
  });
 }
});
const flechas=new FlechasEscenario(gl,{cube,ground,obstacles,limite:half});
// Los módulos compartidos siguen intactos. Este mapa aporta sus volúmenes.
flechas.solido=p=>{
 if(Math.abs(p.x)>half||Math.abs(p.z)>half||p.y<=ground(p.x,p.z)+.035)return true;
 if(solidRects.some(o=>Math.abs(p.x-o.x)<=o.w/2+.04&&Math.abs(p.z-o.z)<=o.d/2+.04&&p.y>=o.bottom-.04&&p.y<=o.top+.04))return true;
 return obstacles.some(o=>!o.box?.supervivenciaOculta&&p.y>=(o.y??2)&&p.y<=(o.y??2)+(o.height??o.h??0)&&Math.hypot(p.x-o.x,p.z-o.z)<=o.r+.035);
};
const enemigos=new EnemigosSistema(gl,{config:ENEMIGOS_CONFIG,ground,obstacles,limite:half,player,cube,upload,draw,avisar:notify});
const combate=new CombateSistema({enemigos,proyectiles:flechas,player,personaje:terceraPersona,equipo:equipoJugador,permitido:()=>active&&!player.protected&&!VidaJugador.estaMuerto()});
let ataquePendiente=null;
window.addEventListener('escenario:uso-arma',evento=>{if(active&&!player.protected&&!VidaJugador.estaMuerto())ataquePendiente=evento.detail?.arma||null;});
function render(time){const dt=Math.min(.04,(time-previous)/1000||0);previous=time;
 if(active)update(dt);
 equipoJugador.actualizar(dt);
 const vista=terceraPersona.actualizar(player,dt,player.y-1.7);
 if(active&&!player.protected&&!VidaJugador.estaMuerto()){
  if(ataquePendiente)combate.ataqueDelJugador(ataquePendiente,vista);
  flechas.actualizar(dt);
  if(!VidaJugador.estaMuerto())enemigos.actualizar(dt,(a,b)=>combate.visionLibre(a,b));
 }
 ataquePendiente=null;
 if($('quiz').open&&solved&&returnAt&&time>=returnAt)closeQuiz();
 if($('quiz').open&&!solved){const left=Math.max(0,Math.ceil((deadline-time)/1000));$('shield').textContent='Escudo activo · '+left+' s · movimiento bloqueado';if(!left)answer(null);}
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
 screenPass(skyProgram,skyLoc);gl.uniform2f(skyLoc.turn,vista.yaw,vista.pitch);gl.uniform1f(skyLoc.aspect,canvas.width/canvas.height);gl.uniform1f(skyLoc.ambiente,luzAmbiente);gl.uniform1f(skyLoc.clima,intensidadClima);gl.drawArrays(gl.TRIANGLES,0,6);
 gl.useProgram(program);gl.uniform3f(loc.camera,vista.x,vista.y,vista.z);gl.uniform2f(loc.turn,vista.yaw,vista.pitch);gl.uniform1f(loc.aspect,canvas.width/canvas.height);gl.uniform1f(loc.ambiente,luzAmbiente);gl.uniform1f(loc.clima,intensidadClima);
 gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
 gl.uniform1f(loc.distanceMax,460);gl.uniform3f(loc.offset,Math.sin(worldTime*.014)*9,0,Math.sin(worldTime*.01)*5);draw(clouds);
 gl.clear(gl.DEPTH_BUFFER_BIT);gl.uniform3f(loc.offset,0,0,0);gl.uniform1f(loc.distanceMax,quality.distance);
 for(const c of chunks.values())if(Math.hypot(c.x-player.x,c.z-player.z)<quality.distance+24){draw(c);if(qualityName!=='low')draw(c.detailMesh);}
 for(const b of boxes)if(!b.supervivenciaOculta&&Math.hypot(b.x-player.x,b.z-player.z)<quality.distance)draw(b.opened?b.openMesh:b);
 if(BIOME==='castillo'){
  gl.uniform3f(loc.offset,0,Math.sin(worldTime*.8)*.35,0);draw(apariciones);
  gl.uniform3f(loc.offset,0,0,0);
 }
 botiquines.dibujar(draw,player,quality.distance);
 gl.useProgram(waterProgram);gl.uniform3f(waterLoc.camera,vista.x,vista.y,vista.z);gl.uniform3f(waterLoc.offset,0,0,0);gl.uniform2f(waterLoc.turn,vista.yaw,vista.pitch);gl.uniform1f(waterLoc.aspect,canvas.width/canvas.height);gl.uniform1f(waterLoc.distanceMax,quality.distance);gl.uniform1f(waterLoc.time,worldTime%120);gl.uniform1f(waterLoc.ambiente,luzAmbiente);gl.uniform1f(waterLoc.clima,intensidadClima);draw(water,waterLoc);
 for(const h of hazards)if(hazardOn(h))draw(h.mesh,waterLoc);
 if(VidaJugador.debeDibujarPersonaje())terceraPersona.dibujar(program,loc);
 enemigos.dibujar(program,loc,quality.distance);
 flechas.dibujar(program,loc);
 dibujarNieve(vista);
 frames++;if(time-fpsStart>=1000){$('fps').textContent=Math.round(frames*1000/(time-fpsStart))+' FPS';frames=0;fpsStart=time;}
 if(time-lastUI>120){minimap();lastUI=time;}
 requestAnimationFrame(render);
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();fail('Se perdió el contexto gráfico. Recarga la página para continuar.');});
// Contrato pequeño para conectar después el proyecto. No implementa autoridad de servidor.
window.EscenarioHielo=Object.freeze({
 version:'1.2.0',
 getState:()=>({clima:{modo:weatherMode,intensidad:intensidadClima,luz:luzAmbiente,tiempo:worldTime},mapa:'hielo',semilla:config.semilla,caidas:falls,puntoSeguro:{...checkpoint},jugador:{...player},puntos:points,inventario:[...inventory],cajasAbiertas:boxes.filter(b=>b.opened).map(b=>b.id)}),
 pause,resume,setWeather,
 returnToCheckpoint:()=>{if(!$('quiz').open)respawn(false);},
 reset:()=>location.reload()
});
requestAnimationFrame(render);
})();
