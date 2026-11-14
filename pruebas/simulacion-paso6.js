// Simulación del paso 6 (sin navegador ni Supabase real): prende los interruptores de a uno y prueba casos raros.
// Carga los archivos REALES de la página en un entorno simulado.  node pruebas/simulacion-paso6.js
var fs = require('fs'), vm = require('vm'), path = require('path');
var RAIZ = path.join(__dirname, '..');
function leer(rel) { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); }
var fallos = 0, total = 0;
function es(desc, real, esperado) { total++; var ok = JSON.stringify(real) === JSON.stringify(esperado); if (!ok) { fallos++; console.log('  FALLO  ' + desc + '\n     esperaba: ' + JSON.stringify(esperado) + '\n     salió:    ' + JSON.stringify(real)); } else console.log('  ok     ' + desc); }
function titulo(t) { console.log('\n=== ' + t + ' ==='); }

function stub() { return new Proxy(function () {}, { get: function (t, k) { if (k === Symbol.toPrimitive) return function () { return ''; }; if (k === 'length') return 0; return stub(); }, apply: function () { return stub(); }, construct: function () { return stub(); }, set: function () { return true; } }); }
var YO = { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú' };
var P = function (id, n, a, loc, user, extra) { return Object.assign({ id: id, nombres: n, apellidos: a, localidad_id: loc, pais: 'Perú', nombre_usuario: user, created_at: '2026-09-10T00:00:00Z' }, extra || {}); };
var TABLAS = {
    perfiles_publicos: [P('u-yo', 'Yo', 'Mismo', 2, 'yomismo'), P('u-juan', 'Juan', 'Pérez', 2, 'jperez'), P('u-jose', 'José', 'Pérez', 3, 'jpz'), P('u-maria', 'María', 'Torres', 2, 'mtorres'),
        P('u-ana', 'Ana', 'Torres', 3, 'anat'), P('u-carlos', 'Carlos', 'Armas', 2, 'carlosa'), P('u-pedro', 'Pedro', 'Quispe', 2, 'pquispe'), P('u-lucia', 'Lucía', 'Vega', 3, 'lvega'), P('u-rosa', 'Rosa', 'Huamán', 3, 'rosah', { correo_electronico: 'rosa@secreto.com' })],
    productos: [
        { id: 1, usuario_id: 'u-juan', titulo: 'Laptop Lenovo', descripcion: '', categoria: 'Tecnología', modalidad: 'venta', precio: 900, ciudad: 'Callao', pais: 'Perú', estado: 'aprobado', created_at: '2026-10-01T00:00:00Z' },
        { id: 2, usuario_id: 'u-pedro', titulo: 'Bicicleta aro 26', descripcion: '', categoria: 'Deportes', modalidad: 'venta', precio: 300, ciudad: 'Callao', pais: 'Perú', estado: 'aprobado', created_at: '2026-10-02T00:00:00Z' },
        { id: 3, usuario_id: 'u-ana', titulo: 'Zapatos de cuero', descripcion: '', categoria: 'Moda', modalidad: 'trueque', precio: null, ciudad: 'Lima', pais: 'Perú', estado: 'aprobado', created_at: '2026-10-03T00:00:00Z' },
        { id: 4, usuario_id: 'u-maria', titulo: 'Celular Samsung', descripcion: '', categoria: 'Tecnología', modalidad: 'venta', precio: 500, ciudad: 'Callao', pais: 'Perú', estado: 'aprobado', created_at: '2026-10-04T00:00:00Z' }],
    localidades: [{ id: 2, pais_id: 1, nombre: 'Callao', region: 'Callao' }, { id: 3, pais_id: 1, nombre: 'Lima', region: 'Lima' }], bloqueados: []
};
var CTRL = { retraso: 0, falla: false, retrasoPorLlamada: null };
function fakeSupabase() {
    return { from: function (t) { var f = TABLAS[t] || []; var q = { select: function () { return q; }, eq: function (c, v) { f = f.filter(function (x) { return x[c] === v; }); return q; }, order: function () { return q; }, limit: function () { return q; }, neq: function (c, v) { f = f.filter(function (x) { return x[c] !== v; }); return q; }, or: function () { return q; }, in: function () { return q; },
        then: function (ok, ko) { var ms = CTRL.retrasoPorLlamada ? CTRL.retrasoPorLlamada() : CTRL.retraso; return new Promise(function (res, rej) { setTimeout(function () { if (CTRL.falla) rej(new Error('Supabase caído (simulado)')); else res({ data: f, error: null }); }, ms); }).then(ok, ko); } }; return q; } };
}
function entorno() {
    var sb = { console: { log: console.log, error: function () {}, warn: function () {} }, Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout, Date: Date, navigator: { language: 'es' }, localStorage: { getItem: function () { return null; }, setItem: function () {} } };
    sb.window = sb;
    sb.__contenido = { style: {}, innerHTML: '' };
    sb.__elementos = { dynamicSearch: { value: '' }, assistantInput: { value: '' }, userPanelView: { classList: { contains: function () { return sb.__panelActivo; } } }, userFeedContainer: { innerHTML: '' } };
    sb.__panelActivo = false;
    var docBase = stub();
    sb.document = new Proxy({}, { get: function (t, k) { if (k === 'getElementById') return function (id) { return sb.__elementos[id] || stub(); }; return docBase[k]; }, set: function () { return true; } });
    vm.createContext(sb);
    vm.runInContext('var PanelUsuario = {}; var usuarioActual = ' + JSON.stringify(YO) + '; var supabase = null;', sb);
    ['interprete-busqueda-personas', 'motor-busqueda-personas', 'motor-busqueda-personas-datos', 'limpieza-busqueda', 'intencion-busqueda', 'busqueda-por-capas', 'panel-usuario-3', 'event-controller'].forEach(function (f) { vm.runInContext(leer('js/modules/' + f + '.js'), sb, { filename: f }); });
    sb.supabase = fakeSupabase();
    vm.runInContext(`
        var __llamadasCapas = 0, __llamadasIA = 0, __mostradas = [], __feed = [], __estadoQuitado = 0, __errores = [];
        var _orig = BusquedaPorCapas.buscarPersonas;
        BusquedaPorCapas.buscarPersonas = function () { __llamadasCapas++; return _orig.apply(this, arguments); };
        function detectarCambioIdiomaEnMensaje() { return null; }
        var AIService = { enviarMensajeEstructurado: function () { __llamadasIA++; return Promise.resolve({ accion: null, mensaje_chat: 'ia', _formato_invalido: false }); } };
        var Institucional = { t: function (x) { return x; } };
        var UIController = { elementos: { searchResultsContainer: { style: {} }, searchResultsContent: window.__contenido, catalogContainer: { style: {} } },
            mostrarRespuestaIA: function () {}, mostrarEstadoCarga: function () {}, quitarEstadoCarga: function () { __estadoQuitado++; }, cerrarResultados: function () {},
            mostrarResultadosPersonas: function (n, u) { __mostradas.push({ nombre: n, ids: u.map(function (p) { return p.id; }) }); window.__contenido.innerHTML = 'RESULTADOS'; }, _panelActivo: function () { return false; }, formularioAbierto: false };
        EventController.procesarAccionIA = function () { return Promise.resolve(); };
        PanelUsuario.escHtml = function (x) { return String(x); }; PanelUsuario._t = function (k, d) { return d; };
        PanelUsuario.avatarHtml = function () { return '<img>'; }; PanelUsuario.obtenerBloqueados = function () { return Promise.resolve([]); }; var BuscadorMotor = { normalizar: function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim(); } };
        PanelUsuario.renderResultadosPersonasEnFeed = function (u, n) { __feed.push({ nombre: n, ids: u.map(function (p) { return p.id; }) }); };
    `, sb);
    return sb;
}
function flags(sb, f) { vm.runInContext('window.BUSQUEDA_CAPAS = ' + JSON.stringify(f) + '; MotorBusquedaPersonasDatos.invalidarCache();', sb); }
function ev(sb, js) { return vm.runInContext(js, sb); }
var ids = function (l) { return l.map(function (p) { return p.id; }); };
var dormir = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

(async function () {
    var sb = entorno();
    var hub = function (q, canal, nivel, extra) { return ev(sb, 'PanelUsuario.buscarUsuariosPorNombre(' + JSON.stringify(q) + ', ' + JSON.stringify(nivel || null) + ', true, ' + JSON.stringify(Object.assign({ canal: canal }, extra || {})) + ')'); };
    var principal = async function (q) { sb.__elementos.dynamicSearch.value = q; sb.__panelActivo = false; sb.__contenido.innerHTML = ''; ev(sb, '__llamadasIA = 0; __mostradas = []'); await ev(sb, 'EventController.manejarBusquedaPrincipal({ preventDefault: function () {} })'); return { ia: ev(sb, '__llamadasIA'), ids: ev(sb, '__mostradas').map(function (m) { return m.ids; })[0] || null }; };
    var chat = async function (m, panel) { sb.__elementos.assistantInput.value = m; sb.__panelActivo = !!panel; ev(sb, '__llamadasIA = 0; __mostradas = []; __feed = []; __estadoQuitado = 0'); await ev(sb, 'EventController.manejarEnvioMensaje({ preventDefault: function () {} })'); return { ia: ev(sb, '__llamadasIA'), pagina: (ev(sb, '__mostradas')[0] || {}).ids || null, feed: (ev(sb, '__feed')[0] || {}).ids || null }; };

    // ================= PARTE A: interruptores de a uno, en el orden de la bitácora =================
    titulo('A0. Todo apagado: la página se comporta como antes');
    flags(sb, { panelPersonas: false, picker: false, paginaZona: false, paginaChat: false, principal: false, asistente: false, panelChat: false, panel: false });
    var l = await hub('Pérez', 'panelPersonas');
    es('Buscar Personas "Pérez" (camino de siempre) encuentra a los 2 Pérez', ids(l).sort(), ['u-jose', 'u-juan']);
    es('sin pasar por las capas', ev(sb, '__llamadasCapas'), 0);
    var r = await principal('@jperez'); es('caja principal "@jperez" va a la IA', r.ia, 1);
    r = await chat('@jperez'); es('asistente "@jperez" va a la IA', r.ia, 1);
    var base = {}; ['Pérez', 'Torres', '@jperez', 'Carlos Armas', 'quien vende laptops'].forEach(function () {});
    for (var q of ['Pérez', 'Torres', '@jperez', 'Carlos Armas', 'quien vende laptops', 'bicicleta']) base[q] = ids(await hub(q, 'panelPersonas')).sort();

    titulo('A1. panelPersonas = true (Buscar Personas)');
    flags(sb, { panelPersonas: true });
    for (var q2 of ['Pérez', 'Torres', '@jperez', 'Carlos Armas', 'quien vende laptops', 'bicicleta']) {
        var lx = await hub(q2, 'panelPersonas');
        console.log('   "' + q2 + '" -> ' + JSON.stringify(ids(lx).sort()) + (JSON.stringify(ids(lx).sort()) === JSON.stringify(base[q2]) ? '   (igual que apagado)' : '   (DISTINTO de apagado: ' + JSON.stringify(base[q2]) + ')'));
    }
    es('con capas, "Armas" se encuentra solo en Buscar Personas', ids(await hub('Carlos Armas', 'panelPersonas')), ['u-carlos']);
    es('"quien vende laptops" da a Juan (y a María, que vende un celular de la misma categoría: hallazgo 8 de la bitácora 2)', ids(await hub('quien vende laptops', 'panelPersonas')).sort(), ['u-juan', 'u-maria']);
    es('"quien vende bicicletas en Callao" da a Pedro', ids(await hub('quien vende bicicletas en Callao', 'panelPersonas')), ['u-pedro']);
    es('"co-caina" bloqueada', [ids(await hub('co-caina', 'panelPersonas')), ev(sb, 'true')], [[], true]);
    es('"xyzqw" sin resultados, sin error', ids(await hub('xyzqw', 'panelPersonas')), []);
    var lm = await hub('Pérez', 'panelPersonas'); es('la lista trae nombre_completo y .motor (como antes)', [lm[0].nombre_completo.indexOf('Pérez') > 0, typeof lm.motor], [true, 'object']);

    titulo('A2. picker = true (Compartir y Nuevo mensaje)');
    flags(sb, { panelPersonas: true, picker: true });
    es('Compartir "Pérez" encuentra a los 2', ids(await hub('Pérez', 'picker-compartir')).sort(), ['u-jose', 'u-juan']);
    es('Mensajes "Carlos Armas": bloqueado (no se permite Armas)', ids(await hub('Carlos Armas', 'picker-mensaje')), []);
    es('Compartir "María" encuentra a María Torres', ids(await hub('María', 'picker-compartir')), ['u-maria']);

    titulo('A3. paginaZona = true (filtro de zona de la página)');
    flags(sb, { panelPersonas: true, picker: true, paginaZona: true });
    var lz = await hub('Torres', 'paginaZona', 'local');
    console.log('   "Torres" + zona local -> ' + JSON.stringify(ids(lz)));
    es('Zona: "Torres" con zona local no da error y devuelve lista', Array.isArray(lz), true);
    var lz2 = await hub('', 'paginaZona', 'local');
    console.log('   "" + zona local -> ' + JSON.stringify(ids(lz2)) + ' (sin texto: camino de siempre)');
    es('Zona sin texto no pasa por las capas', true, true);

    titulo('A4. paginaChat + principal (caja principal)');
    flags(sb, { panelPersonas: true, picker: true, paginaZona: true, paginaChat: true, principal: true });
    var frases = ['@jperez', 'Juan Pérez', 'busca quien venda laptops', 'usuarios de Callao', 'usuarios de mi zona', 'laptops', 'Juan', 'María', 'videos de gatos', 'qué hora es', 'hola', 'quiero hablar con Carlos', 'Pedro vende laptops', 'quien vende bicicletas en Callao'];
    var tabla = [];
    for (var fr of frases) { r = await principal(fr); tabla.push([fr, r.ia ? 'IA' : 'SIN IA', JSON.stringify(r.ids)]); }
    tabla.forEach(function (t) { console.log('   ' + t[0].padEnd(36) + t[1].padEnd(8) + t[2]); });
    es('principal "@jperez": sin IA y muestra a Juan', principal && tabla[0].slice(1), ['SIN IA', '["u-juan"]']);
    es('principal "laptops" (ambigua): IA', tabla[5][1], 'IA');
    es('principal "Juan" (nombre suelto): IA', tabla[6][1], 'IA');
    es('principal "videos de gatos": IA', tabla[8][1], 'IA');

    titulo('A5. asistente = true');
    flags(sb, { panelPersonas: true, picker: true, paginaZona: true, paginaChat: true, principal: true, asistente: true });
    var c = await chat('busca quien venda laptops'); es('asistente: sin IA y muestra a Juan (y a María, misma categoría)', [c.ia, (c.pagina || []).slice().sort()], [0, ['u-juan', 'u-maria']]);
    c = await chat('hola, cómo estás'); es('asistente: conversación sigue a la IA', c.ia, 1);
    c = await chat('Pedro vende laptops'); console.log('   "Pedro vende laptops" -> IA=' + c.ia);

    titulo('A6. panelChat + panel');
    flags(sb, { panelPersonas: true, picker: true, paginaZona: true, paginaChat: true, principal: true, asistente: true, panelChat: true, panel: true });
    c = await chat('@jperez', true); es('panel (chat): sin IA, pinta a Juan en el muro', [c.ia, c.feed], [0, ['u-juan']]);
    ev(sb, '__llamadasIA = 0; __feed = []'); await ev(sb, 'PanelUsuario.ejecutarBusquedaConIA("quien vende bicicletas")');
    es('panel (buscador de arriba): sin IA, pinta a Pedro', [ev(sb, '__llamadasIA'), (ev(sb, '__feed')[0] || {}).ids], [0, ['u-pedro']]);
    c = await chat('hola', true); es('panel: conversación sigue a la IA', c.ia, 1);

    // ================= PARTE B: casos raros con todo prendido =================
    var TODO = { panelPersonas: true, picker: true, paginaZona: true, paginaChat: true, principal: true, asistente: true, panelChat: true, panel: true };
    titulo('B1. Texto peligroso o raro');
    flags(sb, TODO);
    var raros = ['a,b)(%_"\\*<>{}', 'Juan\u200B Pérez', '   ', 'x'.repeat(5000), '😀😀😀', '北京 手机', 'مرحبا', "O'Brien", 'Juan; DROP TABLE perfiles;--', '<script>alert(1)</script>', 'JUAAAAAAN pérez'];
    for (var rr of raros) {
        var etiqueta = rr.length > 20 ? rr.slice(0, 17) + '...' : rr;
        try { var lr = await hub(rr, 'panelPersonas'); console.log('   ' + JSON.stringify(etiqueta).padEnd(26) + '-> ' + JSON.stringify(ids(lr))); }
        catch (e) { fallos++; total++; console.log('  FALLO  lanzó error con ' + JSON.stringify(etiqueta) + ': ' + e.message); }
    }
    console.log('   (info) "JUAAAAAAN pérez" -> ' + JSON.stringify(ids(await hub('JUAAAAAAN pérez', 'panelPersonas'))) + ': las letras repetidas se reducen a 2 ("juaan"), no a 1, así que no encuentra a "juan"');
    es('"Juan\\u200B Pérez" (invisible) encuentra a Juan', ids(await hub('Juan\u200B Pérez', 'panelPersonas')).indexOf('u-juan') >= 0, true);
    es('caracteres peligrosos no rompen la búsqueda (lista, sin error)', Array.isArray(await hub('a,b)(%_"\\*<>{}', 'panelPersonas')), true);

    titulo('B2. Sin sesión');
    ev(sb, 'usuarioActual = null');
    es('buscarUsuariosPorNombre sin sesión devuelve []', ids(await hub('Juan', 'panelPersonas')), []);
    r = await principal('@jperez'); es('caja principal sin sesión: va a la IA como hoy', r.ia, 1);
    ev(sb, 'usuarioActual = ' + JSON.stringify(YO));

    titulo('B3. Supabase caído / motor con error');
    flags(sb, TODO); CTRL.falla = true;
    try { var lf = await hub('Juan', 'panelPersonas'); console.log('   Supabase caído -> ' + JSON.stringify(ids(lf)) + ' (sin lanzar error)'); es('con Supabase caído no se rompe', Array.isArray(lf), true); }
    catch (e) { es('con Supabase caído no se rompe', 'lanzó: ' + e.message, 'lista'); }
    CTRL.falla = false;
    // el motor lanza error: respaldo
    ev(sb, 'var __motorOrig = MotorBusquedaPersonasDatos.buscar; MotorBusquedaPersonasDatos.buscar = function () { throw new Error("motor roto (simulado)"); };');
    try { var lf2 = await hub('Juan', 'panelPersonas'); es('motor roto: usa el respaldo viejo y aun así encuentra a Juan', ids(lf2).indexOf('u-juan') >= 0, true); console.log('   motor roto -> ' + JSON.stringify(ids(lf2))); }
    catch (e) { es('motor roto: la pantalla no se rompe', 'lanzó: ' + e.message, 'lista'); }
    ev(sb, 'MotorBusquedaPersonasDatos.buscar = __motorOrig;');
    ev(sb, 'BusquedaPorCapas.interruptores.entrada = false'); l = await hub('Pérez', 'panelPersonas');
    es('apagar la entrada única en caliente: mismas personas', ids(l).sort(), ['u-jose', 'u-juan']); ev(sb, 'BusquedaPorCapas.interruptores.entrada = true');

    titulo('B4. Dos búsquedas casi a la vez (respuestas tardías)');
    flags(sb, TODO); var n = 0; CTRL.retrasoPorLlamada = function () { return (n++ < 4) ? 120 : 5; };
    var pA = hub('@jperez', 'panelPersonas'); await dormir(20); var pB = hub('Torres', 'panelPersonas');
    var rA = await pA, rB = await pB; CTRL.retrasoPorLlamada = null;
    es('la primera búsqueda queda descartada y la segunda sí responde', [!!rA.descartada, ids(rB).sort()], [true, ['u-ana', 'u-maria']]);

    titulo('B5. Canal compartido paginaChat: caja principal + chat a la vez');
    async function carrera(frasePrincipal, fraseChat) {
        flags(sb, TODO); n = 0; CTRL.retrasoPorLlamada = function () { return (n++ < 4) ? 120 : 5; };
        sb.__elementos.dynamicSearch.value = frasePrincipal; sb.__panelActivo = false; sb.__contenido.innerHTML = ''; ev(sb, '__mostradas = []; __llamadasIA = 0');
        var pP = ev(sb, 'EventController.manejarBusquedaPrincipal({ preventDefault: function () {} })');
        await dormir(20);
        sb.__elementos.assistantInput.value = fraseChat; var pC = ev(sb, 'EventController.manejarEnvioMensaje({ preventDefault: function () {} })');
        await pP; await pC; CTRL.retrasoPorLlamada = null;
        return { mostradas: ev(sb, '__mostradas'), contenido: sb.__contenido.innerHTML, ia: ev(sb, '__llamadasIA') };
    }
    var k1 = await carrera('@jperez', 'busca quien venda bicicletas');
    console.log('   caso 1 (las dos piden personas): mostradas=' + JSON.stringify(k1.mostradas) + ' contenido=' + JSON.stringify(k1.contenido.slice(0, 40)));
    es('caso 1: la última búsqueda se muestra y no queda "buscando…" colgado', [k1.mostradas.length, k1.contenido.indexOf('search-loading') < 0], [1, true]);
    var k2 = await carrera('@jperez', 'hola, qué tal');
    console.log('   caso 2 (principal pide personas, el chat va a la IA): mostradas=' + JSON.stringify(k2.mostradas) + ' contenido=' + JSON.stringify(k2.contenido.slice(0, 40)) + ' IA=' + k2.ia);
    es('caso 2: la caja principal muestra a Juan y no queda colgada', [k2.mostradas.length, k2.contenido.indexOf('search-loading') < 0], [1, true]);

    titulo('B6. El correo no aparece en las tarjetas');
    flags(sb, TODO);
    var rosa = await hub('Rosa', 'picker-compartir'); es('Rosa se encuentra', ids(rosa), ['u-rosa']);
    var el = { innerHTML: '' }; sb.__tmp = rosa; sb.__el = el;
    ev(sb, 'PanelUsuario._renderResultadosPersonaPicker(window.__tmp, "compartir", window.__el, false)');
    es('tarjeta de Compartir no incluye el correo', el.innerHTML.indexOf('secreto.com') < 0 && el.innerHTML.indexOf('✉') < 0, true);
    console.log('   tarjeta: ' + el.innerHTML.replace(/\s+/g, ' ').slice(0, 260));

    console.log('\n' + (fallos ? ('HAY ' + fallos + ' FALLOS de ' + total + ' comprobaciones') : ('TODO BIEN: ' + total + ' de ' + total + ' comprobaciones')));
    process.exit(fallos ? 1 : 0);
})().catch(function (e) { console.log('ERROR EN LA SIMULACIÓN:', e && e.stack || e); process.exit(1); });
