/* Escenario independiente · WebGL 1 · sin dependencias ni peticiones de red.
   API de integración al final. El servidor futuro debe validar toda acción. */
(() => {
'use strict';
const $ = id => document.getElementById(id), canvas = $('mundo'), config = window.DESIERTO_CONFIG;
const gl = canvas.getContext('webgl', {antialias:false, alpha:false, powerPreference:'low-power'});
function fail(message) { $('error').hidden=false; $('error').textContent=message; $('play').disabled=true; }
if (!gl) { fail('No se pudo iniciar WebGL. Prueba con la aceleración gráfica del navegador activada y un controlador compatible.'); return; }
if (!config) { fail('Falta desierto.config.js. Mantén todos los archivos juntos.'); return; }
const presets={low:{distance:65,scale:.65},medium:{distance:95,scale:.85},high:{distance:140,scale:1}};
let quality=presets.low, seed=config.semilla>>>0;
const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const half=config.tamano/2, tile=4, chunkSize=32, chunks=new Map(), obstacles=[], boxes=[];
const player={x:config.inicio.x,z:config.inicio.z,y:0,yaw:0,pitch:-.08,jump:0,vy:0,protected:false};
let active=false, points=0, inventory=[], keys=new Set(), nearest=null, questionBox=null, deadline=0, solved=false, returnAt=0;
let previous=0,fpsStart=0,frames=0,lastUI=0,toastTimer,drag=false;
function ground(x,z){
  const cx=Math.floor(x/tile)*tile+tile/2,cz=Math.floor(z/tile)*tile+tile/2;
  const fade=Math.min(1,Math.max(0,(Math.hypot(cx,cz)-14)/30));
  return Math.floor((2.7+Math.sin(cx*.043)*1.7+Math.cos(cz*.054)*1.5+Math.sin((cx+cz)*.027))*fade*2)/2;
}
player.y=ground(player.x,player.z)+1.7;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
let program;
try {
 program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,`
 attribute vec3 position; attribute vec3 color;
 uniform vec3 camera; uniform vec2 turn; uniform float aspect; uniform mediump float distanceMax;
 varying mediump vec3 vColor; varying mediump float depth;
 void main(){
 vec3 p=position-camera;
 float c=cos(turn.x),s=sin(turn.x);
 vec3 q=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
 c=cos(turn.y);s=sin(turn.y);
 q=vec3(q.x,c*q.y+s*q.z,-s*q.y+c*q.z);
 float d=-q.z; float n=0.08; float f=distanceMax+30.0;
 gl_Position=vec4(q.x*1.3/aspect,q.y*1.3,(f+n)/(f-n)*d-2.0*f*n/(f-n),d);
 vColor=color;depth=length(p);
 }`));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
 precision mediump float; varying mediump vec3 vColor; varying mediump float depth; uniform mediump float distanceMax;
 void main(){float fog=smoothstep(distanceMax*0.48,distanceMax,depth);gl_FragColor=vec4(mix(vColor,vec3(0.70,0.79,0.77),fog),1.0);}`));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
} catch(error){fail('No se pudo preparar el escenario: '+error.message);return;}
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(.70,.79,.77,1);
const loc={};['position','color'].forEach(k=>loc[k]=gl.getAttribLocation(program,k));
['camera','turn','aspect','distanceMax'].forEach(k=>loc[k]=gl.getUniformLocation(program,k));
function dataAt(x,z){const key=Math.floor((x+half)/chunkSize)+','+Math.floor((z+half)/chunkSize);if(!chunks.has(key))chunks.set(key,{x:Math.floor((x+half)/chunkSize)*chunkSize-half+16,z:Math.floor((z+half)/chunkSize)*chunkSize-half+16,data:[]});return chunks.get(key).data;}
function quad(arr,a,b,c,d,col,light=1){for(const v of [a,b,c,a,c,d])arr.push(...v,col[0]*light,col[1]*light,col[2]*light);}
function cube(arr,x,y,z,w,h,d,col){const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2,t=y+h;
quad(arr,[a,t,c],[b,t,c],[b,t,e],[a,t,e],col,1);
quad(arr,[a,y,e],[b,y,e],[b,t,e],[a,t,e],col,.78);
quad(arr,[b,y,c],[a,y,c],[a,t,c],[b,t,c],col,.64);
quad(arr,[a,y,c],[a,y,e],[a,t,e],[a,t,c],col,.72);
quad(arr,[b,y,e],[b,y,c],[b,t,c],[b,t,e],col,.88);
}
// Terreno: solo superficies y escalones, agrupados por sectores.
for(let x=-half;x<half;x+=tile)for(let z=-half;z<half;z+=tile){
 const h=ground(x,z), arr=dataAt(x,z),v=.94+random()*.09,col=[.84*v,.66*v,.40*v];
 quad(arr,[x,h,z],[x+tile,h,z],[x+tile,h,z+tile],[x,h,z+tile],col);
 const hn=ground(x+tile,z),hs=ground(x,z+tile);
 if(h!==hn)quad(arr,[x+tile,h,z],[x+tile,h,z+tile],[x+tile,hn,z+tile],[x+tile,hn,z],col,.76);
 if(h!==hs)quad(arr,[x,h,z+tile],[x+tile,h,z+tile],[x+tile,hs,z+tile],[x,hs,z+tile],col,.85);
}
function freeSpot(x,z,r){return Math.hypot(x-player.x,z-player.z)>12 && config.cajas.every(b=>Math.hypot(x-b.x,z-b.z)>r+4) && obstacles.every(o=>Math.hypot(x-o.x,z-o.z)>r+o.r+1);}
function populate(count,type){for(let i=0,tries=0;i<count&&tries<count*10;tries++){
 const x=(random()-.5)*(config.tamano-16),z=(random()-.5)*(config.tamano-16),r=type==='cactus'?.8:1.5;
 if(!freeSpot(x,z,r))continue;i++;const y=ground(x,z),arr=dataAt(x,z);
 if(type==='cactus'){
 const h=2.5+random()*3.2,col=[.26,.46+random()*.1,.29];
 cube(arr,x,y,z,.85,h,.85,col);cube(arr,x-.8,y+h*.45,z,1.4,.65,.65,col);cube(arr,x-1.25,y+h*.45,z,.62,h*.38,.62,col);
 cube(arr,x+.7,y+h*.65,z,1.2,.6,.6,col);cube(arr,x+1.05,y+h*.65,z,.58,h*.27,.58,col);
 // Rayas en relieve sin texturas externas.
 cube(arr,x+.2,y+.15,z+.431,.07,h-.3,.025,[.42,.62,.34]);
 obstacles.push({x,z,r:1.6,height:h});
 }else{const h=.7+random()*1.8;cube(arr,x,y,z,2.5,h,2.2,[.52,.43,.33]);cube(arr,x-.2,y+h,z,1.6,.45,1.5,[.59,.48,.36]);obstacles.push({x,z,r:1.7,height:h+.45});}
}}
populate(config.cantidadCactus,'cactus');populate(config.cantidadRocas,'roca');
// Mesetas en los bordes; los límites físicos usan el tamaño del mapa.
for(let i=0;i<64;i++){const side=i%4,t=(i/4|0)/15*(config.tamano-12)-half+6;let x=side<2?t:(side===2?-half+2:half-2),z=side<2?(side===0?-half+2:half-2):t;cube(dataAt(x,z),x,ground(x,z),z,9,5+random()*11,9,[.66,.43,.28]);}
function upload(data){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer,count:data.length/6};}
for(const c of chunks.values()){Object.assign(c,upload(c.data));delete c.data;}
for(const item of config.cajas){const b={...item,y:ground(item.x,item.z),opened:false},a=[];const color=b.tipo==='pregunta'?[.19,.66,.37]:[.78,.25,.19];
 cube(a,b.x,b.y,b.z,1.5,1.25,1.5,color);cube(a,b.x,b.y+1.25,b.z,1.65,.17,1.65,color.map(v=>Math.min(1,v*1.15)));
 cube(a,b.x,b.y+.1,b.z+.762,.25,1.1,.035,[.94,.77,.40]);cube(a,b.x,b.y+.55,b.z+.80,.40,.30,.08,[1,.89,.59]);
 Object.assign(b,upload(a));boxes.push(b);obstacles.push({x:b.x,z:b.z,r:1.15,height:1.42,box:b});}
function draw(mesh){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.enableVertexAttribArray(loc.position);gl.vertexAttribPointer(loc.position,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(loc.color);gl.vertexAttribPointer(loc.color,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
function resize(){const scale=quality.scale;canvas.width=Math.max(1,Math.floor(innerWidth*scale));canvas.height=Math.max(1,Math.floor(innerHeight*scale));gl.viewport(0,0,canvas.width,canvas.height);}
addEventListener('resize',resize);resize();
$('quality').onchange=()=>{quality=presets[$('quality').value];$('qualityLabel').textContent='Calidad '+({low:'baja',medium:'media',high:'alta'}[$('quality').value]);resize();};
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
function release(){if(document.pointerLockElement===canvas)document.exitPointerLock();keys.clear();drag=false;}
function resume(){if($('quiz').open)return;active=true;$('overlay').hidden=true;previous=performance.now();try{const req=canvas.requestPointerLock();if(req&&req.catch)req.catch(()=>notify('Arrastra con el ratón o usa las flechas para mirar.'));}catch{notify('Arrastra con el ratón para mirar.');}}
function pause(){active=false;$('overlay').hidden=false;$('play').firstChild.textContent='Continuar exploración ';$('hint').hidden=true;release();}
$('play').onclick=resume;$('menuBtn').onclick=pause;
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&active&&!$('quiz').open)pause();});
canvas.addEventListener('mousedown',e=>{if(active&&e.button===0)drag=true;});addEventListener('mouseup',()=>drag=false);
addEventListener('mousemove',e=>{if(!active||$('quiz').open)return;if(document.pointerLockElement===canvas||drag){player.yaw-=e.movementX*.0025;player.pitch=Math.max(-1.35,Math.min(1.35,player.pitch-e.movementY*.0025));}});
addEventListener('blur',()=>{keys.clear();if(active)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)pause();});
const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'];
addEventListener('keydown',e=>{if(!active||$('quiz').open)return;if(movement.includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='Escape'){pause();}if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Space'&&!e.repeat&&player.jump===0)player.vy=5;});
addEventListener('keyup',e=>keys.delete(e.code));
function allowed(x,z){if(Math.abs(x)>half-7||Math.abs(z)>half-7)return false;return !obstacles.some(o=>!o.box?.opened && Math.hypot(x-o.x,z-o.z)<o.r+.25);}
function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}));}
function interact(){if(!nearest||!active)return;const b=nearest;
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
 if(keys.has('ArrowLeft'))player.yaw+=dt*1.6;if(keys.has('ArrowRight'))player.yaw-=dt*1.6;
 if(keys.has('ArrowUp'))player.pitch=Math.min(1.35,player.pitch+dt);if(keys.has('ArrowDown'))player.pitch=Math.max(-1.35,player.pitch-dt);
 let f=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),s=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),len=Math.hypot(f,s)||1;
 const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?8:4.5)*dt;
 const dx=(-Math.sin(player.yaw)*f+Math.cos(player.yaw)*s)/len*speed,dz=(-Math.cos(player.yaw)*f-Math.sin(player.yaw)*s)/len*speed;
 if(allowed(player.x+dx,player.z))player.x+=dx;if(allowed(player.x,player.z+dz))player.z+=dz;
 if(player.jump>0||player.vy>0){player.vy-=13*dt;player.jump=Math.max(0,player.jump+player.vy*dt);if(player.jump===0)player.vy=0;}
 player.y+=(ground(player.x,player.z)+1.7+player.jump-player.y)*Math.min(1,dt*18);
 nearest=null;let min=3.7;for(const b of boxes){const d=Math.hypot(player.x-b.x,player.z-b.z);if(!b.opened&&d<min){nearest=b;min=d;}}
 $('hint').hidden=!nearest;if(nearest)$('hint').textContent='[ E ] '+(nearest.tipo==='pregunta'?'Responder pregunta · escudo activo al abrir':'Abrir caja de equipamiento');
}
const map=$('mapa').getContext('2d');
function minimap(){map.fillStyle='#d6b078';map.fillRect(0,0,160,160);const mx=x=>(x/ config.tamano+.5)*160;
 map.strokeStyle='#ac8e62';map.lineWidth=.5;for(let i=0;i<=160;i+=20){map.beginPath();map.moveTo(i,0);map.lineTo(i,160);map.moveTo(0,i);map.lineTo(160,i);map.stroke();}
 map.fillStyle='#798050';for(const o of obstacles){map.fillRect(mx(o.x)-.6,mx(o.z)-.6,1.2,1.2);}
 for(const b of boxes){map.fillStyle=b.opened?'#756b56':b.tipo==='pregunta'?'#178b4f':'#c3362e';map.fillRect(mx(b.x)-2.5,mx(b.z)-2.5,5,5);}
 map.save();map.translate(mx(player.x),mx(player.z));map.rotate(-player.yaw);map.fillStyle='#fff';map.strokeStyle='#26372f';map.lineWidth=1.5;map.beginPath();map.moveTo(0,-7);map.lineTo(4,5);map.lineTo(0,3);map.lineTo(-4,5);map.closePath();map.fill();map.stroke();map.restore();
 $('coords').textContent=Math.round(player.x)+' / '+Math.round(player.z);
}
function render(time){const dt=Math.min(.04,(time-previous)/1000||0);previous=time;
 if(active)update(dt);
 if($('quiz').open&&solved&&returnAt&&time>=returnAt)closeQuiz();
 if($('quiz').open&&!solved){const left=Math.max(0,Math.ceil((deadline-time)/1000));$('shield').textContent='Escudo activo · '+left+' s · movimiento bloqueado';if(!left)answer(null);}
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform3f(loc.camera,player.x,player.y,player.z);gl.uniform2f(loc.turn,player.yaw,player.pitch);gl.uniform1f(loc.aspect,canvas.width/canvas.height);gl.uniform1f(loc.distanceMax,quality.distance);
 for(const c of chunks.values())if(Math.hypot(c.x-player.x,c.z-player.z)<quality.distance+24)draw(c);
 for(const b of boxes)if(!b.opened&&Math.hypot(b.x-player.x,b.z-player.z)<quality.distance+3)draw(b);
 frames++;if(time-fpsStart>=1000){$('fps').textContent=Math.round(frames*1000/(time-fpsStart))+' FPS';frames=0;fpsStart=time;}
 if(time-lastUI>120){minimap();lastUI=time;}
 requestAnimationFrame(render);
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();fail('Se perdió el contexto gráfico. Recarga la página para continuar.');});
// Contrato pequeño para conectar después el proyecto. No implementa autoridad de servidor.
window.EscenarioDesierto=Object.freeze({
 version:'1.0.1',
 getState:()=>({mapa:'desierto',semilla:config.semilla,jugador:{...player},puntos:points,inventario:[...inventory],cajasAbiertas:boxes.filter(b=>b.opened).map(b=>b.id)}),
 pause,resume,
 reset:()=>location.reload()
});
requestAnimationFrame(render);
})();
