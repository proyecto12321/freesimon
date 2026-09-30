const nombre = sessionStorage.getItem("nombreJugador");
const grado = sessionStorage.getItem("gradoJugador");
const seccion = sessionStorage.getItem("seccionJugador");


// Verificar que existan los tres datos
if (!nombre || !grado || !seccion) {

    window.location.href = "../index.html";

} else {

    document.getElementById("datosJugador").textContent =
        `Jugador: ${nombre} | Grado: ${grado}.º | Sección: ${seccion}`;

}