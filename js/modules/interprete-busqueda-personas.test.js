// Pruebas del intérprete de búsqueda de personas. Se ejecutan con:  node pruebas/interprete-busqueda-personas.test.js
var I = require('../js/modules/interprete-busqueda-personas.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) {
    total++;
    var ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); }
}
function nivel(t) { return I.interpretar(t).riesgo.nivel; }
function f(t, ctx) { return I.interpretar(t, ctx); }

// --- Error 1: no bloquear cosas normales ---
['vendo un Ford Escort', 'Ford Escort 1.8', 'revolver cemento', 'revolver la pintura', 'pistola de agua', 'pistola de silicona',
 'pistola de calor', 'pistola de juguete', 'armario de madera', 'Juan Pérez', 'escort mk2 repuestos'].forEach(function (t) {
    es('no se bloquea: "' + t + '"', nivel(t) === 'alto', false);
});
// --- ...pero sí lo que corresponde ---
['vendo un revolver', 'armas', 'Juan que vende armas y pistolas', 'escopeta', 'municiones', 'escort', 'firearms for sale', 'rifle'].forEach(function (t) {
    es('se bloquea: "' + t + '"', nivel(t), 'alto');
});

// --- Error 2: evasiones y otros idiomas ---
['mariguana', 'marihuana', 'marijuana', 'cocaine', 'c0caina', 'cocainaa', 'c o c a i n a', 'C.O.C.A.I.N.A', 'prostitute', 'sicario', 'pasta base', 'heroina', 'heroin'].forEach(function (t) {
    es('se bloquea: "' + t + '"', nivel(t), 'alto');
});
['perico', 'weed', 'acompañantes'].forEach(function (t) { es('aviso (medio, no bloquea): "' + t + '"', nivel(t), 'medio'); });
es('"amo" y "wed" no se confunden con la lista', nivel('amo a mi perro wed'), null);

// --- Error 3: no comerse nombres ---
es('Dan Smith', f('Dan Smith').nombre, 'Dan Smith');
es('busca a Dan Smith', f('busca a Dan Smith').nombre, 'Dan Smith');
es('Rosa Mas', f('Rosa Mas').nombre, 'Rosa Mas');
es('Al Pacino', f('Al Pacino').nombre, 'Al Pacino');
es('Juan Pérez conserva mayúsculas y tilde', f('Juan Pérez').nombre, 'Juan Pérez');
es("O'Brien", f("O'Brien").nombre, "O'Brien");
es('María de la Cruz (el "de la" es del apellido)', f('María de la Cruz').nombre, 'María de la Cruz');
es('María de la Cruz no inventa un lugar', f('María de la Cruz').lugar, null);
es('José-Luis', f('José-Luis').nombre, 'José-Luis');

// --- Error 4: frases que se piden ---
var nuevo = f('búscame nuevo usuario');
es('"búscame nuevo usuario" no busca a "Nuevo"', [nuevo.nombre, nuevo.intencion, nuevo.orden], [null, 'nuevos', 'recientes']);
es('"usuarios recientes"', f('usuarios recientes').intencion, 'nuevos');
es('"quiero ver personas nuevas"', f('quiero ver personas nuevas').intencion, 'nuevos');
var ana = f('ana de arequipa');
es('"ana de arequipa"', [ana.nombre, ana.lugar], ['ana', 'arequipa']);
var lap = f('laptops en trujillo');
es('"laptops en trujillo"', [lap.nombre, lap.oferta, lap.lugar], [null, 'laptops', 'trujillo']);
var emp = f('emprendedores en perú', { pais: 'Perú' });
es('"emprendedores en perú" con país conocido', [emp.rol, emp.zona, emp.lugar, emp.nombre], ['emprendedores', 'pais', null, null]);
var emp2 = f('emprendedores en perú');
es('"emprendedores en perú" sin país conocido', [emp2.rol, emp2.lugar], ['emprendedores', 'perú']);

// --- Frases completas ---
var j = f('Juan de mi ciudad que vende ropa');
es('Juan de mi ciudad que vende ropa', [j.nombre, j.zona, j.oferta], ['Juan', 'local', 'ropa']);
var j2 = f('Juan que vende ropa en Lima');
es('Juan que vende ropa en Lima', [j2.nombre, j2.oferta, j2.lugar], ['Juan', 'ropa', 'Lima']);
var j3 = f('busca a Juan Pérez a nivel mundial');
es('busca a Juan Pérez a nivel mundial', [j3.nombre, j3.zona], ['Juan Pérez', 'mundial']);
es('en mi región', f('profesionales en mi región').zona, 'regional');
es('a nivel nacional', f('a nivel nacional').zona, 'pais');
es('quién vende celulares en Piura', [f('quién vende celulares en Piura').oferta, f('quién vende celulares en Piura').lugar], ['celulares', 'Piura']);

