// Capa 0 de la búsqueda por capas: LIMPIEZA (13/11/2026). Función pura: no usa la IA, no consulta Supabase y no toca la página.
// Todavía NO está conectada a ninguna pantalla (paso 1 de BITACORA-BUSQUEDA-POR-CAPAS-1.md). Pruebas: pruebas/limpieza-busqueda.test.js
//
// limpiar(texto, opciones) devuelve:
//   original   : el texto tal cual lo escribió la persona (solo para MOSTRAR: "Busqué: Juan Pérez"; escapar antes de ponerlo en el HTML)
//   limpio     : para BUSCAR. Sin invisibles, sin espacios de sobra, sin , ( ) % _ " \ * ` < > { }, con tope de largo.
//                Se conservan guion y apóstrofe ("Ana-María", "D'Angelo") y el @usuario completo (incluido su guion bajo).
//   comparable : el limpio en minúsculas y sin tildes. Para comparar nombres.
//   paraRiesgo : el comparable sin guiones, apóstrofes ni puntos. SOLO para la lista de riesgo ("co-caina" -> "cocaina").
//   recortado  : true si se cortó por pasar el tope.       vacio: true si no quedó nada para buscar.
// No quita palabras de relleno ("quien", "personas"): son pistas para la capa de intención.
// No borra letras de otros alfabetos (chino, árabe, ruso...): solo quita símbolos concretos.
var LimpiezaBusqueda = (function () {
    'use strict';

    var MAX_LARGO = 200;       // tope sugerido por la bitácora (150 a 200)
    var MAX_ENTRADA = 2000;    // se corta antes de procesar, para que un texto enorme no trabe la página

    // Invisibles y de control: controles C0/C1, espacios de ancho cero, marcas de dirección, separadores de línea/párrafo,
    // guion blando, BOM, caracteres "etiqueta" (usados para esconder texto) y selectores de variación.
    var INVISIBLES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\uFE00-\uFE0F\u{E0000}-\u{E007F}]/gu;
    // Espacios de todo tipo (tabulador, salto de línea, espacio duro, espacios Unicode) se vuelven un espacio normal.
    var ESPACIOS = /[\t\n\r\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g;
    // Símbolos que pueden romper el filtro .or() de Supabase o servir para inyectar algo. Un @usuario se respeta entero.
    var SIMBOLOS = /(@[\p{L}\p{N}_.]+)|[,()%_"\\*`<>{}]/gu;
    var REPETIDAS = /(\p{L})\1{2,}/gu;   // 3 o más letras iguales seguidas -> 2 ("holaaaaa" -> "holaa"); los números no se tocan

    function sinTildes(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC'); }

    // Corta sin partir un carácter de dos partes (emoji, letras raras) y, si puede, en un límite de palabra.
    function cortar(s, max) {
        if (s.length <= max) return s;
        var c = s.slice(0, max);
        var ult = c.charCodeAt(c.length - 1);
        if (ult >= 0xD800 && ult <= 0xDBFF) c = c.slice(0, -1);
        var sp = c.lastIndexOf(' ');
        if (sp > max * 0.6) c = c.slice(0, sp);
        return c.replace(/\s+$/, '');
    }

    function limpiar(texto, opciones) {
        var max = (opciones && opciones.max > 0) ? Math.floor(opciones.max) : MAX_LARGO;
        var original = (typeof texto === 'string') ? texto : (typeof texto === 'number' && isFinite(texto) ? String(texto) : '');
        var t = original.length > MAX_ENTRADA ? original.slice(0, MAX_ENTRADA) : original;

        t = t.normalize('NFKC');                          // letras de ancho completo y ligaduras -> forma normal ("ｃｏｃａ" -> "coca")
        t = t.replace(ESPACIOS, ' ').replace(INVISIBLES, '');
        t = t.replace(SIMBOLOS, function (m, usuario) { return usuario ? usuario : ' '; });
        t = t.replace(REPETIDAS, '$1$1');
        t = t.replace(/\s+/g, ' ').trim();

        var limpio = cortar(t, max);
        var comparable = sinTildes(limpio.toLowerCase());
        return {
            original: original,
            limpio: limpio,
            comparable: comparable,
            paraRiesgo: comparable.replace(/[-'’‘`´.·]/g, ''),
            recortado: limpio.length < t.length || original.length > MAX_ENTRADA,
            vacio: limpio.length === 0
        };
    }

    return { limpiar: limpiar, MAX_LARGO: MAX_LARGO };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LimpiezaBusqueda;
