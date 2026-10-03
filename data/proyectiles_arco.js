// Flechas locales: geometría compartida, gravedad y colisiones por segmentos.
// No crea otro bucle de animación ni aplica daño multijugador.
(() => {
  'use strict';
  class FlechasEscenario {
    constructor(gl, {cube, ground, obstacles, limite = 200, buscarObjetivo = () => null, alImpactar = () => {}}) {
      this.gl = gl; this.ground = ground; this.obstacles = obstacles;
      this.limite = limite; this.buscarObjetivo=buscarObjetivo; this.alImpactar=alImpactar;
      this.flechas = []; this.maximo = 48;
      const v = [];
      // Punta en z=0; asta y plumas quedan detrás de la punta.
      cube(v,0,-.035,.43,.07,.07,.78,[.95,.68,.27]);
      cube(v,0,-.055,.05,.11,.11,.16,[.83,.9,.96]);
      cube(v,0,-.12,.77,.025,.24,.20,[.96,.9,.62]);
      cube(v,0,-.015,.77,.24,.03,.20,[.93,.72,.25]);
      this.modelo = v; this.datos = new Float32Array(v.length*this.maximo);
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER,this.datos.byteLength,gl.DYNAMIC_DRAW);
    }
    // Geometría aproximada de colisión usada por el escenario.
    solido(p) {
      if (Math.abs(p.x)>this.limite || Math.abs(p.z)>this.limite) return true;
      if (p.y <= this.ground(p.x,p.z)+.035) return true;
      return this.obstacles.some(o => {
        if (o.box?.supervivenciaOculta) return false;
        const base = o.box?.y ?? o.y ?? this.ground(o.x,o.z);
        const height = o.height ?? o.h ?? 0;
        const radius = o.r ?? 0;
        return height > 0 && p.y >= base && p.y <= base+height &&
          Math.hypot(p.x-o.x,p.z-o.z) <= radius+.035;
      });
    }
    // Comprobar todo el trayecto evita atravesar objetos entre fotogramas.
    impacto(a,b,dueno=null) {
      const n = Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)/.10));
      for (let i=0;i<=n;i++) {
        const t=i/n;
        const p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
        if(this.solido(p)) return p;
        const objetivo=dueno ? this.buscarObjetivo(p,dueno) : null;
        if(objetivo)return {...p,impactado:objetivo};
      }
      return null;
    }
    disparar(origen,vista,opciones={}) {
      if (!origen) return;
      const frente={x:-Math.sin(vista.yaw)*Math.cos(vista.pitch),
        y:Math.sin(vista.pitch),z:-Math.cos(vista.yaw)*Math.cos(vista.pitch)};
      const lejano={x:origen.x+frente.x*100,y:origen.y+frente.y*100,z:origen.z+frente.z*100};
      let objetivo=this.impacto(origen,lejano,opciones.dueno || "jugador")||lejano;
      // Si la mira toca un NPC, usar ese punto ligeramente dentro de su cuerpo
      // para que el borde del volumen no provoque un fallo por redondeo.
      if(objetivo.impactado?.tipo === 'enemigo') {
        const e=objetivo.impactado.enemigo;
        objetivo={x:e.x,y:objetivo.y,z:e.z};
      }
      let x=objetivo.x-origen.x,y=objetivo.y-origen.y,z=objetivo.z-origen.z;
      // Mantener la dirección de la mira si el volumen de origen toca un obstáculo.
      if(x*frente.x+y*frente.y+z*frente.z<=0) ({x,y,z}=frente);
      this.dispararHacia(origen,{x:origen.x+x,y:origen.y+y,z:origen.z+z},opciones);
    }
    // Propietario y tipo permiten distinguir las armas del jugador y los NPC.
    dispararHacia(origen,objetivo,{dueno='jugador',tipo='flecha'}={}) {
      let x=objetivo.x-origen.x,y=objetivo.y-origen.y,z=objetivo.z-origen.z;
      const largo=Math.hypot(x,y,z)||1, velocidad=tipo==='bala'?55:28;
      let vx=x/largo*velocidad, vy=y/largo*velocidad, vz=z/largo*velocidad;
      // Arco bajo calculado: compensar la gravedad hacia el punto apuntado.
      // Si el punto es inalcanzable, conservar la dirección inicial normal.
      const horizontal=Math.hypot(x,z), gravedad=4, v2=velocidad*velocidad;
      if(tipo==='flecha' && horizontal>.001) {
        const discriminante=v2*v2-gravedad*(gravedad*horizontal*horizontal+2*y*v2);
        if(discriminante>=0) {
          const angulo=Math.atan((v2-Math.sqrt(discriminante))/(gravedad*horizontal));
          const vh=velocidad*Math.cos(angulo);
          vx=x/horizontal*vh;vz=z/horizontal*vh;vy=velocidad*Math.sin(angulo);
        }
      }
      if(this.flechas.length>=this.maximo)this.flechas.shift();
      this.flechas.push({p:{...origen},v:{x:vx,y:vy,z:vz},
        dueno,tipo,gravedad:tipo==='bala'?0:4,edad:0,clavada:false,restante:tipo==='bala'?.10:2});
    }
    actualizar(dt) {
      dt=Math.max(0,Math.min(.05,dt));
      for(const f of this.flechas){
        f.edad+=dt;
        if(f.clavada){f.restante-=dt;continue;}
        const siguiente={x:f.p.x+f.v.x*dt,y:f.p.y+f.v.y*dt-f.gravedad*.5*dt*dt,z:f.p.z+f.v.z*dt};
        const hit=this.impacto(f.p,siguiente,f.dueno);
        if(hit){
          f.p={x:hit.x,y:hit.y,z:hit.z};f.clavada=true;
          if(hit.impactado){this.alImpactar(hit.impactado,f.dueno);f.restante=0;}
          window.dispatchEvent(new CustomEvent('escenario:impacto-flecha',{detail:{posicion:{...f.p},dueno:f.dueno}}));
        }else{f.p=siguiente;f.v.y-=f.gravedad*dt;}
      }
      this.flechas=this.flechas.filter(f=>f.edad<7&&f.restante>0);
    }
    dibujar(program,loc) {
      if(!this.flechas.length)return;
      let k=0;
      for(const f of this.flechas){
        // Eje Z local apunta hacia atrás; orientar punta según velocidad.
        const l=Math.hypot(f.v.x,f.v.y,f.v.z)||1;
        const z={x:-f.v.x/l,y:-f.v.y/l,z:-f.v.z/l};
        const h=Math.hypot(z.x,z.z);
        const x=h>.0001?{x:z.z/h,y:0,z:-z.x/h}:{x:1,y:0,z:0};
        const y={x:z.y*x.z-z.z*x.y,y:z.z*x.x-z.x*x.z,z:z.x*x.y-z.y*x.x};
        for(let i=0;i<this.modelo.length;i+=6){
          const escala=f.tipo==='bala'?.40:1;
          const a=this.modelo[i]*escala,b=this.modelo[i+1]*escala,c=this.modelo[i+2]*escala;
          this.datos[k++]=f.p.x+x.x*a+y.x*b+z.x*c;
          this.datos[k++]=f.p.y+x.y*a+y.y*b+z.y*c;
          this.datos[k++]=f.p.z+x.z*a+y.z*b+z.z*c;
          this.datos[k++]=f.tipo==='bala'?1:this.modelo[i+3];this.datos[k++]=f.tipo==='bala'?.85:this.modelo[i+4];this.datos[k++]=f.tipo==='bala'?.15:this.modelo[i+5];
        }
      }
      const gl=this.gl;
      gl.useProgram(program);gl.uniform3f(loc.offset,0,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,this.datos.subarray(0,k));
      gl.enableVertexAttribArray(loc.position);gl.enableVertexAttribArray(loc.color);
      gl.vertexAttribPointer(loc.position,3,gl.FLOAT,false,24,0);
      gl.vertexAttribPointer(loc.color,3,gl.FLOAT,false,24,12);
      gl.drawArrays(gl.TRIANGLES,0,k/6);
    }
    destruir(){this.gl.deleteBuffer(this.buffer);this.flechas=[];}
  }
  window.FlechasEscenario=FlechasEscenario;
})();
