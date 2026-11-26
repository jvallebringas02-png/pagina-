// Pruebas de la traducción de "Buscar Personas" (js/i18n-buscar-personas.js + textos del motor).
var m = require('../js/i18n-buscar-personas.js');
var D = m.I18N_BUSCAR_PERSONAS, B = m.BuscarPersonasI18n;
var Motor = require('../js/modules/motor-busqueda-personas.js');
var Interprete = require('../js/modules/interprete-busqueda-personas.js');
var ok = 0, mal = 0;
function prueba(nombre, cond, extra) { if (cond) ok++; else { mal++; console.log('FALLO  ' + nombre + (extra ? '\n   ' + extra : '')); } }

var IDIOMAS = ['es', 'en', 'fr', 'pt', 'de', 'it', 'nl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'bg', 'tr'];
var claves = Object.keys(D.es);
prueba('hay 15 idiomas', Object.keys(D).length === 15 && IDIOMAS.every(function (l) { return D[l]; }));
IDIOMAS.forEach(function (l) {
    var faltan = claves.filter(function (k) { return typeof D[l][k] !== 'string' || !D[l][k].length; });
    prueba(l + ': tiene todas las claves', faltan.length === 0, faltan.join(','));
    var sobran = Object.keys(D[l]).filter(function (k) { return claves.indexOf(k) === -1; });
    prueba(l + ': no tiene claves de más', sobran.length === 0, sobran.join(','));
    var marcas = claves.filter(function (k) { var a = (D.es[k].match(/\{(x|y)\}/g) || []).sort().join(), b = (D[l][k].match(/\{(x|y)\}/g) || []).sort().join(); return a !== b; });
    prueba(l + ': mismas marcas {x}/{y} que el español', marcas.length === 0, marcas.join(','));
    prueba(l + ': sin restos de HTML ni de comillas sueltas en etiquetas', claves.every(function (k) { return !/[<>]/.test(D[l][k]); }));
});
// quechua, aimara y desconocidos caen al español
prueba('qu cae al español', B.t('sinRes', {}, 'qu') === D.es.sinRes);
prueba('ay cae al español', B.t('sinRes', {}, 'ay') === D.es.sinRes);
prueba('idioma desconocido cae al español', B.t('sinRes', {}, 'xx') === D.es.sinRes);
prueba('clave inexistente devuelve la clave', B.t('no_existe', {}, 'en') === 'no_existe');
prueba('reemplaza {x} e {y}', B.t('mostrando', { x: 3, y: 9 }, 'en') === 'Showing 3 of 9 people.');
prueba('no interpreta "$" en los datos', B.t('busque', { x: '$& $1' }, 'es') === 'Busqué: $& $1');

// El motor en español queda igual que antes
var datos = { yo: { id: 'u-yo', localidad_id: 3, pais: 'Perú' }, localidades: [{ id: 3, pais_id: 1, nombre: 'Lima', region: 'Lima' }], bloqueados: [], bloqueadores: [], productos: [],
    perfiles: [{ id: 'u-yo', nombres: 'Yo', apellidos: 'Mismo', localidad_id: 3, categoria: 'General', pais: 'Perú', nombre_usuario: null, created_at: '2026-09-01T10:00:00Z', foto_perfil: null },
               { id: 'u1', nombres: 'Juan', apellidos: 'Pérez', localidad_id: null, categoria: 'General', pais: 'Perú', nombre_usuario: 'jperez', created_at: '2026-09-02T10:00:00Z', foto_perfil: null }] };
function msg(texto, idioma) { var r = Motor.buscar(texto, datos, { idioma: idioma, Interprete: Interprete }); return r; }
var rEs = msg('Pedro Gonzales', 'es'), rEn = msg('Pedro Gonzales', 'en'), rJa = msg('Pedro Gonzales', 'ja');
prueba('es: mensaje sin resultados en español', /No encontr/.test(rEs.mensaje), rEs.mensaje);
prueba('en: mensaje sin resultados en inglés', /found|Nobody|nobody|I found/.test(rEn.mensaje) && !/No encontr/.test(rEn.mensaje), rEn.mensaje);
prueba('ja: mensaje en japonés', /[\u3040-\u30ff\u4e00-\u9fff]/.test(rJa.mensaje), rJa.mensaje);
var rNuevos = msg('gente nueva', 'fr');
prueba('fr: etiqueta del criterio "nuevos" en francés', rNuevos.plan.criterios.some(function (c) { return c.etiqueta === D.fr.nuevos; }), JSON.stringify(rNuevos.plan.criterios.map(function (c) { return c.etiqueta; })));
var rZona = msg('personas en mi ciudad', 'de');
prueba('de: la zona sale en alemán', !rZona.plan.criterios.some(function (c) { return /tu ciudad/.test(c.etiqueta); }), JSON.stringify(rZona.plan.criterios.map(function (c) { return c.etiqueta; })));
// la guía usa el idioma de la búsqueda
var rGuia = msg('kjhsdf qwe', 'en');
prueba('en: la guía responde en inglés (no en español)', !/Entendí|No logré|¿/.test(rGuia.mensaje || ''), rGuia.mensaje);

console.log(mal ? 'HAY ' + mal + ' FALLOS de ' + (ok + mal) + ' pruebas' : 'TODO BIEN: ' + ok + ' de ' + ok + ' pruebas');
process.exit(mal ? 1 : 0);
