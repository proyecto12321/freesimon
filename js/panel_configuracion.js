// =================================
// VERIFICAR ACCESO DOCENTE
// =================================

const accesoDocente =
    sessionStorage.getItem("accesoDocente");

if (accesoDocente !== "true") {

    window.location.href = "panel_docente.html";

}


// =================================
// ELEMENTOS
// =================================

const btnPreguntas =
    document.getElementById("btnPreguntas");

const btnAgregarPreguntas =
    document.getElementById("btnAgregarPreguntas");

const btnCrearGrupos =
    document.getElementById("btnCrearGrupos");

const btnCargarJuego =
    document.getElementById("btnCargarJuego");

const btnVolver =
    document.getElementById("btnVolver");

const cantidadSeleccionada =
    document.getElementById("cantidadSeleccionada");

const preguntasRegistradas =
    document.getElementById("preguntasRegistradas");

const mensajeCargarJuego =
    document.getElementById("mensajeCargarJuego");

const listaEscenarios =
    document.getElementById("listaEscenarios");

const estadoEscenario =
    document.getElementById("estadoEscenario");

const tiempoEvaluacion =
    document.getElementById("tiempoEvaluacion");

const DURACIONES_EVALUACION = new Set(["30", "45", "60"]);

const tiempoEvaluacionGuardado =
    sessionStorage.getItem("tiempoEvaluacionMinutos");

tiempoEvaluacion.value = DURACIONES_EVALUACION.has(tiempoEvaluacionGuardado)
    ? tiempoEvaluacionGuardado
    : "30";
sessionStorage.setItem("tiempoEvaluacionMinutos", tiempoEvaluacion.value);

tiempoEvaluacion.addEventListener("change", () => {
    if (!DURACIONES_EVALUACION.has(tiempoEvaluacion.value)) {
        tiempoEvaluacion.value = "30";
    }

    sessionStorage.setItem("tiempoEvaluacionMinutos", tiempoEvaluacion.value);
});

const escenarios = [
    { id: "bosque", nombre: "Bosque Encantado", imagen: "../img/bosque.png" },
    { id: "desierto", nombre: "Desierto tormentoso", imagen: "../img/desierto.png" },
    { id: "cielo", nombre: "Paraíso Celestial", imagen: "../img/cielo.png" },
    { id: "ciudad", nombre: "Metropolitano", imagen: "../img/ciudad.png" },
    { id: "inframundo", nombre: "Infierno de Dante", imagen: "../img/inframundo.png" },
    { id: "mar", nombre: "Mar de Globos", imagen: "../img/mar.png" },
    { id: "hielo", nombre: "Mundo Gélido", imagen: "../img/hielo.png" },
    { id: "castillo", nombre: "Castillo Embrujado", imagen: "../img/castillo.png" }
];

function seleccionarEscenario(escenario, tarjeta) {
    listaEscenarios.querySelectorAll(".tarjeta-escenario").forEach((elemento) => {
        const seleccionado = elemento === tarjeta;
        elemento.classList.toggle("seleccionado", seleccionado);
        elemento.setAttribute("aria-pressed", String(seleccionado));
    });

    sessionStorage.setItem("escenarioSeleccionado", escenario.id);
    sessionStorage.setItem("nombreEscenarioSeleccionado", escenario.nombre);
    estadoEscenario.textContent = `Escenario seleccionado: ${escenario.nombre}`;
}

function mostrarEscenarios() {
    const escenarioGuardado = sessionStorage.getItem("escenarioSeleccionado");

    escenarios.forEach((escenario) => {
        const tarjeta = document.createElement("button");
        tarjeta.type = "button";
        tarjeta.className = "tarjeta-escenario";
        tarjeta.setAttribute("aria-label", `Seleccionar ${escenario.nombre}`);
        tarjeta.setAttribute("aria-pressed", String(escenario.id === escenarioGuardado));
        tarjeta.classList.toggle("seleccionado", escenario.id === escenarioGuardado);

        const imagen = document.createElement("img");
        imagen.className = "imagen-escenario";
        imagen.src = escenario.imagen;
        imagen.alt = `Escenario ${escenario.nombre}`;
        imagen.loading = "lazy";

        const nombre = document.createElement("span");
        nombre.className = "nombre-escenario";
        nombre.textContent = escenario.nombre;

        tarjeta.append(imagen, nombre);
        tarjeta.addEventListener("click", () => seleccionarEscenario(escenario, tarjeta));
        listaEscenarios.appendChild(tarjeta);
    });

    const escenarioElegido = escenarios.find(({ id }) => id === escenarioGuardado);
    if (escenarioElegido) {
        estadoEscenario.textContent =
            `Escenario seleccionado: ${escenarioElegido.nombre}`;
    }
}

