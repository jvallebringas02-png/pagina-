// Pruebas del motor de búsqueda de personas (núcleo puro). Se ejecutan con:  node pruebas/motor-busqueda-personas.test.js
// Los datos de ejemplo imitan los reales de Supabase (24/10/2026): 9 personas, 7 sin localidad; publicaciones solo de venta;
// ciudades en texto libre ("callao", "San Jeronimo", "🌍 Global", "null"); una en borrador y una con alerta OCR "medio".
var I = require('../js/modules/interprete-busqueda-personas.js');
var M = require('../js/modules/motor-busqueda-personas.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) {
    total++;
    if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); }
}

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
function buscar(t, datos, ctx) { var c = ctx || {}; c.Interprete = I; return M.buscar(t, datos || datosBase(), c); }
function ids(r) { return r.personas.map(function (p) { return p.id; }).sort(); }
// "yo" con ciudad Lima por perfil: Lima está en localidades como id 3
var YO_LIMA = { localidad_id: 3, pais: 'Perú' };

// --- el plan (constructor de consulta) ---
var plan = M.construirPlan(I.interpretar('búscame lo que vende piano en mi ciudad'));
es('plan: criterios y etiquetas', plan.criterios.map(function (c) { return c.id + '=' + c.etiqueta; }), ['tipo=Tipo: venta', 'oferta=Ofrece: piano', 'zona=Zona: tu ciudad']);
es('plan: texto "Busqué"', plan.entendi, 'Busqué: Tipo: venta · Ofrece: piano · Zona: tu ciudad');
var planS = M.construirPlan(I.interpretar('quien da clases de piano en mi región'));
es('plan: servicio y región', planS.criterios.map(function (c) { return c.id; }), ['tipo', 'oferta', 'zona']);
var planT = M.construirPlan(I.interpretar('ropa de segunda mano que regalen o cambien en Lima'));
es('plan: tipos combinados con o, segunda mano y lugar', planT.criterios.map(function (c) { return c.etiqueta; }),
    ['Tipo: donación o trueque', 'De segunda mano', 'Ofrece: ropa', 'En: Lima']);
es('plan: segunda mano se marca como búsqueda por texto', planT.criterios[1].nota, 'por texto: la página no guarda la condición');
es('plan: bloqueada no consulta', M.construirPlan(I.interpretar('quien vende drogas')).tipo, 'bloqueada');
es('plan: vacía pide escribir algo', M.construirPlan(I.interpretar('')).tipo, 'vacia');
es('plan: una sola letra pide segunda pista', M.construirPlan(I.interpretar('j')).tipo, 'vacia');
es('plan: el botón de zona entra como zona', M.construirPlan(I.interpretar('Juan'), { nivelZona: 'local' }).criterios.map(function (c) { return c.id; }), ['zona', 'nombre']);
es('plan: un lugar escrito manda sobre el botón', M.construirPlan(I.interpretar('ropa en Lima'), { nivelZona: 'local' }).criterios.map(function (c) { return c.id; }), ['oferta', 'lugar']);
es('plan: compra junto a vende se avisa y no se aplica', M.construirPlan(I.interpretar('quien vende o compra laptops')).avisos.length >= 1, true);
es('plan: solo compra no busca', M.construirPlan(I.interpretar('quien compra laptops')).tipo, 'vacia');
es('plan: rol vendedor se aplica; otro rol avisa', [M.construirPlan(I.interpretar('vendedores')).criterios[0].aplicado, M.construirPlan(I.interpretar('profesionales')).tipo], [true, 'vacia']);
var fs = M.fichaSin(I.interpretar('ropa en Lima'), 'lugar');
es('fichaSin quita un criterio y sigue siendo válida', [fs.lugar, fs.oferta, fs.intencion], [null, 'ropa', 'filtro']);
es('fichaSin del único criterio deja la búsqueda vacía', M.fichaSin(I.interpretar('ropa'), 'oferta').intencion, 'vacia');

