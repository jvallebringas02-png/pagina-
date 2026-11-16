// "Personas que vendan servicios / donen en mi ciudad o país": intérprete (qué entiende) y búsqueda completa (quién sale).
// node pruebas/servicios-y-lugar.test.js
var fs = require('fs'), vm = require('vm'), path = require('path');
var RAIZ = path.join(__dirname, '..');
function leer(rel) { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); }
var fallos = 0, total = 0;
function es(desc, real, esperado) { total++; if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); } }

// ---------- 1) Intérprete ----------
var Int = require('../js/modules/interprete-busqueda-personas.js');
var f = function (t) { var r = Int.interpretar(t, {}); return [r.hace, r.oferta]; };
es('"vendan servicios en mi ciudad": solo servicios', f('búscame personas que vendan servicios en mi ciudad'), [['servicios'], null]);
es('"venda servicios": solo servicios', f('buscame persona que venda servicios'), [['servicios'], null]);
es('"quien vende servicios": solo servicios', f('quien vende servicios'), [['servicios'], null]);
es('"vende servicios de gasfitería": servicios, oferta gasfitería', f('quien vende servicios de gasfitería'), [['servicios'], 'gasfitería']);
es('"vendan servicios y donen": servicios y donación', f('personas que vendan servicios y donen en mi ciudad'), [['servicios', 'regala'], null]);
es('"ofrezca servicios en mi localidad": ya no sobra "en"', f('busca gente que ofrezca servicios en mi localidad'), [['servicios'], null]);
es('"vendan servicios en" (en suelto): oferta vacía', f('que vendan servicios en'), [['servicios'], null]);
es('"vende o da servicios": se queda venta o servicio', f('quien vende o da servicios'), [['vende', 'servicios'], null]);
es('"vendan servicios o productos": se queda como antes', f('que vendan servicios o productos'), [['vende', 'servicios'], 'productos']);
es('"venda servicios y ropa": sigue buscando venta (ropa)', f('gente que venda servicios y ropa'), [['vende', 'servicios'], 'ropa']);
es('"vende laptops" no cambia', f('quien vende laptops'), [['vende'], 'laptops']);
es('"vendan y donen" no cambia', f('usuarios que vendan y donen'), [['vende', 'regala'], null]);
es('"da clases de inglés" no cambia', f('quien da clases de inglés'), [['servicios'], 'inglés']);
es('"da servicios y regala ropa" no cambia', f('quien da servicios y regala ropa'), [['servicios', 'regala'], 'ropa']);
es('"donen en mi país" no cambia', f('personas que donen en mi país'), [['regala'], null]);

