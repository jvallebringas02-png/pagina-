// Pruebas de la guía de la búsqueda de personas (BITACORA-BUSQUEDA-POR-CAPAS-5.md). Se ejecutan con:  node pruebas/guia-busqueda.test.js
// Tres partes: (1) intérprete con ampliar/red, (2) guía pura, (3) motor + guía con datos de ejemplo (los mismos del motor). No usa red ni IA.
var I = require('../js/modules/interprete-busqueda-personas.js');
var M = require('../js/modules/motor-busqueda-personas.js');
var G = require('../js/modules/guia-busqueda.js');
var TEXTOS = require('../js/i18n-guia-busqueda.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) {
    total++;
    if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); }
}
function si(desc, cond) { es(desc, !!cond, true); }

var YO = 'u-yo';
function persona(id, nombres, apellidos, extra) {
    var p = { id: id, nombres: nombres, apellidos: apellidos, localidad_id: null, categoria: 'General', pais: null, nombre_usuario: null, created_at: '2026-09-01T10:00:00Z', foto_perfil: null };
    for (var k in extra) p[k] = extra[k];
    return p;
}
var perfiles = [
    persona(YO, 'Yo', 'Mismo', { nombre_usuario: 'yomismo', created_at: '2026-08-01T00:00:00Z' }),
    persona('u-juan', 'Juan', 'Pérez', { nombre_usuario: 'jperez', created_at: '2026-09-10T00:00:00Z' }),
    persona('u-ana', 'Ana', 'de la Cruz', { nombre_usuario: 'anacruz', created_at: '2026-09-12T00:00:00Z', localidad_id: 2, pais: 'Perú' }),
    persona('u-luis', 'Luis', 'Regalado', { nombre_usuario: 'luisr', created_at: '2026-09-20T00:00:00Z' }),
    persona('u-maria', 'María', 'Muñoz', { nombre_usuario: 'mmunoz', created_at: '2026-09-25T00:00:00Z', localidad_id: 2, pais: 'Perú' }),
    persona('u-carlos', 'Carlos', 'Armas', { nombre_usuario: 'carmas', created_at: '2026-10-01T00:00:00Z' }),
    persona('u-sofia', 'Sofía', 'Quispe', { nombre_usuario: 'sofiaq', created_at: '2026-10-05T00:00:00Z' }),
    persona('u-pedro', 'Pedro', 'Vargas', { nombre_usuario: 'pvargas', created_at: '2026-10-08T00:00:00Z' }),
    persona('u-rosa', 'Rosa', 'Mas', { nombre_usuario: 'rosam', created_at: '2026-10-10T00:00:00Z' })
];
var localidades = [
    { id: 1, pais_id: 13, nombre: 'Sofia', region: 'Sofia-City' }, { id: 2, pais_id: 1, nombre: 'Callao', region: 'Callao' },
    { id: 3, pais_id: 1, nombre: 'Lima', region: 'Lima' }, { id: 4, pais_id: 1, nombre: 'Trujillo', region: 'La Libertad' },
    { id: 5, pais_id: 1, nombre: 'Arequipa', region: 'Arequipa' }, { id: 6, pais_id: 2, nombre: 'Sofia', region: 'Sofia-City' },
    { id: 7, pais_id: 2, nombre: 'Plovdiv', region: 'Plovdiv' }
];
var n = 0;
function prod(usuario, titulo, ciudad, extra) {
    n++;
    var p = { id: 'p' + n, usuario_id: usuario, titulo: titulo, descripcion: '', categoria: 'Otros', modalidad: 'venta', precio: 100, moneda: 'PEN',
        ciudad: ciudad, pais: 'Perú', alcance: 'local', estado: 'aprobado', nivel_alerta_ocr: null, nivel_alerta_legal: null };
    for (var k in extra) p[k] = extra[k];
    return p;
}
var productos = [
    prod('u-juan', 'Polo de algodón', 'Lima', { categoria: 'Ropa', precio: 40 }),
    prod('u-juan', 'Piano Yamaha vertical', 'Lima', { categoria: 'Otros', precio: 2500, descripcion: 'Piano en buen estado, afinado' }),
    prod('u-ana', 'Casaca de cuero', 'callao', { categoria: 'Ropa', precio: 120 }),
    prod('u-ana', 'Laptop Lenovo', 'Callao', { categoria: 'Tecnología', precio: 1800 }),
    prod('u-luis', 'Mesa de comedor', 'San Jeronimo', { categoria: 'Hogar', precio: 300 }),
    prod('u-luis', 'Sillas de madera', 'San Jeronimo', { categoria: 'Hogar', precio: 80 }),
    prod('u-maria', 'Vestido de fiesta', 'Pacora', { categoria: 'Ropa', precio: 90 }),
    prod('u-carlos', 'Zapatillas Nike', 'Trujillo', { categoria: 'Ropa', precio: 150 }),
    prod('u-sofia', 'Curso de inglés online', '🌍 Global', { categoria: 'Otros', pais: 'Mundo', alcance: 'mundial', precio: 50 }),
    prod('u-pedro', 'Ropa para niños', 'Lima', { categoria: 'Ropa', precio: 25, descripcion: 'Ropa de segunda mano en buen estado' }),
    prod('u-pedro', 'Polera', 'Lima', { categoria: 'Ropa', precio: 35, estado: 'borrador' }),
    prod('u-rosa', 'Bicicleta montañera', 'Urpipata', { categoria: 'Deportes', precio: 600 }),
    prod('u-rosa', 'Celular Samsung', 'Lima', { categoria: 'Tecnología', precio: 700, nivel_alerta_ocr: 'medio' }),
    prod('u-sofia', 'Lámpara', 'null', { categoria: 'Hogar', precio: 30, nivel_alerta_legal: 'bajo' }),
    prod('u-juan', 'Teclado Casio usado', 'Lima', { categoria: 'Otros', precio: 400, descripcion: 'Teclado usado, funciona perfecto' })
];
function datosBase(extraProd, extraYo) {
    var yo = persona(YO, 'Yo', 'Mismo', extraYo || {});
    return { yo: yo, perfiles: perfiles, productos: productos.concat(extraProd || []), localidades: localidades, bloqueados: [], bloqueadores: [] };
}

