# Corrección del arco y apuntado contra NPC

Basada en FreeSIMON_enemigos_automaticos, la última versión entregada en esta conversación.

## Instalar
1. Guarda una copia de tus cuatro archivos actuales.
2. Copia en data los cuatro JS completos de este paquete, reemplazando sus versiones:
   - personajeD_completo.js
   - proyectiles_arco.js
   - combate.js
   - escenario.js
3. Conserva enemigos.js, enemigos.config.js, personaje.js, vida, botiquines, temporizador y todos los demás archivos existentes.
4. En escenario.html actualiza las etiquetas correspondientes. No las dupliques:

```html
<!-- Conserva antes los scripts existentes de configuración, catálogo,
     vida, botiquines del mapa y temporizador. -->
<script src="personajeD_completo.js?v=arco-fix-2"></script>
<script src="enemigos.config.js?v=npc-1"></script>
<script src="proyectiles_arco.js?v=arco-fix-2"></script>
<script src="enemigos.js?v=npc-1"></script>
<script src="combate.js?v=arco-fix-2"></script>
<script src="escenario.js?v=arco-fix-2"></script>
```

5. Recarga con Ctrl+F5 y comienza una nueva partida.

## Qué se corrige
- Cámara inicial horizontal; elimina el descuento oculto de 0,22 radianes que dirigía la mira al suelo próximo.
- Los límites verticales de entrada y cámara coinciden; no se acumula un exceso invisible de movimiento.
- El disparo del jugador ya no asigna instantáneamente personaje.giro. Con arma en mano el cuerpo sigue suavemente la orientación de la mira; desplazarse de lado no fuerza la dirección del siguiente tiro.
- La flecha compensa la gravedad con una trayectoria de arco bajo para alcanzar el punto de la mira cuando es físicamente alcanzable. No es un proyectil teledirigido: enemigos móviles pueden esquivarla.
- Cuando la mira toca el cuerpo de un NPC, el destino se coloca dentro de su volumen para evitar fallos en el borde por redondeo.
- Flecha más visible y sin flecha decorativa sobre el arco durante la animación de disparo.

## Prueba
Recoge el arco y apunta al CUERPO de un enemigo, no a la marca roja situada por encima de su cabeza. Pulsa F o clic izquierdo con el ratón capturado. Prueba primero con el enemigo a unos 8–20 metros/unidades, con visión libre. Repite girando a izquierda, derecha y detrás de la dirección inicial. El disparo debe conservar la orientación de la vista y la flecha debe viajar antes de impactar.

Las paredes y el terreno siguen bloqueando el disparo: no se ha eliminado la colisión. Para un enemigo en movimiento debes anticipar su desplazamiento. El escudo, las preguntas, los NPC y su reaparición conservan sus reglas.

## Verificación y límites
Sintaxis de los cuatro archivos; 288 disparos simulados con los 12 modelos del catálogo, ocho orientaciones y tres distancias (8, 20 y 35), usando cámara, origen del arco, trayectoria y colisión del combate. Se comprobó que el disparo no cambia yaw/pitch ni asigna el giro del personaje, y que el límite vertical responde inmediatamente al invertir el movimiento.

Pendiente comprobar visualmente en el navegador del proyecto completo y medir rendimiento en la laptop. Esta entrega continúa siendo local, sin sincronización LAN.
