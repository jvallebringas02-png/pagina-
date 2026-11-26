// La búsqueda por nombre, @usuario e iniciales debe dar lo mismo en TODOS los idiomas de la página.
// Antes (hasta nov 2026) el motor sacaba el valor quitando "Nombre: " del texto de la etiqueta, y eso solo funcionaba en español:
// con la página en inglés o francés, "Ana Torres" y "@anat" no encontraban a nadie aunque existieran.
// node pruebas/idiomas-nombre.test.js
var I = require('../js/modules/interprete-busqueda-personas.js');
var M = require('../js/modules/motor-busqueda-personas.js');
var T = require('../js/i18n-buscar-personas.js');
var fallos = 0, total = 0;
function es(desc, real, esperado) { total++; if (JSON.stringify(real) !== JSON.stringify(esperado)) { fallos++; console.log('FALLO  ' + desc + '\n   esperaba: ' + JSON.stringify(esperado) + '\n   salió:    ' + JSON.stringify(real)); } }
function p(id, n, a, u) { return { id: id, nombres: n, apellidos: a, localidad_id: null, categoria: 'General', pais: null, nombre_usuario: u, created_at: '2026-09-01T10:00:00Z', foto_perfil: null }; }
var datos = { yo: p('u-yo', 'Yo', 'Mismo', 'yomismo'), perfiles: [p('u-yo', 'Yo', 'Mismo', 'yomismo'), p('u-ana', 'Ana', 'Torres', 'anat'), p('u-juan', 'Juan', 'Pérez', 'jperez'), p('u-jose', 'José', 'Pérez', 'jpz')],
    productos: [], localidades: [], bloqueados: [], bloqueadores: [] };
var ids = function (r) { return r.personas.map(function (x) { return x.id; }).sort(); };
var IDIOMAS = Object.keys(T.I18N_BUSCAR_PERSONAS);
es('la página tiene 14 idiomas con textos de búsqueda', IDIOMAS.length >= 14, true);
IDIOMAS.forEach(function (L) {
    var b = function (t) { return M.buscar(t, datos, { Interprete: I, idioma: L }); };
    es('[' + L + '] nombre y apellido: "Ana Torres"', ids(b('Ana Torres')), ['u-ana']);
    es('[' + L + '] solo apellido: "Pérez" trae a los dos', ids(b('Pérez')), ['u-jose', 'u-juan']);
    es('[' + L + '] @usuario: "@anat"', ids(b('@anat')), ['u-ana']);
    es('[' + L + '] iniciales: "iniciales J P" trae a Juan Pérez y José Pérez', ids(b('usuarios con iniciales J P')), ['u-jose', 'u-juan']);
    es('[' + L + '] una sola inicial se rechaza con mensaje (como en español)', [b('inicial J').personas.length, typeof b('inicial J').mensaje === 'string' && b('inicial J').mensaje.length > 0], [0, true]);
    var r = b('Zoila');
    es('[' + L + '] nombre que no existe: sin resultados y con mensaje', [r.personas.length, typeof r.mensaje === 'string' && r.mensaje.length > 0], [0, true]);
});
console.log(fallos ? ('HAY ' + fallos + ' FALLOS de ' + total + ' pruebas') : ('TODO BIEN: ' + total + ' de ' + total + ' pruebas'));
process.exit(fallos ? 1 : 0);
