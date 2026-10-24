# BITÁCORA — Estructura única de búsqueda de personas

**Fecha:** 23/10/2026
**Estado:** diseño aprobado en parte, sin código todavía.
**Reemplaza en la práctica a:** BITACORA-BUSQUEDA-PERSONAS.md y a la parte de personas de BITACORA-BUSCADOR-ASISTENTE.md. La del 22/10 (COMO-DEBERIA-SER) sigue siendo la referencia de producto.

---

## 1. Idea central

Una sola estructura de búsqueda de personas que usan todos los lugares, en lugar de caminos separados:

- Pantalla "Buscar Personas"
- Compartir
- Nuevo mensaje
- Buscador principal y asistente del chat

Cada lugar solo cambia **qué pasa al tocar a la persona**. La búsqueda es la misma.

## 2. Tres capas

1. **Intérprete:** convierte la frase en una **ficha** de criterios. Primero reglas simples en el navegador; solo si no entiende, la IA (para cuidar la cuota de Groq).
2. **Motor:** recibe la ficha y devuelve siempre la misma lista ordenada. Es el único que aplica zona, exclusiones, visibilidad y paginación.
3. **Presentación:** cada lugar pinta el resultado a su manera.

### Regla de seguridad del intérprete
La IA **nunca escribe la consulta a la base de datos**. Solo llena la ficha con campos permitidos. El código valida la ficha (rechaza campos desconocidos, limpia textos) y recién el motor consulta.

## 3. La ficha (piezas opcionales)

| Pieza | Ejemplos |
|---|---|
| Nombre | Juan, `@usuario`, iniciales (j, j p) |
| Zona | mi localidad, país, ciudad, mundial |
| Categoría de la persona | emprendedor, profesional |
| Qué hace | vende, regala, cambia, da servicios |
| Qué ofrece | laptops, diseño, clases |
| Precio | máximo, rango u orden |
| Orden | más cerca, más barato, más reciente |

Una pieza vacía no filtra. Se pueden juntar de cualquier manera.

**Obligatorio:** lo que la persona nombró de forma clara (nombre y zona).
**Suave:** lo demás ordena o filtra sin dejar la búsqueda en cero. Si no hay resultados, se quita el filtro más débil y se avisa cuál.
**Transparencia:** se muestra lo entendido ("Busqué: Juan · tu localidad · vende o da servicios").

### Iniciales
- Una letra: nombre o apellido que empieza con esa letra.
- Dos letras ("j p" o "jp"): nombre con J y apellido con P, y también al revés.
- Con una sola letra se pide una **segunda pista** (zona, categoría u otra inicial) antes de listar.

## 4. Reglas de privacidad
1. Solo datos públicos del perfil (nombre, foto, `@usuario`, ciudad y país, categoría, publicaciones visibles). Nunca correo, teléfono ni fecha de nacimiento.
2. Solo con sesión iniciada.
3. Evitar listado masivo: máximo por búsqueda, tope de páginas de "Ver más" y límite de búsquedas por minuto.
4. No aparecen: quien busca, bloqueados, cuentas suspendidas o inactivas. La página no avisa que existen.
5. La IA solo recibe el texto de quien busca. Nunca recibe datos de otras personas.
6. No se busca por datos sensibles (salud, religión, ideas políticas, etc.).
7. Registro de búsquedas **sin identificar a la persona**.
8. Cada usuario debería poder decidir si aparece en búsquedas. **Por verificar si existe hoy.**

> No soy abogado. Las reglas de privacidad y los posibles deberes de reportar deben revisarse con la política de privacidad de la página y con alguien que conozca la normativa de protección de datos de Perú.

## 5. Regla de visibilidad de publicaciones (lo que se muestra en tarjetas de personas)

