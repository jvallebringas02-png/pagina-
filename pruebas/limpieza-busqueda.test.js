// Pruebas de la capa de limpieza. Se ejecutan con:  node pruebas/limpieza-busqueda.test.js
var L = require('../js/modules/limpieza-busqueda.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) {
    total++;
    if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); }
}
function limpio(t, o) { return L.limpiar(t, o).limpio; }
function comp(t) { return L.limpiar(t).comparable; }

// --- Símbolos que rompen el filtro .or() de Supabase ---
es('comas y paréntesis', limpio('Juan, Perez (x)'), 'Juan Perez x');
es('porcentaje y guion bajo', limpio('100% ju_an'), '100 ju an');
es('comillas y barra', limpio('Ana "la" \\ mejor'), 'Ana la mejor');
es('asterisco, comilla invertida, <>, {}', limpio('a*b`c<d>e{f}g'), 'a b c d e f g');
es('un filtro malicioso queda sin sus separadores', limpio('x),nombres.ilike.%a%,(y'), 'x nombres.ilike. a y');

// --- Se conserva lo que sí es parte de un nombre ---
es('guion', limpio('Ana-María'), 'Ana-María');
es('apóstrofe', limpio("D'Angelo"), "D'Angelo");
es('apóstrofe tipográfico', limpio('O’Brien'), 'O’Brien');
es('@usuario con guion bajo y punto', limpio('busca @j_valle.2 por favor'), 'busca @j_valle.2 por favor');
es('@usuario y símbolo pegado', limpio('@j_valle, gracias'), '@j_valle gracias');

// --- Espacios, largo, invisibles ---
es('espacios de sobra', limpio('  hola    mundo  '), 'hola mundo');
es('tabuladores y saltos de línea', limpio('hola\t\nmundo\r\n'), 'hola mundo');
es('espacio duro y de ancho completo', limpio('a\u00A0b\u3000c'), 'a b c');
es('ancho cero y BOM', limpio('ho\u200Bla\uFEFF'), 'hola');
es('caracteres de control', limpio('ho\u0000la\u0007'), 'hola');
es('caracteres etiqueta ocultos', limpio('hola\u{E0041}\u{E0042}'), 'hola');
es('guion blando', limpio('ho\u00ADla'), 'hola');
var largo = new Array(80).join('palabra ');
var rl = L.limpiar(largo);
es('tope de largo', rl.limpio.length <= 200, true);
es('tope marca recortado', rl.recortado, true);
es('corta en límite de palabra', /palabra$/.test(rl.limpio), true);
es('texto corto no se recorta', L.limpiar('hola').recortado, false);
es('opción max', limpio('uno dos tres cuatro', { max: 8 }), 'uno dos');
var enorme = L.limpiar(new Array(5000).join('a b '));
es('texto enorme: no se cuelga y queda recortado', enorme.limpio.length <= 200 && enorme.recortado, true);
es('no parte un emoji', /[\uD800-\uDBFF]$/.test(L.limpiar(new Array(150).join('😀'), { max: 101 }).limpio), false);

// --- Letras repetidas ---
es('holaaaaa', limpio('holaaaaa'), 'holaa');
es('dos letras iguales no se tocan', limpio('Aarón Aleex Ottoo'), 'Aarón Aleex Ottoo');
es('números repetidos no se tocan', limpio('999000111'), '999000111');

// --- Tildes y mayúsculas solo para comparar ---
es('comparable sin tildes', comp('Pérez'), 'perez');
es('Pérez = perez', comp('PÉREZ') === comp('perez'), true);
es('limpio conserva las tildes', limpio('Pérez'), 'Pérez');
es('ñ se compara como n (igual que el resto de la página)', comp('Peña'), 'pena');
es('ancho completo', limpio('ｃｏｃａｉｎａ'), 'cocaina');

// --- Original intacto para mostrar ---
es('original intacto', L.limpiar('  Juan, Pérez  ').original, '  Juan, Pérez  ');

// --- Lista de riesgo: trucos de escritura ---
es('paraRiesgo: co-caina', L.limpiar('co-caina').paraRiesgo, 'cocaina');
es('paraRiesgo: c.o.c.a.i.n.a', L.limpiar('c.o.c.a.i.n.a').paraRiesgo, 'cocaina');
es('paraRiesgo: ARMAS con tilde y símbolos', L.limpiar('árm,as').paraRiesgo, 'arm as');
es('paraRiesgo: a-r-m-a-s', L.limpiar('a-r-m-a-s').paraRiesgo, 'armas');
es('el limpio NO pierde el guion', limpio('co-caina'), 'co-caina');

// --- Otros alfabetos: no se borran ---
es('chino', limpio('北京 手机'), '北京 手机');
es('ruso', limpio('Москва ноутбук'), 'Москва ноутбук');
es('árabe', limpio('مرحبا'), 'مرحبا');
es('japonés con dakuten', comp('がっこう'), 'がっこう');
es('ruso comparable en minúsculas', comp('МОСКВА'), 'москва');
es('ruso con coma', limpio('Москва, Иван'), 'Москва Иван');

// --- Palabras de relleno: no se quitan ---
es('quien vende laptops intacto', limpio('busca quien venda laptops'), 'busca quien venda laptops');

// --- Entradas raras ---
es('vacío', L.limpiar('').vacio, true);
es('null', L.limpiar(null).limpio, '');
es('undefined', L.limpiar(undefined).vacio, true);
es('número', L.limpiar(123).limpio, '123');
es('objeto', L.limpiar({ a: 1 }).limpio, '');
es('solo símbolos', L.limpiar(',,,()%_').vacio, true);
es('solo invisibles', L.limpiar('\u200B\u200B').vacio, true);
es('idempotente', limpio(limpio('  Juan,   Pérez (x) ')), limpio('  Juan,   Pérez (x) '));

console.log(fallos ? ('HAY ' + fallos + ' FALLOS de ' + total + ' pruebas') : ('TODO BIEN: ' + total + ' de ' + total + ' pruebas'));
process.exit(fallos ? 1 : 0);
