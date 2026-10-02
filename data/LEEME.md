# FreeSIMON — Personaje, armas, botiquines y escudos

Estos archivos contienen código completo. No sobrescribas tus originales: copia ambos JS a data y cambia únicamente las etiquetas de carga. No cargues las versiones anteriores junto con las nuevas.

## Archivos incluidos

- personajeD_completo.js: personaje, cámara, armas, inventario, botiquines y escudo visible.
- vida_jugador_completo.js: cinco corazones, inmunidad, curación, validación de escudos y derrota.

Reglas: un golpe sin escudo quita un corazón; un escudo activado absorbe un golpe desde cualquier dirección y se rompe; no se acumulan escudos activos. Un botiquín recupera un corazón tras 1,4 s. La pausa, las preguntas y los impactos aceptados cancelan la curación sin gastar el botiquín. Una nueva entrada comienza con cinco corazones. La derrota regresa a ../html/panel_sala.html tras tres segundos.

## 1. Etiquetas al final de escenario.html

Reemplaza las etiquetas correspondientes, no las dupliques:

```html
<script src="desierto.config.js?v=preguntas-docente"></script>
<script src="personaje.js?v=personaje-3d-fix3"></script>
<script src="vida_jugador_completo.js?v=1"></script>
<script src="personajeD_completo.js?v=1"></script>
<script src="escenario.js?v=equipo-completo-1"></script>
```

## 2. Vida en escenario.js

Si ya tienes VidaJugador.configurar, reemplaza ese bloque por este. Si no, insértalo después de la declaración que empieza con let active = false. No necesitas otro bucle de animación.

```javascript
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
```

Al comienzo de resume(), conserva o agrega:

```javascript
if (VidaJugador.estaMuerto()) return;
```

## 3. Instancia única de equipo

Antes de const terceraPersona = new PersonajeTerceraPersona(...), crea UNA instancia. Si ya existe equipoJugador, reemplázala; no la dupliques.

```javascript
const equipoJugador = new EquipoJugador({
  inventario: inventory,
  avisar: notify,
  puedeUsar: () => active && !player.protected && !VidaJugador.estaMuerto(),
  puedeRecibirDano: () => active && !player.protected && !VidaJugador.estaMuerto()
});
```

En las opciones de terceraPersona agrega equipo: equipoJugador. Conserva distancia, altura y tu función bloqueado:

```javascript
const terceraPersona = new PersonajeTerceraPersona(gl, {
  equipo: equipoJugador,
  distancia: 8,
  altura: 1.85,
  bloqueado: (x, y, z) => {
    if (y < ground(x, z) + 0.25) return true;
    return obstacles.some(o => {
      const base = o.box?.y ?? ground(o.x, o.z);
      return y > base - 0.2 && y < base + o.height + 0.3 &&
        Math.hypot(x - o.x, z - o.z) < o.r + 0.3;
    });
  }
});
```

## 4. Cofres

Dentro de interact(), sustituye únicamente el bloque if (caja.tipo === 'equipo') completo por:

```javascript
if (caja.tipo === 'equipo') {
  equipoJugador.recoger(caja);
  return;
}
```

Conserva el código de las preguntas verdes. El desierto compartido ya emite escenario:proteccion al abrir/cerrar preguntas; el sistema de vida lo escucha.

## 5. Render

Dentro de render(time), inmediatamente DESPUÉS del bloque if (active) { update(dt); updateWeather(dt); }, agrega una sola vez:

```javascript
equipoJugador.actualizar(dt);
```

Conserva la cámara vista y sus uniforms, tal como ya funcionan. Sustituye el dibujo directo del personaje por:

```javascript
if (VidaJugador.debeDibujarPersonaje()) {
  terceraPersona.dibujar(program, loc);
}
```

## 6. Controles

Pega después de crear equipoJugador. Si ya conectaste estos eventos, reemplaza los anteriores para evitar ejecutar cada acción dos veces.

```javascript
window.addEventListener('keydown', evento => {
  if (!active || player.protected || VidaJugador.estaMuerto()) return;
  equipoJugador.manejarTecla(evento);
});
canvas.addEventListener('mousedown', evento => {
  if (evento.button === 0 && document.pointerLockElement === canvas &&
      active && !player.protected && !VidaJugador.estaMuerto()) {
    equipoJugador.usarArma();
  }
});
```

Q saca/guarda arma; F o clic usa arma; H cura; G activa escudo; 1–5 selecciona armas. Elimina la prueba anterior de H que quitaba vida.

## 7. Contenido de los cofres en desierto.config.js

En las entradas existentes de tipo equipo, agrega botiquines y escudos. Conserva sus id, x, z y objeto. Ejemplo del cofre roja-1 compartido:

```javascript
{ id: 'roja-1', tipo: 'equipo', x: 3, z: 2, objeto: 'Arco', botiquines: 2, escudos: 2 },
```

También puedes cambiar el objeto de un cofre existente por 'Botiquín' o 'Escudo'. Los nombres exactos son Espada, Hacha, Arco, Pistola, Metralleta, Botiquín y Escudo. No hace falta crear nuevas posiciones.

## 8. Comprobación temporal (opcional)

Pega dentro del escenario, después de crear equipoJugador. J simula un impacto. Elimina este bloque cuando conectes el combate:

```javascript
window.addEventListener('keydown', evento => {
  if (evento.code === 'KeyJ' && !evento.repeat && active && !player.protected) {
    equipoJugador.recibirDano(1);
  }
});
```

Recoge el cofre roja-1. Pulsa G y luego J: se rompe el escudo sin perder vida. Espera más de un segundo y pulsa J otra vez: pierdes un corazón. H recupera un corazón al finalizar la curación y consume un botiquín. Durante una pregunta, no debe recibirse daño. Al perder cinco corazones vuelve a la sala.

## Alcance y comprobaciones

El uso del arma anima el modelo y emite escenario:uso-arma; no implementa proyectiles, detección de impactos sobre otros jugadores ni servidor LAN. El código que detecte un impacto debe llamar una sola vez a equipoJugador.recibirDano(1). No lo dupliques con VidaJugador.recibirGolpe().

Pruebas realizadas con mocks de DOM/WebGL: sintaxis, recogida única, escudo, inmunidad, curación, cancelación, derrota única y geometría finita en 84 combinaciones de modelos/equipo con escudo. La posición visual del panel y de los accesorios requiere prueba en el navegador real del proyecto. No se ha cambiado la estructura visual de escenario.html.