mostrarEscenarios();


// =================================
// ELEMENTOS DEL MODAL
// =================================

const modalPreguntas =
    document.getElementById("modalPreguntas");

const cantidadPreguntas =
    document.getElementById("cantidadPreguntas");

const mensajePreguntas =
    document.getElementById("mensajePreguntas");

const btnGuardarPreguntas =
    document.getElementById("btnGuardarPreguntas");

const btnCancelarPreguntas =
    document.getElementById("btnCancelarPreguntas");


// =================================
// CARGAR CANTIDAD GUARDADA
// =================================

const cantidadGuardada =
    sessionStorage.getItem("cantidadPreguntas");

if (cantidadGuardada) {

    cantidadSeleccionada.textContent =
        `${cantidadGuardada} preguntas`;

}

const preguntasGuardadas = leerPreguntasRegistradas();

if (preguntasGuardadas.length > 0) {

    preguntasRegistradas.textContent =
        preguntasGuardadas.length === 1
            ? "1 pregunta agregada"
            : `${preguntasGuardadas.length} preguntas agregadas`;

}


// =================================
// ABRIR EDITOR DE PREGUNTAS
// =================================

btnAgregarPreguntas.addEventListener("click", () => {

    window.location.href = "panel_pregunta.html";

});


// =================================
// ABRIR VENTANA DE PREGUNTAS
// =================================

btnPreguntas.addEventListener("click", () => {

    mensajePreguntas.textContent = "";

    cantidadPreguntas.value =
        sessionStorage.getItem("cantidadPreguntas") || "";

    modalPreguntas.classList.remove("oculto");

    cantidadPreguntas.focus();

});


// =================================
// GUARDAR CANTIDAD
// =================================

btnGuardarPreguntas.addEventListener("click", () => {

    const cantidad =
        Number(cantidadPreguntas.value);


    // ===============================
    // VALIDAR
    // ===============================

    if (
        cantidad < 1 ||
        cantidad > 40 ||
        !Number.isInteger(cantidad)
    ) {

        mensajePreguntas.textContent =
            "La cantidad debe estar entre 1 y 40.";

        cantidadPreguntas.focus();

        return;
    }


    // ===============================
    // GUARDAR
    // ===============================

    sessionStorage.setItem(
        "cantidadPreguntas",
        cantidad
    );


    cantidadSeleccionada.textContent =
        `${cantidad} preguntas`;


    // ===============================
    // CERRAR
    // ===============================

    modalPreguntas.classList.add("oculto");
    actualizarResumenPreguntas();

});


// =================================
// CANCELAR
// =================================

btnCancelarPreguntas.addEventListener("click", () => {

    modalPreguntas.classList.add("oculto");

});


// =================================
// CREAR GRUPOS
// =================================

btnCrearGrupos.addEventListener("click", () => {

    window.location.href = "panel_grupo.html";

});


// =================================
// CARGAR JUEGO
// =================================