var YO_CALLAO = { localidad_id: 2, pais: 'Perú' };
function buscar(t, ctx, extraYo) {
    var c = ctx || {}; c.Interprete = I;
    return M.buscar(t, datosBase(null, extraYo), c);
}
function ids(r) { return r.personas.map(function (p) { return p.id; }).sort(); }

// ===== 1) INTÉRPRETE: apagado no cambia nada; ampliar y red =====
var NOMBRES = {}; ['mario', 'juan', 'ana', 'torres', 'carlos', 'lucia', 'perez', 'dan', 'smith', 'rosa', 'cortez', 'maria', 'munoz'].forEach(function (w) { NOMBRES[w] = true; });
var CTX = { ampliar: true, red: true, esNombreConocido: function (w) { return NOMBRES[w] === true; } };
function f(t, c) { return I.interpretar(t, c || CTX); }
function resumen(x) {
    var p = { nombre: x.nombre, zona: x.zona, lugar: x.lugar, oferta: x.oferta, hace: x.hace.join('+'), orden: x.orden, sin: x.sin_entender, noExiste: x.no_disponible };
    return x.intencion + Object.keys(p).filter(function (k) { return p[k]; }).map(function (k) { return ' ' + k + '=' + p[k]; }).join('');
}

es('apagado: "cerca donde vivo" se queda como antes (todo es nombre)', I.interpretar('busca a Mario cerca donde vivo').nombre, 'Mario cerca donde vivo');
es('apagado: la ficha trae los campos nuevos vacíos', [I.interpretar('Juan').sin_entender, I.interpretar('Juan').no_disponible, I.interpretar('Juan').guia_n], [null, null, 0]);
es('zona: "cerca donde vivo"', resumen(f('busca a Mario cerca donde vivo')), 'nombre nombre=Mario zona=local');
es('zona: "que viva cerca"', resumen(f('mario que viva cerca')), 'nombre nombre=mario zona=local');
es('zona: "de mi barrio"', resumen(f('Mario de mi barrio')), 'nombre nombre=Mario zona=local');
es('zona: "usuarios en mi barrio"', resumen(f('usuarios en mi barrio')), 'filtro zona=local');
es('zona: "vecinos" (plural)', resumen(f('vecinos')), 'filtro zona=local');
es('zona: "mi vecino juan" sigue siendo el nombre juan', resumen(f('mi vecino juan')), 'nombre nombre=juan');
es('zona: "cerca de mi" sigue igual', resumen(f('Mario cerca de mi')), 'nombre nombre=Mario zona=local');
es('relleno: "dime quién es Ana Torres"', f('dime quién es Ana Torres').nombre, 'Ana Torres');
es('relleno: "conoces a Carlos"', f('conoces a Carlos').nombre, 'Carlos');
es('relleno: "muéstrame el perfil de Lucía"', f('muéstrame el perfil de Lucía').nombre, 'Lucía');
es('relleno: "listame los usuarios" no es un nombre', resumen(f('listame los usuarios')), 'vacia');
es('relleno: "kiero ver gente" no es un nombre', resumen(f('kiero ver gente')), 'vacia');
es('oficio: "alguien que arregle celulares"', resumen(f('alguien que arregle celulares')), 'filtro oferta=celulares hace=servicios');
es('oficio: "quien repara laptops"', resumen(f('quien repara laptops')), 'filtro oferta=laptops hace=servicios');
es('oficio: "necesito alguien que cocine"', resumen(f('necesito alguien que cocine')), 'filtro oferta=cocina hace=servicios');
es('oficio: "alguien que arregle cosas" (sin decir qué)', resumen(f('alguien que arregle cosas')), 'filtro hace=servicios');
es('orden: "los más nuevos"', resumen(f('los más nuevos')), 'nuevos orden=recientes');
es('orden: "los últimos registrados"', f('los últimos registrados').intencion, 'nuevos');
es('orden: "se unieron esta semana"', f('se unieron esta semana').intencion, 'nuevos');
es('orden: "los más nuevos en Callao" mezcla orden y lugar', resumen(f('los más nuevos en Callao')), 'filtro lugar=Callao orden=recientes');
es('no existe: "verificados"', resumen(f('verificados')), 'vacia noExiste=verificados');
es('no existe: "con foto"', f('con foto').no_disponible, 'con foto');
es('no existe: "mejor reputación"', f('mejor reputación').no_disponible, 'mejor reputacion');
es('no existe: "mis favoritos"', f('mis favoritos').no_disponible, 'mis favoritos');
es('red: "o cuidad" (tu captura) no se busca como nombre', resumen(f('o cuidad')), 'vacia sin=o cuidad');
es('red: un nombre que ningún perfil tiene, con mayúscula, se sigue buscando', f('Pedro Gonzales').nombre, 'Pedro Gonzales');
es('red: 2 palabras en minúscula que no están en los perfiles se siguen buscando', f('pedro gonzales').nombre, 'pedro gonzales');
es('red: 3 palabras en minúscula sin ningún nombre real es una frase', resumen(f('xyz abc def')), 'vacia sin=xyz abc def');
es('red: 3 palabras en minúscula con un nombre real sí es un nombre', f('juan carlos perez').nombre, 'juan carlos perez');
es('red: "Dan Smith" no pierde palabras', f('Dan Smith').nombre, 'Dan Smith');
es('red: "Rosa Cortez" no se confunde con un verbo', f('Rosa Cortez').nombre, 'Rosa Cortez');
es('red: nombre + producto', resumen(f('Juan laptops')), 'nombre nombre=Juan oferta=laptops');
es('red sola (sin ampliar): separa nombre y lo que sobra', resumen(f('Mario cerca donde vivo', { red: true, esNombreConocido: CTX.esNombreConocido })), 'nombre nombre=Mario sin=cerca donde vivo');
es('riesgo: sigue bloqueando con todo encendido', f('quien vende drogas').bloqueada, true);
es('sanear: guia_n se conserva entre 0 y 3', [I.sanear({ nombre: 'Ana', guia_n: 2 }).guia_n, I.sanear({ nombre: 'Ana', guia_n: 99 }).guia_n, I.sanear({ nombre: 'Ana', guia_n: -4 }).guia_n, I.sanear({ nombre: 'Ana', guia_n: 'x' }).guia_n], [2, 3, 0, 0]);

