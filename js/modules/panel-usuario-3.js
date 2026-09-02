Object.assign(PanelUsuario, {
    // === PUBLICAR === [FASE 3 - Sistema de Publicaciones (Solo Fotos)]
    _fotosSeleccionadas: [],
    _textoOCRAcumulado: '',
    abrirModalPublicar: function() {
        document.getElementById('modalPublicar').style.display = 'flex';
        document.getElementById('publicarAlert').className = 'alert';
        document.getElementById('publicarAlert').style.display = 'none';
        this._fotosSeleccionadas = [];
        this._fotosExistentesEdit = [];
        this._editandoProductoId = null;
        document.getElementById('modalPublicarTitulo').textContent = '📦 Publicar';
        this._textoOCRAcumulado = '';
        this.renderFotosPreview();
        var btnSubmit = document.getElementById('btnPublicarSubmit');
        if (btnSubmit) btnSubmit.disabled = true;
        var declaracion = document.getElementById('pubDeclaracionJurada');
        if (declaracion) declaracion.checked = false;
    },
    editarPublicacion: async function(id) {
        try {
            var { data: p, error } = await supabase.from('productos').select('*').eq('id', id).eq('usuario_id', usuarioActual.id).single();
            if (error || !p) { this.mostrarToast('No se pudo cargar la publicación'); return; }

            this.abrirModalPublicar();
            this._editandoProductoId = id;
            document.getElementById('modalPublicarTitulo').textContent = '✏️ Editar publicación';

            var esServicio = p.modalidad === 'servicio';
            document.getElementById('pubTipo').value = esServicio ? 'servicio' : 'producto';
            this.onTipoPublicacionChange();

            document.getElementById('pubTitulo').value = p.titulo || '';
            document.getElementById('pubTituloContador').textContent = (p.titulo || '').length + '/100';
            document.getElementById('pubDescripcion').value = p.descripcion || '';
            document.getElementById('pubDescripcionContador').textContent = (p.descripcion || '').length + '/500';
            document.getElementById('pubCategoria').value = p.categoria || 'Tecnología';

            if (!esServicio) {
                document.getElementById('pubModalidad').value = p.modalidad || 'venta';
                this.onModalidadChange();
            }
            document.getElementById('pubPrecio').value = (p.precio != null) ? p.precio : '';
            document.getElementById('pubCantidad').value = '';

            var alcanceRadio = document.querySelector('input[name="pubAlcance"][value="' + (p.alcance || 'local') + '"]');
            if (alcanceRadio) alcanceRadio.checked = true;

            this._fotosExistentesEdit = (p.fotos || []).slice();
            this._fotosSeleccionadas = [];
            this.renderFotosPreview();

            document.getElementById('pubDeclaracionJurada').checked = true;
            document.getElementById('btnPublicarSubmit').disabled = false;
        } catch (e) {
            this.mostrarToast('Error al cargar la publicación');
        }
    },
    cerrarModalPublicar: function() {
        document.getElementById('modalPublicar').style.display = 'none';
        this.mostrarPanelLateral();
    },

    // Micro-Paso 3.2: Validación de Fotos (SOLO FOTOS, no videos)
    // Umbral de sensibilidad del filtro de contenido (0 a 1). 0.75 = equilibrado.
    NSFW_UMBRAL: 0.60,
    _modeloNSFW: null,

    // Carga el modelo una sola vez (se reutiliza en todas las fotos que se suban después)
    cargarModeloNSFW: async function() {
        if (this._modeloNSFW) return this._modeloNSFW;
        try {
            var tf = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/+esm');
            await tf.ready();
            var nsfwjsModulo = await import('https://cdn.jsdelivr.net/npm/nsfwjs@4.4.0/+esm');
            this._modeloNSFW = await nsfwjsModulo.load(); // modelo empaquetado, no depende de un servidor externo
            return this._modeloNSFW;
        } catch (e) {
            console.warn('No se pudo cargar el filtro de contenido:', e);
            this._ultimoErrorFiltro = 'Filtro NSFW (carga del modelo): ' + (e && e.message ? e.message : String(e));
            return null;
        }
    },

    // Revisa si la foto contiene un código QR con contenido prohibido (pagos/contacto externo).
    // Devuelve 'segura' (sin QR, o QR limpio), 'rechazada' (QR con contenido prohibido), o 'error'.
    // === OCR (Micro-Paso B: solo registrar texto de fotos, sin bloquear) ===
    _workerOCR: null,
    obtenerWorkerOCR: async function() {
        if (this._workerOCR) return this._workerOCR;
        try {
            this._workerOCR = await Tesseract.createWorker('spa+eng');
            return this._workerOCR;
        } catch (e) {
            console.warn('No se pudo cargar el lector de texto (OCR):', e);
            return null;
        }
    },

    // Lee el texto visible en una foto. Nunca bloquea la publicación, solo devuelve el texto (o vacío).
    // === ENLACE DE VIDEO VERIFICADO (YouTube/TikTok) ===
    _videoVerificado: null,

    verificarEnlaceVideo: async function() {
        var plataforma = document.getElementById('pubVideoPlataforma').value;
        var url = document.getElementById('pubVideoUrl').value.trim();
        var previewEl = document.getElementById('pubVideoPreview');
        this._videoVerificado = null;

        if (!url) { previewEl.innerHTML = ''; return; }

        if (plataforma === 'instagram') {
            if (url.indexOf('instagram.com') === -1) {
                previewEl.innerHTML = '<div class="alert alert-error" style="display:block;">🚫 Ese link no parece ser de Instagram.</div>';
                this._videoVerificado = null;
                return;
            }
            this._videoVerificado = { plataforma: 'instagram', url: url, titulo: 'Ver publicación en Instagram', miniatura: '' };
            previewEl.innerHTML = '<div style="display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--borde);border-radius:8px;">' +
                '<span style="font-size:24px;">📸</span>' +
                '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;">Ver publicación en Instagram</div>' +
                '<div style="font-size:11px;color:var(--texto-secundario);">⚠️ Enlace no verificado automáticamente todavía — revisa que sea correcto antes de publicar.</div></div></div>';
            return;
        }

        var dominiosValidos = { youtube: ['youtube.com', 'youtu.be'], tiktok: ['tiktok.com'] };
        var esDominioValido = dominiosValidos[plataforma].some(function(d) { return url.indexOf(d) !== -1; });
        if (!esDominioValido) {
            previewEl.innerHTML = '<div class="alert alert-error" style="display:block;">🚫 Ese link no parece ser de ' + (plataforma === 'youtube' ? 'YouTube' : 'TikTok') + '.</div>';
            return;
        }

        previewEl.innerHTML = '<div class="alert" style="display:block;">🔎 Verificando...</div>';
        try {
            var endpoint = plataforma === 'youtube' ? 'https://www.youtube.com/oembed' : 'https://www.tiktok.com/oembed';
            var response = await fetch(endpoint + '?url=' + encodeURIComponent(url) + '&format=json');
            if (!response.ok) throw new Error('No se encontró ese video');
            var data = await response.json();
            this._videoVerificado = { plataforma: plataforma, url: url, titulo: data.title || 'Video', miniatura: data.thumbnail_url || '' };
            previewEl.innerHTML = '<div style="display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--borde);border-radius:8px;">' +
                (this._videoVerificado.miniatura ? '<img src="' + this._videoVerificado.miniatura + '" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">' : '▶️') +
                '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">✅ ' + this.escHtml(this._videoVerificado.titulo) + '</div>' +
                '<div style="font-size:11px;color:var(--texto-secundario);">' + (plataforma === 'youtube' ? 'YouTube' : 'TikTok') + ' verificado</div></div></div>';
        } catch (e) {
            this._videoVerificado = null;
            previewEl.innerHTML = '<div class="alert alert-error" style="display:block;">🚫 No pudimos verificar este enlace. Revisa que esté completo y correcto.</div>';
        }
    },

    // === NIVELES DE ALERTA (contacto externo + contenido ilegal) — solo registra, no bloquea ===
    // Primera capa de defensa: coincidencia directa de palabras obviamente prohibidas.
    // No depende de la IA, así que sigue funcionando aunque la llamada a Groq falle o esté caída.
    PALABRAS_PROHIBIDAS: ['porno', 'pornografia', 'pornografía', 'xxx', 'sexo pago', 'servicio sexual', 'servicios sexuales', 'escort', 'arma de fuego', 'municion', 'municiones', 'droga', 'drogas', 'cocaina', 'cocaína', 'marihuana'],
    contieneContenidoProhibido: function(texto) {
        var limpio = (texto || '').toLowerCase();
        return this.PALABRAS_PROHIBIDAS.some(function(p) { return limpio.indexOf(p) !== -1; });
    },

    evaluarNivelesAlerta: async function(titulo, descripcion, textoOCR) {
        var resultado = { nivel_ocr: null, nivel_legal: null };
        var contenidoCompleto = (titulo || '') + ' | ' + (descripcion || '') + (textoOCR ? ' | Texto en fotos: ' + textoOCR : '');

        // Filtro rápido por palabra clave, antes de gastar una llamada a la IA
        if (this.contieneContenidoProhibido(contenidoCompleto)) {
            resultado.nivel_legal = 'alto';
            return resultado;
        }
        try {
            var response = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: { "Content-Type": "application/json", "apikey": MI_API_KEY, "Authorization": "Bearer " + MI_API_KEY },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'Eres un revisor de seguridad de remarket-db. Analiza el título, descripción y texto detectado en fotos de una publicación, y clasifica DOS riesgos por separado, cada uno en "bajo", "medio" o "alto":\n\n' +
                            '1) "riesgo_contacto": ¿el contenido intenta dar un número de teléfono, WhatsApp, o cualquier forma de contactar/pagar fuera de la plataforma? Un número de modelo, talla, año o código de producto es riesgo bajo (normal). Un número de teléfono suelto sin contexto es riesgo medio. Un número junto a "cobro adelantado", "solo WhatsApp", o lenguaje de presión es riesgo alto.\n\n' +
                            '2) "riesgo_legal": ¿el producto o servicio corresponde a alguna categoría prohibida por ley? Categorías graves (riesgo alto): armas/municiones, drogas, explotación o contenido de menores, documentos falsos, bienes robados, trata de personas, animales protegidos, contenido sexual/pornográfico o servicios sexuales de cualquier tipo. Categorías moderadas (riesgo medio): medicamentos con receta sin autorización, productos falsificados/réplicas de marcas, alcohol/tabaco sin licencia, vehículos sin papeles. Todo lo demás (productos y servicios normales) es riesgo bajo.\n\n' +
                            'Responde ÚNICAMENTE en JSON válido, sin texto adicional: {"riesgo_contacto":"bajo|medio|alto","riesgo_legal":"bajo|medio|alto"}' },
                        { role: 'user', content: contenidoCompleto }
                    ]
                })
            });
            var data = await response.json();
            var contenidoRespuesta = (data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '').trim();
            contenidoRespuesta = contenidoRespuesta.replace(/^```json\s*|\s*```$/g, '').trim();
            var parsed = JSON.parse(contenidoRespuesta);
            var niveles = ['bajo', 'medio', 'alto'];
            resultado.nivel_ocr = niveles.indexOf(parsed.riesgo_contacto) !== -1 ? parsed.riesgo_contacto : null;
            resultado.nivel_legal = niveles.indexOf(parsed.riesgo_legal) !== -1 ? parsed.riesgo_legal : null;
        } catch (e) {
            console.warn('No se pudo evaluar el nivel de alerta (no bloquea la publicación):', e);
        }
        return resultado;
    },

    leerTextoDeImagen: async function(file) {
        try {
            var worker = await this.obtenerWorkerOCR();
            if (!worker) return '';
            var resultado = await worker.recognize(file);
            var texto = (resultado && resultado.data && resultado.data.text) ? resultado.data.text.trim() : '';
            if (texto) console.log('🔎 OCR - texto detectado en la foto:', texto);
            return texto;
        } catch (e) {
            console.warn('Error leyendo texto de la foto (OCR):', e);
            return '';
        }
    },

    fotoTieneQRProhibido: async function(file) {
        try {
            var img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            await new Promise(function(resolve, reject) { img.onload = resolve; img.onerror = reject; });
            var canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(img.src);
            var resultado = jsQR(imageData.data, imageData.width, imageData.height);
            if (!resultado || !resultado.data) return { resultado: 'segura', qrTexto: null }; // no tiene ningún QR
            var texto = resultado.data.toLowerCase();
            var contienePalabraProhibida = this.FILTRO_PALABRAS_PROHIBIDAS.some(function(p) { return texto.indexOf(p) !== -1; });
            var esLinkExterno = /^https?:\/\//.test(texto) && texto.indexOf(window.location.hostname) === -1;
            return { resultado: (contienePalabraProhibida || esLinkExterno) ? 'rechazada' : 'segura', qrTexto: resultado.data };
        } catch (e) {
            console.warn('Error revisando código QR:', e);
            this._ultimoErrorFiltro = 'Filtro QR: ' + (e && e.message ? e.message : String(e));
            return { resultado: 'error', qrTexto: null };
        }
    },

    // Revisa una foto. Devuelve 'segura', 'rechazada', o 'error' (no se pudo verificar).
    fotoEsSegura: async function(file) {
        try {
            var modelo = await this.cargarModeloNSFW();
            if (!modelo) return 'error'; // no se pudo cargar el filtro: no confiamos, bloqueamos por seguridad
            var img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            await new Promise(function(resolve, reject) { img.onload = resolve; img.onerror = reject; });
            var predicciones = await modelo.classify(img);
            URL.revokeObjectURL(img.src);
            var riesgo = predicciones.filter(function(p) { return p.className === 'Porn' || p.className === 'Hentai' || p.className === 'Sexy'; })
                .reduce(function(max, p) { return Math.max(max, p.probability); }, 0);
            console.log('🔎 NSFW.js - predicciones:', predicciones, '| riesgo calculado:', (riesgo * 100).toFixed(1) + '%', '| umbral:', (this.NSFW_UMBRAL * 100) + '%');
            return riesgo < this.NSFW_UMBRAL ? 'segura' : 'rechazada';
        } catch (e) {
            console.warn('Error revisando la foto:', e);
            this._ultimoErrorFiltro = 'Filtro NSFW (clasificación): ' + (e && e.message ? e.message : String(e));
            return 'error'; // ante un error técnico, bloqueamos por seguridad (falla cerrado, no abierto)
        }
    },

    onFotosSeleccionadas: async function(fileList) {
        var alertEl = document.getElementById('publicarAlert');
        var tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        var archivos = Array.from(fileList);
        document.getElementById('pubFotosInput').value = '';
        for (var i = 0; i < archivos.length; i++) {
            var f = archivos[i];
            if (f.type.indexOf('video') !== -1 || !tiposPermitidos.includes(f.type)) {
                alertEl.className = 'alert alert-error';
                alertEl.textContent = '🚫 Solo se permiten fotos (JPG, PNG, GIF, WEBP). No se permiten videos.';
                alertEl.style.display = 'block';
                continue;
            }
            if ((this._fotosExistentesEdit || []).length + this._fotosSeleccionadas.length >= 5) {
                alertEl.className = 'alert alert-error';
                alertEl.textContent = '🚫 Máximo 5 fotos por publicación.';
                alertEl.style.display = 'block';
                break;
            }
            alertEl.className = 'alert';
            alertEl.textContent = '🔎 Revisando foto...';
            alertEl.style.display = 'block';
            var resultadoFiltro = await this.fotoEsSegura(f);
            if (resultadoFiltro === 'rechazada') {
                alertEl.className = 'alert alert-error';
                alertEl.textContent = '🚫 Esta foto no cumple con nuestras normas de contenido.';
                alertEl.style.display = 'block';
                continue;
            }
            if (resultadoFiltro === 'error') {
                alertEl.className = 'alert alert-error';
                alertEl.textContent = '⚠️ No pudimos verificar esta foto: ' + (this._ultimoErrorFiltro || 'problema técnico desconocido') + '. Intenta de nuevo o prueba con otra imagen.';
                alertEl.style.display = 'block';
                continue;
            }
            var qrCheck = await this.fotoTieneQRProhibido(f);
            if (qrCheck.qrTexto) {
                console.log('🔎 QR detectado en la foto, contenido:', qrCheck.qrTexto);
            }
            if (qrCheck.resultado === 'rechazada') {
                alertEl.className = 'alert alert-error';
                alertEl.textContent = '🚫 Esta imagen contiene un código QR de pago o contacto externo, lo cual no está permitido. Coordina todo dentro de remarket-db.';
                alertEl.style.display = 'block';
                continue;
            }
            if (qrCheck.resultado === 'error') {
                alertEl.className = 'alert alert-error';
                alertEl.textContent = '⚠️ No pudimos verificar esta foto: ' + (this._ultimoErrorFiltro || 'problema técnico desconocido') + '. Intenta de nuevo o prueba con otra imagen.';
                alertEl.style.display = 'block';
                continue;
            }
            // Modo diagnóstico temporal: si se detectó un QR pero pasó la revisión, lo mostramos 3 segundos igual
            if (qrCheck.qrTexto) {
                alertEl.className = 'alert';
                alertEl.textContent = '🔎 QR detectado y revisado (contenido no prohibido): ' + qrCheck.qrTexto.substring(0, 80);
                alertEl.style.display = 'block';
                var alertElRef = alertEl;
                setTimeout(function() { alertElRef.style.display = 'none'; }, 4000);
            } else {
                alertEl.style.display = 'none';
            }
            this._fotosSeleccionadas.push(f);
            this.renderFotosPreview();
            // OCR: solo registra el texto encontrado, no bloquea nada (versión inicial mientras el tráfico es bajo)
            this.leerTextoDeImagen(f).then(function(texto) {
                if (texto) PanelUsuario._textoOCRAcumulado = (PanelUsuario._textoOCRAcumulado ? PanelUsuario._textoOCRAcumulado + '\n---\n' : '') + texto;
            });
        }
        this.renderFotosPreview();
    },
    quitarFotoPublicar: function(index) {
        this._fotosSeleccionadas.splice(index, 1);
        this.renderFotosPreview();
    },
    quitarFotoExistente: function(index) {
        this._fotosExistentesEdit.splice(index, 1);
        this.renderFotosPreview();
    },
    renderFotosPreview: function() {
        var cont = document.getElementById('pubFotosPreview');
        var self = this;
        var htmlExistentes = (this._fotosExistentesEdit || []).map(function(url, i) {
            return '<div style="position:relative;width:72px;height:72px;">' +
                '<img src="' + self.escHtml(url) + '" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--borde);">' +
                '<button type="button" onclick="PanelUsuario.quitarFotoExistente(' + i + ')" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#EF4444;color:#fff;border:none;font-size:12px;cursor:pointer;line-height:1;">✕</button>' +
                '</div>';
        }).join('');
        var html = htmlExistentes + this._fotosSeleccionadas.map(function(f, i) {
            var url = URL.createObjectURL(f);
            return '<div style="position:relative;width:72px;height:72px;">' +
                '<img src="' + url + '" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--borde);">' +
                '<button type="button" onclick="PanelUsuario.quitarFotoPublicar(' + i + ')" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#EF4444;color:#fff;border:none;font-size:12px;cursor:pointer;line-height:1;">✕</button>' +
                '</div>';
        }).join('');
        // Casilla "+" estilo Facebook para agregar más fotos, visible mientras no se llegue al máximo de 5
        if ((this._fotosExistentesEdit || []).length + this._fotosSeleccionadas.length < 5) {
            html += '<button type="button" onclick="document.getElementById(\'pubFotosInput\').click()" ' +
                'style="width:72px;height:72px;border-radius:8px;border:2px dashed var(--borde);background:var(--fondo-secundario);' +
                'display:flex;align-items:center;justify-content:center;font-size:28px;color:var(--purpura-ia);cursor:pointer;line-height:1;" ' +
                'title="Agregar foto">+</button>';
        }
        cont.innerHTML = html;
    },

    onTipoPublicacionChange: function() {
        var tipo = document.getElementById('pubTipo').value;
        document.getElementById('pubTipoOtroWrap').style.display = tipo === 'otro' ? 'block' : 'none';
        var esServicio = tipo === 'servicio';
        document.getElementById('pubModalidadWrap').style.display = esServicio ? 'none' : 'block';
        if (esServicio) {
            document.querySelector('input[name="pubAlcance"][value="local"]').checked = true;
            document.getElementById('pubAlcanceSugerido').textContent = '✨ Es un servicio: se recomienda Local (requiere presencia física)';
            document.getElementById('pubTruequeWrap').style.display = 'none';
        } else {
            this.onModalidadChange();
        }
        this.sugerirCategoria();
        this.sugerirAlcance();
    },

    onModalidadChange: function() {
        var modalidad = document.getElementById('pubModalidad').value;
        document.getElementById('pubPrecioWrap').style.display = modalidad === 'venta' ? 'block' : 'none';
        document.getElementById('pubTruequeWrap').style.display = modalidad === 'trueque' ? 'block' : 'none';
    },

    MAPA_CATEGORIAS: {
        'Tecnología': ['celular','iphone','android','laptop','computadora','tablet','audifono','tv','televisor','consola','playstation','xbox'],
        'Hogar': ['mueble','sofa','mesa','silla','refrigeradora','cocina','lavadora','microondas','decoracion'],
        'Ropa': ['camisa','polo','pantalon','zapato','zapatilla','casaca','vestido','chompa','ropa','correa','cartera','mochila','lentes','reloj','gorra','cinturon','bolso'],
        'Deportes': ['bicicleta','pesas','balon','pelota','raqueta','patines','gimnasio'],
        'Vehículos': ['auto','carro','moto','camioneta','vehiculo','placa'],
        'Agro': ['papa','uva','semilla','fruta','verdura','cosecha','ganado','abono'],
        'Servicios': ['reparacion','gasfitero','electricista','clases','asesoria','instalacion','mantenimiento'],
        'Libros': ['libro','novela','texto escolar','cuaderno']
    },

    sugerirCategoria: function() {
        var texto = ((document.getElementById('pubTitulo').value || '') + ' ' + (document.getElementById('pubDescripcion').value || '')).toLowerCase();
        if (!texto.trim()) { document.getElementById('pubCategoriaSugerida').textContent = ''; return; }
        var mejorCategoria = null;
        for (var cat in this.MAPA_CATEGORIAS) {
            var palabras = this.MAPA_CATEGORIAS[cat];
            for (var i = 0; i < palabras.length; i++) {
                if (texto.indexOf(palabras[i]) !== -1) { mejorCategoria = cat; break; }
            }
            if (mejorCategoria) break;
        }
        if (mejorCategoria) {
            document.getElementById('pubCategoria').value = mejorCategoria;
            document.getElementById('pubCategoriaSugerida').textContent = '✨ Categoría detectada: ' + mejorCategoria;
        } else {
            document.getElementById('pubCategoriaSugerida').textContent = '';
        }
    },

    sugerirAlcance: function() {
        var tipo = document.getElementById('pubTipo').value;
        if (tipo === 'servicio') return;
        var precio = parseFloat(document.getElementById('pubPrecio').value) || 0;
        var cantidadTexto = (document.getElementById('pubCantidad').value || '').toLowerCase();
        var esMayor = /contenedor|mayor|lote|tonelada|\d{3,}\s*unidades/.test(cantidadTexto);
        var sugeridoEl = document.getElementById('pubAlcanceSugerido');
        var valor = 'local', motivo = 'bajo valor o poco práctico de enviar lejos';
        if (esMayor) { valor = 'mundial'; motivo = 'venta al por mayor / alto volumen'; }
        else if (precio > 3000) { valor = 'mundial'; motivo = 'producto de alto valor'; }
        else if (precio > 500) { valor = 'regional'; motivo = 'valor medio, fácil de enviar'; }
        var radio = document.querySelector('input[name="pubAlcance"][value="' + valor + '"]');
        if (radio) radio.checked = true;
        sugeridoEl.textContent = '✨ La IA recomienda: ' + valor.charAt(0).toUpperCase() + valor.slice(1) + ' (' + motivo + ')';
    },

    // PASO 1: valida el formulario y muestra la Vista Previa (no publica todavía)
    ocultarPanelLateral: function() {
        var panel = document.getElementById('userPanelRight');
        if (panel) panel.style.display = 'none';
    },

    mostrarPanelLateral: function() {
        var panel = document.getElementById('userPanelRight');
        if (panel) panel.style.display = '';
    },

    mostrarVistaPreviaPublicacion: function() {
        var alertEl = document.getElementById('publicarAlert');
        function mostrarError(msg) { alertEl.className = 'alert alert-error'; alertEl.textContent = msg; alertEl.style.display = 'block'; }
        if (!usuarioActual) { mostrarError('Debes iniciar sesión'); return; }
        var tipo = document.getElementById('pubTipo').value;
        var titulo = document.getElementById('pubTitulo').value.trim();
        var descripcion = document.getElementById('pubDescripcion').value.trim();
        var categoria = document.getElementById('pubCategoria').value;
        var esServicio = tipo === 'servicio';
        var modalidad = esServicio ? 'servicio' : document.getElementById('pubModalidad').value;
        var precio = document.getElementById('pubPrecio').value ? parseFloat(document.getElementById('pubPrecio').value) : null;
        var cantidad = document.getElementById('pubCantidad').value.trim();
        var alcanceRadio = document.querySelector('input[name="pubAlcance"]:checked');
        var alcance = alcanceRadio ? alcanceRadio.value : 'local';
        var declaracion = document.getElementById('pubDeclaracionJurada').checked;

        if (!titulo) { mostrarError('El título es obligatorio'); return; }
        if (!esServicio && modalidad === 'venta' && !precio) { mostrarError('Ingresa un precio para la venta'); return; }
        if (!declaracion) { mostrarError('Debes aceptar la Declaración Jurada para publicar'); return; }
        var totalFotos = (this._fotosExistentesEdit || []).length + this._fotosSeleccionadas.length;
        if (totalFotos === 0) {
            var continuar = confirm('Estás publicando sin fotos. Las publicaciones con fotos reales generan más confianza y respuestas.\n\n¿Quieres continuar así de todos modos?');
            if (!continuar) return;
        }

        var descripcionFinal = descripcion;
        if (tipo === 'otro') {
            var tipoOtro = document.getElementById('pubTipoOtro').value.trim();
            if (tipoOtro) descripcionFinal = '[' + tipoOtro + '] ' + descripcionFinal;
        }
        if (cantidad) descripcionFinal += (descripcionFinal ? '\n\n' : '') + 'Cantidad/Volumen: ' + cantidad;
        if (!esServicio && modalidad === 'trueque') {
            var buscaCambio = document.getElementById('pubBuscaCambio').value.trim();
            if (buscaCambio) descripcionFinal += (descripcionFinal ? '\n' : '') + 'Busca a cambio: ' + buscaCambio;
        }

        // Guardamos los datos ya validados para usarlos si el usuario confirma
        this._datosPublicacionPendiente = { tipo: tipo, titulo: titulo, descripcionFinal: descripcionFinal, categoria: categoria, esServicio: esServicio, modalidad: modalidad, precio: precio, alcance: alcance };

        var nombreCompleto = ((usuarioActual.nombres || '') + ' ' + (usuarioActual.apellidos || '')).trim() || 'Usuario';
        var precioTexto = (!esServicio && modalidad === 'venta' && precio) ? ('S/ ' + precio) : (esServicio ? 'Servicio' : modalidad.charAt(0).toUpperCase() + modalidad.slice(1));
        var fotosExistentes = this._fotosExistentesEdit || [];
        var fotosNuevas = this._fotosSeleccionadas;
        var todasLasUrls = fotosExistentes.concat(fotosNuevas.map(function(f) { return URL.createObjectURL(f); }));
        var imagenHtml;
        if (todasLasUrls.length > 1) {
            imagenHtml = '<div class="feed-post-carousel">' +
                '<div class="feed-post-carousel-track" id="carruselTrack-vp" onscroll="PanelUsuario.actualizarDotsCarrusel(this)">' +
                todasLasUrls.map(function(u) { return '<img class="feed-post-image" src="' + u + '">'; }).join('') +
                '</div>' +
                '<button type="button" class="feed-post-carousel-arrow prev" onclick="PanelUsuario.moverCarrusel(\'vp\', -1)">‹</button>' +
                '<button type="button" class="feed-post-carousel-arrow next" onclick="PanelUsuario.moverCarrusel(\'vp\', 1)">›</button>' +
                '<div class="feed-post-carousel-dots">' + todasLasUrls.map(function(u, i) { return '<span class="dot' + (i === 0 ? ' active' : '') + '"></span>'; }).join('') + '</div>' +
                '</div>';
        } else if (todasLasUrls.length === 1) {
            imagenHtml = '<img src="' + todasLasUrls[0] + '" class="feed-post-image">';
        } else {
            imagenHtml = '<div style="padding:40px;text-align:center;color:var(--texto-terciario);">📷 Sin fotos</div>';
        }
        var videoHtml = '';
        if (this._videoVerificado) {
            var v = this._videoVerificado;
            videoHtml = '<a href="' + v.url + '" target="_blank" rel="noopener" style="display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--borde);border-radius:8px;margin-top:8px;text-decoration:none;color:inherit;">' +
                (v.miniatura ? '<img src="' + v.miniatura + '" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">' : '▶️') +
                '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">▶️ ' + this.escHtml(v.titulo) + '</div>' +
                '<div style="font-size:11px;color:var(--texto-secundario);">' + (v.plataforma === 'youtube' ? 'YouTube' : v.plataforma === 'tiktok' ? 'TikTok' : 'Instagram') + '</div></div></a>';
        }

        var esEdicion = !!this._editandoProductoId;
        var botonesHtml = esEdicion ?
            ('<button class="btn-cancelar" style="flex:1;min-width:120px;" onclick="PanelUsuario.editarDesdeVistaPrevia()">← Seguir editando</button>' +
             '<button class="btn-auth btn-auth-primary" id="btnVpConfirmar" style="flex:1;min-width:160px;" onclick="PanelUsuario.confirmarPublicacionFinal()">✅ Guardar cambios</button>')
            :
            ('<button class="btn-cancelar" style="flex:1;min-width:120px;" onclick="PanelUsuario.descartarPublicacion()">🗑️ Descartar</button>' +
             '<button class="btn-cancelar" style="flex:1;min-width:120px;" onclick="PanelUsuario.guardarComoBorrador()">💾 Guardar borrador</button>' +
             '<button class="btn-cancelar" style="flex:1;min-width:120px;" onclick="PanelUsuario.editarDesdeVistaPrevia()">← Editar</button>' +
             '<button class="btn-auth btn-auth-primary" id="btnVpConfirmar" style="flex:1;min-width:160px;" onclick="PanelUsuario.confirmarPublicacionFinal()">✅ Confirmar y Publicar</button>');

        var html = '<div style="max-width:540px;margin:0 auto;">' +
            '<div style="font-size:12px;color:var(--texto-secundario);margin-bottom:12px;display:flex;align-items:center;gap:6px;">👁️ <strong style="color:var(--texto-principal);">' + (esEdicion ? 'Vista Previa de tus cambios' : 'Vista Previa') + '</strong> — así se verá tu publicación. Revísala antes de confirmar.</div>' +
            '<div class="preview-compartir">' +
                '<div class="preview-compartir-header">' +
                    '<div class="preview-compartir-avatar">' + this.escHtml(nombreCompleto.charAt(0).toUpperCase()) + '</div>' +
                    '<div><div class="preview-compartir-nombre">' + this.escHtml(nombreCompleto) + '</div><div class="preview-compartir-fecha">Ahora</div></div>' +
                '</div>' +
                '<div id="vpImagen" class="preview-compartir-imagen">' + imagenHtml + '</div>' +
                videoHtml +
                '<div class="preview-compartir-body">' +
                    '<div class="preview-compartir-titulo">' + this.escHtml(titulo) + '</div>' +
                    '<div id="vpDescripcion" class="preview-compartir-desc">' + this.escHtml(descripcionFinal) + '</div>' +
                    '<div style="font-weight:700;color:var(--verde-eco);margin-top:6px;">' + this.escHtml(precioTexto) + '</div>' +
                '</div>' +
            '</div>' +
            '<div id="publicarAlertVp" class="alert" style="margin-top:12px;"></div>' +
            '<div class="modal-fb-botones" style="flex-wrap:wrap;gap:8px;margin-top:16px;">' + botonesHtml + '</div>' +
        '</div>';

        document.getElementById('vistaPreviaInline').innerHTML = html;
        document.getElementById('modalPublicar').style.display = 'none';
        document.getElementById('userFeedContainer').style.display = 'none';
        document.getElementById('vistaPreviaInline').style.display = 'block';

        // El asistente muestra contexto real de lo que se está publicando
        if (typeof UIController !== 'undefined' && UIController.mostrarRespuestaIA) {
            UIController.mostrarRespuestaIA('👁️ Estoy viendo tu publicación "' + titulo + '" — ' + precioTexto + ', categoría ' + categoria + ', con ' + todasLasUrls.length + (todasLasUrls.length === 1 ? ' foto' : ' fotos') + (this._videoVerificado ? ' y un video de ' + (this._videoVerificado.plataforma === 'youtube' ? 'YouTube' : 'TikTok') : '') + '. Si quieres que revise algo específico, pregúntame.', 'assistant');
        }
    },

    // PASO 2a: el usuario confirma, recién aquí se sube todo de verdad
    confirmarPublicacionFinal: async function() {
        var datos = this._datosPublicacionPendiente;
        if (!datos) return;
        var alertEl = document.getElementById('publicarAlertVp');
        function mostrarError(msg) { alertEl.className = 'alert alert-error'; alertEl.textContent = msg; alertEl.style.display = 'block'; }
        var btn = document.getElementById('btnVpConfirmar');
        var textoOriginal = btn.textContent;
        btn.textContent = '⏳ Subiendo fotos...';
        btn.disabled = true;
        try {
            // Se evalúa el riesgo legal ANTES de subir fotos o guardar nada,
            // así no gastamos almacenamiento en algo que vamos a bloquear.
            btn.textContent = '⏳ Revisando contenido...';
            var niveles = await this.evaluarNivelesAlerta(datos.titulo, datos.descripcionFinal, this._textoOCRAcumulado);

            if (niveles.nivel_legal === 'alto') {
                mostrarError('🚫 No puedo publicar esto porque el contenido está restringido en remarket-db. Publicamos artículos y servicios legales de compra, venta, trueque o donación — si quieres, cuéntame qué producto tienes y te ayudo a redactarlo.');
                if (typeof UIController !== 'undefined' && UIController.mostrarRespuestaIA) {
                    UIController.mostrarRespuestaIA('🚫 No puedo publicar "' + datos.titulo + '" porque está restringido por ley en remarket-db. Si quieres, cuéntame qué otro producto tienes y te ayudo a publicarlo.', 'assistant');
                }
                btn.textContent = textoOriginal;
                btn.disabled = false;
                return;
            }

            var fotos = (this._fotosExistentesEdit || []).slice();
            btn.textContent = '⏳ Subiendo fotos...';
            for (var i = 0; i < this._fotosSeleccionadas.length; i++) {
                var archivo = this._fotosSeleccionadas[i];
                var ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase();
                var path = 'productos/' + usuarioActual.id + '/' + Date.now() + '_' + i + '.' + ext;
                var { error: errSubida } = await supabase.storage.from('publicaciones').upload(path, archivo);
                if (errSubida) throw errSubida;
                var { data: urlData } = supabase.storage.from('publicaciones').getPublicUrl(path);
                fotos.push(urlData.publicUrl);
            }

            if (this._editandoProductoId) {
                btn.textContent = '⏳ Guardando cambios...';
                var { error } = await supabase.from('productos').update({
                    titulo: datos.titulo,
                    descripcion: datos.descripcionFinal,
                    categoria: datos.categoria,
                    modalidad: datos.modalidad,
                    precio: datos.precio,
                    alcance: datos.alcance,
                    fotos: fotos,
                    texto_ocr_fotos: this._textoOCRAcumulado || null,
                    nivel_alerta_ocr: niveles.nivel_ocr,
                    nivel_alerta_legal: niveles.nivel_legal,
                    video_plataforma: this._videoVerificado ? this._videoVerificado.plataforma : null,
                    video_url: this._videoVerificado ? this._videoVerificado.url : null,
                    video_titulo: this._videoVerificado ? this._videoVerificado.titulo : null,
                    video_miniatura: this._videoVerificado ? this._videoVerificado.miniatura : null
                }).eq('id', this._editandoProductoId).eq('usuario_id', usuarioActual.id);
                if (error) throw error;
                this.volverAlFeedDesdeVistaPrevia();
                this.mostrarToast('✅ Cambios guardados.');
                this.limpiarFormularioPublicar();
                this._datosPublicacionPendiente = null;
                this.cargarMisPublicaciones();
            } else {
                btn.textContent = '⏳ Publicando...';
                var { error } = await supabase.from('productos').insert({
                    usuario_id: usuarioActual.id,
                    titulo: datos.titulo,
                    descripcion: datos.descripcionFinal,
                    categoria: datos.categoria,
                    modalidad: datos.modalidad,
                    precio: datos.precio,
                    moneda: 'PEN',
                    ciudad: (typeof UbicacionUsuario !== 'undefined' && UbicacionUsuario.ciudad) ? UbicacionUsuario.ciudad : null,
                    pais: (typeof UbicacionUsuario !== 'undefined' && UbicacionUsuario.pais) ? UbicacionUsuario.pais : null,
                    alcance: datos.alcance,
                    fotos: fotos,
                    estado: 'aprobado', // auto-aprobado: no hay Panel de Moderador todavía (queda pendiente para más adelante)
                    ia_scan_status: 'pendiente',
                    acepto_declaracion_jurada: true,
                    fecha_aceptacion_jurada: new Date().toISOString(),
                    texto_ocr_fotos: this._textoOCRAcumulado || null,
                    nivel_alerta_ocr: niveles.nivel_ocr,
                    nivel_alerta_legal: niveles.nivel_legal,
                    video_plataforma: this._videoVerificado ? this._videoVerificado.plataforma : null,
                    video_url: this._videoVerificado ? this._videoVerificado.url : null,
                    video_titulo: this._videoVerificado ? this._videoVerificado.titulo : null,
                    video_miniatura: this._videoVerificado ? this._videoVerificado.miniatura : null
                });
                if (error) throw error;
                this.volverAlFeedDesdeVistaPrevia();
                this.mostrarToast('✅ ¡Publicación creada y ya visible en el feed!');
                this.limpiarFormularioPublicar();
                this._datosPublicacionPendiente = null;
                this.cargarFeed();
            }
        } catch (e) {
            mostrarError('Error al publicar: ' + (e.message || 'Intenta de nuevo'));
        } finally {
            btn.disabled = false;
            btn.textContent = textoOriginal;
        }
    },

    // Vuelve del área de Vista Previa al feed normal (dentro del panel central, sin modales)
    volverAlFeedDesdeVistaPrevia: function() {
        document.getElementById('vistaPreviaInline').style.display = 'none';
        document.getElementById('vistaPreviaInline').innerHTML = '';
        document.getElementById('userFeedContainer').style.display = '';
    },

    // PASO 2b: el usuario quiere seguir editando el formulario
    editarDesdeVistaPrevia: function() {
        this.volverAlFeedDesdeVistaPrevia();
        document.getElementById('modalPublicar').style.display = 'flex';
    },

    // PASO 2c: el usuario descarta todo lo escrito
    descartarPublicacion: function() {
        var seguro = confirm('¿Seguro que quieres descartar esta publicación? Se perderá todo lo que escribiste.');
        if (!seguro) return;
        this.volverAlFeedDesdeVistaPrevia();
        this.limpiarFormularioPublicar();
        this._datosPublicacionPendiente = null;
        this.cerrarModalPublicar();
    },

    // PASO 2d: guardar como borrador de verdad
    guardarComoBorrador: async function() {
        var datos = this._datosPublicacionPendiente;
        if (!datos) return;
        var alertEl = document.getElementById('publicarAlertVp');
        var botones = document.querySelectorAll('.modal-fb-botones button');
        botones.forEach(function(b) { b.disabled = true; });
        try {
            var fotos = [];
            for (var i = 0; i < this._fotosSeleccionadas.length; i++) {
                var archivo = this._fotosSeleccionadas[i];
                var ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase();
                var path = 'productos/' + usuarioActual.id + '/' + Date.now() + '_' + i + '.' + ext;
                var { error: errSubida } = await supabase.storage.from('publicaciones').upload(path, archivo);
                if (errSubida) throw errSubida;
                var { data: urlData } = supabase.storage.from('publicaciones').getPublicUrl(path);
                fotos.push(urlData.publicUrl);
            }
            var { error } = await supabase.from('productos').insert({
                usuario_id: usuarioActual.id,
                titulo: datos.titulo,
                descripcion: datos.descripcionFinal,
                categoria: datos.categoria,
                modalidad: datos.modalidad,
                precio: datos.precio,
                moneda: 'PEN',
                ciudad: (typeof UbicacionUsuario !== 'undefined' && UbicacionUsuario.ciudad) ? UbicacionUsuario.ciudad : null,
                pais: (typeof UbicacionUsuario !== 'undefined' && UbicacionUsuario.pais) ? UbicacionUsuario.pais : null,
                alcance: datos.alcance,
                fotos: fotos,
                estado: 'borrador',
                ia_scan_status: 'pendiente',
                acepto_declaracion_jurada: true,
                fecha_aceptacion_jurada: new Date().toISOString(),
                texto_ocr_fotos: this._textoOCRAcumulado || null,
                video_plataforma: this._videoVerificado ? this._videoVerificado.plataforma : null,
                video_url: this._videoVerificado ? this._videoVerificado.url : null,
                video_titulo: this._videoVerificado ? this._videoVerificado.titulo : null,
                video_miniatura: this._videoVerificado ? this._videoVerificado.miniatura : null
            });
            if (error) throw error;
            this.volverAlFeedDesdeVistaPrevia();
            this.mostrarToast('💾 Guardado como borrador. Puedes retomarlo en "Mis Publicaciones".');
            this.limpiarFormularioPublicar();
            this._datosPublicacionPendiente = null;
            this.cerrarModalPublicar();
        } catch (e) {
            if (alertEl) { alertEl.className = 'alert alert-error'; alertEl.textContent = 'Error al guardar borrador: ' + (e.message || 'intenta de nuevo'); alertEl.style.display = 'block'; }
        } finally {
            botones.forEach(function(b) { b.disabled = false; });
        }
    },

    limpiarFormularioPublicar: function() {
        document.getElementById('pubTipo').value = 'producto';
        document.getElementById('pubTitulo').value = '';
        document.getElementById('pubTituloContador').textContent = '0/100';
        document.getElementById('pubDescripcion').value = '';
        document.getElementById('pubDescripcionContador').textContent = '0/500';
        document.getElementById('pubCategoria').value = 'Tecnología';
        document.getElementById('pubModalidad').value = 'venta';
        document.getElementById('pubPrecio').value = '';
        document.getElementById('pubCantidad').value = '';
        document.getElementById('pubBuscaCambio').value = '';
        document.getElementById('pubTipoOtro').value = '';
        document.querySelector('input[name="pubAlcance"][value="local"]').checked = true;
        document.getElementById('pubDeclaracionJurada').checked = false;
        document.getElementById('btnPublicarSubmit').disabled = true;
        document.getElementById('pubVideoUrl').value = '';
        document.getElementById('pubVideoPreview').innerHTML = '';
        this._videoVerificado = null;
        this._fotosSeleccionadas = [];
        this._fotosExistentesEdit = [];
        this._editandoProductoId = null;
        document.getElementById('modalPublicarTitulo').textContent = '📦 Publicar';
        this._textoOCRAcumulado = '';
        this.renderFotosPreview();
        this.onTipoPublicacionChange();
    },

    // === CHAT === [FASE 6 - Chat con Moderación + Traducción]
    cargarConversaciones: async function(convIdAbrir, modo) {
        modo = modo || 'panel';
        this._modoChatActivo = modo;
        if (!usuarioActual) { toggleAuthModal(true); return; }
        var container = document.getElementById(modo === 'flotante' ? 'floatMsgBody' : 'userFeedContainer');
        if (!container) return;
        if (modo === 'panel' && this._scrollObserver) this._scrollObserver.disconnect();
        container.innerHTML = '<div class="feed-loading"><div class="search-loading-spinner"></div><p>Cargando tus mensajes...</p></div>';
        try {
            var { data: convs, error } = await supabase.from('conversaciones').select('*').or('comprador_id.eq.' + usuarioActual.id + ',vendedor_id.eq.' + usuarioActual.id).order('updated_at', { ascending: false });
            if (error) throw error;
            convs = convs || [];
            this._conversacionesCache = convs;
            var prefijoItem = modo === 'flotante' ? 'floatConvItem-' : 'convItem-';

            if (!convs.length) {
                container.innerHTML = (modo === 'panel' ? '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><button class="btn-auth btn-auth-primary" style="width:auto;padding:8px 16px;" onclick="PanelUsuario.abrirModalNuevoMensaje()">✉️ Nuevo mensaje</button></div>' : '') +
                    '<div class="feed-empty"><div style="font-size:48px;margin-bottom:12px;">💬</div><h3 style="color:var(--texto-principal);margin-bottom:8px;">Sin conversaciones todavía</h3><p>Cuando compartas o te escriban sobre una publicación, aparecerá aquí.</p></div>';
                return;
            }

            var listaHtml = '';
            for (var i = 0; i < convs.length; i++) {
                var c = convs[i];
                var otroId = c.comprador_id === usuarioActual.id ? c.vendedor_id : c.comprador_id;
                var otro = await this.obtenerAutor(otroId);
                var nombreOtro = otro ? ((otro.nombres || '') + ' ' + (otro.apellidos || '')).trim() : 'Usuario';
                var fotoOtro = otro ? otro.foto_perfil : '';
                var producto = null;
                if (c.producto_id) { var r = await supabase.from('productos').select('titulo').eq('id', c.producto_id).maybeSingle(); producto = r.data; }
                var { data: ultimosMsjs } = await supabase.from('mensajes').select('*').eq('conversacion_id', c.id).order('created_at', { ascending: false }).limit(1);
                var ultimo = ultimosMsjs && ultimosMsjs[0];
                var { count: noLeidos } = await supabase.from('mensajes').select('id', { count: 'exact', head: true }).eq('conversacion_id', c.id).eq('leido', false).neq('emisor_id', usuarioActual.id);
                var avatarHtml = fotoOtro ? `<img src="${fotoOtro}" alt="${nombreOtro}">` : (nombreOtro.charAt(0).toUpperCase() || 'U');
                listaHtml += '<div class="conv-item" id="' + prefijoItem + c.id + '" onclick="PanelUsuario.abrirConversacion(\'' + c.id + '\', \'' + modo + '\')">' +
                    '<div class="conv-avatar">' + avatarHtml + '</div>' +
                    '<div class="conv-info"><div class="conv-name">' + this.escHtml(nombreOtro) + (noLeidos ? ' <span class="conv-badge">' + noLeidos + '</span>' : '') + '</div>' +
                    '<div class="conv-producto">' + this.escHtml(producto ? producto.titulo : 'Mensaje directo') + '</div>' +
                    '<div class="conv-preview">' + (ultimo ? this.escHtml((ultimo.texto_original || '').substring(0, 60)) : 'Sin mensajes aún') + '</div></div></div>';
            }

            var ctx = this._ctxChat(modo);
            var html = (modo === 'panel' ? '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><button class="btn-auth btn-auth-primary" style="width:auto;padding:8px 16px;" onclick="PanelUsuario.abrirModalNuevoMensaje()">✉️ Nuevo mensaje</button></div>' : '') +
                '<div class="messenger-layout" id="' + ctx.layout + '">' +
                '<div class="messenger-list"><div class="conv-list">' + listaHtml + '</div></div>' +
                '<div class="messenger-chat-panel" id="' + ctx.chatPanel + '">' +
                '<div class="messenger-vacio"><div style="font-size:40px;">💬</div><p>Selecciona una conversación para empezar a chatear.</p></div>' +
                '</div></div>';
            container.innerHTML = html;
            this.actualizarBadgesMensajes();

            if (convIdAbrir) this.abrirConversacion(convIdAbrir, modo);
        } catch (e) {
            console.warn('Error cargando conversaciones:', e);
            container.innerHTML = '<div class="feed-empty"><p>No se pudieron cargar tus mensajes.</p></div>';
        }
    },

    // Devuelve los IDs de los elementos según dónde se está mostrando el chat:
    // dentro del panel "Mensajes" (panel) o en la ventana flotante tipo Facebook (flotante)
    _ctxChat: function(modo) {
        if (modo === 'flotante') return { layout: 'floatMsgLayout', chatPanel: 'floatMsgChatPanel', messages: 'floatChatMessages', input: 'floatChatInput', escribiendo: 'floatChatEscribiendo', modAlert: 'floatChatModAlert', buscarRow: 'floatChatBuscarRow', buscarInput: 'floatChatBuscarInput', fotoInput: 'floatChatFotoInput' };
        return { layout: 'messengerLayout', chatPanel: 'messengerChatPanel', messages: 'chatMessages', input: 'chatInput', escribiendo: 'chatEscribiendo', modAlert: 'chatModAlert', buscarRow: 'chatBuscarRow', buscarInput: 'chatBuscarInput', fotoInput: 'chatFotoInput' };
    },

    volverListaConversaciones: function(modo) {
        var ctx = this._ctxChat(modo || this._modoChatActivo);
        var layout = document.getElementById(ctx.layout);
        if (layout) layout.classList.remove('chat-activo');
        if (this._canalConversacionActivo) { supabase.removeChannel(this._canalConversacionActivo); this._canalConversacionActivo = null; }
        this._conversacionAbiertaId = null;
    },

    abrirConversacion: async function(convId, modo) {
        modo = modo || 'panel';
        this._modoChatActivo = modo;
        var ctx = this._ctxChat(modo);
        var panel = document.getElementById(ctx.chatPanel);
        if (!panel) { this.cargarConversaciones(convId, modo); return; } // si aún no está el layout (ej: recién entrando), lo carga primero
        var layout = document.getElementById(ctx.layout);
        if (layout) layout.classList.add('chat-activo'); // en celular (o en la ventana flotante), muestra el chat y oculta la lista
        document.querySelectorAll('.conv-item.activo').forEach(function(el) { el.classList.remove('activo'); });
        var itemActivo = document.getElementById((modo === 'flotante' ? 'floatConvItem-' : 'convItem-') + convId);
        if (itemActivo) itemActivo.classList.add('activo');
        panel.innerHTML = '<div class="feed-loading"><div class="search-loading-spinner"></div><p>Cargando conversación...</p></div>';
        try {
            var { data: conv } = await supabase.from('conversaciones').select('*').eq('id', convId).maybeSingle();
            if (!conv) { panel.innerHTML = '<div class="feed-empty"><p>Conversación no encontrada.</p></div>'; return; }
            var otroId = conv.comprador_id === usuarioActual.id ? conv.vendedor_id : conv.comprador_id;
            var otro = await this.obtenerAutor(otroId);
            var nombreOtro = otro ? ((otro.nombres || '') + ' ' + (otro.apellidos || '')).trim() : 'Usuario';
            var fotoOtro = otro ? otro.foto_perfil : '';
            var producto = null;
            if (conv.producto_id) { var rp = await supabase.from('productos').select('titulo').eq('id', conv.producto_id).maybeSingle(); producto = rp.data; }

            await supabase.from('mensajes').update({ leido: true }).eq('conversacion_id', convId).neq('emisor_id', usuarioActual.id).eq('leido', false);
            this.actualizarBadgesMensajes();
            var itemActivo2 = document.getElementById((modo === 'flotante' ? 'floatConvItem-' : 'convItem-') + convId);
            if (itemActivo2) { var badge = itemActivo2.querySelector('.conv-badge'); if (badge) badge.remove(); }

            var { data: mensajes } = await supabase.from('mensajes').select('*').eq('conversacion_id', convId).order('created_at', { ascending: true });
            this._conversacionAbiertaId = convId;
            this._otroIdConversacionAbierta = otroId;
            this._mensajesActuales = mensajes || [];
            this._otroInfoActual = { nombre: nombreOtro, foto: fotoOtro }; // para poder mostrar su avatar en mensajes que lleguen en vivo
            var traduccionActivaMsgs = this.tieneTraduccionChatActiva();
            var msgsHtml = this._mensajesActuales.map(function(m, i) {
                var siguiente = PanelUsuario._mensajesActuales[i + 1];
                var anterior = PanelUsuario._mensajesActuales[i - 1];
                var agrupado = anterior && anterior.emisor_id === m.emisor_id && !anterior.eliminado;
                var mostrarAvatar = !siguiente || siguiente.emisor_id !== m.emisor_id; // último de su tanda
                return PanelUsuario._renderBurbuja(m, traduccionActivaMsgs, { agrupado: agrupado, mostrarAvatar: mostrarAvatar, fotoOtro: fotoOtro, nombreOtro: nombreOtro });
            }).join('');

            var avatarHtml = fotoOtro ? `<img src="${fotoOtro}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">` : (nombreOtro.charAt(0).toUpperCase() || 'U');
            var enLinea = otro && otro.ultima_conexion && (Date.now() - new Date(otro.ultima_conexion).getTime() < 120000);
            var dotOnlineHtml = enLinea ? '<span class="dot-online"></span>' : '';
            var estadoConexionHtml = enLinea ? '<span style="color:#31A24C;">En línea</span>' : '<span id="estadoConexionOtro">Última vez: ' + this.tiempoRelativo(otro ? otro.ultima_conexion : null) + '</span>';
            var traduccionActiva = this.tieneTraduccionChatActiva();
            var volverBtn = modo === 'flotante' ? '<button class="chat-back-btn" onclick="PanelUsuario.volverListaConversaciones(\'flotante\')" title="Ver lista">←</button>' : '<button class="chat-back-btn messenger-back-movil" onclick="PanelUsuario.volverListaConversaciones()">← Volver</button>';

            panel.innerHTML = '<div class="chat-header">' + volverBtn +
                '<div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;"><div class="chat-header-avatar-wrap"><div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg, var(--purpura-ia), var(--azul-confianza));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;overflow:hidden;">' + avatarHtml + '</div>' + dotOnlineHtml + '</div>' +
                '<div style="min-width:0;"><strong>' + this.escHtml(nombreOtro) + '</strong><div style="font-size:12px;color:var(--texto-terciario);" id="' + ctx.chatPanel + '_estadoLinea">' + estadoConexionHtml + ' · ' + this.escHtml(producto ? producto.titulo : 'Mensaje directo') + '</div></div></div>' +
                '<button type="button" title="Buscar en la conversación" onclick="PanelUsuario.toggleBuscarEnChat(\'' + modo + '\')" style="background:none;border:none;font-size:16px;cursor:pointer;padding:6px;">🔍</button>' +
                '<button type="button" title="' + (traduccionActiva ? 'Desactivar traducción automática' : 'Activar traducción automática') + '" onclick="PanelUsuario.toggleTraduccionChat(\'' + convId + '\', \'' + otroId + '\')" style="background:none;border:none;font-size:18px;cursor:pointer;padding:6px;opacity:' + (traduccionActiva ? '1' : '0.4') + ';" >🌐</button>' +
                '<button type="button" title="Reportar usuario" onclick="PanelUsuario.abrirModalReportarUsuario(\'' + otroId + '\', \'' + this.escHtml(nombreOtro) + '\')" style="background:none;border:none;font-size:16px;cursor:pointer;padding:6px;">🚩</button>' +
                '<button type="button" title="Bloquear usuario" onclick="PanelUsuario.toggleBloqueado(\'' + otroId + '\')" style="background:none;border:none;font-size:16px;cursor:pointer;padding:6px;">🚫</button>' +
                '</div>' +
                '<div id="' + ctx.buscarRow + '" style="display:none;padding:8px 12px;border-bottom:1px solid var(--borde);"><input type="text" id="' + ctx.buscarInput + '" class="form-input" placeholder="Buscar en esta conversación..." oninput="PanelUsuario.buscarEnChatAbierto(this.value, \'' + modo + '\')"></div>' +
                '<div class="chat-messages" id="' + ctx.messages + '">' + (msgsHtml || '<p style="text-align:center;color:var(--texto-terciario);font-size:13px;margin-top:20px;">Aún no hay mensajes. ¡Escribe el primero!</p>') + '</div>' +
                '<div id="' + ctx.escribiendo + '" style="display:none;padding:0 12px;font-size:12px;color:var(--texto-terciario);">✍️ ' + this.escHtml(nombreOtro) + ' está escribiendo...</div>' +
                '<div id="' + ctx.modAlert + '" class="alert" style="margin:0 12px;"></div>' +
                '<div class="chat-input-row">' +
                '<input type="file" id="' + ctx.fotoInput + '" accept="image/*" style="display:none;" onchange="PanelUsuario.enviarFotoChat(\'' + convId + '\', \'' + otroId + '\', this.files[0], \'' + modo + '\')">' +
                '<button type="button" title="Enviar foto" onclick="document.getElementById(\'' + ctx.fotoInput + '\').click()" style="background:none;border:none;font-size:18px;cursor:pointer;padding:0 8px;">📷</button>' +
                '<input type="text" id="' + ctx.input + '" class="form-input" placeholder="Escribe un mensaje..." oninput="PanelUsuario.avisarEscribiendo(\'' + modo + '\'); PanelUsuario.actualizarBotonEnvio(\'' + modo + '\');" onkeydown="if(event.key===\'Enter\'){PanelUsuario.enviarMensajeChat(\'' + convId + '\',\'' + otroId + '\',\'' + modo + '\')}">' +
                '<button class="btn-auth btn-auth-primary btn-envio-chat" id="' + ctx.input + '_btnEnvio" style="width:auto;padding:10px 18px;" onclick="PanelUsuario.enviarLikeORaTexto(\'' + convId + '\', \'' + otroId + '\', \'' + modo + '\')"><span class="icono-envio">👍</span></button></div>';

            var msgsBox = document.getElementById(ctx.messages);
            if (msgsBox) msgsBox.scrollTop = msgsBox.scrollHeight;
            this._activarCanalConversacion(convId, modo);
        } catch (e) {
            console.warn('Error cargando conversación:', e);
            panel.innerHTML = '<div class="feed-empty"><p>No se pudo cargar la conversación.</p></div>';
        }
    },

    // --- Mejora 1: canal en vivo de la conversación abierta (mensajes nuevos + "escribiendo...") ---
    _canalConversacionActivo: null,
    _activarCanalConversacion: function(convId, modo) {
        var ctx = this._ctxChat(modo);
        if (this._canalConversacionActivo) supabase.removeChannel(this._canalConversacionActivo);
        this._canalConversacionActivo = supabase.channel('conv-' + convId)
            .on('broadcast', { event: 'escribiendo' }, function(payload) {
                if (payload.payload.userId === usuarioActual.id) return;
                var el = document.getElementById(ctx.escribiendo);
                if (!el) return;
                el.style.display = 'block';
                clearTimeout(PanelUsuario._timeoutEscribiendo);
                PanelUsuario._timeoutEscribiendo = setTimeout(function() { el.style.display = 'none'; }, 3000);
            })
            .subscribe();
    },
    _timeoutEscribiendo: null,
    _timeoutAvisoEscribiendo: null,
    avisarEscribiendo: function(modo) {
        if (!this._canalConversacionActivo || this._timeoutAvisoEscribiendo) return; // se avisa como máximo cada 2.5s
        this._canalConversacionActivo.send({ type: 'broadcast', event: 'escribiendo', payload: { userId: usuarioActual.id } });
        this._timeoutAvisoEscribiendo = setTimeout(function() { PanelUsuario._timeoutAvisoEscribiendo = null; }, 2500);
    },

    // Botón del chat estilo Messenger: 👍 cuando el campo está vacío, ✈️ enviar cuando hay texto escrito
    actualizarBotonEnvio: function(modo) {
        var ctx = this._ctxChat(modo || this._modoChatActivo);
        var input = document.getElementById(ctx.input);
        var btn = document.getElementById(ctx.input + '_btnEnvio');
        if (!input || !btn) return;
        var icono = btn.querySelector('.icono-envio');
        if (input.value.trim()) { icono.textContent = ''; icono.className = 'icono-envio fas fa-paper-plane'; }
        else { icono.className = 'icono-envio'; icono.textContent = '👍'; }
    },
    enviarLikeORaTexto: function(convId, otroId, modo) {
        var ctx = this._ctxChat(modo || this._modoChatActivo);
        var input = document.getElementById(ctx.input);
        if (input && !input.value.trim()) input.value = '👍';
        this.enviarMensajeChat(convId, otroId, modo);
        this.actualizarBotonEnvio(modo);
    },

    // Pinta un mensaje nuevo que llegó por Realtime sin recargar toda la conversación
    agregarMensajeEnVivo: function(m, modo) {
        var ctx = this._ctxChat(modo || this._modoChatActivo);
        var ultimoAnterior = this._mensajesActuales[this._mensajesActuales.length - 1];
        var agrupado = ultimoAnterior && ultimoAnterior.emisor_id === m.emisor_id && !ultimoAnterior.eliminado;
        this._mensajesActuales.push(m);
        var box = document.getElementById(ctx.messages);
        if (!box) return;
        var vacio = box.querySelector('p');
        if (vacio) box.innerHTML = '';
        // Si el mensaje anterior mostraba el avatar (por ser el último de su tanda), se lo quitamos:
        // ahora este mensaje nuevo pasa a ser el último, así que el avatar le corresponde a él.
        if (agrupado) {
            var filaAnterior = box.querySelector('.chat-bubble-row[data-msg-id="' + ultimoAnterior.id + '"]');
            if (filaAnterior) {
                var avatarPrevio = filaAnterior.querySelector('.msg-avatar');
                if (avatarPrevio) avatarPrevio.outerHTML = '<div class="msg-avatar-spacer"></div>';
            }
        }
        var info = this._otroInfoActual || {};
        box.insertAdjacentHTML('beforeend', this._renderBurbuja(m, this.tieneTraduccionChatActiva(), { agrupado: agrupado, mostrarAvatar: true, fotoOtro: info.foto, nombreOtro: info.nombre }));
        box.scrollTop = box.scrollHeight;
        var elEscribiendo = document.getElementById(ctx.escribiendo);
        if (elEscribiendo) elEscribiendo.style.display = 'none';
    },

    // Arma el HTML de una burbuja de mensaje (texto o foto), con acciones de editar/borrar si es mío
    _renderBurbuja: function(m, traduccionActivaMsgs, opts) {
        opts = opts || {};
        var esMio = m.emisor_id === usuarioActual.id;
        var hora = m.created_at ? new Date(m.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '';
        var checkHtml = esMio ? '<span class="chat-bubble-check' + (m.leido ? ' leido' : '') + '">' + (m.leido ? '✓✓' : '✓') + '</span>' : '';
        var claseFila = 'chat-bubble-row ' + (esMio ? 'mio' : 'otro') + (opts.agrupado ? ' agrupado' : '');
        // El avatar del otro usuario solo se muestra en el último mensaje de cada tanda seguida (estilo Messenger)
        var avatarHtml = '';
        if (!esMio) {
            if (opts.mostrarAvatar) {
                avatarHtml = opts.fotoOtro ? '<img src="' + opts.fotoOtro + '" class="msg-avatar">' : '<div class="msg-avatar">' + (opts.nombreOtro ? opts.nombreOtro.charAt(0).toUpperCase() : 'U') + '</div>';
            } else {
                avatarHtml = '<div class="msg-avatar-spacer"></div>';
            }
        }
        if (m.eliminado) {
            return '<div class="' + claseFila + '" data-msg-id="' + m.id + '">' + avatarHtml + '<div><div class="chat-bubble" style="font-style:italic;opacity:0.6;">🚫 Mensaje eliminado</div><div class="chat-bubble-hora">' + hora + checkHtml + '</div></div></div>';
        }
        var contenidoHtml;
        if (m.imagen_url) {
            contenidoHtml = '<div class="chat-bubble" style="padding:4px;"><img src="' + m.imagen_url + '" style="max-width:200px;border-radius:8px;display:block;cursor:pointer;" onclick="window.open(\'' + m.imagen_url + '\',\'_blank\')"></div>';
        } else if (m.texto_original === '👍' || m.texto_original === '👍 Me gusta') {
            contenidoHtml = '<div class="chat-bubble" style="background:transparent;font-size:40px;padding:0;">👍</div>';
        } else {
            var textoMostrar = m.texto_original;
            if (!esMio && traduccionActivaMsgs && m.texto_traducido && m.idioma_destino === (usuarioActual.idioma_preferido || 'es')) textoMostrar = m.texto_traducido;
            var traducidoHtml = (!esMio && textoMostrar === m.texto_traducido && m.idioma_original) ? '<div style="font-size:11px;color:var(--texto-terciario);margin-top:2px;">Traducido del ' + this.escHtml(this.NOMBRES_IDIOMAS[m.idioma_original] || m.idioma_original) + '</div>' : '';
            var editadoHtml = m.editado ? ' <span style="font-size:11px;opacity:0.6;">(editado)</span>' : '';
            contenidoHtml = '<div class="chat-bubble">' + this.escHtml(textoMostrar) + editadoHtml + '</div>' + traducidoHtml;
        }
        var accionesHtml = (esMio && !m.imagen_url) ? '<div class="chat-bubble-acciones" style="display:flex;gap:6px;font-size:11px;opacity:0.6;">' +
            '<span style="cursor:pointer;" onclick="PanelUsuario.editarMensajeChat(\'' + m.id + '\')">✏️</span>' +
            '<span style="cursor:pointer;" onclick="PanelUsuario.borrarMensajeChat(\'' + m.id + '\')">🗑️</span></div>' : '';
        return '<div class="' + claseFila + '" data-msg-id="' + m.id + '" data-texto="' + this.escHtml((m.texto_original || '').toLowerCase()) + '">' + avatarHtml + '<div>' + contenidoHtml + '<div class="chat-bubble-hora">' + hora + checkHtml + '</div>' + accionesHtml + '</div></div>';
    },


    // --- Mejora 6: buscar dentro de la conversación abierta ---
    toggleBuscarEnChat: function(modo) {
        var ctx = this._ctxChat(modo || this._modoChatActivo);
        var row = document.getElementById(ctx.buscarRow);
        if (!row) return;
        var mostrar = row.style.display === 'none';
        row.style.display = mostrar ? 'block' : 'none';
        if (mostrar) { document.getElementById(ctx.buscarInput).focus(); } else { this.buscarEnChatAbierto('', modo); }
    },
    buscarEnChatAbierto: function(texto, modo) {
        var ctx = this._ctxChat(modo || this._modoChatActivo);
        var q = (texto || '').toLowerCase().trim();
        document.querySelectorAll('#' + ctx.messages + ' .chat-bubble-row').forEach(function(row) {
            var coincide = !q || (row.dataset.texto || '').indexOf(q) !== -1;
            row.style.display = coincide ? '' : 'none';
        });
    },

    // --- Mejora 3: enviar foto en el chat ---
    enviarFotoChat: async function(convId, otroId, archivo, modo) {
        if (!archivo) return;
        var ctx = this._ctxChat(modo || this._modoChatActivo);
        var alertEl = document.getElementById(ctx.modAlert);
        try {
            alertEl.className = 'alert';
            alertEl.textContent = '⏳ Enviando foto...';
            alertEl.style.display = 'block';
            var ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase();
            var path = 'chat/' + usuarioActual.id + '/' + Date.now() + '.' + ext;
            var { error: errSubida } = await supabase.storage.from('publicaciones').upload(path, archivo);
            if (errSubida) throw errSubida;
            var { data: urlData } = supabase.storage.from('publicaciones').getPublicUrl(path);
            var { data: nuevoMsg, error } = await supabase.from('mensajes').insert({ conversacion_id: convId, emisor_id: usuarioActual.id, imagen_url: urlData.publicUrl, texto_original: '📷 Foto', leido: false }).select().single();
            if (error) throw error;
            alertEl.style.display = 'none';
            this.agregarMensajeEnVivo(nuevoMsg, modo);
            await supabase.from('conversaciones').update({ updated_at: new Date().toISOString() }).eq('id', convId);
        } catch (e) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = '❌ No se pudo enviar la foto. Intenta de nuevo.';
            alertEl.style.display = 'block';
        }
    },

    // --- Mejora 7: editar / borrar un mensaje propio ---
    editarMensajeChat: async function(msgId) {
        var msg = (this._mensajesActuales || []).find(function(m) { return m.id === msgId; });
        if (!msg) return;
        var nuevoTexto = prompt('Editar mensaje:', msg.texto_original);
        if (nuevoTexto === null || !nuevoTexto.trim() || nuevoTexto === msg.texto_original) return;
        var { error } = await supabase.from('mensajes').update({ texto_original: nuevoTexto.trim(), editado: true }).eq('id', msgId);
        if (error) { this.mostrarToast('No se pudo editar el mensaje.'); return; }
        msg.texto_original = nuevoTexto.trim();
        msg.editado = true;
        var row = document.querySelector('.chat-bubble-row[data-msg-id="' + msgId + '"]');
        if (row) row.outerHTML = this._renderBurbuja(msg, this.tieneTraduccionChatActiva());
    },
    borrarMensajeChat: async function(msgId) {
        if (!confirm('¿Eliminar este mensaje para ambos?')) return;
        var { error } = await supabase.from('mensajes').update({ eliminado: true }).eq('id', msgId);
        if (error) { this.mostrarToast('No se pudo eliminar el mensaje.'); return; }
        var msg = (this._mensajesActuales || []).find(function(m) { return m.id === msgId; });
        if (msg) msg.eliminado = true;
        var row = document.querySelector('.chat-bubble-row[data-msg-id="' + msgId + '"]');
        if (row && msg) row.outerHTML = this._renderBurbuja(msg, this.tieneTraduccionChatActiva());
    },


    NOMBRES_IDIOMAS: { 'en': 'inglés', 'pt': 'portugués', 'fr': 'francés', 'de': 'alemán', 'it': 'italiano', 'zh': 'chino', 'ja': 'japonés', 'ko': 'coreano', 'ar': 'árabe', 'hi': 'hindi', 'nl': 'holandés', 'tr': 'turco', 'es': 'español' },

    // Micro-Paso 6.2: Declaración Jurada de Chat
    tieneDeclaracionChatAceptada: function() {
        try { return localStorage.getItem('chat_declaracion_aceptada') === 'true'; } catch (e) { return false; }
    },
    aceptarDeclaracionChat: function() {
        try { localStorage.setItem('chat_declaracion_aceptada', 'true'); } catch (e) {}
        document.getElementById('modalDeclaracionChat').style.display = 'none';
        var pendiente = this._chatPendiente;
        this._chatPendiente = null;
        if (pendiente) this.enviarMensajeChat(pendiente.convId, pendiente.otroId, pendiente.modo);
    },
    cancelarDeclaracionChat: function() {
        document.getElementById('modalDeclaracionChat').style.display = 'none';
        this._chatPendiente = null;
    },

    // Micro-Paso 6.5: interruptor de traducción automática (activa por defecto)
    tieneTraduccionChatActiva: function() {
        try { var v = localStorage.getItem('chat_traduccion_activa'); return v === null ? true : v === 'true'; } catch (e) { return true; }
    },
    toggleTraduccionChat: function(convId, otroId) {
        var activa = this.tieneTraduccionChatActiva();
        try { localStorage.setItem('chat_traduccion_activa', (!activa).toString()); } catch (e) {}
        this.abrirConversacion(convId);
    },
    FILTRO_PALABRAS_PROHIBIDAS: ['whatsapp', 'wsp', 'yape', 'plin', 'deposito', 'depósito', 'numero de cuenta', 'número de cuenta', 'cuenta bancaria', 'fuera de la plataforma', 'tarjeta de credito', 'tarjeta de crédito', 'transferencia'],

    moderarMensaje: function(texto) {
        var t = texto.toLowerCase();
        for (var i = 0; i < this.FILTRO_PALABRAS_PROHIBIDAS.length; i++) {
            if (t.indexOf(this.FILTRO_PALABRAS_PROHIBIDAS[i]) !== -1) return { permitido: false, motivo: '🛡️ Por tu seguridad, evita compartir números de contacto o hacer pagos fuera de remarket-db. Coordina todo aquí mismo en el chat — así ambos quedan protegidos ante estafas.' };
        }
        if (/\b\d{6,9}\b/.test(t)) return { permitido: false, motivo: '⚠️ Por tu seguridad, no compartas números de teléfono ni de cuenta.' };
        return { permitido: true };
    },

    enviarMensajeChat: async function(convId, otroId, modo) {
        modo = modo || this._modoChatActivo;
        var ctx = this._ctxChat(modo);
        var input = document.getElementById(ctx.input);
        var texto = input ? input.value.trim() : '';
        if (!texto) return;
        if (!this.tieneDeclaracionChatAceptada()) {
            this._chatPendiente = { convId: convId, otroId: otroId, modo: modo };
            document.getElementById('chatDeclaracionCheckbox').checked = false;
            document.getElementById('btnAceptarDeclaracionChat').disabled = true;
            document.getElementById('modalDeclaracionChat').style.display = 'flex';
            return;
        }
        var alertEl = document.getElementById(ctx.modAlert);
        alertEl.style.display = 'none';
        var mod = this.moderarMensaje(texto);
        if (!mod.permitido) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = mod.motivo;
            alertEl.style.display = 'block';
            return;
        }
        // Supervisión de la IA: revisa que el mensaje no infrinja la ley antes de enviarlo
        alertEl.className = 'alert';
        alertEl.textContent = '🔎 Revisando mensaje...';
        alertEl.style.display = 'block';
        var nivelesChat = await this.evaluarNivelesAlerta('', texto, '');
        if (nivelesChat.nivel_legal === 'alto') {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = '🚫 No puedo enviar este mensaje porque su contenido está restringido por ley en remarket-db.';
            alertEl.style.display = 'block';
            return;
        }
        alertEl.style.display = 'none';
        var otro = await this.obtenerAutor(otroId);
        var idiomaDestino = (otro && otro.idioma_preferido) || 'es';
        var idiomaOrigen = usuarioActual.idioma_preferido || 'es';
        var textoTraducido = null;
        if (idiomaDestino !== idiomaOrigen) {
            textoTraducido = await this.traducirTextoIA(texto, idiomaDestino);
        }
        try {
            var { data: nuevoMsg, error } = await supabase.from('mensajes').insert({ conversacion_id: convId, emisor_id: usuarioActual.id, texto_original: texto, texto_traducido: textoTraducido, idioma_original: idiomaOrigen, idioma_destino: idiomaDestino, leido: false }).select().single();
            if (error) throw error;
            await supabase.from('conversaciones').update({ updated_at: new Date().toISOString() }).eq('id', convId);
            input.value = '';
            this.agregarMensajeEnVivo(nuevoMsg, modo);
        } catch (e) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = 'Error al enviar: ' + (e.message || 'intenta de nuevo');
            alertEl.style.display = 'block';
        }
    },

    traducirTextoIA: async function(texto, idiomaDestinoCode) {
        var idiomaNombre = this.NOMBRES_IDIOMAS[idiomaDestinoCode] || 'inglés';
        try {
            var response = await fetch(CONFIG.GROQ_API_URL, { method: 'POST', headers: { "Content-Type": "application/json", "apikey": MI_API_KEY, "Authorization": "Bearer " + MI_API_KEY }, body: JSON.stringify({ messages: [{ role: 'system', content: 'Traduce el siguiente mensaje de chat al ' + idiomaNombre + '. Responde solo con la traducción, sin explicaciones ni comillas.' }, { role: 'user', content: texto }] }) });
            var data = await response.json();
            return data.choices && data.choices[0] ? data.choices[0].message.content.trim() : null;
        } catch (e) { return null; }
    },

    actualizarBadgesMensajes: async function() {
        if (!usuarioActual) return;
        try {
            var { data: convs } = await supabase.from('conversaciones').select('id').or('comprador_id.eq.' + usuarioActual.id + ',vendedor_id.eq.' + usuarioActual.id);
            var ids = (convs || []).map(function(c) { return c.id; });
            var total = 0;
            if (ids.length) {
                var { count } = await supabase.from('mensajes').select('id', { count: 'exact', head: true }).in('conversacion_id', ids).eq('leido', false).neq('emisor_id', usuarioActual.id);
                total = count || 0;
            }
            ['mensajesBadge', 'notifBellBadge', 'floatingChatBadge'].forEach(function(elId) {
                var el = document.getElementById(elId);
                if (!el) return;
                el.textContent = total;
                if (elId !== 'mensajesBadge') el.classList.toggle('visible', total > 0);
            });
        } catch (e) { console.warn('No se pudieron actualizar los badges de mensajes:', e); }
    },

    abrirModalNuevoMensaje: function() {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        document.getElementById('nuevoMsjBuscarPersona').value = '';
        document.getElementById('nuevoMsjResultadosPersona').innerHTML = '';
        document.getElementById('nuevoMsjAlert').style.display = 'none';
        document.querySelectorAll('.compartir-filtro-zona[data-contexto="nuevoMsj"]').forEach(function(b) { b.classList.remove('activo'); });
        document.getElementById('modalNuevoMensaje').style.display = 'flex';
    },

    cerrarModalNuevoMensaje: function() {
        document.getElementById('modalNuevoMensaje').style.display = 'none';
    },

    // === BUSCADOR DE PERSONAS MEJORADO === [FASE 6 - Búsqueda de Usuarios en Tiempo Real]
    // Motor único de búsqueda de personas. Reutilizado por: Compartir, Nuevo mensaje, Buscador principal y el Chat IA.
    // - q: texto escrito (nombre completo, nombre parcial o INICIALES, ej: "J P", "JP", "J.P.")
    // - nivelZona: 'local' | 'regional' | 'pais' | null -> combinable con el texto
    buscarUsuariosPorNombre: async function(q, nivelZona) {
        if (!usuarioActual) return [];
        var termino = (q || '').trim().toLowerCase().replace(/\./g, '');
        if (!termino && !nivelZona) return [];
        var bloqueados = await this.obtenerBloqueados();
        try {
            var query = supabase
                .from('usuarios')
                .select('id, nombres, apellidos, correo_electronico, foto_perfil, localidad_id')
                .neq('id', usuarioActual.id)
                .limit(60);

            if (termino) {
                var primeraPalabra = termino.split(/\s+/)[0];
                var soloLetras = termino.replace(/\s+/g, '');
                var primeraLetra = soloLetras.charAt(0);
                // Se pide al servidor: nombre/apellido que contenga la primera palabra escrita,
                // O que empiece con la primera letra (para no perder coincidencias por iniciales, ej: "J P").
                query = query.or(
                    'nombres.ilike.%' + primeraPalabra + '%,' +
                    'apellidos.ilike.%' + primeraPalabra + '%,' +
                    'nombres.ilike.' + primeraLetra + '%,' +
                    'apellidos.ilike.' + primeraLetra + '%'
                );
            }

            if (nivelZona) {
                var idsLocalidades = await this.obtenerLocalidadIdsPorNivel(nivelZona);
                if (idsLocalidades && idsLocalidades.length) query = query.in('localidad_id', idsLocalidades);
                else return []; // pidió una zona pero no hay localidades que califiquen
            }

            var { data, error } = await query;
            if (error) throw error;

            var resultados = (data || []).filter(function(u) { return bloqueados.indexOf(u.id) === -1; });

            if (termino) {
                var terminoSinEspacios = termino.replace(/\s+/g, '');
                resultados = resultados.filter(function(u) {
                    var nombreCompleto = ((u.nombres || '') + ' ' + (u.apellidos || '')).trim().toLowerCase();
                    if (!nombreCompleto) return false;
                    if (nombreCompleto.indexOf(termino) !== -1) return true; // coincidencia normal por texto
                    // Coincidencia por iniciales: "jp" o "j p" -> "Juan Perez"
                    var iniciales = nombreCompleto.split(/\s+/).filter(Boolean).map(function(p) { return p.charAt(0); }).join('');
                    return iniciales.indexOf(terminoSinEspacios) !== -1;
                });
            }

            return resultados.slice(0, 12).map(function(u) {
                u.nombre_completo = ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || u.correo_electronico || 'Usuario';
                return u;
            });
        } catch (e) {
            console.warn('Error buscando usuarios:', e);
            return [];
        }
    },

    // Filtros explícitos por zona (Local/Regional/País) y por rubro, visibles en el modal de Compartir
    filtrarCompartirPorZona: async function(nivel) {
        var btn = document.getElementById('filtroZona-' + nivel + '-compartir');
        var yaActivo = btn && btn.classList.contains('activo');
        document.querySelectorAll('.compartir-filtro-zona[data-contexto="compartir"]').forEach(function(b) { b.classList.remove('activo'); });
        if (btn && !yaActivo) btn.classList.add('activo');
        var inputEl = document.getElementById('compartirBuscarPersona');
        if (inputEl && inputEl.value.trim()) {
            // Ya hay texto escrito: combinar zona + texto con el motor unificado, en vez del flujo de sugerencias por rubro
            this.buscarPersonaPicker(inputEl.value, 'compartir');
        } else {
            this._aplicarFiltrosCompartir();
        }
    },
    filtrarCompartirPorRubro: function() {
        this._aplicarFiltrosCompartir();
    },
    _aplicarFiltrosCompartir: async function() {
        var el = document.getElementById('compartirResultadosPersona');
        var zonaActiva = document.querySelector('.compartir-filtro-zona[data-contexto="compartir"].activo');
        var nivel = zonaActiva ? zonaActiva.dataset.nivel : null;
        var rubro = document.getElementById('compartirFiltroRubro').value;
        if (!nivel && !rubro) { this.sugerirPersonasInteresadas(this._categoriaProductoCompartiendo); return; }
        if (nivel && !usuarioActual.localidad_id) {
            el.innerHTML = '<div class="user-picker-empty">🤖 Todavía no tienes tu localidad definida. Ve a Configuración para definirla, o usa solo el filtro de rubro.</div>';
            return;
        }
        el.innerHTML = '<div class="user-picker-empty">Buscando...</div>';
        var candidatos = await this.buscarUsuariosCompartir(rubro || null, nivel);
        var self = this;
        if (!candidatos.length) {
            el.innerHTML = '<div class="user-picker-empty">😕 No encontré personas con esos filtros.</div>';
            return;
        }
        el.innerHTML = candidatos.map(function(u) {
            var nombre = ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
            var inicial = nombre.charAt(0).toUpperCase() || 'U';
            var nombreEscapado = self.escHtml(nombre).replace(/'/g, "\\'");
            var fotoHtml = u.foto_perfil ? '<img src="' + u.foto_perfil + '" class="user-picker-avatar" style="border-radius:50%;width:36px;height:36px;object-fit:cover;">' : '<div class="user-picker-avatar">' + inicial + '</div>';
            return '<div class="user-picker-item" onclick="PanelUsuario.seleccionarPersonaPicker(\'' + u.id + '\', \'' + nombreEscapado + '\', \'compartir\')">' +
                fotoHtml + '<div style="flex:1;"><div class="user-picker-name">' + self.escHtml(nombre) + '</div></div></div>';
        }).join('');
    },

    // Espera a que el usuario termine de escribir (350ms) antes de buscar,
    // así no se llama a la IA en cada letra que teclea.
    onBuscarPersonaInput: function(valor, contexto) {
        clearTimeout(this._debounceBusqueda);
        this._debounceBusqueda = setTimeout(function() {
            PanelUsuario.buscarPersonaPicker(valor, contexto);
        }, 350);
    },

    // Lee el botón de zona (Local/Regional/País) activo para un contexto dado, si existe.
    _obtenerNivelZonaActivo: function(contexto) {
        var activo = document.querySelector('.compartir-filtro-zona[data-contexto="' + contexto + '"].activo');
        if (!activo && contexto === 'compartir') activo = document.querySelector('.compartir-filtro-zona.activo'); // compatibilidad con los botones originales de Compartir
        return activo ? activo.dataset.nivel : null;
    },

    // Botón genérico de filtro de zona, usado en Nuevo mensaje y en los resultados de persona del buscador/IA.
    setFiltroZonaPersona: function(contexto, nivel) {
        var btn = document.getElementById('filtroZona-' + nivel + '-' + contexto);
        var yaActivo = btn && btn.classList.contains('activo');
        document.querySelectorAll('.compartir-filtro-zona[data-contexto="' + contexto + '"]').forEach(function(b) { b.classList.remove('activo'); });
        if (btn && !yaActivo) btn.classList.add('activo');
        var inputEl = document.getElementById(contexto + 'BuscarPersona');
        var valor = inputEl ? inputEl.value : '';
        this.buscarPersonaPicker(valor, contexto);
    },

    // Pinta la lista de tarjetas de personas encontradas (nombre, avatar, correo) para cualquier contexto.
    _renderResultadosPersonaPicker: function(usuarios, contexto, el) {
        var self = this;
        el.innerHTML = usuarios.map(function(u) {
            var nombre = u.nombre_completo || ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
            var inicial = nombre.charAt(0).toUpperCase() || 'U';
            var email = u.correo_electronico || '';
            var foto = u.foto_perfil || '';
            var nombreEscapado = self.escHtml(nombre).replace(/'/g, "\\'");
            var fotoHtml = foto ? `<img src="${foto}" class="user-picker-avatar" style="border-radius:50%;width:40px;height:40px;object-fit:cover;">` :
                                 `<div class="user-picker-avatar">${inicial}</div>`;
            return `<div class="user-picker-item" onclick="PanelUsuario.seleccionarPersonaPicker('${u.id}', '${nombreEscapado}', '${contexto}')">
                ${fotoHtml}
                <div style="flex:1;">
                    <div class="user-picker-name">${self.escHtml(nombre)}</div>
                    <div class="user-picker-email">${email ? '✉️ ' + self.escHtml(email) : ''}</div>
                </div>
            </div>`;
        }).join('');
    },

    buscarPersonaPicker: async function(q, contexto) {
        var el = document.getElementById(contexto + 'ResultadosPersona');
        if (!el) return;
        var nivelZona = this._obtenerNivelZonaActivo(contexto);
        if (!q || !q.trim().length) {
            if (nivelZona) {
                // Sin texto pero con zona activa: mostrar personas de esa zona directamente
                el.innerHTML = '<div class="user-picker-empty">Buscando...</div>';
                var soloZona = await this.buscarUsuariosPorNombre('', nivelZona);
                this._renderResultadosPersonaPicker(soloZona, contexto, el);
                return;
            }
            if (contexto === 'compartir') this.sugerirPersonasInteresadas(this._categoriaProductoCompartiendo);
            else el.innerHTML = '<div class="user-picker-empty">💡 Escribe para buscar, o filtra por zona...</div>';
            return;
        }
        var usuarios = await this.buscarUsuariosPorNombre(q, nivelZona);
        if (usuarios && usuarios.length) {
            this._renderResultadosPersonaPicker(usuarios, contexto, el);
            return;
        }
        // 🤖 No hubo coincidencia por nombre: si es el buscador de Compartir, le pedimos
        // criterio a la IA real: puede devolver una búsqueda (categoría y/o localidad), o un mensaje conversacional.
        if (contexto === 'compartir' || contexto === 'nuevoMsj') {
            el.innerHTML = '<div class="user-picker-empty">🤖 Pensando...</div>';
            var categoriaContexto = contexto === 'compartir' ? this._categoriaProductoCompartiendo : null;
            var resultado = await this.consultarAsistenteCompartir(q, categoriaContexto);
            if (resultado.tipo === 'mensaje') {
                el.innerHTML = '<div class="user-picker-empty">🤖 ' + this.escHtml(resultado.valor) + '</div>';
                return;
            }
            var categoriaDetectada = resultado.categoria;
            var nivelZona = resultado.nivel_zona;
            if (nivelZona && !usuarioActual.localidad_id) {
                el.innerHTML = '<div class="user-picker-empty">🤖 Todavía no tienes tu localidad definida, así que no puedo comparar zonas. Ve a Configuración para definirla, o busca por categoría/nombre.</div>';
                return;
            }
            var candidatos = await this.buscarUsuariosCompartir(categoriaDetectada, nivelZona);
            var NOMBRES_NIVEL = { local: 'tu misma zona', regional: 'tu misma región', pais: 'tu mismo país' };
            var etiquetaZona = nivelZona ? NOMBRES_NIVEL[nivelZona] : null;
            var etiqueta = categoriaDetectada && etiquetaZona ? 'interesadas en <strong>' + this.escHtml(categoriaDetectada) + '</strong> de ' + etiquetaZona
                : categoriaDetectada ? 'interesadas en <strong>' + this.escHtml(categoriaDetectada) + '</strong>'
                : 'de ' + etiquetaZona;
            if (candidatos && candidatos.length) {
                var self2 = this;
                el.innerHTML = '<div style="font-size:12px;color:var(--texto-secundario);margin-bottom:6px;">🤖 No hay nadie con ese nombre, pero encontré personas ' + etiqueta + ':</div>' +
                    candidatos.map(function(u) {
                        var nombre = ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
                        var inicial = nombre.charAt(0).toUpperCase() || 'U';
                        var nombreEscapado = self2.escHtml(nombre).replace(/'/g, "\\'");
                        var fotoHtml = u.foto_perfil ? '<img src="' + u.foto_perfil + '" class="user-picker-avatar" style="border-radius:50%;width:40px;height:40px;object-fit:cover;">' : '<div class="user-picker-avatar">' + inicial + '</div>';
                        return '<div class="user-picker-item" onclick="PanelUsuario.seleccionarPersonaPicker(\'' + u.id + '\', \'' + nombreEscapado + '\', \'' + contexto + '\')">' +
                            fotoHtml +
                            '<div style="flex:1;"><div class="user-picker-name">' + self2.escHtml(nombre) + '</div>' +
                            '<div class="user-picker-email">✨ ' + (categoriaDetectada ? 'Interesado en ' + self2.escHtml(categoriaDetectada) : 'De ' + etiquetaZona) + '</div></div></div>';
                    }).join('');
                return;
            } else {
                el.innerHTML = '<div class="user-picker-empty">🤖 Todavía no encontré personas ' + etiqueta + '. Prueba buscando por nombre, o comparte con todos usando "Copiar Enlace".</div>';
                return;
            }
        }
        el.innerHTML = '<div class="user-picker-empty">😕 No se encontraron usuarios con ese nombre ni con ese interés</div>';
    },

    // Detecta a qué categoría se refiere una frase libre, usando la IA real
    // (con el diccionario de palabras clave como respaldo si la IA falla o no responde)
    // Le pregunta a la IA qué hacer con la frase del usuario: puede devolver
    // {tipo:'categoria', valor:'Hogar'} si detecta un producto/servicio,
    // o {tipo:'mensaje', valor:'...respuesta explicando qué sí puede hacer...'} si no aplica.
    consultarAsistenteCompartir: async function(texto, categoriaProducto) {
        var CATEGORIAS_VALIDAS = ['Tecnología', 'Hogar', 'Ropa', 'Deportes', 'Vehículos', 'Agro', 'Servicios', 'Libros', 'Otros'];
        var NIVELES_ZONA = ['local', 'regional', 'pais'];
        var contextoProducto = categoriaProducto
            ? 'La publicación que el usuario está compartiendo es de la categoría "' + categoriaProducto + '". Si la frase claramente pide gente interesada EN LO QUE SE ESTÁ COMPARTIENDO (ej: "quién quiere esto", "interesados", "compradores") sin nombrar otra categoría distinta, usa "usar_categoria_publicacion": true.\n\n'
            : '';
        try {
            var response = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: { "Content-Type": "application/json", "apikey": MI_API_KEY, "Authorization": "Bearer " + MI_API_KEY },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'Eres el asistente del botón "Compartir" de remarket-db. El usuario escribe una frase buscando con quién compartir una publicación. Puedes buscar personas por DOS filtros combinables: (1) categoría de producto/servicio de interés, y (2) zona geográfica de quien pregunta, en UNO de estos 3 niveles: "local" (misma ciudad/localidad exacta — palabras como "mi zona", "mi localidad", "mi barrio", "cerca de mí"), "regional" (misma región/provincia, más amplio — palabras como "mi región"), "pais" (mismo país, el más amplio — palabras como "mi país", o si menciona un país específico). Este dato de zona NO es privado, es información general que cada usuario ya define en su perfil para ver publicaciones cercanas, así que SÍ puedes usarlo. Lo que NO puedes hacer es dar una lista completa de todos los usuarios sin ningún criterio, ni datos personales como email, teléfono o dirección exacta.\n\nLas categorías disponibles en la base de datos son: Tecnología, Hogar, Ropa, Deportes, Vehículos, Agro / Alimentos, Servicios, Libros, Otros. NO exijas que el usuario escriba estas palabras exactas: reconoce sinónimos y términos relacionados y mapéalos a la categoría más cercana. Ejemplos: "celulares", "laptops", "consolas", "audífonos" → Tecnología; "muebles", "sofás", "sillones", "cocina", "decoración" → Hogar; "zapatillas", "casacas", "moda" → Ropa; "bicicletas", "pelotas", "gimnasio" → Deportes; "autos", "motos", "carros" → Vehículos; "comida", "verduras", "mascotas", "plantas" → Agro / Alimentos; "clases", "reparaciones", "limpieza" → Servicios; "cuadernos", "revistas" → Libros. Si de verdad no encaja en ninguna, usa "Otros" en vez de rechazar la búsqueda.\n\nSi la frase pide ver gente EN GENERAL, sin categoría específica (ej: "hay usuarios nuevos", "cualquiera", "todos", "quién está activo", "gente random"), responde con "sin_filtro": true — eso es válido y distinto de no entender la frase.\n\n' + contextoProducto + 'Responde ÚNICAMENTE en JSON válido, sin texto adicional ni markdown, con una de estas dos formas:\n1) Si la frase pide encontrar personas (por categoría, por zona, "usar_categoria_publicacion", "sin_filtro", o combinaciones): {"tipo":"busqueda","categoria":"UNA_DE_ESTAS_O_NULL: Tecnología, Hogar, Ropa, Deportes, Vehículos, Agro / Alimentos, Servicios, Libros, Otros","nivel_zona":"local_O_regional_O_pais_O_NULL","usar_categoria_publicacion":true_o_false,"sin_filtro":true_o_false}\n2) Si la frase pide algo que de verdad no puedes hacer, o es tan ambigua que no corresponde a ninguno de los casos anteriores (ej: email/teléfono/dirección exacta de alguien, algo totalmente no relacionado): {"tipo":"mensaje","valor":"una respuesta breve, amable, en español, explicando qué sí puedes hacer y ofreciendo ayuda concreta"}' },
                        { role: 'user', content: texto }
                    ]
                })
            });
            var data = await response.json();
            var contenido = (data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '').trim();
            contenido = contenido.replace(/^```json\s*|\s*```$/g, '').trim();
            var parsed = JSON.parse(contenido);
            if (parsed.tipo === 'busqueda') {
                var match = parsed.categoria ? CATEGORIAS_VALIDAS.find(function(c) { return (parsed.categoria || '').toLowerCase().indexOf(c.toLowerCase()) !== -1; }) : null;
                var nivelZona = NIVELES_ZONA.indexOf(parsed.nivel_zona) !== -1 ? parsed.nivel_zona : null;
                // Solo usamos la categoría de la publicación si la IA detectó explícitamente que la frase
                // se refería a "quién quiere esto" — no como respaldo genérico para cualquier frase ambigua.
                if (!match && parsed.usar_categoria_publicacion && categoriaProducto) match = categoriaProducto;
                if (!match && !nivelZona && !parsed.sin_filtro) {
                    return { tipo: 'mensaje', valor: 'No logré identificar un producto, servicio o zona en tu mensaje. ¿Puedes ser más específico, por ejemplo "quién quiere una silla", "personas de mi zona", o "cualquiera" para ver gente en general?' };
                }
                return { tipo: 'busqueda', categoria: match || null, nivel_zona: nivelZona };
            }
            return { tipo: 'mensaje', valor: parsed.valor || 'No entendí bien tu mensaje, ¿puedes reformularlo?' };
        } catch (e) {
            console.warn('IA no disponible, usando diccionario de respaldo:', e);
            var textoLower = (texto || '').toLowerCase();
            var pareceInteres = /quien quiere|quién quiere|interesad|comprador|le puede servir/i.test(textoLower);
            var cat = this.detectarCategoriaPorDiccionario(texto) || (pareceInteres ? categoriaProducto : null);
            return cat ? { tipo: 'busqueda', categoria: cat, nivel_zona: null } : { tipo: 'mensaje', valor: 'No pude conectarme con la IA para interpretar tu mensaje. Prueba buscar por nombre, o escribe algo como "quién quiere una silla".' };
        }
    },

    // Respaldo sin conexión a IA: diccionario de palabras clave (el que ya existía)
    detectarCategoriaPorDiccionario: function(texto) {
        texto = (texto || '').toLowerCase();
        for (var cat in this.MAPA_CATEGORIAS) {
            var palabras = this.MAPA_CATEGORIAS[cat];
            for (var i = 0; i < palabras.length; i++) {
                if (texto.indexOf(palabras[i]) !== -1) return cat;
            }
        }
        return null;
    },

    // Traduce el nivel de zona pedido a una lista de IDs de localidades que califican,
    // basándose en la propia localidad del usuario que pregunta.
    obtenerLocalidadIdsPorNivel: async function(nivelZona) {
        if (!usuarioActual.localidad_id) return null;
        if (nivelZona === 'local') return [usuarioActual.localidad_id];
        try {
            var { data: miLoc, error: errLoc } = await supabase.from('localidades').select('region, pais_id').eq('id', usuarioActual.localidad_id).maybeSingle();
            if (errLoc || !miLoc) return null;
            if (nivelZona === 'regional' && miLoc.region) {
                var { data: rowsReg } = await supabase.from('localidades').select('id').eq('region', miLoc.region);
                return (rowsReg || []).map(function(r) { return r.id; });
            }
            if (nivelZona === 'pais' && miLoc.pais_id) {
                var { data: rowsPais } = await supabase.from('localidades').select('id').eq('pais_id', miLoc.pais_id);
                return (rowsPais || []).map(function(r) { return r.id; });
            }
            return null;
        } catch (e) {
            console.warn('Error resolviendo nivel de zona:', e);
            return null;
        }
    },

    buscarUsuariosCompartir: async function(categoria, nivelZona) {
        try {
            var bloqueados = await this.obtenerBloqueados();
            var query = supabase
                .from('usuarios')
                .select('id, nombres, apellidos, foto_perfil, categoria, localidad_id')
                .neq('id', usuarioActual.id)
                .limit(8);
            if (categoria) query = query.ilike('categoria', '%' + categoria + '%');
            if (nivelZona) {
                var idsLocalidades = await this.obtenerLocalidadIdsPorNivel(nivelZona);
                if (idsLocalidades && idsLocalidades.length) query = query.in('localidad_id', idsLocalidades);
                else return []; // pidió zona pero no hay localidades que califiquen
            }
            var { data, error } = await query;
            if (error) throw error;
            return (data || []).filter(function(u) { return bloqueados.indexOf(u.id) === -1; }).slice(0, 5);
        } catch (e) {
            console.warn('Error buscando personas:', e);
            return [];
        }
    },

    // Se mantiene por compatibilidad (usado en la sugerencia automática al abrir el modal)
    buscarUsuariosPorCategoria: async function(categoria) {
        return this.buscarUsuariosCompartir(categoria, null);
    },

    seleccionarPersonaPicker: function(id, nombre, contexto) {
        if (contexto === 'compartir') {
            if (!this._destinatariosSeleccionados) this._destinatariosSeleccionados = [];
            if (!this._destinatariosSeleccionados.some(function(d) { return d.id === id; })) {
                this._destinatariosSeleccionados.push({ id: id, nombre: nombre });
                this.renderChipsSeleccionados();
            }
            var itemSugerido = document.getElementById('pickerItem-' + id);
            if (itemSugerido) itemSugerido.classList.add('seleccionado'); // marca la tarjeta con el check, estilo Facebook
            document.getElementById('compartirBuscarPersona').value = '';
            document.getElementById('compartirResultadosPersona').innerHTML = '';
        } else if (contexto === 'nuevoMsj') {
            this.cerrarModalNuevoMensaje();
            this.iniciarConversacionDirecta(id);
        }
    },

    renderChipsSeleccionados: function() {
        var el = document.getElementById('compartirSeleccionados');
        if (!el) return;
        var self = this;
        var seleccionados = this._destinatariosSeleccionados || [];
        el.innerHTML = seleccionados.map(function(d) {
            return '<span class="user-picker-chip">' + self.escHtml(d.nombre) + ' <button onclick="PanelUsuario.quitarPersonaSeleccionada(\'' + d.id + '\')">&times;</button></span>';
        }).join('');
        var btnEnviar = document.getElementById('btnEnviarCompartir');
        if (btnEnviar) btnEnviar.disabled = seleccionados.length === 0;
        if (btnEnviar) btnEnviar.textContent = seleccionados.length ? '📤 Enviar a ' + seleccionados.length + (seleccionados.length === 1 ? ' persona' : ' personas') : '📤 Enviar';
    },

    quitarPersonaSeleccionada: function(id) {
        this._destinatariosSeleccionados = (this._destinatariosSeleccionados || []).filter(function(d) { return d.id !== id; });
        var itemSugerido = document.getElementById('pickerItem-' + id);
        if (itemSugerido) itemSugerido.classList.remove('seleccionado');
        this.renderChipsSeleccionados();
    },

    // Micro-Paso 5.1 (opción 1): enviar la publicación por mensaje privado a los usuarios seleccionados
    enviarCompartirMensajePrivado: async function() {
        var destinatarios = this._destinatariosSeleccionados || [];
        var productoId = this._productoCompartiendo;
        if (!destinatarios.length || !productoId) return;
        var alertEl = document.getElementById('compartirAlert');
        var tituloEl = document.getElementById('compartirPreviewTitulo');
        var titulo = tituloEl ? tituloEl.textContent : 'esta publicación';
        var enlace = window.location.origin + window.location.pathname + '?producto=' + productoId;
        var texto = '📦 Te comparto esta publicación: "' + titulo + '" ' + enlace;
        var enviados = 0;
        try {
            for (var i = 0; i < destinatarios.length; i++) {
                var otroId = destinatarios[i].id;
                var { data: existente } = await supabase.from('conversaciones').select('id').is('producto_id', null)
                    .or('and(comprador_id.eq.' + usuarioActual.id + ',vendedor_id.eq.' + otroId + '),and(comprador_id.eq.' + otroId + ',vendedor_id.eq.' + usuarioActual.id + ')')
                    .maybeSingle();
                var convId = existente ? existente.id : null;
                if (!convId) {
                    var { data: nuevaConv, error: errConv } = await supabase.from('conversaciones')
                        .insert({ producto_id: null, comprador_id: usuarioActual.id, vendedor_id: otroId, estado: 'activa' })
                        .select().single();
                    if (errConv) throw errConv;
                    convId = nuevaConv.id;
                }
                await supabase.from('mensajes').insert({ conversacion_id: convId, emisor_id: usuarioActual.id, texto_original: texto, idioma_original: usuarioActual.idioma_preferido || 'es', leido: false });
                await supabase.from('conversaciones').update({ updated_at: new Date().toISOString() }).eq('id', convId);
                enviados++;
            }
            this.mostrarToast('✅ Publicación enviada a ' + enviados + (enviados === 1 ? ' persona' : ' personas'));
            this.cerrarModalCompartir();
        } catch (e) {
            alertEl.className = 'alert alert-error';
            alertEl.textContent = 'Error al enviar: ' + (e.message || 'intenta de nuevo');
            alertEl.style.display = 'block';
        }
    },

    // Micro-Paso 5.1 (opción 2): copiar enlace de la publicación con advertencia de seguridad
    copiarEnlaceCompartir: function() {
        var productoId = this._productoCompartiendo;
        var enlace = window.location.origin + window.location.pathname + '?producto=' + productoId;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(enlace).then(function() {
                PanelUsuario.mostrarToast('🔗 Enlace copiado. ⚠️ No compartas datos bancarios ni pagues fuera de remarket-db.');
            }).catch(function() {
                PanelUsuario.mostrarToast('No se pudo copiar el enlace');
            });
        } else {
            this.mostrarToast('No se pudo copiar el enlace');
        }
    },

    iniciarConversacionDirecta: async function(otroId) {
        if (!usuarioActual) { toggleAuthModal(true); return; }
        try {
            var { data: existente } = await supabase.from('conversaciones').select('id').is('producto_id', null).or('and(comprador_id.eq.' + usuarioActual.id + ',vendedor_id.eq.' + otroId + '),and(comprador_id.eq.' + otroId + ',vendedor_id.eq.' + usuarioActual.id + ')').maybeSingle();
            var convId = existente ? existente.id : null;
            if (!convId) {
                var { data: nuevaConv, error } = await supabase.from('conversaciones').insert({ producto_id: null, comprador_id: usuarioActual.id, vendedor_id: otroId, estado: 'activa' }).select().single();
                if (error) throw error;
                convId = nuevaConv.id;
            }
            abrirChatFlotante();
            this.cargarConversaciones(convId, 'flotante');
        } catch (e) {
            this.mostrarToast('Error al iniciar la conversación');
        }
    },

    toggleMenuMobile: function() {
        document.getElementById('userPanelLeft').classList.toggle('mobile-open');
        document.getElementById('sidebarOverlay').classList.toggle('show');
    },

    cerrarMenuMobile: function() {
        document.getElementById('userPanelLeft').classList.remove('mobile-open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    },

    // Buscador del header dentro del panel: le manda el texto completo a la IA,
    // que decide la intención (producto, persona, recientes, categoría, o fuera de tema)
    ejecutarBusquedaConIA: async function(query) {
        var container = document.getElementById('userFeedContainer');
        container.innerHTML = '<div class="feed-loading"><div class="search-loading-spinner"></div><p>🤖 El Asistente IA está pensando...</p></div>';
        var respuestaIA = await AIService.enviarMensaje(query);
        var esError = respuestaIA === 'Error al conectar con la IA.' || respuestaIA === 'Error de conexión.';
        if (esError) {
            container.innerHTML = '<div class="feed-empty"><div style="font-size:48px;margin-bottom:12px;">🤖</div><p>No pude conectarme con el Asistente en este momento. Intenta de nuevo en unos segundos.</p><button class="btn-publicar" onclick="PanelUsuario.cargarFeed()">Volver al inicio</button></div>';
            return;
        }
        var accionMatch = respuestaIA.match(/\[ACCION:\s*([^\]\|]+)/i);
        var accion = accionMatch ? accionMatch[1].trim().toUpperCase() : '';

        if (accion === 'BUSCAR') {
            var prodMatch = respuestaIA.match(/PRODUCTO:\s*([^\|\]]+)/i);
            var producto = prodMatch ? prodMatch[1].trim() : query;
            await this.buscarProductosReales(producto, 'titulo_desc');
        } else if (accion === 'CATEGORIA') {
            var catMatch = respuestaIA.match(/CATEGORIA:\s*([^\|\]]+)/i);
            var categoria = catMatch ? catMatch[1].trim() : query;
            await this.buscarProductosReales(categoria, 'categoria');
        } else if (accion === 'BUSCAR_PERSONA') {
            var nombreMatch = respuestaIA.match(/NOMBRE:\s*([^\|\]]+)/i);
            var nombre = nombreMatch ? nombreMatch[1].trim() : query;
            var usuarios = await this.buscarUsuariosPorNombre(nombre);
            this.renderResultadosPersonasEnFeed(usuarios, nombre);
        } else if (accion === 'RECIENTES') {
            this.cargarFeed();
        } else {
            // Respuesta conversacional (o pregunta fuera de tema): se muestra en el Asistente IA lateral
            if (typeof UIController !== 'undefined' && UIController.mostrarRespuestaIA) UIController.mostrarRespuestaIA(respuestaIA, 'assistant');
            this.cargarFeed();
        }
    },

    buscarProductosReales: async function(termino, modo) {
        var container = document.getElementById('userFeedContainer');
        try {
            var q = supabase.from('productos').select('*').eq('estado', 'aprobado');
            q = (modo === 'categoria') ? q.ilike('categoria', '%' + termino + '%') : q.or('titulo.ilike.%' + termino + '%,descripcion.ilike.%' + termino + '%');
            var { data: productos } = await q.order('created_at', { ascending: false }).limit(30);
            if (!productos || !productos.length) {
                container.innerHTML = '<div class="feed-empty"><div style="font-size:48px;margin-bottom:12px;">🔎</div><p>No encontré publicaciones para "' + this.escHtml(termino) + '".</p><button class="btn-publicar" onclick="PanelUsuario.cargarFeed()">Volver al inicio</button></div>';
                return;
            }
            var self = this;
            var html = '<div style="padding:10px 4px;font-size:13px;color:var(--texto-secundario);">🔎 Resultados para "' + this.escHtml(termino) + '" · <a href="#" onclick="event.preventDefault();PanelUsuario.cargarFeed();">Volver al inicio</a></div>';
            for (var i = 0; i < productos.length; i++) {
                var autor = await self.obtenerAutor(productos[i].usuario_id);
                html += self.renderPost(productos[i], autor, false);
            }
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<div class="feed-empty"><p>Error al buscar. Intenta de nuevo.</p></div>';
        }
    },

    renderResultadosPersonasEnFeed: function(usuarios, nombreBuscado) {
        var container = document.getElementById('userFeedContainer');
        if (!usuarios || !usuarios.length) {
            container.innerHTML = '<div class="feed-empty"><div style="font-size:48px;margin-bottom:12px;">👤</div><p>No encontré a nadie llamado "' + this.escHtml(nombreBuscado) + '".</p><button class="btn-publicar" onclick="PanelUsuario.cargarFeed()">Volver al inicio</button></div>';
            return;
        }
        var self = this;
        var html = '<div style="padding:10px 4px;font-size:13px;color:var(--texto-secundario);">👤 Personas que coinciden con "' + this.escHtml(nombreBuscado) + '" · <a href="#" onclick="event.preventDefault();PanelUsuario.cargarFeed();">Volver al inicio</a></div>';
        html += '<div style="background:#fff;border-radius:12px;padding:8px;">' + usuarios.map(function(u) {
            var nombre = u.nombre_completo || ((u.nombres || '') + ' ' + (u.apellidos || '')).trim() || 'Usuario';
            var inicial = nombre.charAt(0).toUpperCase() || 'U';
            var fotoHtml = u.foto_perfil ? '<img src="' + u.foto_perfil + '" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">' : '<div class="feed-post-avatar">' + inicial + '</div>';
            return '<div style="display:flex;align-items:center;gap:10px;padding:10px;cursor:pointer;" onclick="PanelUsuario.cargarPerfilUsuario(\'' + u.id + '\')">' + fotoHtml + '<div style="font-weight:600;">' + self.escHtml(nombre) + '</div></div>';
        }).join('') + '</div>';
        container.innerHTML = html;
    },
});