btnCargarJuego.addEventListener("click", () => {
    const escenarioId = sessionStorage.getItem("escenarioSeleccionado");
    const escenario = escenarios.find(({ id }) => id === escenarioId);

    if (!escenario) {
        mensajeCargarJuego.textContent =
            "Selecciona un escenario antes de cargar el juego.";
        return;
    }

    // Cargar exactamente la cantidad elegida, incluso tras editar manualmente.
    const cantidad = obtenerCantidadConfigurada();
    if (!cantidad) {
        mensajeCargarJuego.textContent = "Configura primero la cantidad de preguntas (1 a 40).";
        return;
    }
    const disponibles = leerPreguntasRegistradas();
    if (disponibles.length < cantidad) {
        mensajeCargarJuego.textContent = `Faltan ${cantidad - disponibles.length} preguntas para completar las ${cantidad} configuradas.`;
        return;
    }
    const preguntas = disponibles.slice(0, cantidad);
    if (preguntas.some(p => !preguntaCompatible(p))) {
        mensajeCargarJuego.textContent = "Revisa las preguntas: cada una necesita un enunciado, cuatro alternativas y una respuesta correcta.";
        return;
    }
    const grupos = JSON.parse(
        sessionStorage.getItem("gruposFreeSIMON") || "[]"
    );

    const configuracionJuego = {
        escenario: {
            id: escenario.id,
            nombre: escenario.nombre,
            imagen: escenario.imagen.replace("../", "")
        },
        tiempoEvaluacionMinutos: Number(tiempoEvaluacion.value),
        cantidadPreguntas: cantidad,
        preguntas,
        grupos
    };

    sessionStorage.setItem(
        "configuracionJuego",
        JSON.stringify(configuracionJuego)
    );
    sessionStorage.setItem("juegoEscenario", escenario.id);
    sessionStorage.setItem("juegoPreguntas", JSON.stringify(preguntas));
    sessionStorage.setItem("juegoGrupos", JSON.stringify(grupos));
    sessionStorage.setItem("tiempoEvaluacionMinutos", tiempoEvaluacion.value);
    sessionStorage.removeItem("juegoTiempoFin");

    window.location.href = "../index.html";
});


// =================================
// VOLVER
// =================================

btnVolver.addEventListener("click", () => {

    window.location.href = "../index.html";

});

// ================================================
// BANCO DE PREGUNTAS Y RESUMEN DE CANTIDAD
// Mismo formato que usa el editor y el juego:
// { texto, alternativas: [A,B,C,D], correcta: 0..3 }
// ================================================
function leerPreguntasRegistradas() {
    try {
        const valor = JSON.parse(sessionStorage.getItem("preguntasFreeSIMON") || "[]");
        return Array.isArray(valor) ? valor : [];
    } catch { return []; }
}
function obtenerCantidadConfigurada() {
    const n = Number(sessionStorage.getItem("cantidadPreguntas"));
    return Number.isInteger(n) && n >= 1 && n <= 40 ? n : 0;
}
function preguntaCompatible(p) {
    return p && typeof p.texto === "string" && p.texto.trim() &&
        Array.isArray(p.alternativas) && p.alternativas.length === 4 &&
        p.alternativas.every(a => typeof a === "string" && a.trim()) &&
        Number.isInteger(p.correcta) && p.correcta >= 0 && p.correcta < 4;
}
function actualizarResumenPreguntas() {
    const total = leerPreguntasRegistradas().length;
    const n = obtenerCantidadConfigurada();
    preguntasRegistradas.textContent = n
        ? total < n ? `${total} de ${n} preguntas · Faltan ${n - total}`
            : total > n ? `${total} registradas · Se usarán las primeras ${n}`
                : `${total} de ${n} preguntas · Completo`
        : total ? `${total} preguntas registradas` : "No hay preguntas agregadas";
    mensajeCargarJuego.textContent = "";
}

