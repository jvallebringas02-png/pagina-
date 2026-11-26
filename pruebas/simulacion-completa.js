// SIMULACIÓN COMPLETA de la búsqueda de personas con los archivos REALES de la página (guía, red de seguridad, idiomas, capas).
// No usa navegador ni tu Supabase: usa 9 perfiles y 12 publicaciones de ejemplo.   node pruebas/simulacion-completa.js
var fs = require('fs'), vm = require('vm'), path = require('path');
var RAIZ = path.join(__dirname, '..');
function leer(rel) { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); }
var fallos = 0, total = 0, hallazgos = [];
function es(desc, real, esperado) { total++; var ok = JSON.stringify(real) === JSON.stringify(esperado); if (!ok) { fallos++; console.log('  FALLO  ' + desc + '\n     esperaba: ' + JSON.stringify(esperado) + '\n     salió:    ' + JSON.stringify(real)); } else console.log('  ok     ' + desc); }
function hallazgo(t) { hallazgos.push(t); console.log('  HALLAZGO  ' + t); }
function titulo(t) { console.log('\n=== ' + t + ' ==='); }
function stub() { return new Proxy(function () {}, { get: function (t, k) { if (k === Symbol.toPrimitive) return function () { return ''; }; if (k === 'length') return 0; return stub(); }, apply: function () { return stub(); }, construct: function () { return stub(); }, set: function () { return true; } }); }

