// Pruebas de la capa de intención. Se ejecutan con:  node pruebas/intencion-busqueda.test.js
var fs = require('fs'), vm = require('vm'), path = require('path');
var I = require('../js/modules/intencion-busqueda.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) {
    total++;
    if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); }
}
function d(t, ctx) { return I.decidir(t, ctx); }
function quien(t, ctx) { var r = d(t, ctx); return r.directa || r.principal; }

// --- Personas: señales claras ---
es('@usuario', quien('@jvalle'), 'personas');
es('@usuario con guion bajo', quien('hablar con @j_valle'), 'personas');
es('quien vende laptops = personas', quien('busca quien venda laptops'), 'personas');
es('quien compra', quien('quien compre libros en Arequipa'), 'personas');
es('usuarios de Callao', quien('busca usuarios de Callao'), 'personas');
es('gente nueva', quien('gente nueva'), 'personas');
es('con quién con tilde', quien('¿con quién hablo?'), 'personas');
es('inicial J (hallazgo 1)', quien('usuarios con inicial J'), 'personas');
es('empieza con M (hallazgo 1)', quien('nombre empieza con M'), 'personas');
es('rol', quien('emprendedores en Trujillo'), 'personas');
es('contactar a', quien('quiero contactar a Carlos'), 'personas');
es('que venda (sin la palabra quien)', quien('alguien que venda ropa'), 'personas');
es('Ana de Callao que venda ropa: personas sin ambigüedad', d('Ana de Callao que venda ropa').ambigua, false);
es('MAYÚSCULAS y tildes', quien('QUIÉN VENDE LAPTOPS'), 'personas');

// --- Personas: señales débiles ---
es('nombre y apellido', quien('Juan Pérez'), 'personas');
es('nombre y apellido no es ambiguo', d('Juan Pérez').ambigua, false);
es('iniciales sueltas', quien('J P'), 'personas');

// --- Productos ---
es('laptops baratas = productos', quien('laptops baratas'), 'productos');
es('laptops baratas sin segunda pantalla', d('laptops baratas').secundaria, null);
es('presupuesto', quien('celular hasta 500'), 'productos');
es('moneda', quien('bicicleta 300 soles'), 'productos');
es('orden por precio', d('lo mas barato').orden, 'precio_asc');
es('orden por precio caro', d('lo mas caro').orden, 'precio_desc');
es('celular que tenga buena cámara: productos, no personas', quien('celular que tenga buena camara'), 'productos');
es('frase larga de producto no es ambigua', d('celular que tenga buena camara').ambigua, false);

// --- Ambiguas: se muestran ambas cosas (decisión 9.3) ---
var lap = d('laptops');
es('laptops: productos primero', lap.principal, 'productos');
es('laptops: también personas', lap.secundaria, 'personas');
es('laptops: ambigua', lap.ambigua, true);
var sam = d('Samsung');
es('una palabra con mayúscula: ambas', [sam.principal, sam.secundaria, sam.ambigua], ['personas', 'productos', true]);
es('Samsung Galaxy: nombre propio con producto conocido = ambas', d('Juan Zapatos').ambigua, true);

// --- Sin señal: la IA decide, como hoy ---
es('videos de gatos', quien('videos de gatos'), 'ia');
es('hola', quien('hola'), 'ia');
es('texto en minúsculas sin pistas', quien('juan perez'), 'ia');

// --- Acciones directas ---
es('hora', quien('qué hora es'), 'hora');
es('reclamo', quien('quiero hacer un reclamo'), 'reclamo');
es('contacto admin', quien('quiero hablar con el administrador'), 'contacto_admin');
es('quiénes somos', quien('¿quiénes somos?'), 'quienes_somos');
es('mi zona', quien('mi zona'), 'explorar_localidad');
es('por categoría', quien('ver por categoria'), 'explorar_localidad');
es('quiénes somos gana a explorar zona (como hoy)', quien('que es esta pagina en mi zona'), 'quienes_somos');
es('directa deja principal en null', d('qué hora es').principal, null);
// Diferencia a propósito con hoy: pedir personas con claridad no se desvía a la matriz de zona
es('usuarios de mi zona = personas, no matriz', quien('usuarios de mi zona'), 'personas');
es('usuarios de mi zona marca ubicación propia', d('usuarios de mi zona').ubicacionPropia, true);
es('gente cerca de mi', quien('gente cerca de mi'), 'personas');

