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

console.log(fallos === 0 ? 'TODO BIEN: ' + total + ' de ' + total + ' pruebas' : fallos + ' FALLOS de ' + total + ' pruebas');
process.exit(fallos === 0 ? 0 : 1);