**Hallazgos del código (leídos, no probados en el navegador):**
- Cada publicación nueva se guarda con `estado: 'aprobado'` automáticamente (no hay Panel de Moderador). Los borradores también se activan sin revisión.
- Se guardan `nivel_alerta_ocr`, `nivel_alerta_legal` e `ia_scan_status`, pero solo registran y avisan en "Mis publicaciones". No ocultan nada.
- Existe la tabla `reportes`. No vi que un reporte oculte la publicación.
- Si la IA falla, el nivel queda vacío y se trata como sin alerta.

**Regla propuesta (la búsqueda es más estricta que el muro; el muro no cambia):**
- Entran: `estado = aprobado`, sin alerta legal alta ni media, sin alerta de contacto externo alta.
- Quedan fuera: publicaciones con reporte pendiente, suspendidas, y de cuentas inactivas.
- Si todas las ofertas de una persona quedan fuera, la persona aparece por su nombre pero sin ofertas.
- La regla vive **dentro del motor** (y de la función SQL en la etapa B) para que ningún lugar la omita.

## 6. Búsquedas prohibidas (armas, servicios sexuales, drogas, etc.)

**Hallazgos del código:**
- La búsqueda de personas hoy no revisa el texto buscado.
- La lista `PALABRAS_PROHIBIDAS` es corta y no incluye "prostitución", "armas" en plural ni "pistola". La revisión con IA sí nombra armas, drogas, trata de personas, menores y servicios sexuales.

**Comportamiento definido:**
1. El intérprete detecta la categoría prohibida **antes** de buscar, con una lista compartida normalizada (sin tildes, plurales, sinónimos). No ejecuta búsqueda ni llama a la IA.
2. Muestra un mensaje neutro con botón de reportar, sin alternativas ni sugerencias parecidas. Texto base: "Esa búsqueda va contra las normas de remarket-db. Si ves una publicación que las incumple, puedes reportarla."
3. Se bloquea **toda la frase**, no solo la palabra (con "Juan que vende armas" no se muestra ningún Juan).
4. Segunda barrera: la regla de visibilidad (sección 5).
5. Se registra el intento sin identificar a la persona (texto, fecha, idioma, tipo "bloqueada por normas") y se lleva un contador por texto buscado para el administrador.
6. Comparación por **palabra completa**, para no bloquear "armario", "armadura" o "droguería". Las frases dudosas no se bloquean; pasan por la regla de visibilidad.
7. La lista se amplía y se usa en un solo lugar, tanto al publicar como al buscar.

## 7. Decisiones

### Aceptadas por el usuario (23/10)
- Mensaje de búsqueda prohibida: el de la sección 6.
- Bloquear toda la frase cuando aparece una categoría prohibida.
- Avisar al administrador con un contador por texto buscado, sin identificar a la persona.
- Publicación con alerta vacía: entra en tarjetas solo si su nivel es bajo; las vacías van a revisión. **Cuidado:** las publicaciones antiguas podrían tener el nivel vacío; hay que contar cuántas son antes de aplicarlo.
- Ampliar la lista de palabras prohibidas y compartirla entre publicar y buscar.

### Por confirmar (sugerencia entre paréntesis)
1. Conectar los lugares de a uno: Buscar Personas, Compartir, Nuevo mensaje, asistente (sí).
2. "Por precio": ¿tener precio publicado, ordenar o rango? (ordenar y rango, tras ver cómo se guarda el precio).
3. "Que compre": ¿se agrega "necesito X"? (ignorarlo por ahora y avisarlo; etapa posterior).
4. Zona: ¿ids de localidades o texto del país? (ids, con el país de respaldo).
5. ¿Buscar por categoría aunque no haya publicaciones? (sí).
6. Máximo de resultados y páginas (20 por página y un tope).
7. Alerta **media**: ¿fuera de las tarjetas, o solo la alta? (ambas fuera, sin tocar el muro).
8. ¿Un reporte pendiente oculta la publicación de la búsqueda? (sí).
9. ¿Existe una lista de productos o servicios prohibidos que la búsqueda deba respetar? (solo lo sabe el dueño del proyecto).
10. ¿Los usuarios pueden decidir si aparecen en búsquedas? (revisar y agregar si no existe).