// --- Pantalla de personas: siempre personas ---
['hola', 'laptops', 'qué hora es', 'mi zona', 'videos de gatos', 'Samsung'].forEach(function (t) {
    es('superficie personas: "' + t + '"', quien(t, { superficie: 'personas' }), 'personas');
});
es('superficie personas no es ambigua', d('laptops', { superficie: 'personas' }).ambigua, false);

// --- Término del catálogo (opcional) ---
es('esTerminoProducto aporta pista', d('zapatillas nike', { esTerminoProducto: function (w) { return w === 'nike'; } }).pistas.producto.indexOf('término del catálogo') !== -1, true);
es('esTerminoProducto que falla no rompe', quien('hola', { esTerminoProducto: function () { throw new Error('x'); } }), 'ia');

// --- Entradas raras ---
es('vacío', d('').principal, null);
es('null', d(null).razon, 'texto vacío');
es('solo símbolos', d(',,,()').principal, null);
es('texto con inyección de filtro', quien('x),nombres.ilike.%a%,(y'), 'ia');
es('devuelve el original para mostrar', d('  Juan, Pérez ').texto.original, '  Juan, Pérez ');
es('idioma desconocido cae en español', quien('@jvalle', { idioma: 'xx' }), 'personas');

// --- Paridad con las funciones sueltas de js/modules/buscador.js (las líneas 1 a 57) ---
var fuente = fs.readFileSync(path.join(__dirname, '../js/modules/buscador.js'), 'utf8').split('\n').slice(0, 57).join('\n');
var ctx = {}; vm.createContext(ctx); vm.runInContext(fuente, ctx);
var frases = ['mi zona', 'Mi Zona', 'la zona norte', 'mi localidad', 'cerca de mí', 'cerca mio', 'mi ciudad', 'por categoría', 'agrúpalo', 'agrupados por pais',
    'quiénes somos', 'quienes son', 'qué es remarket', 'que es esta página', 'de qué trata', 'cómo funciona la plataforma', 'como funciona esto',
    'quiero hacer un reclamo', 'tengo una queja', 'libro de reclamaciones', 'quiero reclamar', 'poner una queja',
    'contactar al administrador', 'quiero hablar con el administrador', 'escribir al administrador',
    'qué hora es', 'dime la hora', 'sabes que hora es', 'hora es en tokio',
    'lo más barato', 'más económico', 'del más barato', 'de menor a mayor precio', 'el más caro', 'precio más alto', 'de mayor a menor precio',
    'donde estoy', 'junto a mi', 'laptops', 'hola', 'videos de gatos', 'zapatos nike baratos cerca de mi', 'Ver Por Categoria', 'MI CIUDAD'];
frases.forEach(function (f) {
    var r = d(f);
    var viejaDirecta = ctx.detectarPreguntaHora(f) ? 'hora' : ctx.detectarIntencionReclamo(f) ? 'reclamo' : ctx.detectarIntencionContactoAdmin(f) ? 'contacto_admin'
        : ctx.detectarIntencionQuienesSomos(f) ? 'quienes_somos' : ctx.detectarIntencionExplorarLocalidad(f) ? 'explorar_localidad' : null;
    es('paridad directa: "' + f + '"', r.directa, viejaDirecta);
    es('paridad orden: "' + f + '"', r.orden, ctx.detectarIntencionOrden(f));
    es('paridad ubicación propia: "' + f + '"', r.ubicacionPropia, ctx.detectarIntencionUbicacionPropia(f));
});

console.log(fallos ? ('HAY ' + fallos + ' FALLOS de ' + total + ' pruebas') : ('TODO BIEN: ' + total + ' de ' + total + ' pruebas'));
process.exit(fallos ? 1 : 0);
