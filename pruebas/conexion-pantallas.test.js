// Pruebas de la conexión de las pantallas a la búsqueda por capas (paso 5). Carga los archivos REALES de la página en un entorno
// simulado (sin navegador ni Supabase real) y comprueba los interruptores de window.BUSQUEDA_CAPAS.  node pruebas/conexion-pantallas.test.js
var fs = require('fs'), vm = require('vm'), path = require('path');
var RAIZ = path.join(__dirname, '..');
function leer(rel) { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); }
var fallos = 0, total = 0;
function es(desc, real, esperado) { total++; if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); } }

// --- index.html: orden de los scripts y interruptores apagados por defecto ---
var html = leer('index.html');
var pos = function (n) { return html.indexOf('js/modules/' + n + '.js'); };
es('index.html carga limpieza, intención y entrada única, en ese orden', pos('limpieza-busqueda') > 0 && pos('limpieza-busqueda') < pos('intencion-busqueda') && pos('intencion-busqueda') < pos('busqueda-por-capas'), true);
es('las capas se cargan después del motor de personas y antes del panel', pos('motor-busqueda-personas-datos') < pos('limpieza-busqueda') && pos('busqueda-por-capas') < pos('panel-usuario-1'), true);
var bloque = (html.match(/window\.BUSQUEDA_CAPAS = (\{[^}]*\});/) || [])[1];
var porDefecto = bloque ? vm.runInNewContext('(' + bloque + ')') : null;
es('todos los interruptores existen y vienen apagados', porDefecto && Object.keys(porDefecto).sort().join() + '|' + Object.keys(porDefecto).every(function (k) { return porDefecto[k] === false; }),
    'asistente,paginaChat,paginaZona,panel,panelChat,panelPersonas,picker,principal|true');