## 8. Plan de pasos

1. **Inventario** (solo leer): dónde se llama la búsqueda de personas, con qué datos y qué se hace con el resultado.
2. **Ver las columnas** de `productos`, `localidades` y `perfiles_publicos` con la consulta de solo lectura de la bitácora del 22/10 (la corre el usuario en Supabase).
3. **Cerrar las decisiones** pendientes de la sección 7.
4. **Motor** en archivo nuevo (`panel-usuario-4.js`), sin tocar lo viejo.
5. **Intérprete** (reglas simples primero, IA después).
6. **Conectar los lugares de a uno**, probando cada vez.
7. **Textos en todos los idiomas** y pruebas con 3 cuentas (sin sesión, la propia, otra distinta).
8. **Actualizar esta bitácora** con lo hecho.

## 9. Lo que no se ha verificado
- Qué significan exactamente `medio` y `alto` y si se calculan bien.
- Qué columna marca una publicación como suspendida o retirada.
- Si un reporte cambia el estado de la publicación o hace falta una columna nueva.
- Cómo se guarda el precio y si los servicios tienen precio fijo.
- Si existe hoy la opción de aparecer o no en búsquedas.
- Cuántas publicaciones antiguas tienen el nivel de alerta vacío.

---

## 10. Inventario (paso 1, hecho el 23/10) — solo lectura del código

**Método:** búsqueda de los nombres de función en `js/` e `index.html` y lectura de cada punto de llamada. No se probó en el navegador.

### Funciones de búsqueda que existen hoy
| Función | Archivo | Qué hace |
|---|---|---|
| `buscarUsuariosPorNombre(q, nivelZona)` | panel-usuario-3.js:1291 | Busca por nombre/iniciales y zona. |
| `buscarUsuariosCompartir(categoria, nivelZona)` | panel-usuario-3.js:1601 | Lee `perfiles_publicos`; filtra por la **categoría del perfil** (no por publicaciones) y por zona; trae 8 sin orden y muestra 5; excluye a quien busca y a bloqueados. |
| `consultarAsistenteCompartir(texto, categoria)` | panel-usuario-3.js:1523 | Mini asistente con IA (Groq): devuelve categoría (lista fija de 9) y nivel de zona. No entiende nombre, "qué hace", precio ni iniciales. Tiene respaldo por diccionario. |
| `obtenerLocalidadIdsPorNivel(nivel)` | panel-usuario-3.js:1580 | Ya convierte local/regional/país en **ids de localidades** usando la localidad de quien busca. |

### Los lugares que buscan personas
1. **Buscar Personas (panel):** `buscarEnPanelPersonas` (panel-usuario-1.js:644). Usa `buscarUsuariosPorNombre`; si no hay resultado y se escribió texto, pregunta al mini asistente y luego usa `buscarUsuariosCompartir`. Tiene aviso de localidad en la ruta de la IA.
2. **Resultados en la página principal, filtro de zona:** `filtrarResultadosPersonasPorZona` (ui-controller.js:399). Usa `buscarUsuariosPorNombre`.
3. **Compartir y Nuevo mensaje:** `buscarPersonaPicker(q, contexto)` (panel-usuario-3.js:1454), mismo flujo que Buscar Personas. Compartir además tiene `_aplicarFiltrosCompartir` (1382) que llama directo a `buscarUsuariosCompartir` con el filtro de rubro, con aviso de localidad.
4. **Asistente del chat en la página principal:** acción `BUSCAR_PERSONA` (event-controller.js:78). Usa `buscarUsuariosPorNombre(nombre)` **sin zona**, y si no hay resultado usa el mini asistente.
5. **Asistente dentro del panel:** acción `BUSCAR_PERSONA` (panel-usuario-3.js:1872). Usa `buscarUsuariosPorNombre(nombre)` **sin zona y sin respaldo**.

Además, la sugerencia automática al abrir Compartir pasa por `buscarUsuariosPorCategoria` → `buscarUsuariosCompartir`.