// --- "ropa en Lima": ciudad de la publicación, sin tildes ni mayúsculas ---
es('ropa en Lima', ids(buscar('ropa en Lima')), ['u-juan', 'u-pedro']);
es('ropa en lima (minúscula) = ropa en Lima', ids(buscar('ropa en lima')), ids(buscar('ropa en Lima')));
es('callao encuentra "callao" y "Callao"', ids(buscar('quien vende ropa en callao')), ['u-ana']);
es('ropa en Trujillo / trujillo', [ids(buscar('ropa en Trujillo')), ids(buscar('ropa en trujillo'))], [['u-carlos'], ['u-carlos']]);
// el borrador de Pedro (Polera, Lima) no cuenta, pero su otra publicación sí
es('borrador no cuenta', buscar('polera en Lima').personas.length, 0);
es('alerta "medio" deja fuera la publicación', buscar('celular en Lima').personas.length, 0);
es('alerta "bajo" y vacía sí entran', ids(buscar('quien vende lámpara')), ['u-sofia']);
es('ciudad "null" no coincide con nada', buscar('quien vende lámpara en null').personas.length, 0);

// --- "vende piano" en ciudad, región y país (quien busca vive en Lima) ---
var dLima = datosBase([], YO_LIMA);
es('piano en mi ciudad (Lima)', ids(buscar('búscame lo que vende piano en mi ciudad', dLima)), ['u-juan']);
es('piano en mi región', ids(buscar('quien vende piano en mi región', dLima)), ['u-juan']);
es('piano en mi país', ids(buscar('personas que venden piano en mi país', dLima)), ['u-juan']);
es('piano a nivel mundial', ids(buscar('quien vende piano a nivel mundial', dLima)), ['u-juan']);
es('piano con nombre Juan', ids(buscar('vende piano en mi ciudad con nombre Juan', dLima)), ['u-juan']);
es('piano con nombre Ana: dice cuál criterio falló', buscar('vende piano en mi ciudad con nombre Ana', dLima).mensaje, 'Hay personas con Tipo: venta, Ofrece: piano, Zona: tu ciudad, pero ninguna con Nombre: Ana.');
es('piano en Trujillo: dice qué criterio falló y sugiere quitarlo', [buscar('quien vende piano en Trujillo', dLima).mensaje, buscar('quien vende piano en Trujillo', dLima).sugerencia],
    ['Hay publicaciones con Tipo: venta, Ofrece: piano, pero ninguna con En: Trujillo.', 'lugar']);
// mi ciudad = ciudad de mis publicaciones cuando no tengo localidad
var dSinLoc = datosBase([prod(YO, 'Mi parlante', 'Lima'), prod(YO, 'Mi radio', 'Lima'), prod(YO, 'Mi tele', 'Pacora')], {});
es('sin localidad, mi ciudad sale de mis publicaciones', ids(buscar('vende piano en mi ciudad', dSinLoc)), ['u-juan']);
es('sin localidad ni publicaciones: aviso de configuración, no lista vacía', [buscar('vende piano en mi ciudad').requiere, buscar('vende piano en mi ciudad').personas.length], ['localidad', 0]);
es('personas de mi localidad sin localidad: aviso', buscar('personas de mi localidad').mensaje, 'Define tu localidad en Configuración para buscar en tu ciudad.');
// región: Lima y Callao tienen regiones distintas; una publicación en San Jeronimo (no está en localidades) no tiene región conocida
es('región: una ciudad fuera de localidades no cuenta, salvo alcance regional o mundial', ids(buscar('ropa en mi región', dLima)), ['u-juan', 'u-pedro']);
var dReg = datosBase([prod('u-luis', 'Piano de cola', 'San Jeronimo', { alcance: 'regional' }), prod('u-sofia', 'Piano digital', '🌍 Global', { pais: 'Mundo', alcance: 'mundial' })], YO_LIMA);
es('región: alcance regional del mismo país y mundial cuentan', ids(buscar('quien vende piano en mi región', dReg)), ['u-juan', 'u-luis', 'u-sofia']);
es('ciudad: lo mundial no es "mi ciudad"', ids(buscar('quien vende piano en mi ciudad', dReg)), ['u-juan']);
es('país: lo mundial sí alcanza', ids(buscar('quien vende piano en mi país', dReg)), ['u-juan', 'u-luis', 'u-sofia']);

