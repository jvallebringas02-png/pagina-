// Guía de la búsqueda de personas (BITACORA-BUSQUEDA-POR-CAPAS-5.md). Función pura: no lee Supabase, no usa la IA, no toca la pantalla.
// Cuando una búsqueda de personas no da resultados porque la página NO entendió qué se quería, en vez de "No encontré a nadie"
// dice qué entendió, hace UNA pregunta y ofrece botones. Cada botón trae una ficha lista para volver a buscar.
//
// GuiaBusqueda.decidir(res, ctx) -> { paso, entendi, pregunta, botones:[{id, etiqueta, total, ficha}], aviso, mensaje }
//   res: lo que devuelve MotorBusquedaPersonas.buscar (ficha, plan, total, requiere)
//   ctx: { contar(ficha) -> número de personas (para NO ofrecer botones que den "no hay"), idioma, max }
//   paso: 'nada'      -> la guía no interviene (el motor sigue como siempre)
//         'avisar'    -> hay un aviso (res.total > 0 con algo que no se entendió, o sin datos para ofrecer)
//         'preguntar' -> hay una pregunta con botones
// Reglas: 1) dice qué entendió antes de preguntar  2) una sola pregunta por turno, de 2 a 5 botones  3) los botones salen de datos reales
//         (solo se ofrece lo que da al menos una persona)  4) no repite: cada botón sube ficha.guia_n y con 3 preguntas ya no pregunta más
//         5) si el pedido es claro no interviene  6) nunca ofrece nada si la búsqueda está bloqueada por riesgo.
var GuiaBusqueda = (function () {
    'use strict';

    var MAX_PREGUNTAS = 3;
    var CAMPOS = ['nombre', 'usuario', 'iniciales', 'zona', 'lugar', 'oferta', 'rol', 'hace', 'precio', 'condicion', 'orden'];

    function textosDe(ctx) {
        if (ctx && ctx.textos) return ctx.textos;
        if (typeof I18N_GUIA_BUSQUEDA !== 'undefined') return I18N_GUIA_BUSQUEDA;
        if (typeof window !== 'undefined' && window.I18N_GUIA_BUSQUEDA) return window.I18N_GUIA_BUSQUEDA;
        if (typeof require === 'function') { try { return require('../i18n-guia-busqueda.js'); } catch (e) { /* sin textos */ } }
        return null;
    }
    // Texto en el idioma pedido; quechua, aimara y cualquier otro caen al español. {x} e {y} se reemplazan (sin interpretar "$").
    function t(clave, ctx, vars) {
        var T = textosDe(ctx) || {};
        var idioma = (ctx && ctx.idioma) || 'es';
        var tabla = T[idioma] && T[idioma][clave] ? T[idioma] : (T.es || {});
        var s = tabla[clave] || '';
        vars = vars || {};
        return s.replace(/\{(x|y)\}/g, function (m, k) { return vars[k] == null ? '' : String(vars[k]); });
    }

    function copiaCampos(ficha) {
        var f = {};
        CAMPOS.forEach(function (k) { if (ficha[k] != null && !(Array.isArray(ficha[k]) && !ficha[k].length)) f[k] = JSON.parse(JSON.stringify(ficha[k])); });
        return f;
    }
    function boton(id, claveEtiqueta, ficha, cambios, ctx, vars) {
        var f = copiaCampos(ficha);
        Object.keys(cambios).forEach(function (k) { f[k] = cambios[k]; });
        f.guia_n = Math.min(MAX_PREGUNTAS, (ficha.guia_n || 0) + 1);
        return { id: id, etiqueta: t(claveEtiqueta, ctx, vars), total: null, ficha: f };
    }
    // Se queda solo con los botones que dan al menos una persona (si no hay cómo contar, se dejan todos)
    function conDatos(botones, ctx) {
        if (!ctx || typeof ctx.contar !== 'function') return botones;
        return botones.filter(function (b) {
            var n = 0;
            try { n = ctx.contar(b.ficha) || 0; } catch (e) { n = 0; }
            b.total = n;
            return n > 0;
        });
    }

    function botonesModo(ficha, ctx) {
        var l = [boton('nuevos', 'bNuevos', ficha, { orden: 'recientes' }, ctx),
            boton('venden', 'bVenden', ficha, { hace: ['vende'] }, ctx),
            boton('servicios', 'bServicios', ficha, { hace: ['servicios'] }, ctx),
            boton('local', 'bLocal', ficha, { zona: 'local' }, ctx)];
        // "Buscar «x» como nombre": solo si lo que no se entendió podría ser un nombre y hay alguien con ese nombre
        if (ficha.sin_entender && !ficha.nombre) l.push(boton('comoNombre', 'bComoNombre', ficha, { nombre: ficha.sin_entender }, ctx, { x: ficha.sin_entender }));
        return conDatos(l, ctx);
    }
    function botonesZona(ficha, ctx) {
        var l = [['local', 'zLocal'], ['regional', 'zRegional'], ['pais', 'zPais'], ['mundial', 'zMundial']].map(function (z) {
            return boton('zona-' + z[0], z[1], ficha, { zona: z[0] }, ctx);
        });
        return conDatos(l, ctx);
    }

    function resultado(paso, partes) {
        var r = { paso: paso, entendi: partes.entendi || '', pregunta: partes.pregunta || '', botones: partes.botones || [], aviso: partes.aviso || '', mensaje: '' };
        r.mensaje = [r.entendi, r.pregunta, r.aviso].filter(Boolean).join(' ');
        return r;
    }
    var NADA = function () { return { paso: 'nada', entendi: '', pregunta: '', botones: [], aviso: '', mensaje: '' }; };

    function decidir(res, ctx) {
        ctx = ctx || {};
        var max = ctx.max || MAX_PREGUNTAS;
        var ficha = res && res.ficha, plan = (res && res.plan) || {};
        if (!ficha || ficha.bloqueada || plan.tipo === 'bloqueada' || res.requiere || ficha.necesita_segunda_pista) return NADA();
        var total = typeof res.total === 'number' ? res.total : ((res.personas || []).length);
        var hechas = ficha.guia_n || 0;

        // Hay resultados: no se pregunta nada; solo se avisa si una parte de la frase no se entendió
        if (total > 0) {
            if (!ficha.sin_entender) return NADA();
            var buscado = ficha.nombre || ficha.oferta || '';
            return resultado('avisar', { aviso: buscado ? t('avisoNoEntendi', ctx, { x: ficha.sin_entender, y: buscado }) : t('noEntendi', ctx, { x: ficha.sin_entender }) });
        }

        // Sin resultados. Con 3 preguntas ya hechas no se pregunta más: sigue lo de siempre (búsquedas parecidas del motor)
        if (hechas >= max) return NADA();

        var hayAlgoQueBuscar = ficha.intencion !== 'vacia';
        var botones, p;

        // 1) pidió algo que la página no tiene ("verificados", "con foto") y no quedó nada más que buscar
        if (ficha.no_disponible && !hayAlgoQueBuscar) {
            botones = botonesModo(ficha, ctx);
            if (!botones.length) return resultado('avisar', { entendi: t('noExiste', ctx, { x: ficha.no_disponible }), aviso: t('sinDatos', ctx) });
            return resultado('preguntar', { entendi: t('noExiste', ctx, { x: ficha.no_disponible }), pregunta: t('qModo', ctx), botones: botones });
        }
        // 2) no quedó nada que buscar: frase vacía, solo relleno o algo que no se entendió
        if (!hayAlgoQueBuscar) {
            botones = botonesModo(ficha, ctx);
            p = ficha.sin_entender ? t('noEntendi', ctx, { x: ficha.sin_entender }) : '';
            if (!botones.length) return resultado('avisar', { entendi: p, aviso: t('sinDatos', ctx) });
            return resultado('preguntar', { entendi: p, pregunta: t('qModo', ctx), botones: botones });
        }
        // 3) sí hay algo que buscar (un nombre, por ejemplo) pero sobró una parte que no se entendió y no se dijo dónde: se pregunta la zona
        if (ficha.sin_entender && !ficha.zona && !ficha.lugar) {
            botones = botonesZona(ficha, ctx);
            var que = ficha.nombre || ficha.oferta || '';
            var entendi = que ? t('entendiBusco', ctx, { x: que }) : t('noEntendi', ctx, { x: ficha.sin_entender });
            if (!botones.length) return NADA();
            return resultado('preguntar', { entendi: entendi, pregunta: t('qZona', ctx), botones: botones });
        }
        return NADA();
    }

    return { decidir: decidir, t: t, MAX_PREGUNTAS: MAX_PREGUNTAS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = GuiaBusqueda;
