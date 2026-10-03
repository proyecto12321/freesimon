// NPC locales. Cada plaza tiene un solo enemigo; se repone 5 s tras morir.
// No escribe sessionStorage ni cambia el personaje elegido por el jugador.
(() => {
  'use strict';
  const elegir = lista => lista[Math.floor(Math.random()*lista.length)];
  class EnemigosSistema {
    constructor(gl, {config, ground, obstacles, limite, player, cube, upload, draw, avisar}) {
      Object.assign(this,{gl,config,ground,obstacles,limite,player,draw,avisar});
      this.catalogo=window.PersonajesKaku.obtenerTodos();
      this.lista=Array.from({length:Math.max(0,Math.min(20,Math.floor(config.cantidad)))},
        (_,i)=>({id:'npc-'+i,vivo:false,reaparece:0,modelo:null}));
      this.atacar=()=>{};this.bajas=0;
      const datos=[];
      // Indicador rojo sobre cada NPC; amarillo mientras prepara un ataque.
      cube(datos,0,2.12,0,.12,.25,.12,[1,.16,.13]);
      cube(datos,0,2.04,0,.12,.05,.12,[1,.16,.13]);
      this.marca=upload(datos);
      const aviso=[];cube(aviso,0,2.12,0,.22,.22,.22,[1,.84,.15]);
      this.aviso=upload(aviso);
    }
    libre(x,z,ignorar=null) {
      if(Math.abs(x)>this.limite-8||Math.abs(z)>this.limite-8)return false;
      if(this.obstacles.some(o=>!o.box?.supervivenciaOculta&&Math.hypot(x-o.x,z-o.z)<o.r+.48))return false;
      return !this.lista.some(e=>e!==ignorar&&e.vivo&&Math.hypot(x-e.x,z-e.z)<.95);
    }
    aparecer(e) {
      const c=this.config;
      for(let intento=0;intento<90;intento++) {
        const a=Math.random()*Math.PI*2;
        const d=c.distanciaMinimaAparicion+Math.random()*(c.distanciaMaximaAparicion-c.distanciaMinimaAparicion);
        const x=this.player.x+Math.sin(a)*d,z=this.player.z+Math.cos(a)*d;
        if(!this.libre(x,z,e))continue;
        const modelo=elegir(this.catalogo), arma=elegir(c.armas);
        if(e.modelo)e.modelo.destruir();
        Object.assign(e,{x,z,pies:this.ground(x,z),yaw:a,vivo:true,arma,nombre:modelo.nombre,
          modeloId:modelo.id,uso:0,espera:2+Math.random()*2,preparacion:0,patrulla:0,
          persigue:false,atascado:0});
        e.modelo=new PersonajeTerceraPersona(this.gl,{modeloId:modelo.id,soloModelo:true,
          equipo:{getState:()=>({objetoEnMano:e.arma,progresoUso:e.uso>0?1-e.uso/.5:0})}});
        this.destinoPatrulla(e);
        return true;
      }
      // Si no hay sitio libre, reintentar; nunca colocar dentro de un obstáculo.
      e.reaparece=1;return false;
    }
    destinoPatrulla(e) {
      const a=Math.random()*Math.PI*2,d=4+Math.random()*9;
      e.destino={x:e.x+Math.sin(a)*d,z:e.z+Math.cos(a)*d};
      e.patrulla=3+Math.random()*5;
    }
    mover(e,tx,tz,velocidad,dt) {
      const dx=tx-e.x,dz=tz-e.z,l=Math.hypot(dx,dz);
      if(l<.25)return false;
      const angulo=Math.atan2(dx,dz),paso=Math.min(l,velocidad*dt);
      // Desvíos locales; no es navegación global por laberintos.
      for(const desvio of [0,.65,-.65,1.15,-1.15]) {
        const x=e.x+Math.sin(angulo+desvio)*paso,z=e.z+Math.cos(angulo+desvio)*paso;
        if(Math.hypot(x-this.player.x,z-this.player.z)<1)continue;
        if(this.libre(x,z,e)&&Math.abs(this.ground(x,z)-this.ground(e.x,e.z))<=1.05){
          e.x=x;e.z=z;e.atascado=0;return true;
        }
      }
      e.atascado+=dt;
      if(e.atascado>1.5){this.destinoPatrulla(e);e.atascado=0;}
      return false;
    }
    eliminar(e) {
      if(!e?.vivo)return false;
      e.vivo=false;e.reaparece=this.config.reaparicion;e.preparacion=0;
      this.bajas++;
      this.avisar(`Enemigo eliminado: ${e.nombre} · Total: ${this.bajas}`);
      window.dispatchEvent(new CustomEvent('escenario:enemigo-eliminado',{
        detail:{id:e.id,personaje:e.nombre,arma:e.arma,bajas:this.bajas}}));
      return true;
    }
    actualizar(dt,visionLibre) {
      dt=Math.max(0,Math.min(.05,dt));
      const p=this.player,c=this.config;
      for(const e of this.lista){
        if(!e.vivo){e.reaparece-=dt;if(e.reaparece<=0)this.aparecer(e);continue;}
        e.uso=Math.max(0,e.uso-dt);e.espera=Math.max(0,e.espera-dt);
        const distancia=Math.hypot(p.x-e.x,p.z-e.z);
        const piesJugador=p.y-1.7;
        const origen={x:e.x,y:e.pies+1.2,z:e.z};
        const objetivo={x:p.x,y:piesJugador+1,z:p.z};
        const visible=distancia<c.perderRastro&&visionLibre(origen,objetivo);
        if(distancia<c.deteccion&&visible)e.persigue=true;
        if(distancia>c.perderRastro)e.persigue=false;
        const alcance=['Espada','Hacha'].includes(e.arma)?2.1:19;
        if(e.preparacion>0){
          e.yaw=Math.atan2(e.x-p.x,e.z-p.z);
          e.preparacion=Math.max(0,e.preparacion-dt);
          if(!e.preparacion){
            if(distancia<=alcance&&visible){e.uso=.5;this.atacar(e);}
            e.espera=c.intervaloAtaque+Math.random()*.6;
          }
        } else if(e.persigue&&visible&&distancia<=alcance){
          e.yaw=Math.atan2(e.x-p.x,e.z-p.z);
          if(e.espera<=0)e.preparacion=c.avisoAtaque;
        } else if(e.persigue&&visible){
          this.mover(e,p.x,p.z,c.velocidadPersecucion,dt);
        } else {
          e.patrulla-=dt;
          if(e.patrulla<=0||Math.hypot(e.destino.x-e.x,e.destino.z-e.z)<.6)this.destinoPatrulla(e);
          this.mover(e,e.destino.x,e.destino.z,c.velocidadPatrulla,dt);
        }
        e.pies+=(this.ground(e.x,e.z)-e.pies)*Math.min(1,dt*14);
        e.modelo.actualizar({x:e.x,z:e.z,yaw:e.yaw,pitch:0},dt,e.pies);
        if(e.preparacion>0||(e.persigue&&visible&&distancia<=alcance))e.modelo.giro=e.yaw;
        else e.yaw=e.modelo.giro;
      }
    }
    dibujar(program,loc,distancia) {
      const gl=this.gl;
      for(const e of this.lista){
        if(!e.vivo||Math.hypot(e.x-this.player.x,e.z-this.player.z)>Math.min(distancia,this.config.distanciaDibujo))continue;
        e.modelo.dibujar(program,loc);
        gl.uniform3f(loc.offset,e.x,e.pies,e.z);
        this.draw(e.preparacion>0?this.aviso:this.marca);
        gl.uniform3f(loc.offset,0,0,0);
      }
    }
    destruir(){for(const e of this.lista)e.modelo?.destruir();this.gl.deleteBuffer(this.marca.buffer);this.gl.deleteBuffer(this.aviso.buffer);}
  }
  window.EnemigosSistema=EnemigosSistema;
})();