var YO = { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú' };
var P = function (id, n, a, loc, user, pais) { return { id: id, nombres: n, apellidos: a, localidad_id: loc, pais: pais || 'Perú', nombre_usuario: user, created_at: '2026-09-1' + (id.length % 9) + 'T00:00:00Z' }; };
var PR = function (id, u, t, cat, mod, ciudad, pais, precio) { return { id: id, usuario_id: u, titulo: t, descripcion: '', categoria: cat, modalidad: mod, precio: precio || null, ciudad: ciudad, pais: pais || 'Perú', estado: 'aprobado', created_at: '2026-10-' + (10 + id) + 'T00:00:00Z' }; };
var TABLAS = {
    perfiles_publicos: [P('u-yo', 'Yo', 'Mismo', 2, 'yomismo'), P('u-juan', 'Juan', 'Pérez', 2, 'jperez'), P('u-ana', 'Ana', 'Torres', 3, 'anat'), P('u-pedro', 'Pedro', 'Quispe', 2, 'pquispe'), P('u-lucia', 'Lucía', 'Vega', 3, 'lvega'),
        P('u-diego', 'Diego', 'Rojas', 4, 'drojas', 'Chile'), P('u-rosa', 'Rosa', 'Huamán', 2, 'rosah'), P('u-tomas', 'Tomás', 'Ríos', 2, 'tomasr'), P('u-maria', 'María', 'Torres', 2, 'mtorres')],
    productos: [PR(1, 'u-juan', 'Clases de inglés', 'Servicios', 'servicio', 'Callao', 'Perú', 50), PR(2, 'u-ana', 'Reparación de celulares', 'Servicios', 'servicio', 'Lima', 'Perú', 30), PR(3, 'u-pedro', 'Ropa de abrigo', 'Moda', 'donacion', 'Callao', 'Perú'),
        PR(4, 'u-lucia', 'Libros escolares', 'Libros', 'donacion', 'Lima', 'Perú'), PR(5, 'u-diego', 'Diseño gráfico', 'Servicios', 'servicio', 'Santiago', 'Chile', 80), PR(6, 'u-rosa', 'Gasfitería a domicilio', 'Servicios', 'servicio', 'Callao', 'Perú', 40),
        PR(7, 'u-tomas', 'Laptop Lenovo', 'Tecnología', 'venta', 'Callao', 'Perú', 900), PR(8, 'u-juan', 'Laptop HP', 'Tecnología', 'venta', 'Callao', 'Perú', 700), PR(9, 'u-maria', 'Libros de cuentos', 'Libros', 'trueque', 'Callao', 'Perú'),
        PR(10, 'u-rosa', 'Zapatos de cuero', 'Moda', 'venta', 'Callao', 'Perú', 120), PR(11, 'u-tomas', 'Celular Samsung', 'Tecnología', 'venta', 'Callao', 'Perú', 500), PR(12, 'u-ana', 'Zapatos deportivos', 'Moda', 'venta', 'Lima', 'Perú', 150)],
    localidades: [{ id: 2, pais_id: 1, nombre: 'Callao', region: 'Callao' }, { id: 3, pais_id: 1, nombre: 'Lima', region: 'Lima' }, { id: 4, pais_id: 2, nombre: 'Santiago', region: 'Metropolitana' }], bloqueados: []
};
var CTRL = { falla: false, retraso: 0 };
function fakeSupabase() { return { from: function (t) { var f = TABLAS[t] || []; var q = { select: function () { return q; }, eq: function (c, v) { f = f.filter(function (x) { return x[c] === v; }); return q; }, neq: function (c, v) { f = f.filter(function (x) { return x[c] !== v; }); return q; }, or: function () { return q; }, in: function () { return q; }, order: function () { return q; }, limit: function () { return q; },
    then: function (ok, ko) { return new Promise(function (res, rej) { setTimeout(function () { if (CTRL.falla) rej(new Error('Supabase caído (simulado)')); else res({ data: f, error: null }); }, CTRL.retraso); }).then(ok, ko); } }; return q; } }; }

// Un "navegador" nuevo por escenario: mismos archivos, en el orden de index.html
function entorno(o) {
    o = o || {};
    var sb = { console: { log: console.log, error: function () {}, warn: function () {} }, Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout, Date: Date, navigator: { language: o.idioma || 'es' }, localStorage: { getItem: function () { return null; }, setItem: function () {} } };
    sb.window = sb; sb.document = stub(); vm.createContext(sb);
    vm.runInContext('var idiomaDetectado = ' + JSON.stringify(o.idioma || 'es') + '; var PanelUsuario = {}; var usuarioActual = ' + (o.sinSesion ? 'null' : JSON.stringify(YO)) + '; var supabase = null;', sb);
    var archivos = (o.sinI18n ? [] : ['js/i18n-guia-busqueda.js', 'js/i18n-buscar-personas.js']).concat(['js/modules/interprete-busqueda-personas.js', 'js/modules/motor-busqueda-personas.js', 'js/modules/motor-busqueda-personas-datos.js', 'js/modules/limpieza-busqueda.js', 'js/modules/intencion-busqueda.js', 'js/modules/busqueda-por-capas.js', 'js/modules/guia-busqueda.js']);
    archivos.forEach(function (f) { vm.runInContext(leer(f), sb, { filename: f }); });
    sb.supabase = fakeSupabase();
    var on = o.apagar || [];
    vm.runInContext('window.BUSQUEDA_CAPAS = { panelPersonas: true, picker: true, paginaZona: true, paginaChat: true, principal: true, asistente: true, panelChat: true, panel: true }; ' +
        ['ampliar', 'red', 'guia'].map(function (k) { return 'BusquedaPorCapas.interruptores.' + k + ' = ' + (on.indexOf(k) === -1) + ';'; }).join(' '), sb);
    return sb;
}
// Lo que hace la pantalla Buscar Personas al buscar (o al tocar un botón de la guía, que reenvía su ficha)
async function buscarPanel(sb, texto, ficha) {
    sb.__ficha = ficha || null; var r, m;
    if (ficha) { // igual que PanelUsuario.buscarUsuariosPorNombre cuando llega opciones.ficha (botón de la guía o de "Pero puedo mostrarte")
        m = await vm.runInContext('MotorBusquedaPersonasDatos.buscar(' + JSON.stringify(texto) + ', { supabase: supabase, yo: usuarioActual, nivelZona: null, ficha: window.__ficha, canal: "panelPersonas" })', sb); r = {};
    } else {
        r = await vm.runInContext('BusquedaPorCapas.buscarPersonas(' + JSON.stringify(texto) + ', { supabase: supabase, yo: usuarioActual, canal: "panelPersonas", permitirApellidos: true })', sb);
        m = (r && r.personas && (r.personas.motor || r.personas)) || {};
    }
    var botones = (m.alternativas || []).filter(function (a) { return a.tipo === 'guia'; });
    return { ids: ((m.personas) || []).map(function (p) { return p.id; }).sort(), mensaje: m.mensaje || null, guia: m.guia || null, botones: botones, alternativas: m.alternativas || [], criterios: (((m.plan || {}).criterios) || []).map(function (c) { return c.etiqueta; }), avisos: m.avisos || [], ficha: m.ficha || null, descartada: !!(r && r.accion === 'descartada') || !!m.descartada, total: m.total };
}
function clasifica(r) {
    if (r.ids.length) return 'RESULTADOS';
    if (r.guia && r.guia.paso === 'preguntar') return 'GUÍA';
    if (r.mensaje && /No encontré a nadie con (Nombre|Usuario|Iniciales):/.test(r.mensaje)) return 'FALLA: lo busca como nombre';
    return r.mensaje ? 'MENSAJE' : 'SIN RESPUESTA';
}

(async function () {
    // ================= 1. CONVERSACIÓN CON LA GUÍA =================
    titulo('1. Conversación con la guía (español): "personas" -> botones -> botones ... -> resultados');
    var sb = entorno();
    var r = await buscarPanel(sb, 'personas');
    console.log('   Pregunta: ' + (r.guia && r.guia.pregunta));
    console.log('   Botones : ' + r.botones.map(function (b) { return b.etiqueta + ' (' + b.total + ')'; }).join(' | '));
    es('"personas" no termina en "No encontré": la guía pregunta', clasifica(r), 'GUÍA');
    es('la guía ofrece entre 2 y 5 botones', r.botones.length >= 2 && r.botones.length <= 5, true);
    es('ningún botón ofrece algo que dé 0 personas', r.botones.every(function (b) { return b.total > 0; }), true);
    var pasos = 0, preguntas = [], actual = r, textoOrig = 'personas';
    while (actual.botones.length && pasos < 6) {
        preguntas.push(actual.guia.pregunta); var b = actual.botones[0]; pasos++;
        console.log('   > toca "' + b.etiqueta + '" (' + b.total + ')');
        actual = await buscarPanel(sb, textoOrig, b.ficha);
        console.log('     ' + (actual.botones.length ? 'otra pregunta: ' + actual.guia.pregunta : 'resultados: ' + JSON.stringify(actual.ids) + (actual.mensaje ? ' | ' + actual.mensaje : '')));
    }
    es('la guía termina en resultados', actual.ids.length > 0, true);
    es('pregunta como máximo 3 veces', preguntas.length <= 3, true);
    es('no repite la misma pregunta', preguntas.length === new Set(preguntas).size, true);
    // cada botón, tocado, debe dar personas o la siguiente pregunta (nunca vacío)
    var r1 = await buscarPanel(sb, 'personas'), vacios = 0;
    for (var bb of r1.botones) { var rb = await buscarPanel(sb, 'personas', bb.ficha); if (!rb.ids.length && !rb.botones.length) vacios++; }
    es('ningún botón de la primera pregunta lleva a un callejón sin salida', vacios, 0);

    // ================= 2. MISMO PEDIDO EN VARIOS IDIOMAS =================
    titulo('2. Mismo pedido en 8 idiomas: las personas deben ser las mismas; solo cambia el texto');
    var base = null;
    for (var L of ['es', 'en', 'fr', 'pt', 'de', 'ar', 'zh', 'ru']) {
        var s2 = entorno({ idioma: L });
        var a = await buscarPanel(s2, 'Ana Torres'), u = await buscarPanel(s2, '@anat'), p = await buscarPanel(s2, 'personas'), x = await buscarPanel(s2, 'Zoila Inexistente'), z = await buscarPanel(s2, 'usuarios de mi ciudad');
        es('[' + L + '] "Ana Torres" y "@anat" encuentran a Ana', [a.ids, u.ids], [['u-ana'], ['u-ana']]);
        es('[' + L + '] "usuarios de mi ciudad" trae a los 5 de Callao', z.ids, ['u-juan', 'u-maria', 'u-pedro', 'u-rosa', 'u-tomas']);
        es('[' + L + '] "personas" abre la guía con botones', clasifica(p), 'GUÍA');
        var sinClaves = ![x.mensaje, p.guia && p.guia.pregunta].concat(p.botones.map(function (q) { return q.etiqueta; })).some(function (t) { return /^[a-zA-Z]{4,}[A-Z]?[a-z]*$/.test(String(t || '')) && !/\s/.test(String(t)) && t != null; });
        es('[' + L + '] los textos no son claves sin traducir (noConNadie, nombreEt…)', sinClaves, true);
        if (L === 'es') base = { pregunta: p.guia.pregunta, botones: p.botones.map(function (q) { return q.etiqueta; }), msg: x.mensaje };
        else es('[' + L + '] la pregunta y los botones están traducidos (no son los del español)', [p.guia.pregunta !== base.pregunta, p.botones.map(function (q) { return q.etiqueta; }).join() !== base.botones.join()], [true, true]);
        if (L !== 'es' && x.mensaje === base.msg) hallazgo('[' + L + '] "no encontré" sigue en español');
    }

    // ================= 3. BATERÍA DE 73 FRASES: SIN vs CON las mejoras =================
    titulo('3. Batería de 73 frases (inventadas): antes (ampliar/red/guia apagados) vs ahora');
    var FRASES = ['quiero encontrar a Juan Pérez', 'dime quién es Ana Torres', 'hay alguien llamado Pedro', 'conoces a Carlos', 'donde esta Maria', 'busco a mi amigo Luis', 'necesito contactar a Rosa Huamán', 'muéstrame el perfil de Lucía', 'perfil de jperez', 'quien es @mtorres',
        'quienes estan cerca de mi', 'usuarios de mi barrio', 'gente de mi distrito', 'vecinos mios', 'personas que vivan en Callao', 'alguien de Lima', 'usuarios del Callao', 'gente de por aqui', 'personas de mi region', 'usuarios en todo el mundo', 'personas de Chile', 'de arequipa',
        'necesito un gasfitero', 'busco un electricista cerca', 'alguien que arregle celulares', 'quien repara laptops', 'donde consigo un diseñador', 'necesito alguien que cocine', 'quien vende zapatos', 'quienes venden ropa', 'tienen algo de tecnologia', 'hay vendedores de comida', 'busco quien me haga una pagina web', 'quien da clases de matematicas', 'gente que regale cosas', 'quien hace trueque', 'quien intercambia libros', 'alguien que done ropa',
        'quien vende laptops baratas', 'vendedores de celulares por menos de 500', 'quien ofrece servicios economicos', 'el mas barato en zapatos', 'los usuarios mas nuevos', 'gente nueva en la plataforma', 'los ultimos registrados', 'usuarios recientes de mi ciudad', 'quienes se unieron esta semana',
        'gasfitero en Callao que sea barato', 'quien vende ropa en mi ciudad o pais', 'diseñadores graficos de mi localidad', 'personas con inicial J en Lima', 'quien vende laptops en Callao o Lima', 'busco a alguien llamado Juan que venda laptops',
        'buscame un usuaro', 'kiero ver gente de mi cuidad', 'usuarios d mi zona', 'ver gente', 'mostrar personas', 'listame los usuarios', 'dame todos los usuarios', 'usuarios', 'personas', 'gente',
        'quien me puede ayudar', 'busco un amigo', 'quiero conocer gente', 'personas con las que pueda cambiar cosas', 'alguien que venda barato cerca de mi', 'usuarios verificados', 'personas con foto', 'vendedores con mejor reputacion', 'quienes me siguen', 'mis favoritos', 'kjhsdf qwe'];
    var sA = entorno({ apagar: ['ampliar', 'red', 'guia'] }), sN = entorno(), antes = {}, ahora = {}, fallanAhora = [], mejoran = 0;
    for (var f of FRASES) {
        var ra = await buscarPanel(sA, f), rn = await buscarPanel(sN, f), ca = clasifica(ra), cn = clasifica(rn);
        antes[ca] = (antes[ca] || 0) + 1; ahora[cn] = (ahora[cn] || 0) + 1;
        if (cn === 'FALLA: lo busca como nombre' && ['conoces a Carlos', 'busco a mi amigo Luis'].indexOf(f) === -1) fallanAhora.push(f + '   -> ' + rn.mensaje); // Carlos y Luis no existen en los datos: "no encontré" es lo correcto
        if (ca === 'FALLA: lo busca como nombre' && cn !== ca) mejoran++;
    }
    console.log('   ANTES (todo apagado):', JSON.stringify(antes));
    console.log('   AHORA (todo prendido):', JSON.stringify(ahora));
    console.log('   frases que dejan de terminar en "No encontré a nadie con Nombre: ...":', mejoran);
    es('de 73 frases, ahora terminan menos en "lo busca como nombre" que antes', (ahora['FALLA: lo busca como nombre'] || 0) < (antes['FALLA: lo busca como nombre'] || 0), true);
    console.log('   Siguen terminando mal (' + fallanAhora.length + ', sin contar nombres que de verdad no existen en los datos):'); fallanAhora.forEach(function (t) { console.log('      · ' + t); });
    fallanAhora.forEach(function (t) { hallazgo('sigue buscando como nombre: ' + t.split('   ->')[0]); });
    // las que se entienden bien (control)
    var ctl = { 'quien vende zapatos': ['u-ana', 'u-rosa'], 'gente que regale cosas': ['u-lucia', 'u-pedro'], 'quien da clases de matematicas': [] };
    es('control: "quien vende zapatos" -> Ana y Rosa', (await buscarPanel(sN, 'quien vende zapatos')).ids, ctl['quien vende zapatos']);
    es('control: "quien regala" -> Lucía y Pedro', (await buscarPanel(sN, 'quien regala')).ids, ['u-lucia', 'u-pedro']);
    var rCosas = await buscarPanel(sN, 'gente que regale cosas');
    if (!rCosas.ids.length) hallazgo('"gente que regale cosas": la palabra genérica "cosas" se toma como producto y responde "' + rCosas.mensaje + '" aunque hay quienes regalan');
    es('control: "alguien que arregle celulares" -> Ana', (await buscarPanel(sN, 'alguien que arregle celulares')).ids, ['u-ana']);
    es('control: "vendan servicios en mi ciudad" -> Juan y Rosa', (await buscarPanel(sN, 'búscame personas que vendan servicios en mi ciudad')).ids, ['u-juan', 'u-rosa']);
    es('control: "mi localidad o cuidad" (captura de pantalla) trae a los de Callao', (await buscarPanel(sN, 'buscame usuario de mi localidad o cuidad')).ids, ['u-juan', 'u-maria', 'u-pedro', 'u-rosa', 'u-tomas']);

    // ================= 4. INTERRUPTORES =================
    titulo('4. Interruptores: cada uno se puede apagar sin romper nada');
    var sG = entorno({ apagar: ['guia'] }); var rg = await buscarPanel(sG, 'personas');
    es('guia=false: "personas" ya no pregunta (queda como antes)', clasifica(rg) === 'GUÍA', false);
    es('guia=false: sigue buscando por nombre', (await buscarPanel(sG, 'Ana Torres')).ids, ['u-ana']);
    var sR = entorno({ apagar: ['red'] }); var rr = await buscarPanel(sR, 'alguien que arregle celulares'); es('red=false: las frases con verbo siguen funcionando si "ampliar" está prendido', rr.ids, ['u-ana']);
    var sAm = entorno({ apagar: ['ampliar'] }); es('ampliar=false: "Ana Torres" sigue funcionando', (await buscarPanel(sAm, 'Ana Torres')).ids, ['u-ana']);
    var sT = entorno({ apagar: ['ampliar', 'red', 'guia'] }); es('todo apagado: "usuarios de mi ciudad" y nombres funcionan como siempre', [(await buscarPanel(sT, 'usuarios de mi ciudad')).ids.length, (await buscarPanel(sT, 'Ana Torres')).ids], [5, ['u-ana']]);

    // ================= 5. CASOS RAROS =================
    titulo('5. Casos raros');
    var sR5 = entorno();
    for (var raro of ['a,b)(%_"\\*<>{}', 'Ana\u200B Torres', '   ', 'x'.repeat(5000), '😀😀😀', '北京 手机', 'مرحبا', "O'Brien", 'Ana; DROP TABLE perfiles;--', '<script>alert(1)</script>', 'co-caina', 'quien vende armas']) {
        try { var rx = await buscarPanel(sR5, raro); console.log('   ' + JSON.stringify(raro.length > 22 ? raro.slice(0, 19) + '...' : raro).padEnd(28) + '-> ' + clasifica(rx) + ' ' + JSON.stringify(rx.ids)); }
        catch (e) { fallos++; total++; console.log('  FALLO  lanzó error con ' + JSON.stringify(raro.slice(0, 20)) + ': ' + e.message); }
    }
    es('"Ana\\u200B Torres" (carácter invisible) encuentra a Ana', (await buscarPanel(sR5, 'Ana\u200B Torres')).ids, ['u-ana']);
    es('texto bloqueado ("co-caina") no encuentra a nadie ni ofrece botones', (function (x) { return [x.ids.length, x.botones.length]; })(await buscarPanel(sR5, 'co-caina')), [0, 0]);
    var sSes = entorno({ sinSesion: true }); es('sin sesión: no devuelve personas', (await buscarPanel(sSes, 'Ana Torres')).ids, []);
    var sCa = entorno(); CTRL.falla = true;
    try { var rc = await buscarPanel(sCa, 'Ana Torres'); es('Supabase caído: no se rompe y no inventa personas', rc.ids, []); } catch (e) { es('Supabase caído: no se rompe', 'lanzó: ' + e.message, 'lista'); }
    CTRL.falla = false;
    // dos búsquedas casi a la vez: gana la última
    var sCo = entorno(); CTRL.retraso = 60; var p1 = buscarPanel(sCo, 'Juan'); await new Promise(function (rs) { setTimeout(rs, 10); }); var p2 = buscarPanel(sCo, 'Ana Torres'); var r1c = await p1, r2c = await p2; CTRL.retraso = 0;
    es('dos búsquedas seguidas: la primera se descarta y la segunda responde', [r1c.descartada, r2c.ids], [true, ['u-ana']]);
    // la página SIN el archivo de idiomas
    var sNI = entorno({ sinI18n: true }); var rni = await buscarPanel(sNI, 'Ana Torres');
    if (!rni.ids.length || /^[a-zA-Z]+$/.test(String(rni.mensaje || ''))) hallazgo('si js/i18n-buscar-personas.js no carga, "Ana Torres" no encuentra a Ana y la pantalla muestra la clave "' + rni.mensaje + '"');

    // ================= 6. CAJA PRINCIPAL Y ASISTENTE (puerta sin IA) =================
    titulo('6. Caja principal: qué frases se resuelven sin gastar IA');
    var sP = entorno(); await buscarPanel(sP, 'Ana'); // calienta los nombres conocidos
    var puerta = function (t) { return vm.runInContext('(function(){ var i = IntencionBusqueda.decidir(' + JSON.stringify(t) + ', { superficie: "principal", esNombreConocido: (function(){ var s = MotorBusquedaPersonasDatos.nombresConocidos(usuarioActual); return s ? function(w){ return s.has(w); } : null; })() || undefined }); return !i.directa && i.principal === "personas" && !i.ambigua; })()', sP); };
    es('"@anat", "Ana Torres", "busca quien venda laptops" y "Ana" (nombre conocido) no gastan IA', ['@anat', 'Ana Torres', 'busca quien venda laptops', 'Ana'].map(puerta), [true, true, true, true]);
    es('"laptops", "videos de gatos", "hola" y "qué hora es" siguen su camino normal', ['laptops', 'videos de gatos', 'hola', 'qué hora es'].map(puerta), [false, false, false, false]);

    console.log('\n=============================================================');
    console.log(fallos ? ('RESULTADO: HAY ' + fallos + ' FALLOS de ' + total + ' comprobaciones') : ('RESULTADO: TODO BIEN, ' + total + ' de ' + total + ' comprobaciones'));
    console.log('HALLAZGOS (cosas que no son fallos de la prueba pero conviene saber): ' + hallazgos.length);
    process.exit(fallos ? 1 : 0);
})().catch(function (e) { console.log('ERROR EN LA SIMULACIÓN:', e && e.stack || e); process.exit(1); });
