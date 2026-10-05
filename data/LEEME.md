# Castillo e hielo: versiones ligeras

## Instalación
1. Guarda una copia de tus actuales castillo.js e hielo.js.
2. Copia los dos archivos JS de este paquete a la carpeta data, reemplazando los anteriores.
3. Conserva tus archivos HTML, CSS, .config.js y los módulos compartidos del juego.
4. Abre el escenario y pulsa Ctrl + F5 para cargar la versión nueva.

Los escenarios comienzan en calidad baja. Puedes elegir media si deseas más nitidez y adornos cercanos; alta requiere más recursos.

## Qué se optimizó
- Se conservan la distribución, los edificios, los muñecos de nieve, los cofres y los eventos de apagones y nevada.
- Los sectores fuera de la vista dejan de dibujarse, usando límites que incluyen toda su geometría.
- Los adornos secundarios tienen una distancia de dibujo menor.
- La resolución interna se limita a una base máxima de 1280 × 720, ajustada al nivel de calidad. La interfaz conserva su tamaño.
- Se dibujan menos copos durante las nevadas.
- Las colisiones consultan los objetos cercanos mediante una cuadrícula, en lugar de recorrer todos los obstáculos.
- El minimapa se actualiza cada 250 ms.

No se necesita instalar librerías adicionales ni modificar la configuración del docente.

## Verificación
Se verificaron la sintaxis, las colisiones, el acceso a los cofres, la cámara y los eventos en un entorno de prueba; también se renderizó una vista de cada mapa. El rendimiento final debe comprobarse en la laptop: estas optimizaciones no garantizan una cantidad concreta de FPS.
