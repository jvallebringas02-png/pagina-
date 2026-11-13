// Pruebas de la "ayuda" de la búsqueda de personas: sinónimos, vocabulario de las publicaciones, frases de intención,
// sugerencias para tocar y salidas cuando no hay resultados. Se ejecutan con:  node pruebas/motor-busqueda-personas-ayuda.test.js
var fs = require('fs'), path = require('path');
var I = require('../js/modules/interprete-busqueda-personas.js');
var M = require('../js/modules/motor-busqueda-personas.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) {
    total++;
    if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); }
}
// Los sinónimos reales del buscador principal (buscador.js es un archivo del navegador: se evalúa solo el objeto)
var sinonimos = null;
try {
    var srcB = fs.readFileSync(path.join(__dirname, '../js/modules/buscador.js'), 'utf8');
    var BM = new Function('window', 'document', 'localStorage', srcB + '; return typeof BuscadorMotor !== "undefined" ? BuscadorMotor : null;')({}, {}, {});
    if (BM && BM.obtenerGrupoSinonimos) sinonimos = function (w) { return BM.obtenerGrupoSinonimos(w); };
} catch (e) { /* sin buscador.js se prueba solo con los grupos propios del motor */ }

var YO = 'u-yo';
function persona(id, nombres, apellidos, extra) {
    var p = { id: id, nombres: nombres, apellidos: apellidos, localidad_id: null, categoria: 'General', pais: 'Perú', nombre_usuario: null, created_at: '2026-09-01T10:00:00Z', foto_perfil: null };
    for (var k in extra) p[k] = extra[k];
    return p;
}
var perfiles = [
    persona(YO, 'Yo', 'Mismo', { localidad_id: 3 }),
    persona('u-juan', 'Juan', 'Pérez', { nombre_usuario: 'jperez' }),
    persona('u-ana', 'Ana', 'Cruz', { nombre_usuario: 'anacruz' }),
    persona('u-luis', 'Luis', 'Zapata', { nombre_usuario: 'luisz' }),
    persona('u-rosa', 'Rosa', 'Mas', { nombre_usuario: 'rosam' }),
    persona('u-pedro', 'Pedro', 'Vargas', { nombre_usuario: 'pvargas' })
];
var localidades = [{ id: 3, pais_id: 1, nombre: 'Lima', region: 'Lima' }, { id: 4, pais_id: 1, nombre: 'Trujillo', region: 'La Libertad' }];
var n = 0;
function prod(usuario, titulo, ciudad, extra) {
    n++;
    var p = { id: 'p' + n, usuario_id: usuario, titulo: titulo, descripcion: '', categoria: 'Otros', modalidad: 'venta', precio: 100, moneda: 'PEN',
        ciudad: ciudad, pais: 'Perú', alcance: 'local', estado: 'aprobado', nivel_alerta_ocr: null, nivel_alerta_legal: null };
    for (var k in extra) p[k] = extra[k];
    return p;
}
var productos = [
    prod('u-juan', 'Zapatillas deportivas', 'Trujillo', { categoria: 'Ropa', precio: 120 }),
    prod('u-ana', 'Vendo zapatos de cuero', 'Trujillo', { categoria: 'Ropa', precio: 90 }),
    prod('u-luis', 'Servicio de plomero a domicilio', 'Trujillo', { categoria: 'Servicios', modalidad: 'servicio', precio: 50 }),
    prod('u-rosa', 'Laptop Lenovo', 'Lima', { categoria: 'Tecnología', precio: 1800 }),
    prod('u-pedro', 'Clases de piano', 'Lima', { categoria: 'Servicios', modalidad: 'servicio', precio: 40 })
];
var datos = { yo: { id: YO, localidad_id: 3, pais: 'Perú' }, perfiles: perfiles, productos: productos, localidades: localidades, bloqueados: [], bloqueadores: [] };
function ids(r) { return r.personas.map(function (p) { return p.id; }).sort(); }
function buscar(t, ctx) { var c = { sinonimos: sinonimos, Interprete: I }; for (var k in ctx) c[k] = ctx[k]; return M.buscar(t, datos, c); }

// --- sinónimos: otra forma de decir lo mismo ---
es('"calzado" encuentra a quien vende zapatos y zapatillas', ids(buscar('calzado')), ['u-ana', 'u-juan']);
es('"tenis" encuentra zapatos', ids(buscar('tenis')), ['u-ana', 'u-juan']);
es('"zapato" (singular) encuentra "zapatillas"', ids(buscar('zapato')), ['u-ana', 'u-juan']);
es('"notebook" encuentra la laptop', ids(buscar('notebook')), ['u-rosa']);
es('sin función de sinónimos del buscador, los grupos propios siguen valiendo', ids(M.buscar('calzado', datos, { Interprete: I })), ['u-ana', 'u-juan']);

// --- vocabulario sacado de las publicaciones ---
es('"plomero" (está en un título) es lo que se ofrece, no un nombre', buscar('plomero').ficha.oferta, 'plomero');
es('"plomero" encuentra a Luis', ids(buscar('plomero')), ['u-luis']);
es('"quiero un plomero en Trujillo" encuentra a Luis', ids(buscar('quiero un plomero en Trujillo')), ['u-luis']);
es('"Juan" sigue siendo un nombre', buscar('Juan').ficha.nombre, 'Juan');
es('"Zapata" (apellido de Luis) sigue siendo un nombre aunque suene a producto', buscar('Zapata').ficha.nombre, 'Zapata');
es('el vocabulario no incluye nombres de personas', M.vocabularioDe(datos).indexOf('zapata') === -1 && M.vocabularioDe(datos).indexOf('zapatos') !== -1, true);