// --- Entorno simulado con los archivos reales ---
function stub() { return new Proxy(function () {}, { get: function (t, k) { if (k === Symbol.toPrimitive) return function () { return ''; }; if (k === 'length') return 0; return stub(); }, apply: function () { return stub(); }, construct: function () { return stub(); }, set: function () { return true; } }); }
var YO = { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú' };
var TABLAS = {
    perfiles_publicos: [
        { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú', nombre_usuario: 'yomismo', created_at: '2026-08-01T00:00:00Z' },
        { id: 'u-juan', nombres: 'Juan', apellidos: 'Pérez', localidad_id: 2, pais: 'Perú', nombre_usuario: 'jperez', created_at: '2026-09-10T00:00:00Z' },
        { id: 'u-carlos', nombres: 'Carlos', apellidos: 'Armas', localidad_id: 2, pais: 'Perú', nombre_usuario: 'carlosa', created_at: '2026-09-13T00:00:00Z' }
    ],
    productos: [{ id: 1, usuario_id: 'u-juan', titulo: 'Laptop Lenovo', descripcion: '', categoria: 'Tecnología', modalidad: 'venta', precio: 900, ciudad: 'Callao', pais: 'Perú', estado: 'aprobado', created_at: '2026-10-01T00:00:00Z' }],
    localidades: [{ id: 2, pais_id: 1, nombre: 'Callao', region: 'Callao' }], bloqueados: []
};
function fakeSupabase() {
    return { from: function (t) { var f = TABLAS[t] || []; var q = { select: function () { return q; }, eq: function (c, v) { f = f.filter(function (x) { return x[c] === v; }); return q; }, order: function () { return q; }, limit: function () { return q; },
        then: function (ok, ko) { return Promise.resolve({ data: f, error: null }).then(ok, ko); } }; return q; } };
}
function entorno() {
    var sb = { console: { log: console.log, error: function () {}, warn: function () {} }, Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout, Date: Date, navigator: { language: 'es' }, localStorage: { getItem: function () { return null; }, setItem: function () {} } };
    sb.window = sb;
    sb.__elementos = { dynamicSearch: { value: '' }, assistantInput: { value: '' }, userPanelView: { classList: { contains: function () { return sb.__panelActivo; } } }, userFeedContainer: { innerHTML: '' } };
    sb.__panelActivo = false;
    var docBase = stub();
    sb.document = new Proxy({}, { get: function (t, k) { if (k === 'getElementById') return function (id) { return sb.__elementos[id] || stub(); }; return docBase[k]; }, set: function () { return true; } });
    vm.createContext(sb);
    vm.runInContext('var PanelUsuario = {}; var usuarioActual = ' + JSON.stringify(YO) + '; var supabase = null;', sb);
    ['interprete-busqueda-personas', 'motor-busqueda-personas', 'motor-busqueda-personas-datos', 'limpieza-busqueda', 'intencion-busqueda', 'busqueda-por-capas', 'panel-usuario-3', 'event-controller'].forEach(function (f) {
        vm.runInContext(leer('js/modules/' + f + '.js'), sb, { filename: f });
    });
    sb.supabase = fakeSupabase();
    vm.runInContext(`
        var __llamadasCapas = 0, __llamadasIA = 0, __mostradas = [], __feed = [], __estadoQuitado = 0;
        var _orig = BusquedaPorCapas.buscarPersonas;
        BusquedaPorCapas.buscarPersonas = function () { __llamadasCapas++; return _orig.apply(this, arguments); };
        function detectarCambioIdiomaEnMensaje() { return null; }
        var AIService = { enviarMensajeEstructurado: function () { __llamadasIA++; return Promise.resolve({ accion: null, mensaje_chat: 'ia', _formato_invalido: false }); } };
        var Institucional = { t: function (x) { return x; } };
        var UIController = { elementos: { searchResultsContainer: { style: {} }, searchResultsContent: { style: {}, innerHTML: '' }, catalogContainer: { style: {} } },
            mostrarRespuestaIA: function () {}, mostrarEstadoCarga: function () {}, quitarEstadoCarga: function () { __estadoQuitado++; }, cerrarResultados: function () {},
            mostrarResultadosPersonas: function (n, u) { __mostradas.push({ nombre: n, ids: u.map(function (p) { return p.id; }) }); }, _panelActivo: function () { return false; }, formularioAbierto: false };
        EventController.procesarAccionIA = function () { return Promise.resolve(); };
        PanelUsuario.escHtml = function (x) { return String(x); }; PanelUsuario._t = function (k, d) { return d; };
        PanelUsuario.renderResultadosPersonasEnFeed = function (u, n) { __feed.push({ nombre: n, ids: u.map(function (p) { return p.id; }) }); };
    `, sb);
    return sb;
}
function flags(sb, f) { vm.runInContext('window.BUSQUEDA_CAPAS = ' + JSON.stringify(f) + '; MotorBusquedaPersonasDatos.invalidarCache();', sb); }
function ev(sb, js) { return vm.runInContext(js, sb); }
var ids = function (l) { return l.map(function (p) { return p.id; }); };

(async function () {
    var sb = entorno();
    var hub = function (q, canal, extra) { return ev(sb, 'PanelUsuario.buscarUsuariosPorNombre(' + JSON.stringify(q) + ', null, true, ' + JSON.stringify(Object.assign({ canal: canal }, extra || {})) + ')'); };
    var capasLlamadas = function () { return ev(sb, '__llamadasCapas'); };

    // ---- Punto central: buscarUsuariosPorNombre ----
    flags(sb, { panelPersonas: false, picker: false });
    var l = await hub('co-caina', 'panelPersonas');
    es('interruptor apagado: camino de siempre (co-caina no se bloquea) y sin pasar por las capas', [l.motor.ficha.bloqueada, capasLlamadas()], [false, 0]);
    flags(sb, { panelPersonas: true });
    l = await hub('co-caina', 'panelPersonas');
    es('Buscar Personas con interruptor: co-caina se bloquea', [ids(l), l.motor.ficha.bloqueada, capasLlamadas()], [[], true, 1]);
    l = await hub('Carlos Armas', 'panelPersonas');
    es('Buscar Personas permite el apellido Armas', ids(l), ['u-carlos']);
    flags(sb, { picker: true });
    l = await hub('Carlos Armas', 'picker-compartir');
    es('Compartir/Mensajes (picker-*) usan las capas pero NO permiten Armas', [l.motor.ficha.bloqueada, ids(l)], [true, []]);
    flags(sb, { panelPersonas: true });
    l = await hub('quien vende laptops', 'picker-mensaje');
    es('picker apagado: camino de siempre', ids(l), ['u-juan']);
    es('lista con nombre_completo y .motor, igual que antes', [l[0].nombre_completo, typeof l.motor], ['Juan Pérez', 'object']);
    var antes = capasLlamadas();
    await hub('Juan', 'panelPersonas', { ficha: { nombre: 'juan' } });
    es('ficha forzada (botones de ejemplo): no pasa por las capas', capasLlamadas(), antes);
    antes = capasLlamadas();
    await hub('', 'panelPersonas');
    es('texto vacío (solo zona): no pasa por las capas', capasLlamadas(), antes);
    l = await hub('usuarios con inicial J en Callao', 'panelPersonas');
    es('inicial J con lugar: filtra por la letra', [ids(l), l.motor.ficha.iniciales], [['u-juan'], ['j']]);
    ev(sb, 'BusquedaPorCapas.interruptores.entrada = false');
    l = await hub('quien vende laptops', 'panelPersonas');
    es('si la entrada única se apaga: respaldo, mismas personas', ids(l), ['u-juan']);
    ev(sb, 'BusquedaPorCapas.interruptores.entrada = true');

    // ---- Ayudante: ¿es claramente de personas? ----
    var es_ = function (f, c) { return ev(sb, 'PanelUsuario._fraseEsDePersonasPorCapas(' + JSON.stringify(f) + ', ' + JSON.stringify(c) + ')'); };
    flags(sb, { principal: false });
    es('apagado: false', es_('@jperez', 'principal'), false);
    flags(sb, { principal: true, asistente: true, panel: true });
    es('@usuario: true', es_('@jperez', 'principal'), true);
    es('quien vende laptops: true', es_('busca quien venda laptops', 'principal'), true);
    es('nombre y apellido: true', es_('Juan Pérez', 'asistente'), true);
    es('usuarios de mi zona: true (no se desvía a la matriz)', es_('usuarios de mi zona', 'panel'), true);
    es('laptops (ambigua): false, sigue la IA', es_('laptops', 'principal'), false);
    es('videos de gatos: false', es_('videos de gatos', 'principal'), false);
    es('qué hora es: false', es_('qué hora es', 'principal'), false);
    es('mi zona: false (la matriz la resuelve como hoy)', es_('mi zona', 'principal'), false);
    es('clave que no existe: false', es_('@jperez', 'otra'), false);
    ev(sb, 'BusquedaPorCapas.interruptores.intencion = false');
    es('intención apagada: false', es_('@jperez', 'principal'), false);
    ev(sb, 'BusquedaPorCapas.interruptores.intencion = true');
    ev(sb, 'usuarioActual = null');
    es('sin sesión: false (sigue el camino de siempre)', es_('@jperez', 'principal'), false);
    ev(sb, 'usuarioActual = ' + JSON.stringify(YO));

    // ---- Buscador principal de la página ----
    var principal = async function (q) { sb.__elementos.dynamicSearch.value = q; sb.__panelActivo = false; ev(sb, '__llamadasIA = 0; __mostradas = []'); await ev(sb, 'EventController.manejarBusquedaPrincipal({ preventDefault: function () {} })'); return [ev(sb, '__llamadasIA'), ev(sb, '__mostradas')]; };
    flags(sb, { principal: false, paginaChat: true });
    es('principal apagado: va a la IA como hoy', (await principal('@jperez'))[0], 1);
    flags(sb, { principal: true, paginaChat: true });
    var r = await principal('@jperez');
    es('principal prendido: sin IA, muestra a Juan', [r[0], r[1]], [0, [{ nombre: '@jperez', ids: ['u-juan'] }]]);
    r = await principal('laptops');
    es('principal: frase ambigua sigue a la IA', [r[0], r[1].length], [1, 0]);
    r = await principal('videos de gatos');
    es('principal: otra cosa sigue a la IA', [r[0], r[1].length], [1, 0]);
    r = await principal('usuarios con inicial J en Callao');
    es('principal: inicial J con lugar', [r[0], r[1][0] && r[1][0].ids], [0, ['u-juan']]);

    // ---- Asistente (chat) de la página ----
    var chat = async function (m, panel) { sb.__elementos.assistantInput.value = m; sb.__panelActivo = !!panel; ev(sb, '__llamadasIA = 0; __mostradas = []; __feed = []; __estadoQuitado = 0'); await ev(sb, 'EventController.manejarEnvioMensaje({ preventDefault: function () {} })'); return { ia: ev(sb, '__llamadasIA'), pagina: ev(sb, '__mostradas'), feed: ev(sb, '__feed'), quitado: ev(sb, '__estadoQuitado') }; };
    flags(sb, { asistente: false, paginaChat: true });
    es('asistente apagado: va a la IA', (await chat('@jperez')).ia, 1);
    flags(sb, { asistente: true, paginaChat: true });
    var c = await chat('busca quien venda laptops');
    es('asistente prendido: sin IA, muestra a Juan y quita el "cargando"', [c.ia, c.pagina.length && c.pagina[0].ids, c.quitado], [0, ['u-juan'], 1]);
    c = await chat('hola, qué tal');
    es('asistente: conversación sigue a la IA', [c.ia, c.pagina.length], [1, 0]);

    // ---- Panel (muro): chat y buscador ----
    flags(sb, { panel: false, panelChat: true });
    es('panel apagado: va a la IA', (await chat('@jperez', true)).ia, 1);
    flags(sb, { panel: true, panelChat: true });
    c = await chat('@jperez', true);
    es('panel prendido (chat): sin IA, pinta a Juan en el muro', [c.ia, c.feed.length && c.feed[0].ids, c.pagina.length], [0, ['u-juan'], 0]);
    c = await chat('usuarios de mi zona', true);
    es('panel: "usuarios de mi zona" busca personas, no la matriz', [c.ia, c.feed.length && c.feed[0].nombre], [0, 'usuarios de mi zona']);
    ev(sb, '__llamadasIA = 0; __feed = []');
    await ev(sb, 'PanelUsuario.ejecutarBusquedaConIA("@jperez")');
    es('panel prendido (buscador de arriba): sin IA, pinta a Juan', [ev(sb, '__llamadasIA'), ev(sb, '__feed')[0] && ev(sb, '__feed')[0].ids], [0, ['u-juan']]);

    console.log(fallos ? ('HAY ' + fallos + ' FALLOS de ' + total + ' pruebas') : ('TODO BIEN: ' + total + ' de ' + total + ' pruebas'));
    process.exit(fallos ? 1 : 0);
})().catch(function (e) { console.log('ERROR EN LA PRUEBA:', e && e.stack || e); process.exit(1); });