// ===== 2) TEXTOS: todos los idiomas tienen las mismas frases =====
var claves = Object.keys(TEXTOS.es);
Object.keys(TEXTOS).forEach(function (l) {
    es('textos ' + l + ': tiene las ' + claves.length + ' frases', claves.filter(function (k) { return !TEXTOS[l][k]; }), []);
    es('textos ' + l + ': mismos {x} e {y} que el español', claves.filter(function (k) {
        var a = (TEXTOS.es[k].match(/\{[xy]\}/g) || []).sort().join(), b = (TEXTOS[l][k].match(/\{[xy]\}/g) || []).sort().join(); return a !== b;
    }), []);
});
es('textos: 15 idiomas (quechua y aimara usan el español)', Object.keys(TEXTOS).length, 15);
es('t(): inglés', G.t('qZona', { idioma: 'en' }), 'Where do you want to search?');
es('t(): quechua cae al español', G.t('qZona', { idioma: 'qu' }), '¿Dónde quieres buscar?');
es('t(): idioma desconocido cae al español', G.t('qZona', { idioma: 'xx' }), '¿Dónde quieres buscar?');
es('t(): reemplaza {x} sin interpretar "$&"', G.t('noEntendi', { idioma: 'es' }, { x: '$&' }), 'No logré entender «$&».');