// --- frases de intención ---
es('"quiero zapatos"', ids(buscar('quiero zapatos')), ['u-ana', 'u-juan']);
es('"busco zapatos"', ids(buscar('busco zapatos')), ['u-ana', 'u-juan']);
es('"necesito comprar zapatos"', ids(buscar('necesito comprar zapatos')), ['u-ana', 'u-juan']);
es('"donde consigo zapatos"', ids(buscar('donde consigo zapatos')), ['u-ana', 'u-juan']);
es('"tienen zapatos"', ids(buscar('tienen zapatos')), ['u-ana', 'u-juan']);
es('"busco a Juan Perez" busca a la persona', ids(buscar('busco a Juan Perez')), ['u-juan']);
es('"por zapatos"', ids(buscar('por zapatos')), ['u-ana', 'u-juan']);
es('"quien vende o da servicios" no deja "den" como producto', buscar('usuarios que vendan o den servicios').ficha.oferta, null);

// --- sugerencias ---
var sug = M.sugerencias(datos, { sinonimos: sinonimos, Interprete: I, max: 12 });
es("hay sugerencias", sug.length > 0, true);
es('ninguna sugerencia da cero', sug.every(function (s) { return s.total > 0; }), true);
es('el número de cada sugerencia es el que da la búsqueda', sug.every(function (s) { return buscar(s.texto).total === s.total; }), true);
es('incluye las categorías que existen', ['Ropa', 'Servicios', 'Tecnología'].every(function (c) { return sug.some(function (s) { return s.etiqueta === c; }); }), true);
es('no sugiere "General" ni "Otros"', sug.every(function (s) { return s.etiqueta !== 'General' && s.etiqueta !== 'Otros'; }), true);
es('"Ropa" suma 2 personas', sug.filter(function (s) { return s.etiqueta === 'Ropa'; })[0].total, 2);
es('termina con "Gente nueva"', sug[sug.length - 1].etiqueta, 'Gente nueva');
es('sin publicaciones solo queda "Gente nueva"', M.sugerencias({ yo: datos.yo, perfiles: perfiles, productos: [], localidades: [], bloqueados: [], bloqueadores: [] }, { Interprete: I }).map(function (s) { return s.etiqueta; }), ['Gente nueva']);
var datosBloq = { yo: datos.yo, perfiles: perfiles, productos: productos, localidades: localidades, bloqueados: ['u-ana', 'u-juan'], bloqueadores: [] };
es('quien está bloqueado no cuenta en las sugerencias', M.sugerencias(datosBloq, { sinonimos: sinonimos, Interprete: I }).filter(function (s) { return s.etiqueta === 'Ropa'; }).length, 0);

// --- salidas cuando no hay resultados ---
var r1 = buscar('zapatos en Lima');
es('zapatos en Lima: sin resultados', r1.personas.length, 0);
es('ofrece quitar el lugar y da cuántos hay', r1.alternativas.map(function (a) { return [a.id, a.total]; }), [['lugar', 2]]);
var r2 = buscar('zapatos hasta 50 soles');
es('zapatos hasta 50: sin resultados', r2.personas.length, 0);
es('ofrece quitar el precio (2 personas)', r2.alternativas.map(function (a) { return [a.id, a.total]; }), [['precio', 2]]);
var r3 = buscar('zapatos', { nivelZona: 'local' });
es('zapatos en mi ciudad (Lima): sin resultados', r3.personas.length, 0);
es('ofrece ampliar la zona antes que quitarla', r3.alternativas[0].tipo, 'ampliar');
es('la zona ampliada tiene resultados', buscar('', { ficha: r3.alternativas[0].ficha }).total > 0, true);
var r4 = buscar('sombreros');
es('palabra que no existe en ningún lado: sin resultados y sin alternativas', [r4.personas.length, r4.alternativas.length], [0, 0]);
var r5 = buscar('piano');
es('si hay resultados no se calculan alternativas', [r5.personas.length > 0, r5.alternativas.length], [true, 0]);
var r6 = buscar('cocaína');
es('una búsqueda bloqueada no ofrece alternativas', [r6.plan.tipo, r6.alternativas.length], ['bloqueada', 0]);
// nombre <-> oferta: si "Luis" no coincide pero hay quien ofrece "Luis"... y al revés
var datosRaro = { yo: datos.yo, perfiles: perfiles.concat([persona('u-marta', 'Marta', 'Sol', {})]), productos: productos.concat([prod('u-marta', 'Marta cuadros artesanales', 'Lima', { categoria: 'Arte' })]), localidades: localidades, bloqueados: [], bloqueadores: [] };
var rx = M.buscar('cuadros', datosRaro, { Interprete: I, ficha: { nombre: 'cuadros' } });
es('"cuadros" leído como nombre no da nadie, pero ofrece verlo como lo que se ofrece',
    [rx.personas.length, rx.alternativas.map(function (a) { return a.tipo; })], [0, ['como_oferta']]);
es('las alternativas traen una ficha que se puede volver a buscar', M.buscar('', datosRaro, { Interprete: I, ficha: rx.alternativas[0].ficha }).personas.map(function (p) { return p.id; }), ['u-marta']);

console.log(fallos === 0 ? 'TODO BIEN: ' + total + ' de ' + total + ' pruebas' : fallos + ' FALLOS de ' + total + ' pruebas');
process.exit(fallos === 0 ? 0 : 1);