// --- Riesgo solo en el nombre (decisión del dueño) ---
es('"Carlos Armas": riesgo solo en el nombre', [f('Carlos Armas').riesgo.nivel, f('Carlos Armas').riesgo.soloNombre], ['alto', true]);
es('"Juan que vende armas": riesgo en lo que ofrece, no solo nombre', f('Juan que vende armas').riesgo.soloNombre, false);

// --- Vacío y basura ---
es('texto vacío', f('').intencion, 'vacia');
es('solo símbolos', f('(((').nombre, null);
es('texto largo se recorta', f(new Array(400).join('a')).texto.length, 120);
es('null no rompe', f(null).intencion, 'vacia');

// --- describir ---
es('describir', I.describir(f('Juan de mi ciudad que vende ropa')), 'Busqué: Juan · tu localidad · ofrece ropa');
es('describir nuevos', I.describir(f('nuevo usuario')), 'Busqué: personas nuevas');

// ===== Agregado en la versión 3: iniciales, @usuario, precio, "qué hace", validación de fichas de la IA =====
function pick(t, campos, ctx) { var r = f(t, ctx); return campos.map(function (c) { return r[c]; }); }

// El ejemplo completo del dueño
var ej = f('búscame Juan de mi localidad que venda o compre o de servicios por precio');
es('ejemplo completo: nombre, zona y oferta', [ej.nombre, ej.zona, ej.oferta, ej.intencion], ['Juan', 'local', null, 'nombre']);
es('ejemplo completo: qué hace', [ej.hace, ej.hace_no_soportado], [['vende', 'servicios'], ['compra']]);
es('ejemplo completo: "por precio" suelto es ambiguo', ej.precio, { min: null, max: null, orden: 'asc', moneda: null, ambiguo: true });

// Iniciales
es('una letra', pick('j', ['iniciales', 'nombre', 'necesita_segunda_pista', 'intencion']), [['j'], null, true, 'nombre']);
es('la letra "a" sola', pick('a', ['iniciales', 'necesita_segunda_pista']), [['a'], true]);
es('"J P"', pick('J P', ['iniciales', 'necesita_segunda_pista']), [['j', 'p'], false]);
es('"jp"', f('jp').iniciales, ['j', 'p']);
es('"J.P."', f('J.P.').iniciales, ['j', 'p']);
es('"busca a j p"', f('búscame a j p').iniciales, ['j', 'p']);
es('"j y p"', f('j y p').iniciales, ['j', 'p']);
es('letra más zona ya no pide segunda pista', pick('j de mi ciudad', ['iniciales', 'zona', 'necesita_segunda_pista']), [['j'], 'local', false]);
es('letra más lo que vende', pick('j que vende ropa', ['iniciales', 'oferta', 'necesita_segunda_pista']), [['j'], 'ropa', false]);
es('"Li" (2 letras con vocal) es un nombre, no iniciales', pick('Li', ['nombre', 'iniciales']), ['Li', null]);
es('"Juan P" sigue siendo nombre', pick('Juan P', ['nombre', 'iniciales']), ['Juan P', null]);

// @usuario
es('@usuario', pick('@jvalle', ['usuario', 'nombre', 'intencion']), ['jvalle', null, 'usuario']);
es('nombre y @usuario juntos', pick('Juan @jvalle', ['usuario', 'nombre']), ['jvalle', 'Juan']);
es('@usuario con palabra de riesgo se bloquea', f('@cocaina').bloqueada, true);

// Precio
var pm = f('quien vende laptops en mi país menos de 500 soles');
es('quién vende laptops ... menos de 500 soles', [pm.nombre, pm.oferta, pm.zona, pm.hace, pm.precio.max, pm.precio.moneda], [null, 'laptops', 'pais', ['vende'], 500, 'PEN']);
var rg = f('carlos que vende bicicletas entre 100 y 300 dólares');
es('rango en dólares', [rg.nombre, rg.oferta, rg.precio], ['carlos', 'bicicletas', { min: 100, max: 300, orden: null, moneda: 'USD', ambiguo: false }]);
var mb = f('ana que vende zapatos más baratos');
es('más baratos', [mb.nombre, mb.oferta, mb.precio.orden, mb.precio.ambiguo], ['ana', 'zapatos', 'asc', false]);
es('"Caro" es un nombre, no "más caro"', pick('Caro Pérez', ['nombre', 'precio']), ['Caro Pérez', null]);
es('"Sol García" no es una moneda', pick('Sol García', ['nombre', 'precio']), ['Sol García', null]);
es('miles con coma', f('vende autos desde 1,500 dólares').precio.min, 1500);