// ================================================
// BOTONES EXCEL: IMPORTACIÓN TRANSACCIONAL
// Solo reemplazar el banco cuando todas las filas
// que se van a usar hayan superado la validación.
// ================================================
const btnExportarExcel = document.getElementById("btnExportarExcel");
const btnImportarExcel = document.getElementById("btnImportarExcel");
const archivoPreguntasExcel = document.getElementById("archivoPreguntasExcel");
const mensajeExcel = document.getElementById("mensajeExcel");
function informarExcel(texto, tipo = "exito") {
    mensajeExcel.textContent = texto;
    mensajeExcel.dataset.tipo = tipo;
}
function exigirCantidadExcel() {
    const n = obtenerCantidadConfigurada();
    if (!n) {
        informarExcel("Primero registra la cantidad de preguntas (de 1 a 40).", "aviso");
        btnPreguntas.click();
    }
    return n;
}
btnExportarExcel.addEventListener("click", () => {
    const n = exigirCantidadExcel(); if (!n) return;
    try {
        const guardadas = leerPreguntasRegistradas().slice(0, n);
        if (guardadas.some(p => !preguntaCompatible(p))) throw new Error("Revisa las preguntas en el editor antes de exportarlas: hay datos incompletos.");
        const blob = ExcelPreguntas.exportar(guardadas, n);
        const url = URL.createObjectURL(blob), enlace = document.createElement("a");
        enlace.href = url; enlace.download = "FreeSIMON_preguntas.xlsx";
        document.body.appendChild(enlace); enlace.click(); enlace.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        informarExcel(`Excel exportado con espacio para ${n} preguntas. Incluye ${guardadas.length} registradas; completa las filas vacías y marca Correcta con A, B, C o D.`);
    } catch (error) { informarExcel(error.message, "error"); }
});
btnImportarExcel.addEventListener("click", () => {
    if (!exigirCantidadExcel()) return;
    archivoPreguntasExcel.value = "";
    archivoPreguntasExcel.click();
});
archivoPreguntasExcel.addEventListener("change", async () => {
    const archivo = archivoPreguntasExcel.files[0]; if (!archivo) return;
    const n = exigirCantidadExcel(); if (!n) return;
    const controles = [btnExportarExcel, btnImportarExcel, btnCargarJuego, btnGuardarPreguntas, btnAgregarPreguntas];
    controles.forEach(b => b.disabled = true);
    informarExcel("Leyendo y comprobando el archivo Excel…", "aviso");
    try {
        const { preguntas, sobrantes } = await ExcelPreguntas.importar(archivo, n);
        sessionStorage.setItem("preguntasFreeSIMON", JSON.stringify(preguntas));
        actualizarResumenPreguntas();
        const faltan = n - preguntas.length;
        informarExcel(faltan
            ? `Se cargaron ${preguntas.length} de ${n} preguntas. Faltan ${faltan}; complétalas en Agregar preguntas o importa un Excel completo.`
            : `Se cargaron las ${n} preguntas.${sobrantes ? ` Se omitieron ${sobrantes} preguntas adicionales.` : ""}`,
            faltan ? "aviso" : "exito");
    } catch (error) {
        informarExcel(`${error.message || "No se pudo leer el Excel."} No se modificaron las preguntas registradas.`, "error");
    } finally {
        controles.forEach(b => b.disabled = false);
        archivoPreguntasExcel.value = "";
    }
});
actualizarResumenPreguntas();
window.addEventListener("pageshow", actualizarResumenPreguntas);

