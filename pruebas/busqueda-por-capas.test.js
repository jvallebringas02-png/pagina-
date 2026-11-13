// Pruebas de la entrada única, con un Supabase de mentira.  node pruebas/busqueda-por-capas.test.js
var B = require('../js/modules/busqueda-por-capas.js');
var D = require('../js/modules/motor-busqueda-personas-datos.js');
var M = require('../js/modules/motor-busqueda-personas.js');
var I = require('../js/modules/interprete-busqueda-personas.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) { total++; if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); } }

var YO = { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú' };
function prod(id, usuario, titulo, cat, precio) { return { id: id, usuario_id: usuario, titulo: titulo, descripcion: '', categoria: cat, modalidad: 'venta', precio: precio, ciudad: 'Callao', pais: 'Perú', estado: 'aprobado', created_at: '2026-10-01T00:00:00Z' }; }
var TABLAS = {
    perfiles_publicos: [
        { id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 2, pais: 'Perú', nombre_usuario: 'yomismo', created_at: '2026-08-01T00:00:00Z' },
        { id: 'u-juan', nombres: 'Juan', apellidos: 'Pérez', localidad_id: 2, pais: 'Perú', nombre_usuario: 'jperez', created_at: '2026-09-10T00:00:00Z' },
        { id: 'u-ana', nombres: 'Ana', apellidos: 'Cruz', localidad_id: 2, pais: 'Perú', nombre_usuario: 'ana_c', created_at: '2026-09-12T00:00:00Z' },
        { id: 'u-carlos', nombres: 'Carlos', apellidos: 'Armas', localidad_id: 2, pais: 'Perú', nombre_usuario: 'carlosa', created_at: '2026-09-13T00:00:00Z' }
    ],
    productos: [prod(1, 'u-juan', 'Laptop Lenovo', 'Tecnología', 900), prod(2, 'u-ana', 'Ropa de bebé', 'Ropa', 40)],
    localidades: [{ id: 2, pais_id: 1, nombre: 'Callao', region: 'Callao' }],
    bloqueados: []
};
var lecturas;
function fake(opts) {
    opts = opts || {};
    return {
        from: function (t) {
            lecturas.push(t);
            var filas = TABLAS[t] || [];
            var q = { select: function () { return q; }, eq: function (c, v) { filas = filas.filter(function (f) { return f[c] === v; }); return q; }, order: function () { return q; }, limit: function () { return q; },
                then: function (ok, ko) {
                    if (opts.revienta) throw new Error('Supabase caído');
                    var d = opts.demora ? new Promise(function (r) { setTimeout(function () { r({ data: filas, error: null }); }, opts.demora); }) : Promise.resolve({ data: filas, error: null });
                    return d.then(ok, ko);
                } };
            return q;
        }
    };
}
function ctx(extra) { var c = { yo: YO, supabase: fake(), forzar: true, Datos: D, Motor: M, Interprete: I, canal: 'prueba' }; Object.keys(extra || {}).forEach(function (k) { c[k] = extra[k]; }); return c; }
function ids(r) { return r.personas ? r.personas.lista.map(function (p) { return p.id; }) : null; }

(async function () {
    // --- La respuesta siempre tiene la misma forma ---
    var FORMA = ['accion', 'directa', 'error', 'intencion', 'personas', 'respaldo', 'texto', 'version'];
    lecturas = []; D.invalidarCache();
    var r = await B.procesar('@jperez', ctx());
    es('forma de la respuesta (personas)', Object.keys(r).sort(), FORMA);
    es('forma de la respuesta (directa)', Object.keys(await B.procesar('qué hora es', ctx())).sort(), FORMA);
    es('forma de la respuesta (ia)', Object.keys(await B.procesar('videos de gatos', ctx())).sort(), FORMA);

    // --- Personas por las distintas puertas ---
    es('@usuario', [r.accion, ids(r)], ['personas', ['u-juan']]);
    r = await B.procesar('busca quien venda laptops', ctx());
    es('quien vende laptops', [r.accion, ids(r)], ['personas', ['u-juan']]);
    es('trae la ficha que se entendió', r.personas.ficha && r.personas.ficha.oferta, 'laptops');
    es('nombre_completo para dibujar', r.personas.lista[0].nombre_completo, 'Juan Pérez');
    r = await B.procesar('Juan Pérez', ctx());
    es('nombre y apellido', [r.accion, ids(r)], ['personas', ['u-juan']]);
    r = await B.buscarPersonas('J P', ctx());
    es('Buscar Personas: iniciales', ids(r), ['u-juan']);
    r = await B.buscarPersonas('hola', ctx());
    es('Buscar Personas: siempre busca en personas aunque no haya señal', [r.accion, r.personas !== null], ['personas', true]);

    // --- Mismo resultado en las tres pantallas para la misma frase ---
    var a = ids(await B.procesar('busca quien venda laptops', ctx({ superficie: 'principal' })));
    var b = ids(await B.procesar('busca quien venda laptops', ctx({ superficie: 'asistente' })));
    var c = ids(await B.buscarPersonas('busca quien venda laptops', ctx()));
    es('buscador = asistente = Buscar Personas', [a, b, c], [['u-juan'], ['u-juan'], ['u-juan']]);

    // --- Ambigua: productos primero y personas como segunda pantalla ---
    r = await B.procesar('laptops', ctx());
    es('laptops: productos + ambigua', [r.accion, r.intencion.ambigua, r.intencion.secundaria], ['productos', true, 'personas']);
    es('laptops: trae también a quien lo vende', ids(r), ['u-juan']);
    r = await B.procesar('bicicletas', ctx());
    es('ambigua sin vendedores: personas vacía, no null', [r.accion, ids(r)], ['productos', []]);

    // --- Lo que no es de personas no toca la base ---
    lecturas = []; D.invalidarCache();
    r = await B.procesar('videos de gatos', ctx());
    es('ia: sin lecturas a la base', [r.accion, r.personas, lecturas.length], ['ia', null, 0]);
    r = await B.procesar('laptops baratas', ctx());
    es('productos claros: sin lecturas a la base', [r.accion, r.personas, lecturas.length], ['productos', null, 0]);
    r = await B.procesar('qué hora es', ctx());
    es('directa hora', [r.accion, r.directa, r.personas, lecturas.length], ['directa', 'hora', null, 0]);
    r = await B.procesar('quiero hacer un reclamo', ctx());
    es('directa reclamo', [r.accion, r.directa], ['directa', 'reclamo']);
    r = await B.procesar('   ', ctx());
    es('texto vacío', [r.accion, r.personas, lecturas.length], ['vacia', null, 0]);

    // --- Limpieza: nada rompe, el original queda para mostrar ---
    r = await B.procesar('Juan, Pérez (x)', ctx());
    es('comas y paréntesis no rompen', [r.respaldo, r.error], [false, null]);
    es('original intacto', r.texto.original, 'Juan, Pérez (x)');
    es('limpio sin símbolos', r.texto.limpio, 'Juan Pérez x');
    r = await B.procesar('x),nombres.ilike.%a%,(y', ctx());
    es('intento de inyección: sin error', [r.respaldo, r.error], [false, null]);

    // --- Lista de riesgo con trucos de escritura ---
    r = await B.buscarPersonas('co-caina', ctx());
    es('co-caina se bloquea', [ids(r), r.personas.ficha.bloqueada, r.intencion.riesgoPorLimpieza], [[], true, true]);
    r = await B.buscarPersonas('cocaína', ctx());
    es('cocaína se bloquea (como ya hacía el motor)', r.personas.ficha.bloqueada, true);
    r = await B.buscarPersonas('Juan Pérez', ctx());
    es('un nombre normal no se bloquea', r.personas.ficha.bloqueada, false);
    r = await B.buscarPersonas('Carlos Armas', ctx());
    es('Carlos Armas: bloqueado por defecto', [ids(r), r.personas.ficha.bloqueada], [[], true]);
    r = await B.buscarPersonas('Carlos Armas', ctx({ permitirApellidos: true }));
    es('Carlos Armas: con permitirApellidos (Buscar Personas) es una persona', [ids(r), r.personas.ficha.bloqueada], [['u-carlos'], false]);
    r = await B.buscarPersonas('quiero comprar armas', ctx({ permitirApellidos: true }));
    es('permitirApellidos no deja buscar armas', r.personas.ficha.bloqueada, true);
    r = await B.procesar('Carlos Armas', ctx({ permitirApellidos: 'si' }));
    es('permitirApellidos solo vale con true', r.personas.ficha.bloqueada, true);

    // --- Iniciales (hallazgo 1 de la bitácora) ---
    r = await B.buscarPersonas('usuarios de Callao con inicial J', ctx());
    es('inicial J en Callao: filtra por la letra', [ids(r), r.personas.ficha.iniciales, r.personas.ficha.nombre], [['u-juan'], ['j'], null]);
    r = await B.buscarPersonas('usuarios con inicial J', ctx());
    es('inicial J sola: pide una segunda pista, no busca un nombre inexistente', [ids(r), r.personas.ficha.nombre, /sola letra/.test(r.personas.mensaje)], [[], null, true]);

    // --- Sin sesión ---
    r = await B.buscarPersonas('Juan', ctx({ yo: null }));
    es('sin sesión', [r.personas.requiere, ids(r)], ['sesion', []]);

    // --- Fallos y respaldo ---
    r = await B.procesar('@jperez', ctx({ supabase: fake({ revienta: true }) }));
    es('si la base no responde: el motor avisa, no hay excepción', [r.respaldo, ids(r), r.personas.avisos.length > 0], [false, [], true]);
    r = await B.procesar('@jperez', ctx({ Datos: { buscar: function () { throw new Error('motor roto'); } } }));
    es('si el motor lanza un error: respaldo', [r.respaldo, r.error], [true, 'motor roto']);
    r = await B.procesar('@jperez', ctx({ Datos: { buscar: function () { return Promise.reject(new Error('rechazado')); } } }));
    es('si el motor rechaza la promesa: respaldo', [r.respaldo, r.error], [true, 'rechazado']);
    r = await B.procesar('@jperez', ctx({ Datos: null, Interprete: null }));
    es('si falta el motor de personas y no hay global: usa el del proyecto', r.respaldo, false);

    // --- Interruptores ---
    B.interruptores.entrada = false;
    lecturas = []; D.invalidarCache();
    r = await B.procesar('@jperez', ctx());
    es('entrada apagada: respaldo y sin lecturas', [r.respaldo, r.error, lecturas.length], [true, 'entrada apagada', 0]);
    B.interruptores.entrada = true;
    B.interruptores.intencion = false;
    r = await B.procesar('qué hora es', ctx());
    es('intención apagada: no decide, va a la IA', [r.accion, r.directa, r.respaldo], ['ia', null, false]);
    r = await B.procesar('hola', ctx({ superficie: 'personas' }));
    es('intención apagada: en pantalla de personas sigue buscando', r.accion, 'personas');
    B.interruptores.intencion = true;
    B.interruptores.limpieza = false;
    r = await B.procesar('Juan,  Pérez', ctx());
    es('limpieza apagada: el texto solo se recorta', r.texto.limpio, 'Juan,  Pérez');
    B.interruptores.limpieza = true;
    r = await B.procesar('Juan,  Pérez', ctx());
    es('interruptores de vuelta: limpia otra vez', r.texto.limpio, 'Juan Pérez');

    // --- Respuestas tardías: la más nueva gana ---
    D.invalidarCache();
    var lenta = B.procesar('Juan', ctx({ supabase: fake({ demora: 30 }), forzar: true, canal: 'tardias' }));
    var rapida = B.procesar('Ana', ctx({ supabase: fake(), forzar: true, canal: 'tardias' }));
    var rr = await Promise.all([lenta, rapida]);
    es('la vieja se descarta', [rr[0].accion, rr[1].accion], ['descartada', 'personas']);
    es('la nueva trae a Ana', ids(rr[1]), ['u-ana']);

    console.log(fallos ? ('HAY ' + fallos + ' FALLOS de ' + total + ' pruebas') : ('TODO BIEN: ' + total + ' de ' + total + ' pruebas'));
    process.exit(fallos ? 1 : 0);
})();