// Qué hace
es('regala o cambia', pick('pedro que regale o cambie', ['nombre', 'hace', 'oferta']), ['pedro', ['regala', 'cambia'], null]);
es('"compra" se detecta y se ignora', pick('luis que compre', ['nombre', 'hace', 'hace_no_soportado']), ['luis', [], ['compra']]);
es('servicios con la palabra', pick('Ana que da servicios de diseño', ['nombre', 'hace', 'oferta']), ['Ana', ['servicios'], 'diseño']);
es('servicios sin la palabra queda como oferta', pick('juan que da clases de ingles', ['nombre', 'oferta']), ['juan', 'clases de ingles']);
es('varias ofertas se conservan', f('Pedro que vende laptops o celulares').oferta, 'laptops o celulares');
es('describir con verbos y precio', I.describir(f('Juan que vende o da servicios hasta 100 soles')), 'Busqué: Juan · vende o da servicios · precio: hasta 100');

// "quién" ya no se toma como nombre
es('"quien vende celulares" no deja "quien" como nombre', f('quien vende celulares').nombre, null);

// Riesgo: lo que se agregó
es('"vende drogas" se bloquea', nivel('quien vende drogas'), 'alto');
es('"busco drogas" se bloquea', nivel('busco drogas'), 'alto');
es('"drogas" suelta solo avisa', nivel('campaña contra las drogas'), 'medio');
es('droguería no se bloquea', nivel('droguería San Juan'), null);
es('búsqueda prohibida: prostitución', f('busco prostitución').bloqueada, true);
es('búsqueda prohibida: varias palabras', f('armas, prostitución, venta de productos').bloqueada, true);
es('mayúsculas y tilde', f('COCAÍNA').bloqueada, true);

// Apellido "Armas": por defecto estricto; con permitirApellidos se busca como persona
var ctxA = { permitirApellidos: true };
es('"Carlos Armas" por defecto sigue bloqueado', f('Carlos Armas').bloqueada, true);
es('"Carlos Armas" con permitirApellidos pasa como nombre', [f('Carlos Armas', ctxA).bloqueada, f('Carlos Armas', ctxA).nombre, f('Carlos Armas', ctxA).riesgo.permitidoComoApellido], [false, 'Carlos Armas', true]);
es('"María de Armas" con permitirApellidos', f('María de Armas', ctxA).bloqueada, false);
['armas', 'compro armas', 'busco armas', 'venta armas', 'Juan que vende armas', 'pistolas armas', 'vendo armas'].forEach(function (t) {
    es('con permitirApellidos igual se bloquea: "' + t + '"', f(t, ctxA).bloqueada, true);
});

es('describir no repite una búsqueda bloqueada', [I.describir(f('quien vende drogas')), I.describir(f('busco prostitución'))], ['', '']);

// sanear: la ficha que llene la IA se limpia y no puede colar campos ni búsquedas prohibidas
var sn = I.sanear({ nombre: 'Juan; DROP TABLE perfiles', zona: 'galaxia', hace: ['vende', 'hackea', 'vende'], iniciales: ['j', 'pp', 3],
    precio: { max: -5, orden: 'asc' }, campo_raro: 'x', sql: 'select *', rol: 'hacker' });
es('sanear: texto limpio', sn.nombre, 'Juan DROP TABLE perfiles');
es('sanear: zona inválida, hace filtrado, iniciales inválidas', [sn.zona, sn.hace, sn.iniciales, sn.rol], [null, ['vende'], ['j'], null]);
es('sanear: precio con máximo inválido', sn.precio && [sn.precio.max, sn.precio.orden], [null, 'asc']);
es('sanear: no deja campos extra', [sn.campo_raro, sn.sql], [undefined, undefined]);
es('sanear: aplica el riesgo', [I.sanear({ oferta: 'cocaína' }).bloqueada, I.sanear({ oferta: 'cocaína' }).riesgo.motivo], [true, 'drogas']);
es('sanear: entrada rara', [I.sanear(null).intencion, I.sanear('hola').intencion], ['vacia', 'vacia']);
es('sanear: zona y oferta válidas', [I.sanear({ zona: 'local', oferta: 'ropa' }).intencion, I.sanear({ usuario: '@jvalle' }).usuario], ['filtro', 'jvalle']);

console.log(fallos === 0 ? 'TODO BIEN: ' + total + ' de ' + total + ' pruebas' : fallos + ' FALLOS de ' + total + ' pruebas');
process.exit(fallos === 0 ? 0 : 1);
