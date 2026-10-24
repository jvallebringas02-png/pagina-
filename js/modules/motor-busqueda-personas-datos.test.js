// Pruebas de la capa de datos con un Supabase de mentira.  node pruebas/motor-busqueda-personas-datos.test.js
var I = require('../js/modules/interprete-busqueda-personas.js');
var M = require('../js/modules/motor-busqueda-personas.js');
var D = require('../js/modules/motor-busqueda-personas-datos.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) { total++; if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); } }

var YO = { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú' };
var TABLAS = {
    perfiles_publicos: [
        { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú', nombre_usuario: 'yomismo', created_at: '2026-08-01T00:00:00Z' },
        { id: 'u-juan', nombres: 'Juan', apellidos: 'Pérez', localidad_id: 2, pais: 'Perú', nombre_usuario: 'jperez', created_at: '2026-09-10T00:00:00Z' },
        { id: 'u-ana', nombres: 'Ana', apellidos: 'Cruz', localidad_id: null, pais: null, nombre_usuario: 'anac', created_at: '2026-09-12T00:00:00Z' },
        { id: 'u-bloq', nombres: 'Juana', apellidos: 'Bloqueada', localidad_id: 2, pais: 'Perú', nombre_usuario: 'jb', created_at: '2026-09-13T00:00:00Z' }
    ],
    productos: [
        { id: 1, usuario_id: 'u-juan', titulo: 'Piano vertical', descripcion: '', categoria: 'Otros', modalidad: 'venta', precio: 900, ciudad: 'Callao', pais: 'Perú', estado: 'aprobado', nivel_alerta_legal: 'bajo', nivel_alerta_ocr: null, created_at: '2026-10-01T00:00:00Z' },
        { id: 2, usuario_id: 'u-bloq', titulo: 'Piano de cola', descripcion: '', categoria: 'Otros', modalidad: 'venta', precio: 5000, ciudad: 'Callao', pais: 'Perú', estado: 'aprobado', nivel_alerta_legal: null, nivel_alerta_ocr: null, created_at: '2026-10-02T00:00:00Z' }
    ],
    localidades: [{ id: 2, pais_id: 1, nombre: 'Callao', region: 'Callao' }],
    bloqueados: [{ bloqueador_id: 'u-yo', bloqueado_id: 'u-bloq' }]
};
var lecturas;
function fake(opts) {
    opts = opts || {};
    return {
        from: function (t) {
            lecturas.push(t);
            var filas = TABLAS[t] || [];
            var q = { select: function () { return q; }, eq: function (c, v) { filas = filas.filter(function (f) { return f[c] === v; }); return q; }, order: function () { return q; },
                limit: function () { return q; },
                then: function (ok, ko) {
                    if (opts.falla === t) return Promise.resolve({ data: null, error: { message: 'x' } }).then(ok, ko);
                    var d = opts.demora && opts.demora[t] ? new Promise(function (r) { setTimeout(function () { r({ data: filas, error: null }); }, opts.demora[t]); }) : Promise.resolve({ data: filas, error: null });
                    return d.then(ok, ko);
                } };
            return q;
        },
        rpc: opts.sinRpc ? undefined : function (n) { return Promise.resolve(opts.rpcError ? { data: null, error: { message: 'no existe' } } : { data: ['u-ana'], error: null }); }
    };
}
function ids(r) { return (r.personas || []).map(function (p) { return p.id; }); }

(async function () {
    var base = { yo: YO, Motor: M, Interprete: I };
    lecturas = []; D.invalidarCache();
    var r = await D.buscar('quien vende piano', Object.assign({ supabase: fake({ sinRpc: true }) }, base));
    es('encuentra a quien vende piano', ids(r), ['u-juan']);
    es('no trae al bloqueado ni a mí', ids(r).indexOf('u-bloq') === -1 && ids(r).indexOf('u-yo') === -1, true);
    es('lee 4 tablas', lecturas.length, 4);

    var n = lecturas.length;
    r = await D.buscar('piano', Object.assign({ supabase: fake({ sinRpc: true }) }, base));
    es('segunda búsqueda usa caché', lecturas.length, n);
    es('marca deCache', r.deCache, true);

    r = await D.buscar('juan', Object.assign({ supabase: fake({ sinRpc: true }), forzar: true }, base));
    es('forzar relee', lecturas.length, n + 4);

    // personas_ocultas oculta a quien me bloqueó
    D.invalidarCache();
    r = await D.buscar('ana', Object.assign({ supabase: fake() }, base));
    es('personas_ocultas oculta a Ana', ids(r), []);
    D.invalidarCache();
    r = await D.buscar('ana', Object.assign({ supabase: fake({ rpcError: true }) }, base));
    es('si la función falla, sigue sin ella', ids(r), ['u-ana']);

    // sin sesión
    r = await D.buscar('juan', { supabase: fake(), yo: null, Motor: M });
    es('sin sesión pide iniciar', r.requiere, 'sesion');

    // fallo parcial: productos cae, no se cachea y se avisa
    D.invalidarCache(); lecturas = [];
    r = await D.buscar('quien vende piano', Object.assign({ supabase: fake({ falla: 'productos', sinRpc: true }) }, base));
    es('fallo de productos: sin personas', ids(r), []);
    es('fallo avisado', (r.avisos || []).some(function (a) { return /productos/.test(a); }), true);
    n = lecturas.length;
    await D.buscar('piano', Object.assign({ supabase: fake({ sinRpc: true }) }, base));
    es('con fallo no se cachea', lecturas.length, n + 4);

    // respuesta tardía descartada
    D.invalidarCache();
    var lenta = D.buscar('juan', Object.assign({ supabase: fake({ sinRpc: true, demora: { perfiles_publicos: 40 } }), canal: 'x' }, base));
    D.invalidarCache();
    var rapida = D.buscar('ana', Object.assign({ supabase: fake({ sinRpc: true }), canal: 'x' }, base));
    var a = await lenta, b = await rapida;
    es('la tardía se descarta', a.descartada, true);
    es('la última sí responde', ids(b), ['u-ana']);

    // canales distintos no se pisan
    D.invalidarCache();
    var c1 = D.buscar('juan', Object.assign({ supabase: fake({ sinRpc: true, demora: { perfiles_publicos: 20 } }), canal: 'a' }, base));
    var c2 = D.buscar('ana', Object.assign({ supabase: fake({ sinRpc: true }), canal: 'b' }, base));
    es('canales independientes', [ids(await c1), ids(await c2)], [['u-juan'], ['u-ana']]);

    // zona local desde el botón
    D.invalidarCache();
    r = await D.buscar('', Object.assign({ supabase: fake({ sinRpc: true }), nivelZona: 'local' }, base));
    es('solo botón local: gente de mi ciudad', ids(r), ['u-juan']);

    // nunca correo
    es('sin correo en el resultado', JSON.stringify(r).indexOf('correo') === -1, true);

    console.log(fallos ? 'HAY FALLOS: ' + fallos + ' de ' + total : 'TODO BIEN: ' + total + ' de ' + total + ' pruebas');
    process.exit(fallos ? 1 : 0);
})();