// ---------- 2) Búsqueda completa con datos de ejemplo ----------
function stub() { return new Proxy(function () {}, { get: function (t, k) { if (k === Symbol.toPrimitive) return function () { return ''; }; if (k === 'length') return 0; return stub(); }, apply: function () { return stub(); }, construct: function () { return stub(); }, set: function () { return true; } }); }
var P = function (id, n, a, loc, user, pais) { return { id: id, nombres: n, apellidos: a, localidad_id: loc, pais: pais || 'Perú', nombre_usuario: user, created_at: '2026-09-10T00:00:00Z' }; };
var PR = function (id, u, t, cat, mod, ciudad, pais, precio) { return { id: id, usuario_id: u, titulo: t, descripcion: '', categoria: cat, modalidad: mod, precio: precio || null, ciudad: ciudad, pais: pais || 'Perú', estado: 'aprobado', created_at: '2026-10-0' + id + 'T00:00:00Z' }; };
var TABLAS = {
    perfiles_publicos: [P('u-yo', 'Yo', 'Mismo', 2, 'yomismo'), P('u-juan', 'Juan', 'Pérez', 2, 'jperez'), P('u-ana', 'Ana', 'Torres', 3, 'anat'), P('u-pedro', 'Pedro', 'Quispe', 2, 'pquispe'), P('u-lucia', 'Lucía', 'Vega', 3, 'lvega'), P('u-diego', 'Diego', 'Rojas', 4, 'drojas', 'Chile'), P('u-rosa', 'Rosa', 'Huamán', 2, 'rosah'), P('u-tomas', 'Tomás', 'Ríos', 2, 'tomasr')],
    productos: [PR(1, 'u-juan', 'Clases de inglés', 'Servicios', 'servicio', 'Callao', 'Perú', 50), PR(2, 'u-ana', 'Reparación de celulares', 'Servicios', 'servicio', 'Lima', 'Perú', 30), PR(3, 'u-pedro', 'Ropa de abrigo', 'Moda', 'donacion', 'Callao', 'Perú'),
        PR(4, 'u-lucia', 'Libros escolares', 'Libros', 'donacion', 'Lima', 'Perú'), PR(5, 'u-diego', 'Diseño gráfico', 'Servicios', 'servicio', 'Santiago', 'Chile', 80), PR(6, 'u-rosa', 'Gasfitería a domicilio', 'Servicios', 'servicio', 'Callao', 'Perú', 40),
        PR(7, 'u-tomas', 'Laptop Lenovo', 'Tecnología', 'venta', 'Callao', 'Perú', 900)],
    localidades: [{ id: 2, pais_id: 1, nombre: 'Callao', region: 'Callao' }, { id: 3, pais_id: 1, nombre: 'Lima', region: 'Lima' }, { id: 4, pais_id: 2, nombre: 'Santiago', region: 'Metropolitana' }], bloqueados: []
};
var YO = { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú' };
var sb = { console: { log: console.log, error: function () {}, warn: function () {} }, Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout, Date: Date, navigator: { language: 'es' }, localStorage: { getItem: function () { return null; }, setItem: function () {} } };
sb.window = sb; sb.document = stub(); vm.createContext(sb);
vm.runInContext('var PanelUsuario = {}; var usuarioActual = ' + JSON.stringify(YO) + '; var supabase = null;', sb);
['interprete-busqueda-personas', 'motor-busqueda-personas', 'motor-busqueda-personas-datos', 'limpieza-busqueda', 'intencion-busqueda', 'busqueda-por-capas', 'panel-usuario-3'].forEach(function (n) { vm.runInContext(leer('js/modules/' + n + '.js'), sb, { filename: n }); });
sb.supabase = { from: function (t) { var d = TABLAS[t] || []; var q = { select: function () { return q; }, eq: function () { return q; }, order: function () { return q; }, limit: function () { return q; }, then: function (ok, ko) { return Promise.resolve({ data: d, error: null }).then(ok, ko); } }; return q; } };
vm.runInContext('window.BUSQUEDA_CAPAS = { principal: true, panelPersonas: true };', sb);

(async function () {
    async function quien(frase) {
        var r = await vm.runInContext('BusquedaPorCapas.buscarPersonas(' + JSON.stringify(frase) + ', { supabase: supabase, yo: usuarioActual, canal: "t", permitirApellidos: false })', sb);
        var m = r.personas && (r.personas.motor || r.personas);
        return ((m && m.personas) || []).map(function (p) { return p.id; }).sort();
    }
    es('"vendan servicios en mi ciudad": Juan y Rosa (Callao), sin Tomás que vende una laptop', await quien('búscame personas que vendan servicios en mi ciudad'), ['u-juan', 'u-rosa']);
    es('"donen en mi país": Pedro y Lucía', await quien('personas que donen en mi país'), ['u-lucia', 'u-pedro']);
    es('"ofrezca servicios en mi localidad": Juan y Rosa', await quien('busca gente que ofrezca servicios en mi localidad'), ['u-juan', 'u-rosa']);
    es('"vendan servicios y donen en mi ciudad": Juan, Pedro y Rosa', await quien('personas que vendan servicios y donen en mi ciudad'), ['u-juan', 'u-pedro', 'u-rosa']);
    es('"servicios en mi país": Juan, Ana y Rosa (Diego es de Chile)', await quien('personas que vendan servicios en mi país'), ['u-ana', 'u-juan', 'u-rosa']);
    es('"donen en Lima": Lucía', await quien('usuarios que donen en Lima'), ['u-lucia']);
    es('"quien vende laptops" sigue dando a Tomás', await quien('quien vende laptops'), ['u-tomas']);
    console.log(fallos ? ('HAY ' + fallos + ' FALLOS de ' + total + ' pruebas') : ('TODO BIEN: ' + total + ' de ' + total + ' pruebas'));
    process.exit(fallos ? 1 : 0);
})().catch(function (e) { console.log('ERROR EN LA PRUEBA:', e && e.stack || e); process.exit(1); });
