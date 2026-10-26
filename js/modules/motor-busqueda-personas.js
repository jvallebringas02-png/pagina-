// Motor de búsqueda de personas (etapa 2, núcleo puro: no usa red, no toca la pantalla).
//
// Recibe la FICHA del intérprete (interprete-busqueda-personas.js) y hace dos cosas:
//   1) construirPlan(ficha, contexto)  -> arma el PLAN DE BÚSQUEDA: una lista de criterios legibles ("constructor de consulta").
//   2) ejecutar(plan, datos)           -> aplica el plan sobre listas de personas y publicaciones y devuelve personas.
//   buscar(texto, datos, contexto) junta las dos con el intérprete.
//
// El plan solo tiene campos conocidos y valores ya limpios: nunca se arma una consulta con texto libre del usuario.
// Todos los criterios se combinan con "y". Los tipos de oferta (vende, servicio, trueque, donación) se combinan entre sí con "o".
// Una capa aparte (más adelante) cargará los datos desde Supabase y llamará a este núcleo.
var MotorBusquedaPersonas = (function () {
    'use strict';

    var LIMITE = 20;
    var MODALIDAD_DE = { vende: 'venta', servicios: 'servicio', regala: 'donacion', cambia: 'trueque' };
    var NOMBRE_TIPO = { venta: 'venta', servicio: 'servicio', trueque: 'trueque', donacion: 'donación' };
    var SIN_PUBLICAR = {
        venta: 'publicaciones en venta', servicio: 'servicios publicados',
        trueque: 'publicaciones de trueque', donacion: 'donaciones publicadas'
    };
    // palabra que se ofrece -> categoría de la página (se usa además del texto)
    var CATEGORIA_DE = {
        laptop: 'Tecnología', celular: 'Tecnología', computadora: 'Tecnología', tv: 'Tecnología', television: 'Tecnología',
        televisor: 'Tecnología', tablet: 'Tecnología', audifono: 'Tecnología', consola: 'Tecnología',
        ropa: 'Ropa', zapato: 'Ropa', zapatilla: 'Ropa', polo: 'Ropa', casaca: 'Ropa', vestido: 'Ropa',
        mueble: 'Hogar', cocina: 'Hogar', cama: 'Hogar', mesa: 'Hogar', silla: 'Hogar',
        libro: 'Libros', bicicleta: 'Deportes', pelota: 'Deportes', moto: 'Vehículos', auto: 'Vehículos', repuesto: 'Vehículos'
    };
    var PALABRAS_USADO = ['usado', 'usada', 'seminuevo', 'seminueva', 'segunda mano'];
    var ROLES_CON_PUBLICACIONES = /^(emprendedor|vendedor|comerciante|artesano)/;

    // ---------- texto ----------
    function sinTildes(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function norm(s) { return sinTildes(s).toLowerCase().replace(/[^a-z0-9ñ\s@._-]/g, ' ').replace(/\s+/g, ' ').trim(); }
    // "🌍 Global", "null" y vacíos no son una ciudad
    function ciudadLimpia(c) {
        var n = norm(c);
        if (!n || n === 'null' || n === 'undefined' || n === 'global' || n === 'mundo') return '';
        return n;
    }
    function esMundial(p) { var c = norm(p.ciudad), pa = norm(p.pais); return c === 'global' || pa === 'mundo' || norm(p.alcance) === 'mundial'; }
    function raiz(w) {
        if (w.length > 5 && /es$/.test(w)) return w.slice(0, -2);
        if (w.length > 3 && /s$/.test(w)) return w.slice(0, -1);
        return w;
    }
    function palabras(s) { return norm(s).split(' ').filter(Boolean); }
    var VACIAS = ['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'o', 'en', 'para', 'con', 'por', 'a'];
    function tokensOferta(oferta) { return palabras(oferta).filter(function (w) { return VACIAS.indexOf(w) === -1; }).map(raiz); }

    // Palabras que para quien busca significan lo mismo (zapato = zapatilla = tenis = calzado). Se suman a los sinónimos del
    // buscador principal cuando la página los entrega (contexto.sinonimos). Todo en raíz, porque se compara con "empieza por".
    var GRUPOS_BASE = [
        ['zapato', 'zapatilla', 'tenis', 'calzado'], ['celular', 'celu', 'smartphone', 'telefono'],
        ['laptop', 'notebook', 'portatil'], ['computadora', 'compu', 'ordenador', 'pc'], ['televisor', 'tv', 'television'],
        ['bicicleta', 'bici'], ['carro', 'auto', 'coche', 'vehiculo'], ['casaca', 'chompa', 'chaqueta', 'abrigo'],
        ['polo', 'camiseta', 'playera', 'remera'], ['ropa', 'prenda', 'vestimenta'], ['comida', 'alimento']
    ];
    function grupoDe(tk, contexto) {
        var g = [tk];
        GRUPOS_BASE.forEach(function (gr) {
            var raices = gr.map(raiz);
            if (raices.indexOf(tk) !== -1) raices.forEach(function (r) { if (g.indexOf(r) === -1) g.push(r); });
        });
        if (contexto && typeof contexto.sinonimos === 'function') {
            try {
                (contexto.sinonimos(tk) || []).forEach(function (w) {
                    var r = raiz(norm(w));
                    if (r && r.length >= 3 && r.indexOf(' ') === -1 && g.indexOf(r) === -1) g.push(r);
                });
            } catch (e) { /* si el buscador principal falla, se sigue con los grupos propios */ }
        }
        return g;
    }
    // Palabras de las publicaciones (categorías y títulos) que el intérprete puede tratar como "lo que se vende" y no como un nombre.
    // Las palabras que también son nombre o apellido de alguien se dejan fuera: ante la duda, "Juan" es una persona.
    var PALABRAS_INTENCION = { vendo: 1, vende: 1, venta: 1, busco: 1, compro: 1, quiero: 1, necesito: 1, oferta: 1, ofrezco: 1, tengo: 1, nuevo: 1, nueva: 1, usado: 1, usada: 1 };
    function vocabularioDe(datos) {
        var nombres = {}, vocab = {};
        ((datos && datos.perfiles) || []).forEach(function (u) { palabras([u.nombres, u.apellidos].join(' ')).forEach(function (w) { nombres[w] = true; nombres[raiz(w)] = true; }); });
        ((datos && datos.productos) || []).filter(publicacionValida).forEach(function (p) {
            palabras([p.categoria, p.titulo].join(' ')).forEach(function (w) {
                if (w.length >= 4 && w.length <= 20 && !/^[0-9]/.test(w) && VACIAS.indexOf(w) === -1 && !nombres[w] && !nombres[raiz(w)] && !PALABRAS_INTENCION[w]) vocab[w] = true;
            });
        });
        // si la página tiene "zapatos", también son productos "calzado" y "tenis" (salvo que alguien se llame así)
        var raices = {}; Object.keys(vocab).forEach(function (w) { raices[raiz(w)] = true; });
        GRUPOS_BASE.forEach(function (gr) {
            if (!gr.some(function (w) { return raices[raiz(w)]; })) return;
            gr.forEach(function (w) { if (w.length >= 3 && !nombres[w] && !nombres[raiz(w)]) vocab[w] = true; });
        });
        return Object.keys(vocab);
    }
    function textoDe(p) { return ' ' + norm([p.titulo, p.descripcion, p.categoria].join(' ')) + ' '; }
    function contienePalabra(texto, stem) { return texto.indexOf(' ' + stem) !== -1; }

    // ---------- reglas sobre publicaciones ----------
    function alertaPermitida(v) { var n = norm(v); return n === '' || n === 'null' || n === 'bajo'; }
    // Opción A: entra si las DOS alertas (legal y OCR) están vacías o en "bajo"
    function publicacionValida(p) {
        return norm(p.estado) === 'aprobado' && alertaPermitida(p.nivel_alerta_legal) && alertaPermitida(p.nivel_alerta_ocr);
    }
    function coincideOferta(p, tokens, grupos) {
        if (!tokens.length) return true;
        var t = textoDe(p), cat = p.categoria || '';
        // cada palabra pedida se cumple con ella misma o con cualquiera de sus sinónimos
        return tokens.every(function (tk, i) {
            var g = (grupos && grupos[i]) || [tk];
            return g.some(function (w) { return contienePalabra(t, w) || (CATEGORIA_DE[w] && CATEGORIA_DE[w] === cat); });
        });
    }
    function coincideUsado(p) {
        var t = ' ' + norm([p.titulo, p.descripcion].join(' ')) + ' ';
        return PALABRAS_USADO.some(function (w) { return t.indexOf(' ' + w) !== -1; });
    }
    function coincidePrecio(p, pr) {
        if (!pr || (pr.min == null && pr.max == null)) return true;
        if (p.precio == null) return false;
        if (pr.moneda && p.moneda && norm(p.moneda) !== norm(pr.moneda)) return false;
        if (pr.min != null && p.precio < pr.min) return false;
        if (pr.max != null && p.precio > pr.max) return false;
        return true;
    }

    // ---------- ubicación ----------
    function masFrecuente(lista) {
        var cuenta = {}, mejor = '', n = 0;
        lista.forEach(function (x) { if (!x) return; cuenta[x] = (cuenta[x] || 0) + 1; if (cuenta[x] > n) { n = cuenta[x]; mejor = x; } });
        return mejor;
    }
    // Ubicación de una persona: su localidad del perfil; si falta, la ciudad/país más frecuente de sus publicaciones aprobadas.
    // Es un respaldo para emparejar: no se muestra como "su localidad".
    function ubicacionDe(persona, datos) {
        var loc = null;
        if (persona.localidad_id != null) {
            (datos.localidades || []).forEach(function (l) { if (String(l.id) === String(persona.localidad_id)) loc = l; });
        }
        var susProductos = (datos.productos || []).filter(function (p) { return p.usuario_id === persona.id && publicacionValida(p); });
        var ciudad = loc ? norm(loc.nombre) : masFrecuente(susProductos.map(function (p) { return ciudadLimpia(p.ciudad); }));
        var pais = norm(persona.pais) || masFrecuente(susProductos.filter(function (p) { return !esMundial(p); }).map(function (p) { return norm(p.pais); }));
        var region = loc ? norm(loc.region) : '';
        if (!region && ciudad) region = regionDeCiudad(ciudad, datos);
        return { ciudad: ciudad, pais: pais, region: region, origen: loc ? 'perfil' : (ciudad ? 'publicaciones' : null) };
    }
    function regionDeCiudad(ciudadNorm, datos) {
        var r = '';
        (datos.localidades || []).forEach(function (l) { if (norm(l.nombre) === ciudadNorm && l.region) r = norm(l.region); });
        return r;
    }
    // ¿La publicación está en la zona pedida, vista desde la ubicación de quien busca?
    function enZona(p, nivel, yo, datos) {
        if (nivel === 'mundial') return true;
        var mundial = esMundial(p);
        if (nivel === 'local') return !!yo.ciudad && ciudadLimpia(p.ciudad) === yo.ciudad;
        if (nivel === 'pais') return mundial || (!!yo.pais && norm(p.pais) === yo.pais);
        if (nivel === 'regional') {
            if (mundial) return true;
            var regionP = regionDeCiudad(ciudadLimpia(p.ciudad), datos);
            if (yo.region && regionP && regionP === yo.region) return true;
            // alcance "regional" declarado por quien publica, dentro del mismo país
            return norm(p.alcance) === 'regional' && !!yo.pais && norm(p.pais) === yo.pais;
        }
        return true;
    }
    function enLugarNombrado(p, lugarNorm) {
        if (!lugarNorm) return true;
        return ciudadLimpia(p.ciudad) === lugarNorm || norm(p.pais) === lugarNorm || (lugarNorm === 'peru' && norm(p.pais) === 'peru');
    }
    function enZonaPersona(u, nivel, yo) {
        if (nivel === 'mundial') return true;
        if (nivel === 'local') return !!yo.ciudad && u.ciudad === yo.ciudad;
        if (nivel === 'regional') return !!yo.region && u.region === yo.region;
        if (nivel === 'pais') return !!yo.pais && u.pais === yo.pais;
        return true;
    }
    function lugarPersona(u, lugarNorm) { return !lugarNorm || u.ciudad === lugarNorm || u.pais === lugarNorm || u.region === lugarNorm; }

    // ---------- nombre ----------
    function puntajeNombre(persona, ficha) {
        var nombres = norm(persona.nombres), apellidos = norm(persona.apellidos);
        var completo = (nombres + ' ' + apellidos).trim();
        if (ficha.usuario) {
            var nu = norm(persona.nombre_usuario).replace(/^@/, '');
            if (nu === ficha.usuario) return 10;
            if (nu && nu.indexOf(ficha.usuario) === 0) return 7;
            return 0;
        }
        if (ficha.iniciales && ficha.iniciales.length) {
            var ini = completo.split(' ').filter(Boolean).map(function (w) { return w.charAt(0); });
            // las iniciales piden palabras del nombre en ese orden (j p -> Juan Pérez)
            var k = 0; ini.forEach(function (c) { if (k < ficha.iniciales.length && c === ficha.iniciales[k]) k++; });
            return k === ficha.iniciales.length ? 2 : 0;
        }
        var q = norm(ficha.nombre);
        if (!q) return 0;
        if (completo === q) return 10;
        if (nombres.indexOf(q) === 0 || apellidos.indexOf(q) === 0 || completo.indexOf(q) === 0) return 7;
        // palabra por palabra: todas las palabras escritas deben aparecer (al inicio de alguna palabra del nombre)
        var pq = q.split(' '), pn = completo.split(' ');
        var todas = pq.every(function (w) { return pn.some(function (x) { return x.indexOf(w) === 0; }); });
        if (todas) return 6;
        if (completo.indexOf(q) !== -1) return 5;
        return 0;
    }

    // ---------- 1) PLAN ----------
    function criterio(id, etiqueta, extra) {
        var c = { id: id, etiqueta: etiqueta, aplicado: true, nota: null };
        for (var k in extra) c[k] = extra[k];
        return c;
    }
    var NOMBRE_ZONA = { local: 'tu ciudad', regional: 'tu región', pais: 'tu país', mundial: 'todo el mundo' };

    function construirPlan(ficha, contexto) {
        contexto = contexto || {};
        var plan = {
            tipo: 'busqueda', criterios: [], avisos: [], limite: LIMITE, orden: ficha && ficha.orden === 'recientes' ? 'recientes' : 'relevancia',
            entendi: '', mensaje: null
        };
        if (!ficha || ficha.intencion === 'vacia' && !ficha.condicion && !contexto.nivelZona) { plan.tipo = 'vacia'; plan.mensaje = 'Escribe qué o a quién buscas: un nombre, @usuario, lo que vende o un lugar.'; return plan; }
        if (ficha.bloqueada) {
            plan.tipo = 'bloqueada'; plan.mensaje = 'Esta búsqueda va contra las normas de la página, así que no se realizó.'; return plan;
        }
        if (ficha.necesita_segunda_pista) {
            plan.tipo = 'vacia'; plan.mensaje = 'Con una sola letra no puedo buscar. Agrega otra inicial o parte del nombre.'; return plan;
        }
        if (ficha.intencion === 'nuevos') {
            plan.tipo = 'nuevos'; plan.criterios.push(criterio('nuevos', 'Personas nuevas', {})); plan.entendi = 'Busqué: personas nuevas'; return plan;
        }

        // "quien compra laptops": la página no guarda lo que alguien quiere comprar; buscar vendedores sería responder otra cosa
        if (ficha.hace_no_soportado && ficha.hace_no_soportado.length && !(ficha.hace && ficha.hace.length)) {
            plan.tipo = 'vacia'; plan.mensaje = 'La página no guarda lo que alguien quiere comprar, así que no puedo buscar a quien compra. Puedo buscar a quien lo vende.'; return plan;
        }

        // --- criterios sobre PUBLICACIONES ---
        var tipos = [];
        (ficha.hace || []).forEach(function (h) { if (MODALIDAD_DE[h] && tipos.indexOf(MODALIDAD_DE[h]) === -1) tipos.push(MODALIDAD_DE[h]); });
        if (tipos.length) plan.criterios.push(criterio('tipo', 'Tipo: ' + tipos.map(function (t) { return NOMBRE_TIPO[t]; }).join(' o '), { nivel: 'publicacion', valores: tipos }));
        if (ficha.condicion) plan.criterios.push(criterio('condicion', 'De segunda mano', { nivel: 'publicacion', nota: 'por texto: la página no guarda la condición' }));
        if (ficha.oferta) plan.criterios.push(criterio('oferta', 'Ofrece: ' + ficha.oferta, { nivel: 'publicacion', tokens: tokensOferta(ficha.oferta), grupos: tokensOferta(ficha.oferta).map(function (tk) { return grupoDe(tk, contexto); }) }));
        var pr = ficha.precio;
        if (pr) {
            var filtra = pr.min != null || pr.max != null;
            var partes = [];
            if (pr.min != null) partes.push('desde ' + pr.min);
            if (pr.max != null) partes.push('hasta ' + pr.max);
            if (pr.moneda) partes.push(pr.moneda);
            if (pr.orden === 'asc') partes.push('del más barato');
            if (pr.orden === 'desc') partes.push('del más caro');
            plan.criterios.push(criterio('precio', 'Precio: ' + partes.join(' '), { nivel: 'publicacion', min: pr.min, max: pr.max, moneda: pr.moneda, orden: pr.orden, filtra: filtra, nota: pr.ambiguo ? 'solo se ordena por precio' : null }));
        }
        var hayPublicacion = plan.criterios.some(function (c) { return c.nivel === 'publicacion'; });

        // --- lugar ---
        var zona = ficha.zona || null;
        if (!zona && !ficha.lugar && contexto.nivelZona) zona = contexto.nivelZona; // botón Local/Regional/País
        if (ficha.lugar) {
            plan.criterios.push(criterio('lugar', 'En: ' + ficha.lugar, { nivel: hayPublicacion ? 'publicacion' : 'persona', lugar: norm(ficha.lugar) }));
        } else if (zona) {
            plan.criterios.push(criterio('zona', 'Zona: ' + NOMBRE_ZONA[zona], { nivel: hayPublicacion ? 'publicacion' : 'persona', zona: zona }));
        }

        // --- criterios sobre PERSONAS ---
        if (ficha.usuario) plan.criterios.push(criterio('usuario', 'Usuario: @' + ficha.usuario, { nivel: 'persona' }));
        if (ficha.nombre) plan.criterios.push(criterio('nombre', 'Nombre: ' + ficha.nombre, { nivel: 'persona' }));
        if (ficha.iniciales) plan.criterios.push(criterio('iniciales', 'Iniciales: ' + ficha.iniciales.join(' ').toUpperCase(), { nivel: 'persona' }));
        if (ficha.rol) {
            var conPub = ROLES_CON_PUBLICACIONES.test(norm(ficha.rol));
            var cr = criterio('rol', 'Quién: ' + ficha.rol, { nivel: 'persona', conPublicaciones: conPub });
            if (!conPub) { cr.aplicado = false; cr.nota = 'este tipo de persona no se puede buscar todavía'; }
            plan.criterios.push(cr);
        }
        if (ficha.hace_no_soportado && ficha.hace_no_soportado.length) {
            plan.avisos.push('La página no guarda lo que alguien quiere comprar, así que no se aplicó esa parte.');
        }
        // solo "compra" y nada más: no hay nada que buscar
        plan.criterios.forEach(function (c) { if (!c.aplicado && c.nota) plan.avisos.push('No se aplicó "' + c.etiqueta + '": ' + c.nota + '.'); });
        if (!plan.criterios.some(function (c) { return c.aplicado; })) {
            plan.tipo = 'vacia';
            plan.mensaje = plan.avisos.length ? plan.avisos[0] : 'No entendí qué buscas. Prueba con un nombre, @usuario o lo que vende.';
            return plan;
        }
        plan.entendi = 'Busqué: ' + plan.criterios.filter(function (c) { return c.aplicado; }).map(function (c) { return c.etiqueta; }).join(' · ');
        return plan;
    }

    // Quita un criterio (la ✕ de la etiqueta en el muro) y devuelve una ficha nueva para volver a buscar.
    var CAMPOS_DE = {
        tipo: ['hace'], condicion: ['condicion'], oferta: ['oferta'], precio: ['precio'], lugar: ['lugar'], zona: ['zona'],
        usuario: ['usuario'], nombre: ['nombre'], iniciales: ['iniciales'], rol: ['rol'], nuevos: ['orden']
    };
    function fichaSin(ficha, idCriterio) {
        var f = JSON.parse(JSON.stringify(ficha || {}));
        (CAMPOS_DE[idCriterio] || []).forEach(function (c) { f[c] = (c === 'hace') ? [] : null; });
        var hayAlgo = f.nombre || f.iniciales || f.usuario || f.oferta || f.rol || f.zona || f.lugar || (f.hace && f.hace.length) || f.precio || f.condicion || f.orden === 'recientes';
        f.intencion = (f.nombre || f.iniciales) ? 'nombre' : (f.usuario ? 'usuario' : (hayAlgo ? (f.orden === 'recientes' && !f.oferta && !f.zona && !f.lugar ? 'nuevos' : 'filtro') : 'vacia'));
        f.necesita_segunda_pista = false;
        return f;
    }

    // ---------- 2) EJECUTAR ----------
    // datos = { yo: {id, localidad_id, pais}, perfiles: [...], productos: [...], localidades: [...], bloqueados: [ids], bloqueadores: [ids] }
    function vistaPersona(u, ubic, ofertas, puntaje) {
        return {
            id: u.id, nombres: u.nombres, apellidos: u.apellidos, nombre_usuario: u.nombre_usuario || null,
            foto_perfil: u.foto_perfil || null, localidad_id: u.localidad_id == null ? null : u.localidad_id,
            ubicacion: { ciudad: ubic.ciudad || null, pais: ubic.pais || null, origen: ubic.origen },
            ofertas: ofertas.slice(0, 3).map(function (p) { return { id: p.id, titulo: p.titulo, modalidad: p.modalidad, precio: p.precio == null ? null : p.precio, moneda: p.moneda || null, ciudad: p.ciudad || null }; }),
            puntaje: puntaje, created_at: u.created_at || null
        };
    }
    function descripcionCorta(criterios) { return criterios.map(function (c) { return c.etiqueta; }).join(', '); }

    function ejecutar(plan, datos) {
        var res = { plan: plan, personas: [], total: 0, mensaje: plan.mensaje, avisos: plan.avisos.slice(), requiere: null, criterioFallido: null, sugerencia: null, pasos: [] };
        if (plan.tipo === 'bloqueada' || plan.tipo === 'vacia') return res;
        datos = datos || {};
        var yoId = datos.yo && datos.yo.id;
        var excluidos = {}; excluidos[yoId] = true;
        (datos.bloqueados || []).forEach(function (id) { excluidos[id] = true; });
        (datos.bloqueadores || []).forEach(function (id) { excluidos[id] = true; });
        var perfiles = (datos.perfiles || []).filter(function (u) { return !excluidos[u.id]; });
        var validas = (datos.productos || []).filter(publicacionValida);

        if (plan.tipo === 'nuevos') {
            perfiles = perfiles.slice().sort(function (a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); });
            res.total = perfiles.length;
            res.personas = perfiles.slice(0, plan.limite).map(function (u) { return vistaPersona(u, ubicacionDe(u, datos), validas.filter(function (p) { return p.usuario_id === u.id; }), 0); });
            return res;
        }

        var aplicados = plan.criterios.filter(function (c) { return c.aplicado; });
        var cPub = aplicados.filter(function (c) { return c.nivel === 'publicacion'; });
        var cPer = aplicados.filter(function (c) { return c.nivel === 'persona'; });
        var yoUbic = datos.yo ? ubicacionDe(datos.yo, datos) : { ciudad: '', pais: '', region: '', origen: null };

        // honestidad con los datos de hoy: si no existe ninguna publicación de ese tipo, se dice (antes de pedir la localidad)
        var tipoC = cPub.filter(function (c) { return c.id === 'tipo'; })[0];
        if (tipoC) {
            var sinNinguna = tipoC.valores.filter(function (t) { return !validas.some(function (p) { return norm(p.modalidad) === t; }); });
            if (sinNinguna.length === tipoC.valores.length) {
                var dosTruequeDonacion = sinNinguna.length === 2 && sinNinguna.indexOf('trueque') !== -1 && sinNinguna.indexOf('donacion') !== -1;
                res.mensaje = 'Todavía no hay ' + (dosTruequeDonacion ? 'publicaciones de trueque o donación' : sinNinguna.map(function (t) { return SIN_PUBLICAR[t]; }).join(' ni ')) + '.';
                res.criterioFallido = 'tipo'; return res;
            }
        }

        // "mi ciudad / mi región / mi país" sin saber dónde está quien busca: no se devuelve una lista vacía
        var zonaC = aplicados.filter(function (c) { return c.id === 'zona' && c.zona !== 'mundial'; })[0];
        if (zonaC) {
            var falta = (zonaC.zona === 'local' && !yoUbic.ciudad) || (zonaC.zona === 'regional' && !yoUbic.region && !yoUbic.pais) || (zonaC.zona === 'pais' && !yoUbic.pais);
            if (falta) { res.requiere = 'localidad'; res.mensaje = 'Define tu localidad en Configuración para buscar en ' + NOMBRE_ZONA[zonaC.zona] + '.'; return res; }
        }

        // ---- publicaciones: se aplica un criterio a la vez y se cuenta lo que queda (así se sabe cuál falló) ----
        var porPersona = {};
        var idsConPublicacion = null;
        if (cPub.length) {
            var actual = validas.filter(function (p) { return excluidos[p.usuario_id] !== true; });
            res.pasos.push({ criterio: 'publicaciones aprobadas', restantes: actual.length });
            var previos = [];
            for (var i = 0; i < cPub.length; i++) {
                var c = cPub[i];
                actual = actual.filter(function (p) {
                    if (c.id === 'tipo') return c.valores.indexOf(norm(p.modalidad)) !== -1;
                    if (c.id === 'condicion') return coincideUsado(p);
                    if (c.id === 'oferta') return coincideOferta(p, c.tokens, c.grupos);
                    if (c.id === 'precio') return coincidePrecio(p, c);
                    if (c.id === 'lugar') return enLugarNombrado(p, c.lugar);
                    if (c.id === 'zona') return enZona(p, c.zona, yoUbic, datos);
                    return true;
                });
                res.pasos.push({ criterio: c.etiqueta, restantes: actual.length });
                if (!actual.length) {
                    res.criterioFallido = c.id;
                    res.mensaje = previos.length
                        ? 'Hay publicaciones con ' + descripcionCorta(previos) + ', pero ninguna con ' + c.etiqueta + '.'
                        : 'No hay publicaciones con ' + c.etiqueta + '.';
                    res.sugerencia = c.id;
                    return res;
                }
                previos.push(c);
            }
            idsConPublicacion = {};
            actual.forEach(function (p) { idsConPublicacion[p.usuario_id] = true; (porPersona[p.usuario_id] = porPersona[p.usuario_id] || []).push(p); });
        }

        // ---- personas ----
        var cNombre = cPer.filter(function (c) { return c.id === 'nombre' || c.id === 'usuario' || c.id === 'iniciales'; })[0];
        var cRol = cPer.filter(function (c) { return c.id === 'rol'; })[0];
        var cLugarP = cPer.filter(function (c) { return c.id === 'lugar' || c.id === 'zona'; })[0];
        var fichaNombre = { nombre: null, usuario: null, iniciales: null };
        cPer.forEach(function (c) {
            if (c.id === 'nombre') fichaNombre.nombre = c.etiqueta.replace(/^Nombre: /, '');
            if (c.id === 'usuario') fichaNombre.usuario = norm(c.etiqueta.replace(/^Usuario: @/, ''));
            if (c.id === 'iniciales') fichaNombre.iniciales = c.etiqueta.replace(/^Iniciales: /, '').toLowerCase().split(' ');
        });

        var candidatos = perfiles.filter(function (u) { return !idsConPublicacion || idsConPublicacion[u.id]; });
        if (cPub.length) res.pasos.push({ criterio: 'personas con esas publicaciones', restantes: candidatos.length });
        if (cRol && cRol.conPublicaciones && !idsConPublicacion) {
            var conPub = {}; validas.forEach(function (p) { conPub[p.usuario_id] = true; });
            candidatos = candidatos.filter(function (u) { return conPub[u.id]; });
        }
        var antesNombre = candidatos.length;
        var puntajes = {};
        if (cNombre) {
            candidatos = candidatos.filter(function (u) { var s = puntajeNombre(u, fichaNombre); puntajes[u.id] = s; return s > 0; });
            res.pasos.push({ criterio: cNombre.etiqueta, restantes: candidatos.length });
            if (!candidatos.length) {
                res.criterioFallido = cNombre.id;
                res.mensaje = antesNombre && cPub.length ? 'Hay personas con ' + descripcionCorta(cPub) + ', pero ninguna con ' + cNombre.etiqueta + '.' : 'No encontré a nadie con ' + cNombre.etiqueta + '.';
                res.sugerencia = cNombre.id; return res;
            }
        }
        if (cLugarP) {
            var conUbic = candidatos.map(function (u) { return { u: u, ub: ubicacionDe(u, datos) }; });
            conUbic = conUbic.filter(function (x) { return cLugarP.id === 'lugar' ? lugarPersona(x.ub, cLugarP.lugar) : enZonaPersona(x.ub, cLugarP.zona, yoUbic); });
            res.pasos.push({ criterio: cLugarP.etiqueta, restantes: conUbic.length });
            if (!conUbic.length) {
                res.criterioFallido = cLugarP.id;
                res.mensaje = 'No encontré personas ' + (cLugarP.id === 'lugar' ? 'en ' + cLugarP.etiqueta.replace(/^En: /, '') : 'de ' + cLugarP.etiqueta.replace(/^Zona: /, '')) + '.';
                res.sugerencia = cLugarP.id; return res;
            }
            candidatos = conUbic.map(function (x) { return x.u; });
        }

        // ---- orden: nombre, luego quienes publicaron lo pedido, luego los más recientes (o por precio si se pidió) ----
        var precioC = cPub.filter(function (c) { return c.id === 'precio'; })[0];
        function minPrecio(u) { var l = (porPersona[u.id] || []).map(function (p) { return p.precio; }).filter(function (x) { return x != null; }); return l.length ? Math.min.apply(null, l) : Infinity; }
        function maxPrecio(u) { var l = (porPersona[u.id] || []).map(function (p) { return p.precio; }).filter(function (x) { return x != null; }); return l.length ? Math.max.apply(null, l) : -Infinity; }
        candidatos.sort(function (a, b) {
            var d = (puntajes[b.id] || 0) - (puntajes[a.id] || 0); if (d) return d;
            if (precioC && precioC.orden === 'asc') { d = minPrecio(a) - minPrecio(b); if (d && isFinite(d)) return d; }
            if (precioC && precioC.orden === 'desc') { d = maxPrecio(b) - maxPrecio(a); if (d && isFinite(d)) return d; }
            d = (porPersona[b.id] || []).length - (porPersona[a.id] || []).length; if (d) return d;
            return String(b.created_at || '').localeCompare(String(a.created_at || ''));
        });
        res.total = candidatos.length;
        res.personas = candidatos.slice(0, plan.limite).map(function (u) {
            var ofertas = porPersona[u.id] || validas.filter(function (p) { return p.usuario_id === u.id; });
            return vistaPersona(u, ubicacionDe(u, datos), ofertas, puntajes[u.id] || 0);
        });
        if (!res.personas.length) res.mensaje = 'No encontré a nadie con esos criterios.';
        return res;
    }

    // ---------- 3) TODO JUNTO ----------
    // buscar('quien vende piano en mi ciudad', datos, { Interprete, nivelZona, sinonimos, palabrasProducto })
    // sinonimos: función opcional (palabra -> lista de palabras iguales), por ejemplo la del buscador principal.
    // palabrasProducto: palabras que son productos; si no se dan, se sacan de las publicaciones (vocabularioDe).
    function buscarBase(texto, datos, contexto) {
        contexto = contexto || {};
        var Interprete = contexto.Interprete || (typeof InterpreteBusquedaPersonas !== 'undefined' ? InterpreteBusquedaPersonas : null);
        if (!Interprete) throw new Error('Falta cargar interprete-busqueda-personas.js antes del motor');
        var ficha = contexto.ficha ? Interprete.sanear(contexto.ficha)
            : Interprete.interpretar(texto, { pais: datos && datos.yo && datos.yo.pais, palabrasProducto: contexto.palabrasProducto || vocabularioDe(datos) });
        var plan = construirPlan(ficha, contexto);
        var r = ejecutar(plan, datos);
        r.ficha = ficha;
        return r;
    }

    // ---------- 4) SALIDAS CUANDO NO HAY RESULTADOS ----------
    var NIVELES_ZONA = ['local', 'regional', 'pais', 'mundial'];
    var ETIQUETA_SALIDA = { zona: 'Buscar en', precio: 'Sin el filtro de precio', condicion: 'Sin \"segunda mano\"', lugar: 'En cualquier lugar',
        tipo: 'Sin el tipo (vende, servicios...)' };
    function copiaFicha(f) { return JSON.parse(JSON.stringify(f || {})); }
    // Devuelve hasta 3 búsquedas parecidas que SÍ tienen resultados, cada una con su ficha lista para volver a buscar.
    function alternativas(res, datos, contexto) {
        var ficha = res.ficha, plan = res.plan;
        if (!ficha || !plan || plan.tipo !== 'busqueda' || res.requiere) return [];
        var base = { Interprete: contexto.Interprete, sinonimos: contexto.sinonimos, palabrasProducto: contexto.palabrasProducto || vocabularioDe(datos) };
        function contar(f) {
            try { var b = {}; for (var k in base) b[k] = base[k]; b.ficha = f; return buscarBase('', datos, b).total || 0; } catch (e) { return 0; }
        }
        var zonaBase = ficha.zona || contexto.nivelZona || null;
        var fBase = copiaFicha(ficha); if (zonaBase && !ficha.lugar) fBase.zona = zonaBase;
        var alts = [], hayAmpliar = false;
        // 1) ampliar la zona: del nivel actual hacia afuera, el primero que tenga a alguien
        if (zonaBase && !ficha.lugar) {
            for (var n = NIVELES_ZONA.indexOf(zonaBase) + 1; n < NIVELES_ZONA.length; n++) {
                var fz = copiaFicha(fBase); fz.zona = NIVELES_ZONA[n];
                var tz = contar(fz);
                if (tz > 0) { alts.push({ tipo: 'ampliar', id: 'zona', zona: NIVELES_ZONA[n], etiqueta: 'Buscar en ' + NOMBRE_ZONA[NIVELES_ZONA[n]], total: tz, ficha: fz }); hayAmpliar = true; break; }
            }
        }
        // 2) quitar de a uno los criterios que más suelen estorbar
        ['precio', 'condicion', 'lugar', 'zona', 'tipo'].forEach(function (id) {
            var c = plan.criterios.filter(function (x) { return x.id === id && x.aplicado; })[0];
            if (!c || (id === 'zona' && hayAmpliar)) return;
            var f = fichaSin(fBase, id);
            if (f.intencion === 'vacia') return;
            var t = contar(f);
            if (t > 0) alts.push({ tipo: 'quitar', id: id, etiqueta: id === 'zona' ? 'En cualquier zona' : ETIQUETA_SALIDA[id], total: t, ficha: f });
        });
        // 3) \"plomero\" puede ser un nombre o lo que alguien ofrece: se prueba la otra lectura
        if (ficha.nombre && !ficha.oferta && !ficha.usuario && !ficha.iniciales) {
            var fo = copiaFicha(fBase); fo.oferta = fo.nombre; fo.nombre = null; fo.intencion = 'filtro';
            var to = contar(fo);
            if (to > 0) alts.push({ tipo: 'como_oferta', id: 'oferta', etiqueta: 'Ver quién ofrece \u00ab' + ficha.nombre + '\u00bb', total: to, ficha: fo });
        } else if (ficha.oferta && !ficha.nombre && !ficha.hace.length) {
            var fn = copiaFicha(fBase); fn.nombre = fn.oferta; fn.oferta = null; fn.intencion = 'nombre';
            var tn = contar(fn);
            if (tn > 0) alts.push({ tipo: 'como_nombre', id: 'nombre', etiqueta: 'Buscar \u00ab' + ficha.oferta + '\u00bb como nombre de persona', total: tn, ficha: fn });
        }
        alts.sort(function (a, b) { return b.total - a.total; });
        return alts.slice(0, 3);
    }

    function buscar(texto, datos, contexto) {
        contexto = contexto || {};
        var r = buscarBase(texto, datos, contexto);
        r.alternativas = [];
        var bloqueada = r.ficha && r.ficha.bloqueada;
        if (!r.personas.length && !bloqueada) {
            try { r.alternativas = alternativas(r, datos, contexto); } catch (e) { r.alternativas = []; }
        }
        return r;
    }

    // ---------- 5) SUGERENCIAS ----------
    // Búsquedas para tocar, armadas con lo que HAY publicado (categorías, tipos, ciudades). Cada una se prueba con el mismo motor
    // y solo se ofrece si da resultados; el número es de personas. Así nunca se sugiere algo que termine en \"no encontré nada\".
    var TIPOS_SUGERIDOS = [['quien vende', 'Venden'], ['quien da servicios', 'Dan servicios'], ['quien cambia', 'Hacen trueque'], ['quien regala', 'Regalan']];
    function sugerencias(datos, contexto) {
        contexto = contexto || {};
        datos = datos || {};
        var max = contexto.max || 7;
        var base = { Interprete: contexto.Interprete, sinonimos: contexto.sinonimos, palabrasProducto: contexto.palabrasProducto || vocabularioDe(datos) };
        var cats = {}, ciudades = {};
        (datos.productos || []).filter(publicacionValida).forEach(function (p) {
            var c = String(p.categoria || '').trim(), cn = norm(c);
            if (c && cn !== 'general' && cn !== 'otros' && cn !== 'null' && cn !== 'undefined') cats[cn] = cats[cn] || c;
            var ci = ciudadLimpia(p.ciudad);
            if (ci && !ciudades[ci]) ciudades[ci] = String(p.ciudad).trim();
        });
        var cand = [];
        Object.keys(cats).forEach(function (k) { cand.push({ texto: cats[k], etiqueta: cats[k] }); });
        TIPOS_SUGERIDOS.forEach(function (t) { cand.push({ texto: t[0], etiqueta: t[1] }); });
        Object.keys(ciudades).forEach(function (k) { cand.push({ texto: 'en ' + ciudades[k], etiqueta: 'En ' + ciudades[k] }); });
        function probar(c) {
            try { var b = {}; for (var k in base) b[k] = base[k]; var r = buscarBase(c.texto, datos, b); return r.total > 0 && !r.requiere ? { texto: c.texto, etiqueta: c.etiqueta, total: r.total } : null; } catch (e) { return null; }
        }
        var ok = cand.map(probar).filter(Boolean);
        ok.sort(function (a, b) { return b.total - a.total || (a.etiqueta < b.etiqueta ? -1 : 1); });
        var salida = ok.slice(0, max - 1);
        var nuevos = probar({ texto: 'gente nueva', etiqueta: 'Gente nueva' });
        if (nuevos) salida.push(nuevos);
        return salida;
    }

    return { construirPlan: construirPlan, ejecutar: ejecutar, buscar: buscar, sugerencias: sugerencias, alternativas: alternativas, vocabularioDe: vocabularioDe, fichaSin: fichaSin, ubicacionDe: ubicacionDe,
        publicacionValida: publicacionValida, _norm: norm, LIMITE: LIMITE };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MotorBusquedaPersonas;
