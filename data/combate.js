// Un impacto válido elimina un NPC. El jugador conserva corazones e inmunidad.
// Este sistema es LOCAL; la autoridad del servidor LAN se conectará después.
(() => {
  'use strict';
  class CombateSistema {
    constructor({enemigos,proyectiles,player,personaje,equipo,permitido}) {
      Object.assign(this,{enemigos,proyectiles,player,personaje,equipo,permitido});
      enemigos.atacar=e=>this.ataqueEnemigo(e);
      proyectiles.buscarObjetivo=(p,dueno)=>this.buscarObjetivo(p,dueno);
      proyectiles.alImpactar=(objetivo,dueno)=>{
        if(!this.permitido())return;
        if(dueno==='jugador'&&objetivo.tipo==='enemigo')this.enemigos.eliminar(objetivo.enemigo);
        else if(dueno!=='jugador'&&objetivo.tipo==='jugador')this.equipo.recibirDano(1);
      };
    }
    visionLibre(a,b){return !this.proyectiles.impacto(a,b);}
    buscarObjetivo(p,dueno) {
      if(dueno==='jugador') {
        for(const e of this.enemigos.lista){
          if(e.vivo&&p.y>=e.pies&&p.y<=e.pies+1.85&&Math.hypot(p.x-e.x,p.z-e.z)<.5)
            return {tipo:'enemigo',enemigo:e};
        }
      } else {
        const j=this.player,pies=j.y-1.7;
        if(p.y>=pies&&p.y<=pies+1.85&&Math.hypot(p.x-j.x,p.z-j.z)<.45)return {tipo:'jugador'};
      }
      return null;
    }
    ataqueDelJugador(arma,vista) {
      if(!this.permitido())return;
      const j=this.player;
      // La cámara y la orientación suave del personaje no se alteran al disparar.
      if(['Espada','Hacha'].includes(arma)) {
        const origen={x:j.x,y:j.y-.7,z:j.z};
        const frente={x:-Math.sin(j.yaw),z:-Math.cos(j.yaw)};
        let elegido=null,menor=arma==='Hacha'?2.5:2.8;
        for(const e of this.enemigos.lista){
          if(!e.vivo)continue;
          const dx=e.x-j.x,dz=e.z-j.z,d=Math.hypot(dx,dz);
          const objetivo={x:e.x,y:e.pies+1,z:e.z};
          if(d<menor&&Math.abs(objetivo.y-origen.y)<1.8&&
             (dx*frente.x+dz*frente.z)/Math.max(d,.001)>.55&&this.visionLibre(origen,objetivo)){
            elegido=e;menor=d;
          }
        }
        if(elegido)this.enemigos.eliminar(elegido);
      } else if(['Arco','Pistola','Metralleta'].includes(arma)) {
        const mira={x:j.x,y:j.y,z:j.z,yaw:this.personaje.giro,pitch:j.pitch};
        this.proyectiles.disparar(this.personaje.obtenerOrigenFlecha(),mira,
          {dueno:'jugador',tipo:arma==='Arco'?'flecha':'bala'});
      }
    }
    ataqueEnemigo(e) {
      if(!this.permitido()||!e.vivo)return;
      const j=this.player,objetivo={x:j.x,y:j.y-.7,z:j.z};
      const centro={x:e.x,y:e.pies+1.2,z:e.z};
      if(!this.visionLibre(centro,objetivo))return;
      if(['Espada','Hacha'].includes(e.arma)){
        if(Math.hypot(e.x-j.x,e.z-j.z)<2.15&&Math.abs(centro.y-objetivo.y)<1.8)this.equipo.recibirDano(1);
      } else {
        e.modelo.actualizar({x:e.x,z:e.z,yaw:e.yaw,pitch:0},0,e.pies);
        e.modelo.giro=e.yaw;
        const origen=e.modelo.obtenerOrigenFlecha() || centro;
        this.proyectiles.dispararHacia(origen,objetivo,
          {dueno:e.id,tipo:e.arma==='Arco'?'flecha':'bala'});
      }
    }
  }
  window.CombateSistema=CombateSistema;
})();