### Cuatro formas distintas de pintar el resultado
`mostrarResultadosPersonas` (página principal), `_renderTarjetasPanelPersonas` (Buscar Personas), `_renderResultadosPersonaPicker` (Compartir y Nuevo mensaje), `renderResultadosPersonasEnFeed` (asistente del panel). Esta es la capa 3 del diseño.

### Hallazgos
- El asistente (lugares 4 y 5) no pasa la zona: "personas de mi ciudad" se busca como si fuera un nombre.
- Hoy **no existe búsqueda por lo que la persona ofrece**; la "categoría" es la del perfil.
- Compartir muestra como máximo 5 resultados; ninguna búsqueda tiene paginación ni orden definido.
- Ninguno aplica la regla de visibilidad (sección 5) ni revisa búsquedas prohibidas (sección 6).
- El aviso "define tu localidad" existe en Compartir y Buscar Personas, pero no en el asistente.
- Los mensajes de estos flujos están escritos en español fijo en lo que vi; la traducción queda para el paso 7.
- **Buena noticia:** `obtenerLocalidadIdsPorNivel` ya trabaja con ids, así que la decisión 4 (zona por ids) se apoya en algo existente.

### Lo que no se revisó
- Otros lugares que consulten `perfiles_publicos` directo sin pasar por estas funciones (la búsqueda fue por nombre de función).
- `index.html` y los demás módulos fuera de los cinco archivos indicados.

---

## 11. Avance (23/10) — intérprete v1 construido

**Archivos nuevos (no están conectados a nada todavía; `index.html` no se tocó):**
- `js/modules/busqueda-personas-interprete.js` — objeto `InterpreteBusquedaPersonas`. Función pura: sin red, sin IA, sin DOM.
- `tests/interprete-busqueda-personas.test.js` — 42 pruebas que se corren con `node tests/interprete-busqueda-personas.test.js` (hoy pasan las 42).

**Qué hace:** `interpretar(texto)` devuelve la ficha de la sección 3 (nombre, `@usuario`, iniciales, zona, qué hace, qué ofrece, precio). Además:
- Corta las búsquedas prohibidas antes de interpretar nada (sección 6), comparando por palabra completa y sin tildes. Palabras ambiguas ("arma", "pistola") solo se marcan como `dudosa`.
- Una sola letra queda con `necesita_segunda_pista`.
- "Que compre" se detecta, se ignora y queda en `hace_no_soportado`.
- `describir(ficha)` arma el texto "Busqué: ...".
- `sanear(fichaExterna)` es la validación para cuando la IA llene la ficha: solo deja pasar campos conocidos con valores permitidos y vuelve a aplicar el filtro de prohibidas.

**Decisiones que se tomaron por defecto y conviene confirmar:**
- "Por precio" suelto → orden del más barato al más caro, marcado `ambiguo` (decisión 2).
- La lista de frases prohibidas es **inicial**; el dueño debe revisarla y ampliarla.
- `ambigua = true` cuando el nombre tiene más de 2 palabras: significa "si la búsqueda por nombre no da nada, pregunta a la IA", no "pregunta a la IA primero".

**Límites conocidos:** lugares nombrados ("de Arequipa") y servicios sin la palabra "servicio" ("da clases") no se entienden aún; textos del resumen en español fijo.

**Falta:** paso 2 (columnas en Supabase), paso 3 (decisiones), motor (`panel-usuario-4.js`), conexión de los 5 lugares y traducciones.

---

## 12. Paso 2 hecho (23/10) — columnas de la base (consulta del usuario en Supabase)

**Fuente:** dos CSV con las columnas de `localidades`, `perfiles_publicos` y `productos`, y un conteo de valores. Solo se consultaron esas tres tablas.

