var UbicacionUsuario = { ciudad: '🌍 Global', pais: 'Mundo', detectarPorIP: async function() { try { var response = await fetch('https://ipapi.co/json/'); var data = await response.json(); if (data && data.city) {
                    // ipapi devuelve el país en inglés y sin tilde ("Peru"). Se pasa a español con el código ("PE") para que
                    // el mismo país no quede guardado de dos formas ("Peru" y "Perú").
                    var nombrePais = data.country_name;
                    try { if (data.country_code && typeof Intl !== 'undefined' && Intl.DisplayNames) nombrePais = new Intl.DisplayNames(['es'], { type: 'region' }).of(data.country_code) || nombrePais; } catch (e2) {}
                    if (nombrePais) this.pais = (typeof normalizarPaisEs === 'function') ? normalizarPaisEs(nombrePais) : nombrePais;
                    this.ciudad = data.city; this.actualizarUI();
                } } catch (e) { console.warn('IP no detectada, usando Global.'); } }, actualizarUI: function() { var sub = document.getElementById('contentSubtitle'); if (sub) sub.textContent = 'Descubre artículos disponibles para intercambio en ' + this.ciudad + ', ' + this.pais; } };

