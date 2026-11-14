// Pruebas del reconocimiento de nombres sueltos ("Juan") en la capa de intención, la capa de datos y la puerta de las pantallas.
// node pruebas/nombres-conocidos.test.js
var fs = require('fs'), vm = require('vm'), path = require('path');
var RAIZ = path.join(__dirname, '..');
function leer(rel) { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); }
var fallos = 0, total = 0;
function es(desc, real, esperado) { total++; if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); } }

// ---------- 1) Capa de intención ----------
var I = require('../js/modules/intencion-busqueda.js');
var NOMBRES = new Set(['juan', 'perez', 'maria', 'torres', 'armas', 'rosa', 'cruz', 'carlos', 'brien', 'jose']);
var ctx = { superficie: 'principal', esNombreConocido: function (w) { return NOMBRES.has(w); } };
var dec = function (t, c) { var r = I.decidir(t, c || ctx); return [r.principal, r.ambigua, r.directa]; };
es('sin la función: "Juan" sigue ambiguo (igual que antes)', dec('Juan', { superficie: 'principal' }), ['personas', true, null]);
es('sin la función: "juan" en minúscula sigue a la IA', dec('juan', { superficie: 'principal' }), ['ia', false, null]);
es('"Juan" conocido: personas sin ambigüedad', dec('Juan'), ['personas', false, null]);
es('"juan" en minúscula conocido: personas', dec('juan'), ['personas', false, null]);
es('"JUAN" en mayúsculas: personas', dec('JUAN'), ['personas', false, null]);
es('"Juan Pérez": personas', dec('Juan Pérez'), ['personas', false, null]);
es('"juan perez" en minúscula: personas', dec('juan perez'), ['personas', false, null]);
es('"maria torres": personas', dec('maria torres'), ['personas', false, null]);
es('"Juan de la Cruz": conectores ignorados, personas', dec('Juan de la Cruz'), ['personas', false, null]);
es('"O\'Brien": con apóstrofe, personas', dec("O'Brien"), ['personas', false, null]);
es('"José" con tilde: personas', dec('José'), ['personas', false, null]);
es('palabra desconocida: a la IA', dec('xyzqw'), ['ia', false, null]);
es('"Juan xyzqw": una palabra desconocida, no se toma como nombre', dec('juan xyzqw')[1], false);
es('"hola": a la IA', dec('hola'), ['ia', false, null]);
es('"laptops": sigue siendo productos ambiguo', dec('laptops'), ['productos', true, null]);
es('"juan laptop": con producto conocido, no se toma como nombre', dec('juan laptop')[0], 'productos');
es('"juan barato": con señal de producto, productos', dec('juan barato')[0], 'productos');
es('nombre que también es producto del catálogo (rosa): no se fuerza a personas, gana el producto', dec('rosa', { superficie: 'principal', esNombreConocido: ctx.esNombreConocido, esTerminoProducto: function (w) { return w === 'rosa'; } })[0], 'productos');
es('"@jperez" sigue igual', dec('@jperez'), ['personas', false, null]);
es('"qué hora es" sigue siendo acción directa', dec('qué hora es'), [null, false, 'hora']);
es('"mi zona" sigue siendo acción directa', dec('mi zona'), [null, false, 'explorar_localidad']);
es('5 palabras conocidas: demasiadas, no se toma como nombre', dec('juan perez maria torres carlos')[0], 'ia');
es('la función lanza error: no se rompe, queda como antes', dec('Juan', { superficie: 'principal', esNombreConocido: function () { throw new Error('x'); } }), ['personas', true, null]);
es('en la pantalla de personas siempre es personas', dec('xyzqw', { superficie: 'personas' }), ['personas', false, null]);
es('"Pedro vende laptops" sigue siendo productos', dec('Pedro vende laptops')[0], 'productos');
es('razón explicativa', I.decidir('juan', ctx).razon.indexOf('nombres y apellidos') >= 0, true);