// --- tipos de oferta: hoy solo hay venta ---
es('servicios: hoy no hay ninguno', buscar('quien da servicios').mensaje, 'Todavía no hay servicios publicados.');
es('regala o cambia: hoy no hay', buscar('que regale o cambie').mensaje, 'Todavía no hay publicaciones de trueque o donación.');
es('regala sola', buscar('que regale muebles en mi región', dLima).mensaje, 'Todavía no hay donaciones publicadas.');
es('clases de piano: servicio inexistente', buscar('quien da clases de piano en mi ciudad', dLima).mensaje, 'Todavía no hay servicios publicados.');
// ...pero el día que existan, funciona sin tocar el código
var extra = [
    prod('u-sofia', 'Clases de piano', 'Lima', { modalidad: 'servicio', categoria: 'Servicios', precio: 60 }),
    prod('u-pedro', 'Muebles para regalar', 'Lima', { modalidad: 'donacion', categoria: 'Hogar', precio: null }),
    prod('u-luis', 'Cambio libros por herramientas', 'San Jeronimo', { modalidad: 'trueque', categoria: 'Libros', precio: null }),
    prod('u-maria', 'Ropa usada para donar', 'Lima', { modalidad: 'donacion', categoria: 'Ropa', precio: null, descripcion: 'ropa de segunda mano' })
];
var dTipos = datosBase(extra, YO_LIMA);
es('clases de piano en mi ciudad (servicio)', ids(buscar('quien da clases de piano en mi ciudad', dTipos)), ['u-sofia']);
es('quien da servicios', ids(buscar('quien da servicios', dTipos)), ['u-sofia']);
es('que regale muebles', ids(buscar('que regale muebles', dTipos)), ['u-pedro']);
es('regala o cambia', ids(buscar('quien regala o cambia', dTipos)), ['u-luis', 'u-maria', 'u-pedro']);
es('trueque de libros', ids(buscar('quien hace trueque de libros', dTipos)), ['u-luis']);
es('ropa de segunda mano que regalen en Lima', ids(buscar('ropa de segunda mano que regalen en Lima', dTipos)), ['u-maria']);
es('ropa de segunda mano (venta)', ids(buscar('quien vende ropa de segunda mano', dTipos)), ['u-pedro']);
es('teclado usado', ids(buscar('que venda usado un teclado', dTipos)), ['u-juan']);

// --- precio ---
es('menos de 100 soles', ids(buscar('ropa menos de 100 soles')), ['u-maria', 'u-juan', 'u-pedro'].sort());
es('entre 100 y 200 soles', ids(buscar('ropa entre 100 y 200 soles')), ['u-ana', 'u-carlos']);
es('en dólares no hay nada (sin conversión)', buscar('ropa menos de 100 dólares').personas.length, 0);
es('más baratos: ordena por el precio mínimo', buscar('ropa más barata').personas.map(function (p) { return p.id; }), ['u-pedro', 'u-juan', 'u-maria', 'u-ana', 'u-carlos']);
es('por precio suelto: ordena y no filtra', buscar('ropa por precio').personas.length, 5);

// --- nombre ---
es('Juan', ids(buscar('Juan')), ['u-juan']);
es('Juan Pérez (con tilde) y juan perez (sin tilde)', [ids(buscar('Juan Pérez')), ids(buscar('juan perez'))], [['u-juan'], ['u-juan']]);
es('Regalado es un apellido, no un verbo', ids(buscar('Luis Regalado')), ['u-luis']);
es('Ana de la Cruz', ids(buscar('Ana de la Cruz')), ['u-ana']);
es('Muñoz sin la ñ', ids(buscar('Munoz')), ['u-maria']);
es('iniciales J P', ids(buscar('J P')), ['u-juan']);
es('@usuario', ids(buscar('@jperez')), ['u-juan']);
es('@usuario parcial', ids(buscar('@jper')), ['u-juan']);
es('nombre exacto va primero', buscar('Ana').personas.map(function (p) { return p.id; })[0], 'u-ana');
es('una sola letra no lista a nadie', buscar('j').personas.length, 0);
es('nadie con ese nombre', buscar('Zoila').mensaje, 'No encontré a nadie con Nombre: Zoila.');
es('"Armas" como apellido: bloqueado en modo estricto', buscar('Carlos Armas').plan.tipo, 'bloqueada');
es('con el interruptor, "Carlos Armas" es una persona', ids(M.buscar('Carlos Armas', datosBase(), { Interprete: { interpretar: function (t) { return I.interpretar(t, { permitirApellidos: true }); }, sanear: I.sanear } })), ['u-carlos']);