// ================================================
// EXCEL XLSX LOCAL — sin CDN ni conexión a internet.
// Exporta texto, formato y lista A–D. Lee hojas XLSX
// con cadenas compartidas o texto en línea de Excel.
// ================================================
const ExcelPreguntas = (() => {
    const enc = new TextEncoder(), dec = new TextDecoder();
    const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const cabeceras = ['Pregunta', 'Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D', 'Correcta'];
    const xml = s => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const normal = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
    const nodos = (n, tag) => [...n.getElementsByTagNameNS('*', tag)];
    function documento(texto) {
        if (/<!DOCTYPE|<!ENTITY/i.test(texto)) throw new Error('El Excel contiene una estructura XML no admitida.');
        const d = new DOMParser().parseFromString(texto, 'application/xml');
        if (nodos(d, 'parsererror').length) throw new Error('El archivo Excel contiene XML dañado.');
        return d;
    }
    const tablaCRC = Array.from({ length: 256 }, (_, i) => {
        let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
    });
    function crc32(datos) {
        let c = 0xffffffff; for (const b of datos) c = tablaCRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0;
    }
    // ZIP sin compresión al exportar: un XLSX real, no un CSV renombrado.
    function zip(archivos) {
        const partes = [], directorio = []; let posicion = 0, longitud = 0;
        for (const [nombre, texto] of Object.entries(archivos)) {
            const n = enc.encode(nombre), b = enc.encode(texto), crc = crc32(b);
            const local = new Uint8Array(30 + n.length), l = new DataView(local.buffer);
            l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true);
            l.setUint32(14, crc, true); l.setUint32(18, b.length, true); l.setUint32(22, b.length, true);
            l.setUint16(26, n.length, true); local.set(n, 30);
            const central = new Uint8Array(46 + n.length), c = new DataView(central.buffer);
            c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
            c.setUint16(8, 0x800, true); c.setUint32(16, crc, true); c.setUint32(20, b.length, true); c.setUint32(24, b.length, true);
            c.setUint16(28, n.length, true); c.setUint32(42, posicion, true); central.set(n, 46);
            partes.push(local, b); directorio.push(central); posicion += local.length + b.length; longitud += central.length;
        }
        const fin = new Uint8Array(22), f = new DataView(fin.buffer);
        f.setUint32(0, 0x06054b50, true); f.setUint16(8, directorio.length, true); f.setUint16(10, directorio.length, true);
        f.setUint32(12, longitud, true); f.setUint32(16, posicion, true);
        return new Blob([...partes, ...directorio, fin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    function celda(valor, ref, estilo) {
        return `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${xml(valor)}</t></is></c>`;
    }
    function exportar(preguntas, cantidad) {
        let filas = `<row r="1" ht="28" customHeight="1">${cabeceras.map((v, i) => celda(v, `${'ABCDEF'[i]}1`, 1)).join('')}</row>`;
        for (let i = 0; i < cantidad; i++) {
            const p = preguntas[i], r = i + 2;
            const datos = p ? [p.texto, ...p.alternativas, 'ABCD'[p.correcta] ?? ''] : ['', '', '', '', '', ''];
            filas += `<row r="${r}" ht="70" customHeight="1">${datos.map((v, j) => celda(v, `${'ABCDEF'[j]}${r}`, j === 5 ? 3 : 2)).join('')}</row>`;
        }
        const hoja = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="55" customWidth="1"/><col min="2" max="5" width="28" customWidth="1"/><col min="6" max="6" width="14" customWidth="1"/></cols><sheetData>${filas}</sheetData><autoFilter ref="A1:F${cantidad + 1}"/><dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Respuesta correcta" error="Elige A, B, C o D." sqref="F2:F${cantidad + 1}"><formula1>"A,B,C,D"</formula1></dataValidation></dataValidations></worksheet>`;
        const instrucciones = [
            'FreeSIMON — Cómo completar la plantilla',
            `Cantidad configurada: ${cantidad} preguntas.`,
            'En la hoja Preguntas, escribe una pregunta por fila y sus cuatro alternativas.',
            'En Correcta selecciona A, B, C o D (al importar también se admite 1, 2, 3 o 4).',
            'Las cuatro alternativas son obligatorias para ser compatibles con el juego actual.',
            'No cambies las cabeceras. Escribe valores, no fórmulas. Guarda como .xlsx.',
            'Las filas totalmente vacías se ignoran. Si sobran preguntas se toman las primeras.',
            'Si faltan preguntas se carga el contenido disponible y se indica cuántas faltan.',
            'La importación reemplaza las preguntas registradas. Puedes completarlas desde Agregar preguntas.'
        ];
        const guia = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${NS}"><cols><col min="1" max="1" width="115" customWidth="1"/></cols><sheetData>${instrucciones.map((v, i) => `<row r="${i + 1}" ht="35" customHeight="1">${celda(v, `A${i + 1}`, i ? 2 : 1)}</row>`).join('')}</sheetData></worksheet>`;
        const tipos = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
        const estilos = `<?xml version="1.0"?><styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF39765C"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF0C2"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="0" fillId="3" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
        return zip({
            '[Content_Types].xml': tipos,
            '_rels/.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
            'xl/workbook.xml': `<?xml version="1.0"?><workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Preguntas" sheetId="1" r:id="rId1"/><sheet name="Instrucciones" sheetId="2" r:id="rId2"/></sheets></workbook>`,
            'xl/_rels/workbook.xml.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
            'xl/styles.xml': estilos, 'xl/worksheets/sheet1.xml': hoja, 'xl/worksheets/sheet2.xml': guia
        });
    }
    // Leer el directorio ZIP y descomprimir solo los XML necesarios.
    async function abrirZip(buffer) {
        const bytes = new Uint8Array(buffer), v = new DataView(buffer); let fin = -1;
        for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
            if (v.getUint32(i, true) === 0x06054b50) { fin = i; break; }
        }
        if (fin < 0) throw new Error('No es un archivo .xlsx válido. Guarda el documento desde Excel como Libro de Excel (.xlsx).');
        const cuantos = v.getUint16(fin + 10, true); let pos = v.getUint32(fin + 16, true), total = 0;
        if (cuantos > 1000) throw new Error('El libro es demasiado complejo. Usa la plantilla exportada.');
        const entradas = new Map();
        for (let i = 0; i < cuantos; i++) {
            if (pos + 46 > bytes.length || v.getUint32(pos, true) !== 0x02014b50) throw new Error('El archivo Excel está incompleto.');
            const flags = v.getUint16(pos + 8, true), metodo = v.getUint16(pos + 10, true), crc = v.getUint32(pos + 16, true);
            const comprimido = v.getUint32(pos + 20, true), tamano = v.getUint32(pos + 24, true);
            const largo = v.getUint16(pos + 28, true), extra = v.getUint16(pos + 30, true), comentario = v.getUint16(pos + 32, true), offset = v.getUint32(pos + 42, true);
            total += tamano;
            if (flags & 1) throw new Error('El Excel está protegido con contraseña. Guarda una copia sin contraseña.');
            if (total > 24 * 1024 * 1024 || tamano > 12 * 1024 * 1024) throw new Error('El contenido del libro es demasiado grande. Usa una hoja sencilla de preguntas.');
            const nombre = dec.decode(bytes.subarray(pos + 46, pos + 46 + largo));
            entradas.set(nombre, { metodo, comprimido, tamano, offset, crc }); pos += 46 + largo + extra + comentario;
        }
        return async nombre => {
            const e = entradas.get(nombre); if (!e) return null;
            if (e.offset + 30 > bytes.length || v.getUint32(e.offset, true) !== 0x04034b50) throw new Error('El archivo Excel está dañado.');
            const inicio = e.offset + 30 + v.getUint16(e.offset + 26, true) + v.getUint16(e.offset + 28, true);
            if (inicio + e.comprimido > bytes.length) throw new Error('El archivo Excel está incompleto.');
            let datos = bytes.subarray(inicio, inicio + e.comprimido);
            if (e.metodo === 8) {
                let flujo;
                try { flujo = new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw')); }
                catch { throw new Error('Este navegador no puede abrir Excel comprimido. Usa una versión actual de Chrome o Edge.'); }
                const lector = flujo.getReader(), partes = []; let size = 0;
                while (true) {
                    const { done, value } = await lector.read(); if (done) break; size += value.length;
                    if (size > e.tamano || size > 12 * 1024 * 1024) { await lector.cancel(); throw new Error('El Excel excede el tamaño permitido.'); } partes.push(value);
                }
                datos = new Uint8Array(size); let n = 0; for (const p of partes) { datos.set(p, n); n += p.length; }
            } else if (e.metodo !== 0) throw new Error('Compresión Excel no admitida. Guarda una copia .xlsx normal.');
            if (datos.length !== e.tamano || crc32(datos) !== e.crc) throw new Error('El archivo Excel está dañado o incompleto.');
            return dec.decode(datos);
        };
    }
    function ruta(target) {
        if (!target || /^[a-z]+:/i.test(target)) throw new Error('La hoja de preguntas no está dentro del libro.');
        const partes = (target.startsWith('/') ? target.slice(1) : 'xl/' + target).split('/'), salida = [];
        for (const p of partes) { if (p === '..') salida.pop(); else if (p && p !== '.') salida.push(p); } return salida.join('/');
    }
    async function importar(archivo, cantidad) {
        if (!/\.xlsx$/i.test(archivo.name)) throw new Error('Selecciona un archivo .xlsx. Los formatos .xls, .csv y .xlsm no se importan.');
        if (archivo.size > 5 * 1024 * 1024) throw new Error('El Excel no debe superar 5 MB.');
        const leer = await abrirZip(await archivo.arrayBuffer());
        const wb = await leer('xl/workbook.xml'), rel = await leer('xl/_rels/workbook.xml.rels');
        if (!wb || !rel) throw new Error('No se encontró un libro Excel válido.');
        const hojas = nodos(documento(wb), 'sheet');
        const hoja = hojas.find(h => normal(h.getAttribute('name')) === 'preguntas') || hojas[0];
        if (!hoja) throw new Error('El libro no tiene hojas.');
        const id = hoja.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || hoja.getAttribute('r:id');
        const relacion = nodos(documento(rel), 'Relationship').find(r => r.getAttribute('Id') === id);
        if (!relacion || relacion.getAttribute('TargetMode') === 'External') throw new Error('La hoja seleccionada no es válida.');
        const hojaXML = await leer(ruta(relacion.getAttribute('Target')));
        if (!hojaXML) throw new Error('No se encontró el contenido de la hoja.');
        const ssrel = nodos(documento(rel), 'Relationship').find(r => /\/sharedStrings$/.test(r.getAttribute('Type') || ''));
        const ss = await leer(ssrel ? ruta(ssrel.getAttribute('Target')) : 'xl/sharedStrings.xml');
        const cadenas = ss ? nodos(documento(ss), 'si').map(si => nodos(si, 't').map(t => t.textContent).join('')) : [];
        const filas = nodos(documento(hojaXML), 'row');
        if (filas.length > 10000) throw new Error('La hoja tiene demasiadas filas. Usa la plantilla del panel.');
        const registros = [];
        for (const fila of filas) {
            const valores = [], formulas = new Set(); let siguiente = 0;
            for (const cel of nodos(fila, 'c')) {
                const ref = cel.getAttribute('r') || '', letras = ref.match(/^[A-Z]+/i)?.[0];
                let col = siguiente;
                if (letras) { col = 0; for (const l of letras.toUpperCase()) col = col * 26 + l.charCodeAt(0) - 64; col--; }
                siguiente = col + 1;
                if (col > 50) continue;
                const tipo = cel.getAttribute('t'), valor = nodos(cel, 'v')[0]?.textContent ?? '';
                const texto = tipo === 's' ? (cadenas[Number(valor)] ?? '') : tipo === 'inlineStr' ? nodos(cel, 't').map(t => t.textContent).join('') : valor;
                valores[col] = String(texto).trim();
                if (nodos(cel, 'f').length) formulas.add(col);
            }
            if (valores.some(v => v !== '' && v !== undefined) || formulas.size) registros.push({ valores, formulas, fila: fila.getAttribute('r') || '?' });
        }
        if (!registros.length) throw new Error('La hoja está vacía.');
        const encabezado = registros.shift().valores.map(normal);
        const columnas = cabeceras.map(c => encabezado.indexOf(normal(c)));
        if (columnas.some(c => c < 0) || cabeceras.some(c => encabezado.filter(h => h === normal(c)).length !== 1))
            throw new Error('Faltan cabeceras o están repetidas. Usa: Pregunta, Alternativa A, Alternativa B, Alternativa C, Alternativa D y Correcta.');
        const extras = encabezado.map((h, i) => /^alternativa\b/.test(h) && !columnas.includes(i) ? i : -1).filter(i => i >= 0);
        const preguntas = [];
        for (const r of registros.slice(0, cantidad)) {
            if (columnas.some(i => r.formulas.has(i))) throw new Error(`Fila ${r.fila}: usa texto o valores, no fórmulas.`);
            const datos = columnas.map(i => r.valores[i] || '');
            if (!datos[0]) throw new Error(`Fila ${r.fila}: falta la pregunta.`);
            if (datos.slice(1, 5).some(v => !v)) throw new Error(`Fila ${r.fila}: completa las cuatro alternativas para que el juego pueda cargarlas.`);
            if (extras.some(i => r.valores[i])) throw new Error(`Fila ${r.fila}: se permiten como máximo cuatro alternativas.`);
            const clave = datos[5].toUpperCase();
            const correcta = /^[ABCD]$/.test(clave) ? 'ABCD'.indexOf(clave) : /^[1-4]$/.test(clave) ? Number(clave) - 1 : -1;
            if (correcta < 0) throw new Error(`Fila ${r.fila}: indica la correcta con A, B, C o D (también 1–4).`);
            if (datos.some(t => t.length > 4000)) throw new Error(`Fila ${r.fila}: cada campo admite hasta 4000 caracteres.`);
            preguntas.push({ texto: datos[0], alternativas: datos.slice(1, 5), correcta });
        }
        if (!preguntas.length) throw new Error('No hay preguntas completadas. Rellena la hoja Preguntas antes de importarla.');
        return { preguntas, sobrantes: Math.max(0, registros.length - cantidad) };
    }
    return { exportar, importar };
})();
