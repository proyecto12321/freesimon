// ===============================
// ELEMENTOS
// ===============================

const numeroGrupo = document.getElementById("numeroGrupo");
const nombreGrupo = document.getElementById("nombreGrupo");
const cantidadEstudiantes = document.getElementById("cantidadEstudiantes");

const btnAgregarGrupo = document.getElementById("btnAgregarGrupo");
const btnVolver = document.getElementById("btnVolver");

const listaGrupos = document.getElementById("listaGrupos");
const mensaje = document.getElementById("mensaje");


// ===============================
// CARGAR GRUPOS GUARDADOS
// ===============================

let grupos = JSON.parse(
    sessionStorage.getItem("gruposFreeSIMON")
) || [];


// ===============================
// MOSTRAR GRUPOS EXISTENTES
// ===============================

grupos.forEach(grupo => {

    mostrarGrupo(grupo);

});


// ===============================
// AGREGAR GRUPO
// ===============================

btnAgregarGrupo.addEventListener("click", () => {

    const numero = numeroGrupo.value;
    const nombre = nombreGrupo.value.trim();
    const cantidad = cantidadEstudiantes.value;


    // ===============================
    // VALIDAR NÚMERO
    // ===============================

    if (numero === "") {

        mensaje.textContent =
            "Selecciona un número de grupo.";

        return;
    }


    // ===============================
    // VALIDAR NOMBRE
    // ===============================

    if (nombre === "") {

        mensaje.textContent =
            "Ingresa el nombre del grupo.";

        nombreGrupo.focus();

        return;
    }


    // ===============================
    // VALIDAR CANTIDAD
    // ===============================

    if (cantidad === "" || Number(cantidad) < 1) {

        mensaje.textContent =
            "Ingresa una cantidad válida de estudiantes.";

        cantidadEstudiantes.focus();

        return;
    }


    // ===============================
    // VERIFICAR MÁXIMO
    // ===============================

    if (grupos.length >= 6) {

        mensaje.textContent =
            "Solo se pueden crear 6 grupos.";

        return;
    }


    // ===============================
    // VERIFICAR DUPLICADO
    // ===============================

    const grupoExiste = grupos.some(
        grupo => grupo.numero === numero
    );

    if (grupoExiste) {

        mensaje.textContent =
            "Ese grupo ya fue creado.";

        return;
    }


    // ===============================
    // CREAR GRUPO
    // ===============================

    const nuevoGrupo = {

        numero: numero,

        nombre: nombre,

        cantidad: Number(cantidad)

    };


    grupos.push(nuevoGrupo);


    // ===============================
    // GUARDAR EN SESSION STORAGE
    // ===============================

    sessionStorage.setItem(
        "gruposFreeSIMON",
        JSON.stringify(grupos)
    );


    // ===============================
    // MOSTRAR
    // ===============================

    mostrarGrupo(nuevoGrupo);


    // ===============================
    // LIMPIAR
    // ===============================

    numeroGrupo.value = "";

    nombreGrupo.value = "";

    cantidadEstudiantes.value = "";

    mensaje.textContent = "";

});


// ===============================
// MOSTRAR GRUPO
// ===============================

function mostrarGrupo(grupo) {

    const tarjetaGrupo = document.createElement("div");

    tarjetaGrupo.classList.add("grupo");


    tarjetaGrupo.innerHTML = `

        <div class="grupo-titulo">
            Grupo ${grupo.numero}: ${grupo.nombre}
        </div>

        <div class="grupo-dato">
            Número de grupo: ${grupo.numero}
        </div>

        <div class="grupo-dato">
            Nombre: ${grupo.nombre}
        </div>

        <div class="grupo-dato">
            Cantidad de estudiantes permitidos:
            ${grupo.cantidad}
        </div>

    `;


    listaGrupos.appendChild(tarjetaGrupo);

}


// ===============================
// BOTÓN VOLVER
// ===============================

btnVolver.addEventListener("click", () => {
    window.location.href = "panel_configuracion.html";
});