### Lo que hay
- **`perfiles_publicos`:** `id, nombres, apellidos, localidad_id, categoria, pais, nombre_usuario, created_at, foto_perfil, foto_portada`. No tiene correo ni teléfono: sirve como base segura para la búsqueda (regla de privacidad 1). No tiene ninguna columna de cuenta suspendida/inactiva ni de "aparecer en búsquedas".
- **`productos`:** `modalidad, precio, moneda, categoria, ciudad, pais, alcance, estado, motivo_rechazo, reportes_count, ia_scan_status, nivel_alerta_ocr, nivel_alerta_legal`, entre otras. No hay columna que distinga producto de servicio.
- **`localidades`:** `id, pais_id, nombre, region, id_estatus, latitud, longitud, radio_cobertura_km`.

### Conteos
- `perfiles_publicos.categoria`: **9 perfiles, todos "General"**.
- `productos`: **42** en total; `estado`: 41 aprobado, 1 borrador; `modalidad`: **42 de 42 "venta"**; `alcance`: 36 local, 4 mundial, 2 regional.

### Lo que esto significa para el diseño (conclusiones, por confirmar)
1. **La categoría del perfil no sirve para buscar.** Con todos los perfiles en "General", el filtro de `buscarUsuariosCompartir` (`ilike '%Tecnología%'` sobre la categoría del perfil) no debería devolver nada nunca. Por probar en el navegador. La categoría útil es la de `productos.categoria` (lo que la persona ofrece).
2. **Servicio = `productos.categoria` "Servicios"** (según la lista de categorías del código). No se verificó cuántas filas la tienen.
3. **"Qué hace":** hoy solo existe "venta". Regala/cambia no tienen datos.
4. **Zona por ids es viable:** `perfiles_publicos.localidad_id` → `localidades` (nombre, region, pais_id). `obtenerLocalidadIdsPorNivel` ya lo hace. Un lugar nombrado ("de Arequipa") se puede resolver con `localidades.nombre` y `region`. Un país por nombre necesitaría la tabla de países (no consultada). `perfiles_publicos.pais` (texto) sirve de respaldo.
5. **Precio:** `precio` numérico y `moneda` texto permiten orden y rango. Ordenar mezclando monedas engaña; falta ver qué valores tiene `moneda`.
6. **Reportes:** `reportes_count` permite ocultar de la búsqueda lo reportado sin columna nueva. El número no distingue reporte resuelto de pendiente.
7. **Alertas:** `nivel_alerta_legal`, `nivel_alerta_ocr` e `ia_scan_status` existen y se pueden usar en la regla de visibilidad.
8. **Cuentas suspendidas y "no aparecer en búsquedas":** no están en `perfiles_publicos`. Pueden estar en otra tabla (por ejemplo la privada de perfiles) o no existir. Por averiguar.
9. **Escala actual:** 9 perfiles y 42 productos. Consultas desde el navegador alcanzan; la función SQL puede esperar.

### Pendiente de consulta (solo lectura, solo conteos)
Distribución de `productos.categoria`, `moneda`, precios vacíos, `nivel_alerta_legal`, `ia_scan_status`, `reportes_count` y `localidades.id_estatus`; y la lista de tablas de la base para ubicar dónde está la suspensión de cuentas.

---

## 13. Cambio (24/10): un solo intérprete

El intérprete de la sección 11 (`busqueda-personas-interprete.js`) **se retiró**. Existía otro, hecho en otra sesión, con la misma variable global. Se unieron en `js/modules/interprete-busqueda-personas.js` (v3, 121 pruebas), tomando como base el de la otra sesión y sumándole las iniciales, `@usuario`, precio, "qué hace", la segunda pista y `sanear()`. El detalle está en `BITACORA-MOTOR-BUSQUEDA-PERSONAS.md`, sección 12.

**Corrección a la sección 12 de esta bitácora:** el punto 6 proponía usar `reportes_count` para ocultar publicaciones reportadas. La otra sesión indica que ese contador no se actualiza (está en 0 aunque hay un reporte), así que la regla debería leer la tabla `reportes`. Falta ver cómo se guarda un reporte.