// ===== 3) GUÍA PURA (con un contador de mentira) =====
function res(ficha, total, extra) { var r = { ficha: ficha, plan: { tipo: 'busqueda' }, total: total, requiere: null }; for (var k in extra) r[k] = extra[k]; return r; }
function fi(texto, c) { return I.interpretar(texto, c || CTX); }
var siempre = function () { return 3; }, nunca = function () { return 0; };
var g1 = G.decidir(res(fi('kiero ver gente'), 0), { contar: siempre });
es('guía: frase vacía pregunta cómo ver (4 botones)', [g1.paso, g1.botones.map(function (b) { return b.id; })], ['preguntar', ['nuevos', 'venden', 'servicios', 'local']]);
es('guía: cada botón sube guia_n a 1', g1.botones.map(function (b) { return b.ficha.guia_n; }), [1, 1, 1, 1]);
es('guía: el mensaje tiene la pregunta', g1.mensaje.indexOf('¿Cómo quieres ver a las personas?') !== -1, true);
es('guía: los botones solo ofrecen lo que tiene datos', G.decidir(res(fi('kiero ver gente'), 0), { contar: function (f) { return f.orden === 'recientes' ? 5 : 0; } }).botones.map(function (b) { return b.id + ':' + b.total; }), ['nuevos:5']);
var gSin = G.decidir(res(fi('kiero ver gente'), 0), { contar: nunca });
es('guía: sin datos para ofrecer, avisa y no pregunta', [gSin.paso, gSin.botones.length, gSin.aviso], ['avisar', 0, 'Todavía no hay personas para mostrarte con eso.']);
var g2 = G.decidir(res(fi('o cuidad'), 0), { contar: siempre });
es('guía: "o cuidad" dice que no entendió y pregunta', [g2.paso, g2.entendi, g2.botones.map(function (b) { return b.id; })], ['preguntar', 'No logré entender «o cuidad».', ['nuevos', 'venden', 'servicios', 'local', 'comoNombre']]);
es('guía: el botón "como nombre" trae el texto como nombre', g2.botones[4].ficha.nombre, 'o cuidad');
var g3 = G.decidir(res(fi('verificados'), 0), { contar: siempre });
es('guía: "verificados" avisa que no existe y ofrece otra cosa', [g3.paso, g3.entendi], ['preguntar', 'Esa opción («verificados») todavía no existe en la página.']);
var g4 = G.decidir(res(fi('Zorro Mario cerca donde vivo', { red: true, esNombreConocido: CTX.esNombreConocido }), 0), { contar: siempre });
es('guía: nombre + algo sin entender y sin zona pregunta la zona', [g4.paso, g4.pregunta, g4.botones.map(function (b) { return b.ficha.zona; })], ['preguntar', '¿Dónde quieres buscar?', ['local', 'regional', 'pais', 'mundial']]);
es('guía: la zona conserva el nombre buscado', g4.botones[0].ficha.nombre, 'Zorro Mario');
var g5 = G.decidir(res(fi('Mario cerca donde vivo', { red: true, esNombreConocido: CTX.esNombreConocido }), 1), { contar: siempre });
es('guía: con resultados solo avisa lo que no entendió', [g5.paso, g5.aviso, g5.botones.length], ['avisar', 'No entendí «cerca donde vivo», así que busqué solo Mario.', 0]);
var fTres = fi('kiero ver gente'); fTres.guia_n = 3;
es('guía: con 3 preguntas hechas ya no pregunta más', G.decidir(res(fTres, 0), { contar: siempre }).paso, 'nada');
var fDos = fi('kiero ver gente'); fDos.guia_n = 2;
es('guía: con 2 hechas todavía pregunta, y el botón sube a 3', G.decidir(res(fDos, 0), { contar: siempre }).botones[0].ficha.guia_n, 3);
es('guía: pedido claro y sin resultados no interviene', G.decidir(res(fi('Juan'), 0), { contar: siempre }).paso, 'nada');
es('guía: búsqueda bloqueada no interviene', G.decidir(res(fi('quien vende drogas'), 0, { plan: { tipo: 'bloqueada' } }), { contar: siempre }).paso, 'nada');
es('guía: si falta la localidad no interviene (lo maneja el motor)', G.decidir(res(fi('kiero ver gente'), 0, { requiere: 'localidad' }), { contar: siempre }).paso, 'nada');
es('guía: una sola letra no interviene', G.decidir(res(fi('j'), 0, { ficha: Object.assign(fi('j'), { necesita_segunda_pista: true }) }), { contar: siempre }).paso, 'nada');
es('guía: en inglés pregunta en inglés', G.decidir(res(fi('kiero ver gente'), 0), { contar: siempre, idioma: 'en' }).pregunta, 'How would you like to see people? You can also type a name.');
es('guía: los botones en francés', G.decidir(res(fi('kiero ver gente'), 0), { contar: siempre, idioma: 'fr' }).botones[0].etiqueta, 'Les plus récentes');
es('guía: sin textos cargados no se rompe', G.decidir(res(fi('kiero ver gente'), 0), { contar: siempre, textos: {} }).paso, 'preguntar');
es('guía: contar que falla cuenta como 0', G.decidir(res(fi('kiero ver gente'), 0), { contar: function () { throw new Error('x'); } }).paso, 'avisar');

