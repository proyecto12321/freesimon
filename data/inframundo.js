/* Escenario independiente · WebGL 1 · sin dependencias ni peticiones de red.
   API de integración al final. El servidor futuro debe validar toda acción. */
(() => {
'use strict';
const $ = id => document.getElementById(id), canvas = $('mundo'), config = window.INFRAMUNDO_CONFIG;
const gl = canvas.getContext('webgl', {antialias:false, alpha:false, powerPreference:'low-power'});
function fail(message) { $('error').hidden=false; $('error').textContent=message; $('play').disabled=true; }
if (!gl) { fail('No se pudo iniciar WebGL. Prueba con la aceleración gráfica del navegador activada y un controlador compatible.'); return; }
if (!config) { fail('Falta inframundo.config.js. Mantén todos los archivos juntos.'); return; }
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
const presets={low:{distance:170,scale:.65},medium:{distance:210,scale:.85},high:{distance:260,scale:1}};
let quality=presets.low, qualityName='low', seed=config.semilla>>>0;
let worldTime=0;
const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const half=config.tamano/2, chunkSize=32, chunks=new Map(), obstacles=[], boxes=[], surfaces=[], waterData=[], solidRects=[], hazards=[];
const player={x:config.inicio.x,z:config.inicio.z,y:0,yaw:config.inicio.yaw||0,pitch:.04,feet:24,grounded:true,vy:0,protected:false};
let active=false, points=0, inventory=[], keys=new Set(), nearest=null, questionBox=null, deadline=0, solved=false, returnAt=0;
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
 vec3 q=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
 c=cos(turn.y);s=sin(turn.y);
 q=vec3(q.x,c*q.y+s*q.z,-s*q.y+c*q.z);
 float d=-q.z; float n=0.08; float f=distanceMax+40.0;
 gl_Position=vec4(q.x*1.3/aspect,q.y*1.3,(f+n)/(f-n)*d-2.0*f*n/(f-n),d);
 vColor=color;depth=length(p);vWorld=position+offset;
 }`;
 program=makeProgram(worldVS,`
 precision mediump float; varying mediump vec3 vColor; varying mediump float depth;
 uniform mediump float distanceMax;
 void main(){float fog=smoothstep(distanceMax*0.40,distanceMax,depth);gl_FragColor=vec4(mix(vColor,vec3(0.24,0.1,0.1),fog),1.0);}`);
 waterProgram=makeProgram(worldVS,`
 precision mediump float; varying mediump vec3 vColor; varying mediump float depth; varying mediump vec3 vWorld;
 uniform mediump float distanceMax; uniform float time;
 void main(){
 float flow=0.5+0.5*sin(vWorld.y*3.4+vWorld.x*1.5+vWorld.z*0.7+time*5.0);
 float thin=pow(flow,9.0)*0.32;
 vec3 water=mix(vColor,vec3(1.0,0.85,0.15),thin);
 float fog=smoothstep(distanceMax*0.4,distanceMax,depth);
 gl_FragColor=vec4(mix(water,vec3(0.24,0.1,0.1),fog),1.0);
 }`);
 const screenVS=`attribute vec2 position; varying mediump vec2 uv; void main(){uv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}`;
 skyProgram=makeProgram(screenVS,`
 precision mediump float; varying mediump vec2 uv;
 uniform vec2 turn; uniform float aspect;
 void main(){
 vec2 p=uv*2.0-1.0;vec3 q=normalize(vec3(p.x*aspect/1.3,p.y/1.3,-1.0));
 float c=cos(turn.y),s=sin(turn.y);q=vec3(q.x,c*q.y-s*q.z,s*q.y+c*q.z);
 c=cos(turn.x);s=sin(turn.x);vec3 ray=vec3(c*q.x-s*q.z,q.y,s*q.x+c*q.z);
 float elevation=max(0.0,ray.y);
 vec3 sky=mix(vec3(0.24,0.1,0.1),vec3(0.1,0.055,0.075),smoothstep(0.0,0.8,elevation));
 vec2 sunLocal=vec2(ray.x,ray.y)/max(0.01,-ray.z)-vec2(-0.646,0.8);
 float square=max(abs(sunLocal.x),abs(sunLocal.y));
 float halo=(1.0-smoothstep(0.06,0.28,length(sunLocal)))*step(0.0,-ray.z);
 
 
 sky=mix(sky,vec3(0.32,0.12,0.08),(1.0-smoothstep(-0.7,-0.05,ray.y)));
 gl_FragColor=vec4(sky,1.0);}`);
} catch(error){fail('No se pudo preparar el escenario: '+error.message);return;}
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(.79,.83,.77,1);
const loc={};['position','color'].forEach(k=>loc[k]=gl.getAttribLocation(program,k));
['camera','offset','turn','aspect','distanceMax'].forEach(k=>loc[k]=gl.getUniformLocation(program,k));
const skyLoc={},waterLoc={};
for(const [p,l,names] of [[skyProgram,skyLoc,['turn','aspect']],[waterProgram,waterLoc,['camera','offset','turn','aspect','distanceMax','time']]]){l.position=gl.getAttribLocation(p,'position');if(p===waterProgram)l.color=gl.getAttribLocation(p,'color');for(const n of names)l[n]=gl.getUniformLocation(p,n);}
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
const BIOME='inframundo';
function platform(x,z,y,w,d,color,solid=true){const a=dataAt(x,z);cube(a,x,y-.35,z,w,.35,d,color);surfaces.push({x,z,y,w,d});if(solid)solidRects.push({x,z,w,d,top:y,bottom:y-.35});}
function wall(x,z,y,w,h,d,color){cube(dataAt(x,z),x,y,z,w,h,d,color);if(BIOME==='bosque'&&h>3&&color[0]<.3){const a=detailAt(x,z);if(w>d)for(let xx=x-w/2+.5;xx<x+w/2;xx+=1.2)cube(a,xx,y+h-.3,z,.9,.6,d+.12,[.25,.46,.20]);else for(let zz=z-d/2+.5;zz<z+d/2;zz+=1.2)cube(a,x,y+h-.3,zz,w+.12,.6,.9,[.25,.46,.20]);}solidRects.push({x,z,w,d,top:y+h,bottom:y});}
function raised(x,z,y,w,d,color){wall(x,z,BIOME==='inframundo'?-1:2,w,y-(BIOME==='inframundo'?-1:2),d,color.map(c=>c*.75));platform(x,z,y,w,d,color);}
function stairs(x,z,base,n,run,step,axis=0,width=3){for(let i=0;i<n;i++){const px=x+(axis?i*run:0),pz=z+(axis?0:-i*run);raised(px,pz,base+(i+1)*step,axis?Math.abs(run)+.04:width,axis?width:Math.abs(run)+.04,[.62,.65,.59]);}}
function lamp(x,z,y){const a=dataAt(x,z);cube(a,x,y,z,.2,2.8,.2,[.25,.25,.22]);cube(a,x,y+2.8,z,.6,.12,.6,[.36,.32,.24]);cube(a,x,y+2.92,z,.42,.6,.42,[1,.79,.35]);cube(a,x,y+3.52,z,.64,.12,.64,[.36,.32,.24]);obstacles.push({x,z,y,r:.25,h:3.6});}
function tree(x,z,y,h){const a=dataAt(x,z);cube(a,x,y,z,.7,h,.7,[.37,.25,.16]);cube(a,x,y+h-1,z,4.5,2.1,4.4,[.22,.43,.18]);cube(a,x-.4,y+h+1.1,z,3.3,1.3,3.2,[.29,.52,.21]);obstacles.push({x,z,y,r:.65,h});}
function pillar(x,z,y,h,color){const a=dataAt(x,z);for(let j=0;j<h;j+=.65)cube(a,x,y+j,z,1.1,.62,1.1,color);cube(a,x,y+h,z,1.65,.3,1.65,color);obstacles.push({x,z,y,r:.8,h:h+.3});}
function gate(x,z,y,color){pillar(x-3,z,y,5,color);pillar(x+3,z,y,5,color);cube(dataAt(x,z),x,y+5.3,z,8,.7,1.8,color);}
function hazard(x,z,y,w,d,phase){const mesh=[];for(let i=0;i<Math.ceil(w);i++)cube(mesh,x-w/2+i+.5,y,z,.7,2.8,d,[1,.33,.04]);hazards.push({x,z,y,w,d,phase,data:mesh});cube(dataAt(x,z),x,y-.02,z,w+.3,.1,d+.3,[.46,.20,.11]);}
function hazardOn(h){return (worldTime+h.phase)%7<3;}
const green=[.32,.52,.23],gray=[.60,.65,.64],dark=[.28,.26,.31];
if(BIOME==='bosque'){
 platform(0,51.5,2,176,69,green);platform(0,-42.5,2,176,91,green);
 // Río, puentes estrechos y atajo de piedras separadas.
 quad(waterData,[-90,0,3],[90,0,3],[90,0,17],[-90,0,17],[.15,.56,.64]);
 for(const x of [-32,32]){platform(x,10,2,2.2,14.2,[.61,.42,.23]);for(let z=3;z<17;z+=.65)cube(detailAt(x,z),x,2.01,z,2.3,.06,.53,[.69,.49,.28]);lamp(x+2,19,2);}
 for(const z of [15,11,7,3])raised(0,z,2.1,2.0,2.1,gray);
 // Laberinto cerrado lateralmente: puertas alternas obligan a cambiar de rumbo.
 const hedge=[.20,.39,.18];wall(-25,38,2,1,3.2,33,hedge);wall(25,38,2,1,3.2,33,hedge);
 for(const z of [54,22]){wall(-14,z,2,22,3.2,1,hedge);wall(14,z,2,22,3.2,1,hedge);}
 for(const [z,gap] of [[48,-12],[40,12],[32,-12]]){
 const left=-25,right=25,g=2.2;
 wall((left+gap-g)/2,z,2,gap-g-left,3.2,1,hedge);wall((gap+g+right)/2,z,2,right-gap-g,3.2,1,hedge);
 }
 gate(0,54,2,[.45,.34,.22]);
 stairs(0,-24,2,15,1.2,.4);raised(0,-50,8,22,18,[.65,.68,.56]);
 gate(0,-54,8,[.68,.73,.61]);for(const x of [-8,8])pillar(x,-45,8,3.2,[.66,.70,.60]);
 for(const x of [14,18,22,26])raised(x,-44,8,2.2,2.4,[.51,.59,.48]);raised(32,-44,8,6,6,[.53,.64,.45]);
 // Reserva de corredores, cajas y edificios antes de distribuir árboles.
 for(let i=0,tries=0;i<230&&tries<4000;tries++){
 const x=(random()-.5)*168,z=(random()-.5)*168;
 if(z>1&&z<20||Math.abs(x)<5||z>20&&z<56&&Math.abs(x)<28||z<-20&&z>-62&&Math.abs(x)<38)continue;
 if(config.cajas.some(b=>Math.hypot(x-b.x,z-b.z)<4)||config.islas.some(b=>Math.hypot(x-b.x,z-b.z)<4)||obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<4))continue;
 tree(x,z,2,4+random()*4);i++;
 }
 for(let i=0;i<520;i++){const x=(random()-.5)*174,z=(random()-.5)*174;if(z>2&&z<18)continue;const a=detailAt(x,z);cube(a,x,2,z,.07,.3,.07,[.35,.62,.20]);cube(a,x,2.3,z,.22,.09,.22,random()>.5?[.91,.81,.40]:[.76,.48,.68]);}
 for(const x of [-46,46])gate(x,-52,2,[.51,.59,.50]);
}else if(BIOME==='ciudad'){
 platform(0,0,2,176,176,[.45,.49,.51]);
 // Calles, pasos de peatones y aceras en módulos de geometría agrupados.
 for(let z=-84;z<84;z+=5)cube(detailAt(0,z),0,2.02,z,.18,.02,2.4,[.93,.85,.51]);
 for(const z of [52,22,-8,-38,-66])for(let x=-6;x<=6;x+=1.5)cube(detailAt(x,z),x,2.025,z,.7,.03,3,[.85,.87,.83]);
 function building(x,z,w,d,h,col,roof=true){
 wall(x,z,2,w,h-2,d,col);if(roof)platform(x,z,h,w,d,[.55,.59,.57]);
 cube(dataAt(x,z),x,h,z,w+1,.35,d+1,[.78,.76,.65]);
 for(let yy=3.2;yy<h-1;yy+=2.3)for(let zz=z-d/2+1.6;zz<z+d/2;zz+=2.8){cube(detailAt(x,z),x+w/2+.015,yy,zz,.035,1.3,1.15,[.26,.43,.49]);cube(detailAt(x,z),x-w/2-.015,yy,zz,.035,1.3,1.15,[.24,.41,.48]);}
 cube(detailAt(x,z),x,2.02,z+d/2+.025,1.5,2.5,.04,[.26,.31,.29]);
 // Cornisa incluida en el soporte: no hay un escalón invisible alrededor de la azotea.
 if(roof)platform(x,z,h+.35,w+1,d+1,[.70,.71,.64]);
 for(let yy=3.2;yy<h-1;yy+=2.3)for(let xx=x-w/2+1.6;xx<x+w/2;xx+=2.8){cube(detailAt(x,z),xx,yy,z+d/2+.015,1.15,1.3,.035,[.24,.43,.51]);cube(detailAt(x,z),xx,yy,z-d/2-.015,1.15,1.3,.035,[.30,.45,.49]);}
 }
 // Ventanas laterales y puertas se añaden a todos los edificios.
 // Edificios principales accesibles por escaleras exteriores.
 building(-24,40,20,18,7.65,[.66,.40,.28]);building(24,12,20,18,10.65,[.52,.58,.60]);building(-24,-20,20,18,13.65,[.63,.51,.38]);
 stairs(-12,51,2,12,1.0,.5,0,3.2);platform(-13,40,8,4.5,1,gray);
 stairs(12,34,2,18,1.2,.5,0,3.2);platform(13,13.6,11,4.5,1,gray);
 stairs(-12,5,2,24,1.0,.5,0,3.2);platform(-13,-18,14,4.5,1,gray);
 // Pasarelas altas sobre la calle: se puede pasar por debajo a nivel del suelo.
 platform(0,40,8,28,1.7,[.60,.44,.27],false);platform(13,32,8,1.7,16,[.60,.44,.27],false);
 building(-24,12,6,6,7.65,[.58,.45,.34]);
 // Azotea opcional por saltos, junto al mercado.
 for(const z of [26,22,18])platform(-24,z,8,2.3,2.3,[.65,.52,.34],false);
 // Barrio periférico con calles transitables y cofres en patios.
 for(const [x,z,w,d,h,col] of [[-55,50,18,18,13,[.63,.43,.33]],[55,48,18,20,16,[.68,.61,.45]],[-55,16,16,20,18,[.45,.51,.55]],[57,9,18,18,12,[.66,.44,.35]],[-58,-25,18,20,15,[.55,.59,.55]],[55,-32,18,20,20,[.60,.52,.41]],[-23,-63,18,16,12,[.68,.45,.34]],[23,-63,16,16,16,[.43,.53,.60]]])building(x,z,w,d,h,col,false);
 for(const z of [-72,-48,-24,0,24,48,72])for(const x of [-8,8])lamp(x,z,2);
 // Bloques de obra y barreras bajas: rodear o saltar.
 for(const [x,z] of [[38,39],[42,39],[37,-33],[39,-36],[-42,-43],[-41,-47]])wall(x,z,2,2,1.3,2,[.72,.54,.28]);
 for(const [x,z] of [[-40,65],[40,65],[-43,-68],[44,-62],[-42,0]])tree(x,z,2,4.2);
 // Monumento de llegada, situado fuera del eje de circulación.
 raised(22,62,3,6,6,[.68,.70,.64]);pillar(22,62,3,4,[.77,.78,.68]);
}else{
 // Cavernas de lava: solo los bloques de roca son transitables.
 for(const [x,z,y,w,d] of [[0,65,4,20,16],[0,35,5,18,18],[-36,10,5,16,16],[0,-35,7,22,24],[0,-55,9,12,12],[27,-32,7,8,8]])raised(x,z,y,w,d,[.36,.33,.38]);
 // Primera secuencia: saltos diagonales que requieren carrera.
 for(const [x,z,y] of [[-1.5,54,4.2],[1.5,49.5,4.5],[-1.5,45,4.8]])raised(x,z,y,2.4,2.5,[.40,.37,.41]);
 // Dos rutas al refugio: pasarela larga estrecha y atajo por piedras.
 platform(-22,35,5,29,1.8,dark);platform(-36,24,5,1.8,23,dark);
 for(const [x,z] of [[-7,27],[-11,23],[-15,19],[-19,15],[-23,11]])raised(x,z,5,2.3,2.3,[.42,.37,.39]);
 platform(-36,-10,5,1.8,24,dark);stairs(-36,-22,5,5,1,.4,0,1.8);platform(-22,-26,7,29,1.8,dark);
 stairs(0,-45,7,5,1,.4,0,3);
 for(const x of [14,18,22])raised(x,-32,7,2.2,2.3,[.42,.36,.40]);
 // Géiseres periódicos con aviso físico: luces y rejillas permanentes.
 hazard(-36,21,5,1.8,2,0);hazard(-20,-26,7,2.2,1.8,2.5);hazard(0,-49,8,2.8,1.5,4);
 gate(0,30,5,[.42,.34,.38]);gate(0,-40,7,[.44,.36,.40]);gate(0,-56,9,[.52,.39,.36]);
 for(const [x,z,y] of [[-7,59,4],[7,59,4],[-6,40,5],[-41,14,5],[-31,4,5],[-8,-30,7],[8,-42,7],[-4,-52,9]])lamp(x,z,y);
 // Paredes de la caverna y columnas incandescentes fuera de los caminos.
 for(let i=0;i<60;i++){const angle=i/60*Math.PI*2,x=Math.cos(angle)*78,z=Math.sin(angle)*78,h=16+random()*18;cube(dataAt(x,z),x,-2,z,8,h,8,[.22+random()*.07,.17,.22]);if(i%3===0)cube(waterData,x+.1,0,z+4.1,2,h*.8,.05,[.93,.26,.03]);}
 for(const [x,z] of [[-19,54],[22,48],[-55,-4],[38,-54],[-25,-48],[40,13]])cube(dataAt(x,z),x,0,z,5,12+random()*9,5,[.31,.24,.28]);
 quad(waterData,[-95,0,-95],[95,0,-95],[95,0,95],[-95,0,95],[.86,.24,.025]);
}
// Bordes del terreno para cerrar el horizonte.
if(BIOME!=='inframundo')for(let i=0;i<40;i++){const side=i%4,t=(i>>2)*18-81,x=side<2?t:(side===2?-89:89),z=side<2?(side===0?-89:89):t;cube(dataAt(x,z),x,0,z,14,BIOME==='bosque'?8+random()*7:6,14,BIOME==='bosque'?[.32,.40,.31]:[.51,.55,.56]);}
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
const cloudData=[];
if(BIOME!=='inframundo')for(let i=0;i<18;i++){const x=(random()-.5)*340,z=(random()-.5)*340,y=48+random()*12;cube(cloudData,x,y,z,16,3,9,[.97,.97,.91]);quad(cloudData,[x-8,y,z-4.5],[x+8,y,z-4.5],[x+8,y,z+4.5],[x-8,y,z+4.5],[.83,.88,.86]);}
const clouds=upload(cloudData);
function draw(mesh,attributes=loc){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.enableVertexAttribArray(attributes.position);gl.vertexAttribPointer(attributes.position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(attributes.color);gl.vertexAttribPointer(attributes.color,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
function resize(){const scale=quality.scale;canvas.width=Math.max(1,Math.floor(innerWidth*scale));canvas.height=Math.max(1,Math.floor(innerHeight*scale));gl.viewport(0,0,canvas.width,canvas.height);}
addEventListener('resize',resize);resize();
$('quality').onchange=()=>{qualityName=$('quality').value;quality=presets[qualityName];$('qualityLabel').textContent='Calidad '+({low:'baja',medium:'media',high:'alta'}[$('quality').value]);resize();};
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
function release(){if(document.pointerLockElement===canvas)document.exitPointerLock();keys.clear();drag=false;}
function resume(){if($('quiz').open)return;active=true;$('overlay').hidden=true;previous=performance.now();try{const req=canvas.requestPointerLock();if(req&&req.catch)req.catch(()=>notify('Arrastra con el ratón o usa las flechas para mirar.'));}catch{notify('Arrastra con el ratón para mirar.');}}
function pause(){active=false;$('overlay').hidden=false;$('play').firstChild.textContent='Continuar exploración ';$('hint').hidden=true;release();}
$('play').onclick=resume;$('menuBtn').onclick=pause;
$('returnRooms').onclick=()=>{release();window.location.href='../html/panel_sala.html';};
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&active&&!$('quiz').open)pause();});
canvas.addEventListener('mousedown',e=>{if(active&&e.button===0)drag=true;});addEventListener('mouseup',()=>drag=false);
addEventListener('mousemove',e=>{if(!active||$('quiz').open)return;if(document.pointerLockElement===canvas||drag){player.yaw-=e.movementX*.0025;player.pitch=Math.max(-1.35,Math.min(1.35,player.pitch-e.movementY*.0025));}});
addEventListener('blur',()=>{keys.clear();if(active)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause();});
const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'];
addEventListener('keydown',e=>{if(!active||$('quiz').open)return;if(movement.includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Escape'){pause();}if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='KeyR'&&!e.repeat)respawn(false);if(e.code==='Space'&&!e.repeat&&player.grounded){player.vy=7.5;player.grounded=false;}});
addEventListener('keyup',e=>keys.delete(e.code));
function allowed(x,z){
 if(Math.abs(x)>87||Math.abs(z)>87)return false;
 if(solidRects.some(o=>Math.abs(x-o.x)<o.w/2+.20&&Math.abs(z-o.z)<o.d/2+.20&&player.feet<o.top-.55&&player.feet+1.65>o.bottom))return false;
 return !obstacles.some(o=>player.feet<o.y+o.h&&player.feet+1.65>o.y&&Math.hypot(x-o.x,z-o.z)<o.r+.22);
}
function respawn(fell=true){
 player.x=checkpoint.x;player.z=checkpoint.z;player.feet=checkpoint.y;player.y=checkpoint.y+1.7;player.vy=0;player.grounded=true;keys.clear();
 if(fell)falls++;
 notify(fell?'Volviste a la última isla segura. ¡Inténtalo otra vez!':'Regresaste a la última isla segura.');
 emit('escenario:reaparicion',{mapa:'inframundo',caida:fell,caidas:falls});
}
function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}
function interact(){if(!nearest||!active||!player.grounded)return;const b=nearest;
 if(b.tipo==='equipo'){b.opened=true;inventory.push(b.objeto);$('inventory').textContent=inventory.join(' · ');notify('Recogiste: '+b.objeto+' · demostración sin combate');emit('escenario:equipo',{id:b.id,objeto:b.objeto});return;}
 const q=config.preguntas[b.pregunta];if(!q){notify('Esta caja todavía no tiene una pregunta válida.');return;}
 questionBox=b;solved=false;returnAt=0;player.protected=true;active=false;release();deadline=performance.now()+config.tiempoPregunta*1000;
 $('question').textContent=q.texto;$('answers').replaceChildren();$('feedback').textContent='';$('hint').hidden=true;
 q.opciones.forEach((option,i)=>{const btn=document.createElement('button');btn.textContent=String.fromCharCode(65+i)+'. '+option;btn.onclick=()=>answer(i);$('answers').append(btn);});
 $('quiz').showModal();emit('escenario:proteccion',{activa:true,id:b.id});
}
function answer(index){if(solved||!questionBox)return;solved=true;returnAt=performance.now()+3000;const q=config.preguntas[questionBox.pregunta],correct=index===q.correcta;questionBox.opened=true;
 if(correct)points+=100;$('score').textContent=points+' puntos';
 $('feedback').textContent=correct?'¡Correcto! +100 puntos':(index===null?'Tiempo terminado. ':'')+'Respuesta correcta: '+q.opciones[q.correcta];
 [...$('answers').children].forEach(b=>b.disabled=true);$('shield').textContent='Respuesta registrada · regreso automático en 3 segundos';
 emit('escenario:respuesta',{id:questionBox.id,seleccion:index,correcta:correct,puntos:points});
}
function closeQuiz(){if(!solved)answer(null);$('quiz').close();player.protected=false;emit('escenario:proteccion',{activa:false});questionBox=null;resume();}
$('closeQuiz').onclick=closeQuiz;$('quiz').addEventListener('cancel',e=>{e.preventDefault();closeQuiz();});
function update(dt){
 worldTime+=dt;
 if(keys.has('ArrowLeft'))player.yaw+=dt*1.6;if(keys.has('ArrowRight'))player.yaw-=dt*1.6;
 if(keys.has('ArrowUp'))player.pitch=Math.min(1.35,player.pitch+dt);if(keys.has('ArrowDown'))player.pitch=Math.max(-1.35,player.pitch-dt);
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
 nearest=null;let min=3.7;for(const b of boxes){const d=Math.hypot(player.x-b.x,player.z-b.z);if(!b.opened&&d<min&&Math.abs(player.feet-b.y)<2&&player.grounded){nearest=b;min=d;}}
 $('hint').hidden=!nearest;if(nearest)$('hint').textContent='[ E ] '+(nearest.tipo==='pregunta'?'Responder pregunta · escudo activo':'Abrir cofre de equipamiento');
}
const map=$('mapa').getContext('2d');
function minimap(){map.fillStyle=BIOME==='inframundo'?'#823e20':BIOME==='bosque'?'#40859a':'#364252';map.fillRect(0,0,160,160);const mx=x=>(x/config.tamano+.5)*160;
 for(const p of surfaces){if(p.type==='bridge')continue;map.fillStyle=BIOME==='bosque'?(p.y>3?'#cab892':'#62834b'):BIOME==='ciudad'?(p.y>3?'#b4a385':'#8a969c'):'#68616a';map.fillRect(mx(p.x-p.w/2),mx(p.z-p.d/2),Math.max(1,p.w/config.tamano*160),Math.max(1,p.d/config.tamano*160));}
 for(const b of boxes){map.fillStyle=b.opened?'#626367':b.tipo==='pregunta'?'#4eff83':'#ff7661';map.fillRect(mx(b.x)-1.8,mx(b.z)-1.8,3.6,3.6);}
 for(const cp of config.islas){map.strokeStyle='#ffed9c';map.strokeRect(mx(cp.x)-2.5,mx(cp.z)-2.5,5,5);}
 map.save();map.translate(mx(player.x),mx(player.z));map.rotate(-player.yaw);map.fillStyle='#fff';map.beginPath();map.moveTo(0,-5);map.lineTo(3,4);map.lineTo(-3,4);map.closePath();map.fill();map.restore();$('coords').textContent=Math.round(player.x)+' / '+Math.round(player.z);
 $('objective').textContent=boxes.filter(b=>b.tipo==='pregunta'&&b.opened).length+' / '+boxes.filter(b=>b.tipo==='pregunta').length+' preguntas';
}
function render(time){const dt=Math.min(.04,(time-previous)/1000||0);previous=time;
 if(active)update(dt);
 if($('quiz').open&&solved&&returnAt&&time>=returnAt)closeQuiz();
 if($('quiz').open&&!solved){const left=Math.max(0,Math.ceil((deadline-time)/1000));$('shield').textContent='Escudo activo · '+left+' s · movimiento bloqueado';if(!left)answer(null);}
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
 screenPass(skyProgram,skyLoc);gl.uniform2f(skyLoc.turn,player.yaw,player.pitch);gl.uniform1f(skyLoc.aspect,canvas.width/canvas.height);gl.drawArrays(gl.TRIANGLES,0,6);
 gl.useProgram(program);gl.uniform3f(loc.camera,player.x,player.y,player.z);gl.uniform2f(loc.turn,player.yaw,player.pitch);gl.uniform1f(loc.aspect,canvas.width/canvas.height);
 gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
 gl.uniform1f(loc.distanceMax,460);gl.uniform3f(loc.offset,Math.sin(worldTime*.014)*9,0,Math.sin(worldTime*.01)*5);draw(clouds);
 gl.clear(gl.DEPTH_BUFFER_BIT);gl.uniform3f(loc.offset,0,0,0);gl.uniform1f(loc.distanceMax,quality.distance);
 for(const c of chunks.values())if(Math.hypot(c.x-player.x,c.z-player.z)<quality.distance+24){draw(c);if(qualityName!=='low')draw(c.detailMesh);}
 for(const b of boxes)if(Math.hypot(b.x-player.x,b.z-player.z)<quality.distance)draw(b.opened?b.openMesh:b);
 gl.useProgram(waterProgram);gl.uniform3f(waterLoc.camera,player.x,player.y,player.z);gl.uniform3f(waterLoc.offset,0,0,0);gl.uniform2f(waterLoc.turn,player.yaw,player.pitch);gl.uniform1f(waterLoc.aspect,canvas.width/canvas.height);gl.uniform1f(waterLoc.distanceMax,quality.distance);gl.uniform1f(waterLoc.time,worldTime%120);draw(water,waterLoc);
 for(const h of hazards)if(hazardOn(h))draw(h.mesh,waterLoc);
 frames++;if(time-fpsStart>=1000){$('fps').textContent=Math.round(frames*1000/(time-fpsStart))+' FPS';frames=0;fpsStart=time;}
 if(time-lastUI>120){minimap();lastUI=time;}
 requestAnimationFrame(render);
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();fail('Se perdió el contexto gráfico. Recarga la página para continuar.');});
// Contrato pequeño para conectar después el proyecto. No implementa autoridad de servidor.
window.EscenarioInframundo=Object.freeze({
 version:'1.0.0',
 getState:()=>({mapa:'inframundo',semilla:config.semilla,caidas:falls,puntoSeguro:{...checkpoint},jugador:{...player},puntos:points,inventario:[...inventory],cajasAbiertas:boxes.filter(b=>b.opened).map(b=>b.id)}),
 pause,resume,
 returnToCheckpoint:()=>{if(!$('quiz').open)respawn(false);},
 reset:()=>location.reload()
});
requestAnimationFrame(render);
})();