// ---------- 2) Capa de datos ----------
var D = require('../js/modules/motor-busqueda-personas-datos.js');
var YO = { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo' };
var PERFILES = [
    { id: 'u-yo', nombres: 'Yolanda', apellidos: 'Soloyo' },
    { id: 'u-1', nombres: 'Juan Carlos', apellidos: 'Pérez Muñoz-Ríos' },
    { id: 'u-2', nombres: 'María', apellidos: "O'Brien de la Cruz" },
    { id: 'u-3', nombres: null, apellidos: null },
    { id: 'u-4', nombres: 'Li', apellidos: 'Wu' },
    { id: 'u-5', nombres: 'José2', apellidos: '北京' }
];
function fakeSb(rows) { return { from: function (t) { var f = t === 'perfiles_publicos' ? rows : []; var q = { select: function () { return q; }, eq: function () { return q; }, order: function () { return q; }, limit: function () { return q; }, then: function (ok, ko) { return Promise.resolve({ data: f, error: null }).then(ok, ko); } }; return q; } }; }

(async function () {
    D.invalidarCache();
    es('antes de leer perfiles: nombresConocidos es null', D.nombresConocidos(YO), null);
    var t0 = 1000000;
    await D.buscar('Juan', { supabase: fakeSb(PERFILES), yo: YO, Motor: { buscar: function () { return { personas: [], avisos: [] }; } }, ahora: function () { return t0; } });
    var set = D.nombresConocidos(YO, { ahora: function () { return t0 + 1000; } });
    es('después de buscar: hay nombres', set instanceof Set, true);
    var arr = Array.from(set).sort();
    es('contiene nombres y apellidos, sin tildes, partes de guion y apóstrofe', ['juan', 'carlos', 'perez', 'munoz', 'rios', 'maria', 'brien', 'cruz'].every(function (w) { return set.has(w); }), true);
    es('NO contiene mis propios nombres (Yolanda, Soloyo)', [set.has('yolanda'), set.has('soloyo')], [false, false]);
    es('NO contiene palabras de menos de 3 letras ni con números/otros alfabetos', [set.has('li'), set.has('wu'), set.has('jose2'), arr.some(function (w) { return !/^[a-z]+$/.test(w); })], [false, false, false, false]);
    es('otro usuario: null', D.nombresConocidos({ id: 'u-otro' }, { ahora: function () { return t0 + 1000; } }), null);
    es('después de 10 minutos: null', D.nombresConocidos(YO, { ahora: function () { return t0 + 600001; } }), null);
    es('sin usuario: null', D.nombresConocidos({}), null);
    D.invalidarCache();
    es('invalidarCache borra también los nombres', D.nombresConocidos(YO, { ahora: function () { return t0 + 1000; } }), null);
    var ok = await D.precargar({ supabase: fakeSb(PERFILES), yo: YO, ahora: function () { return t0; } });
    es('precargar lee los perfiles y devuelve true', [ok, !!D.nombresConocidos(YO, { ahora: function () { return t0 + 1; } })], [true, true]);
    D.invalidarCache();
    var malo = { from: function () { throw new Error('caído'); } };
    es('precargar con Supabase roto no lanza error y devuelve false', await D.precargar({ supabase: malo, yo: YO }), false);
    es('precargar sin sesión devuelve false', await D.precargar({ supabase: fakeSb(PERFILES), yo: null }), false);

    // ---------- 3) Puerta de las pantallas (archivos reales) ----------
    function stub() { return new Proxy(function () {}, { get: function (t, k) { if (k === Symbol.toPrimitive) return function () { return ''; }; if (k === 'length') return 0; return stub(); }, apply: function () { return stub(); }, construct: function () { return stub(); }, set: function () { return true; } }); }
    var TABLAS = {
        perfiles_publicos: [
            { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú', nombre_usuario: 'yomismo', created_at: '2026-08-01T00:00:00Z' },
            { id: 'u-juan', nombres: 'Juan', apellidos: 'Pérez', localidad_id: 2, pais: 'Perú', nombre_usuario: 'jperez', created_at: '2026-09-10T00:00:00Z' }],
        productos: [{ id: 1, usuario_id: 'u-juan', titulo: 'Laptop Lenovo', descripcion: '', categoria: 'Tecnología', modalidad: 'venta', precio: 900, ciudad: 'Callao', pais: 'Perú', estado: 'aprobado', created_at: '2026-10-01T00:00:00Z' }],
        localidades: [{ id: 2, pais_id: 1, nombre: 'Callao', region: 'Callao' }], bloqueados: []
    };
    var sb = { console: { log: console.log, error: function () {}, warn: function () {} }, Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout, Date: Date, navigator: { language: 'es' }, localStorage: { getItem: function () { return null; }, setItem: function () {} } };
    sb.window = sb; sb.document = stub(); vm.createContext(sb);
    vm.runInContext('var PanelUsuario = {}; var usuarioActual = ' + JSON.stringify(YO) + '; var supabase = null;', sb);
    ['interprete-busqueda-personas', 'motor-busqueda-personas', 'motor-busqueda-personas-datos', 'limpieza-busqueda', 'intencion-busqueda', 'busqueda-por-capas', 'panel-usuario-3'].forEach(function (f) { vm.runInContext(leer('js/modules/' + f + '.js'), sb, { filename: f }); });
    sb.supabase = { from: function (t) { var f = TABLAS[t] || []; var q = { select: function () { return q; }, eq: function () { return q; }, order: function () { return q; }, limit: function () { return q; }, then: function (ok, ko) { return Promise.resolve({ data: f, error: null }).then(ok, ko); } }; return q; } };
    var ev = function (js) { return vm.runInContext(js, sb); };
    var puerta = function (f, c) { return ev('PanelUsuario._fraseEsDePersonasPorCapas(' + JSON.stringify(f) + ', ' + JSON.stringify(c || 'principal') + ')'); };
    var esperar = function () { return new Promise(function (r) { setTimeout(r, 30); }); };
    ev('window.BUSQUEDA_CAPAS = { principal: true, asistente: true, panel: true }; MotorBusquedaPersonasDatos.invalidarCache();');
    es('puerta: "Juan" sin perfiles leídos aún -> false (sigue a la IA como hoy)', puerta('Juan'), false);
    await esperar();
    es('puerta: la primera consulta leyó los perfiles en segundo plano', !!ev('MotorBusquedaPersonasDatos.nombresConocidos(usuarioActual)'), true);
    es('puerta: "Juan" ya conocido -> true', puerta('Juan'), true);
    es('puerta: "juan perez" en minúscula -> true', puerta('juan perez', 'asistente'), true);
    es('puerta: nombre desconocido -> false', puerta('Fernando'), false);
    es('puerta: "laptops" sigue siendo false', puerta('laptops'), false);
    es('puerta: "videos de gatos" sigue siendo false', puerta('videos de gatos'), false);
    es('puerta: "hola" sigue siendo false', puerta('hola'), false);
    ev('window.BUSQUEDA_CAPAS.principal = false;');
    es('puerta con el interruptor apagado: false aunque sea un nombre', puerta('Juan'), false);
    ev('window.BUSQUEDA_CAPAS.principal = true; usuarioActual = null;');
    es('puerta sin sesión: false', puerta('Juan'), false);
    ev('usuarioActual = ' + JSON.stringify(YO) + '; BusquedaPorCapas.interruptores.intencion = false;');
    es('puerta con la intención apagada: false', puerta('Juan'), false);
    ev('BusquedaPorCapas.interruptores.intencion = true; MotorBusquedaPersonasDatos.nombresConocidos = undefined;');
    es('puerta si faltara nombresConocidos: no se rompe y sigue como antes', puerta('Juan'), false);

    console.log(fallos ? ('HAY ' + fallos + ' FALLOS de ' + total + ' pruebas') : ('TODO BIEN: ' + total + ' de ' + total + ' pruebas'));
    process.exit(fallos ? 1 : 0);
})().catch(function (e) { console.log('ERROR EN LA PRUEBA:', e && e.stack || e); process.exit(1); });
