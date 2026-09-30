const volumenGeneral = document.getElementById("volumenGeneral");
const volumenMusica = document.getElementById("volumenMusica");
const volumenEfectos = document.getElementById("volumenEfectos");
const sensibilidad = document.getElementById("sensibilidad");

const valorVolumenGeneral = document.getElementById("valorVolumenGeneral");
const valorVolumenMusica = document.getElementById("valorVolumenMusica");
const valorVolumenEfectos = document.getElementById("valorVolumenEfectos");
const valorSensibilidad = document.getElementById("valorSensibilidad");

const calidad = document.getElementById("calidad");
const fps = document.getElementById("fps");
const pantallaCompleta = document.getElementById("pantallaCompleta");
const mostrarFps = document.getElementById("mostrarFps");

function actualizarValores() {
    valorVolumenGeneral.textContent = volumenGeneral.value + "%";
    valorVolumenMusica.textContent = volumenMusica.value + "%";
    valorVolumenEfectos.textContent = volumenEfectos.value + "%";
    valorSensibilidad.textContent = sensibilidad.value;
}

function aplicarVolumen() {
    const general = Number(volumenGeneral.value) / 100;
    const musica = Number(volumenMusica.value) / 100;
    const efectos = Number(volumenEfectos.value) / 100;

    document.querySelectorAll(".audio-musica").forEach(audio => {
        audio.volume = general * musica;
    });

    document.querySelectorAll(".audio-efecto").forEach(audio => {
        audio.volume = general * efectos;
    });
}

function actualizarConfiguracion() {
    actualizarValores();
    aplicarVolumen();
}

volumenGeneral.addEventListener("input", actualizarConfiguracion);
volumenMusica.addEventListener("input", actualizarConfiguracion);
volumenEfectos.addEventListener("input", actualizarConfiguracion);

sensibilidad.addEventListener("input", function () {
    valorSensibilidad.textContent = sensibilidad.value;
});

document.getElementById("btnGuardar").addEventListener("click", function () {
    const configuracion = {
        volumenGeneral: volumenGeneral.value,
        volumenMusica: volumenMusica.value,
        volumenEfectos: volumenEfectos.value,
        sensibilidad: sensibilidad.value,
        calidad: calidad.value,
        fps: fps.value,
        pantallaCompleta: pantallaCompleta.checked,
        mostrarFps: mostrarFps.checked
    };

    localStorage.setItem(
        "simonCraftConfig",
        JSON.stringify(configuracion)
    );

    alert("Configuración guardada");
});

document.getElementById("btnRestablecer").addEventListener("click", function () {
    volumenGeneral.value = 80;
    volumenMusica.value = 60;
    volumenEfectos.value = 80;
    sensibilidad.value = 50;

    calidad.value = "alto";
    fps.value = "60";

    pantallaCompleta.checked = false;
    mostrarFps.checked = false;

    localStorage.removeItem("simonCraftConfig");

    actualizarConfiguracion();
});

document.getElementById("btnVolver").addEventListener("click", function () {
    window.history.back();
});

function cargarConfiguracion() {
    const datos = localStorage.getItem("simonCraftConfig");

    if (datos) {
        const configuracion = JSON.parse(datos);

        volumenGeneral.value = configuracion.volumenGeneral ?? 80;
        volumenMusica.value = configuracion.volumenMusica ?? 60;
        volumenEfectos.value = configuracion.volumenEfectos ?? 80;
        sensibilidad.value = configuracion.sensibilidad ?? 50;

        calidad.value = configuracion.calidad ?? "alto";
        fps.value = configuracion.fps ?? "60";

        pantallaCompleta.checked =
            configuracion.pantallaCompleta ?? false;

        mostrarFps.checked =
            configuracion.mostrarFps ?? false;
    }

    actualizarConfiguracion();
}

cargarConfiguracion();