// ===== 4) MOTOR + GUÍA con datos de ejemplo =====
var ON = { ampliar: true, red: true, guia: true };
function on(extra) { var c = {}; for (var k in ON) c[k] = ON[k]; for (var k2 in extra) c[k2] = extra[k2]; return c; }
var rMaria = buscar('busca a María cerca donde vivo', on(), YO_CALLAO);
es('motor: "María cerca donde vivo" con yo en Callao encuentra a María', ids(rMaria), ['u-maria']);
es('motor: ... y la guía no interviene', rMaria.guia.paso, 'nada');
var rApagado = buscar('busca a María cerca donde vivo', {}, YO_CALLAO);
es('motor: con todo apagado se comporta como antes (nadie con ese nombre)', [ids(rApagado), rApagado.guia], [[], undefined]);
var rRed = buscar('María cerca donde vivo', { red: true }, YO_CALLAO);
es('motor: solo con la red, busca a María y avisa lo que no entendió', [ids(rRed), rRed.avisos.filter(function (a) { return /No entendí/.test(a); }).length], [['u-maria'], 0]);
var rRedGuia = buscar('María cerca donde vivo', { red: true, guia: true }, YO_CALLAO);
es('motor: red + guía: busca a María y avisa', [ids(rRedGuia), rRedGuia.avisos.filter(function (a) { return a === 'No entendí «cerca donde vivo», así que busqué solo María.'; }).length], [['u-maria'], 1]);
var rGente = buscar('kiero ver gente', on(), YO_CALLAO);
es('motor: "kiero ver gente" pregunta con botones que sí dan resultados', [rGente.guia.paso, rGente.alternativas.length > 0, rGente.alternativas.every(function (a) { return a.total > 0 && a.tipo === 'guia' && a.ficha; })], ['preguntar', true, true]);
es('motor: el mensaje es la pregunta, no "No encontré a nadie"', [rGente.mensaje.indexOf('¿Cómo quieres ver') !== -1, /No encontré a nadie/.test(rGente.mensaje)], [true, false]);
es('motor: sin guía, "kiero ver gente" no usa la guía', buscar('kiero ver gente', { ampliar: true, red: true }, YO_CALLAO).guia, undefined);
// seguir la guía: tocar un botón vuelve a buscar con su ficha y cuenta una pregunta
var bNuevos = rGente.alternativas.filter(function (a) { return a.id === 'nuevos'; })[0];
var rNuevos = M.buscar('', datosBase(null, YO_CALLAO), { Interprete: I, ficha: bNuevos.ficha, ampliar: true, red: true, guia: true });
es('motor: el botón "más nuevas" muestra a los últimos registrados primero', [rNuevos.personas.length > 0, rNuevos.personas[0].id, rNuevos.ficha.guia_n], [true, 'u-rosa', 1]);
var bLocal = rGente.alternativas.filter(function (a) { return a.id === 'local'; })[0];
es('motor: el botón "las de mi localidad" trae solo a gente de Callao', ids(M.buscar('', datosBase(null, YO_CALLAO), { Interprete: I, ficha: bLocal.ficha })), ['u-ana', 'u-maria']);
var rO = buscar('o cuidad', on(), YO_CALLAO);
es('motor: "o cuidad" (tu captura) ya no dice "No encontré a nadie con Nombre"', [rO.guia.paso, /No logré entender «o cuidad»/.test(rO.mensaje), /Nombre:/.test(rO.mensaje)], ['preguntar', true, false]);
var rV = buscar('verificados', on(), YO_CALLAO);
es('motor: "verificados" avisa que no existe y ofrece otra cosa', [rV.guia.paso, /todavía no existe/.test(rV.mensaje), rV.alternativas.length > 0], ['preguntar', true, true]);
var rOficio = buscar('alguien que arregle celulares', on(), YO_CALLAO);
es('motor: oficio sin nadie que lo ofrezca, no inventa preguntas (queda lo de siempre)', [rOficio.guia.paso, ids(rOficio)], ['nada', []]);
var rZ = buscar('Zzzz cerca donde vivo', on(), YO_CALLAO);
es('motor: nombre que no existe y sin datos para ofrecer: no pregunta por preguntar', rZ.guia.paso, 'nada');
var rBloq = buscar('quien vende drogas', on(), YO_CALLAO);
es('motor: bloqueada no pasa por la guía', [rBloq.plan.tipo, rBloq.guia], ['bloqueada', undefined]);
var rIdioma = buscar('kiero ver gente', on({ idioma: 'en' }), YO_CALLAO);
es('motor: la pregunta sale en el idioma pedido', /How would you like to see people/.test(rIdioma.mensaje), true);
es('motor: sin localidad no inventa zona (lo maneja el motor)', buscar('Mario cerca de mi', on(), {}).requiere, 'localidad');
es('motor: "los más nuevos" lista a los últimos registrados', [buscar('los más nuevos', on(), YO_CALLAO).personas[0].id, buscar('los más nuevos', on(), YO_CALLAO).plan.tipo], ['u-rosa', 'nuevos']);
es('motor: "los más nuevos en Callao" mezcla orden y lugar', ids(buscar('los más nuevos en Callao', on(), YO_CALLAO)), ['u-ana', 'u-maria']);
es('motor: "dime quién es Juan Pérez" encuentra a Juan', ids(buscar('dime quién es Juan Pérez', on(), YO_CALLAO)), ['u-juan']);
es('motor: un error dentro de la guía no rompe la búsqueda', ids(buscar('Juan', on({ Guia: { decidir: function () { throw new Error('boom'); } } }), YO_CALLAO)), ['u-juan']);

console.log(fallos ? 'HAY ' + fallos + ' FALLOS de ' + total + ' pruebas' : 'TODO BIEN: ' + total + ' de ' + total + ' pruebas');
process.exit(fallos ? 1 : 0);
