# Castillo e Hielo — integración corregida

## Instalación

Copia estos OCHO archivos directamente en `C:\xampp\htdocs\freesimon\data`, reemplazando las versiones anteriores del castillo y del hielo:

- castillo.html
- castillo.js
- castillo.css
- castillo.config.js
- hielo.html
- hielo.js
- hielo.css
- hielo.config.js

No copies los archivos de esta entrega a las carpetas html, js o css: estos escenarios mantienen sus cuatro archivos juntos en data, como tu desierto.

Los HTML ya contienen las rutas y el orden de scripts de TU escenario.html. Ya no debes copiar ni reconstruir manualmente el bloque de scripts. Conserva los módulos compartidos existentes de tu proyecto; no se incluyen versiones antiguas para reemplazarlos.

Después de copiar, recarga con Ctrl+F5. Entra desde el panel docente y la sala con las preguntas cargadas, igual que en el desierto.

## Correcciones de esta entrega

- HTML construido sobre el modelo que enviaste, con el DOM completo del temporizador.
- Vida: `vida_jugador_completo.js`.
- Botiquines: `botiquin_jugador.js`.
- Temporizador: `../js/temporizador_juego.js` y `../css/temporizador_juego.css`.
- Supervivencia: `../js/supervivencia_runtime.js`.
- Orden y versiones de personajes, proyectiles, combate y enemigos iguales a tu HTML.
- Recuperación de corazones compatible con `recuperarCorazon` y `recuperarCorazones`, como tu escenario.js.
- `Supervivencia.alCerrarPregunta()` solo se consulta cuando el modo está activo.
- Preguntas con `texto`, cuatro `alternativas` y `correcta` entre 0 y 3, leídas de `juegoPreguntas`.
- Cofres de armas con `botiquines: 2` y `escudos: 2`, siguiendo desierto.config.js.
- Selector de clima conectado y tecla T funcional: automático / despejado / evento activo.
- Cámara alineada con el modelo, con colisiones contra paredes, plataformas y techos.

## Controles y clima

WASD: caminar. Ratón o flechas: mirar. Shift: correr. Espacio: saltar. E: cofre. Q: guardar/sacar arma. F o clic: usar. H: botiquín. G: escudo. V: punto seguro. T: alternar clima. Esc: pausa.

Castillo: interior con biblioteca, cripta, celdas y trono; apagones periódicos con iluminación tenue. Hielo: lago congelado, iglús, muñecos de nieve y nevadas periódicas.

En cada config puedes ajustar `clima.primerEvento`, `intervalo` y `duracion` (segundos activos), o cambiar `modo` entre `auto`, `clear` y `storm`. En castillo `storm` significa apagón; en hielo, nevada. `luzMinima` controla la luz del apagón. `activo: false` desactiva el efecto, incluso en modo manual.

## Selector de mapas

Si ya agregaste los dos mapas al panel, no repitas este paso.

En el arreglo de escenarios de panel_configuracion.js:

```js
{ id: 'castillo', nombre: 'Castillo de las Sombras', imagen: '../img/castillo.png' },
{ id: 'hielo', nombre: 'Reino de Hielo', imagen: '../img/hielo.png' }
```

En el objeto de rutas que YA usa el botón Comenzar juego de panel_sala.js:

```js
castillo: '../data/castillo.html',
hielo: '../data/hielo.html'
```

Conserva las demás entradas y validaciones. Las imágenes son las entregadas por separado; este ZIP contiene solo código e instrucciones.

## Verificación

Se verificaron sintaxis, elementos HTML requeridos, coincidencia exacta de los scripts compartidos con el modelo, apertura/respuesta/cierre de preguntas, compatibilidad de curación, cámara, acceso a cofres y ciclos manuales/automáticos del clima.

La verificación de lógica usa las interfaces de los módulos compartidos; los archivos actuales completos de vida, botiquines, temporizador y supervivencia no se adjuntaron. Por eso no equivale a una prueba de tu proyecto completo en navegador ni a una medición en tu laptop. Los módulos compartidos se conservan tal como funcionan en tu desierto.