// --- personas por lugar o zona (sin oferta) ---
es('personas de Callao (por perfil)', ids(buscar('personas de Callao')), ['u-ana', 'u-maria']);
es('personas en Callao (por perfil)', ids(buscar('personas en Callao')), ['u-ana', 'u-maria']);
es('personas de mi localidad, yo en Callao', ids(buscar('personas de mi localidad', datosBase([], { localidad_id: 2, pais: 'Perú' }))), ['u-ana', 'u-maria']);
es('el botón Local sin texto NO pide escribir algo (antes era una prueba que no podía fallar)', buscar('', dLima, { nivelZona: 'local' }).plan.tipo, 'busqueda');
es('sin texto y sin botón sigue pidiendo escribir', buscar('', dLima, {}).plan.tipo, 'vacia');

// --- quién nunca aparece ---
es('no aparece quien busca', ids(buscar('Yo Mismo')).indexOf(YO), -1);
var dBloq = datosBase(); dBloq.bloqueados = ['u-juan'];
es('no aparece a quien bloqueé', ids(buscar('Juan', dBloq)), []);
var dBloq2 = datosBase(); dBloq2.bloqueadores = ['u-juan'];
es('no aparece quien me bloqueó', ids(buscar('Juan', dBloq2)), []);
es('nunca se muestra el correo', Object.keys(buscar('Juan').personas[0]).indexOf('email') === -1 && Object.keys(buscar('Juan').personas[0]).indexOf('correo') === -1, true);

// --- resultado ---
es('hasta 3 ofertas por persona', buscar('Juan').personas[0].ofertas.length, 3);
es('la tarjeta trae ubicación con su origen', buscar('Ana').personas[0].ubicacion, { ciudad: 'callao', pais: 'peru', origen: 'perfil' });
es('ubicación por publicaciones se marca como tal', buscar('Juan').personas[0].ubicacion.origen, 'publicaciones');
var muchos = []; for (var i = 0; i < 30; i++) muchos.push(persona('x' + i, 'Ramiro' + i, 'Tapia', { created_at: '2026-10-' + (10 + (i % 10)) + 'T00:00:00Z' }));
var dMuchos = datosBase(); dMuchos.perfiles = perfiles.concat(muchos);
es('máximo 20 resultados (y se informa el total)', [buscar('Ramiro', dMuchos).personas.length, buscar('Ramiro', dMuchos).total], [20, 30]);
es('los más nuevos', buscar('nuevos usuarios').personas.slice(0, 2).map(function (p) { return p.id; }), ['u-rosa', 'u-pedro']);
es('frase bloqueada: aviso y sin consultar', [buscar('quien vende cocaína').plan.tipo, buscar('quien vende cocaína').personas.length, /normas/.test(buscar('quien vende cocaína').mensaje), /coca/i.test(buscar('quien vende cocaína').mensaje)], ['bloqueada', 0, true, false]);
es('compra: se avisa que no se guarda y no se busca', [/no guarda lo que alguien quiere comprar/.test(buscar('quien compra laptops').mensaje), buscar('quien compra laptops').personas.length], [true, 0]);
es('vende o compra: se busca lo que vende y se avisa', [ids(buscar('quien vende o compra laptops')), buscar('quien vende o compra laptops').avisos.length], [['u-ana'], 1]);
es('ficha de la IA: pasa por sanear', ids(buscar('', dLima, { ficha: { oferta: 'piano', zona: 'local', hace: ['vende'], sql: 'drop table x' } })), ['u-juan']);
es('ficha de la IA con palabra prohibida se bloquea', buscar('', dLima, { ficha: { oferta: 'cocaína' } }).plan.tipo, 'bloqueada');

console.log(fallos === 0 ? 'TODO BIEN: ' + total + ' de ' + total + ' pruebas' : fallos + ' FALLOS de ' + total + ' pruebas');
process.exit(fallos === 0 ? 0 : 1);
