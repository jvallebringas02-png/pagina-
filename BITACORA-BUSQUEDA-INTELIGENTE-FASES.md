> **Estado: FASE 1 HECHA EN LOS ARCHIVOS (21/10/2026), PENDIENTE DE SUBIR Y PROBAR EN EL NAVEGADOR. Las fases 2, 3 y 4 siguen en plan. Lo marcado "comprobado" se probó con el código en una simulación (Node), no en el navegador real. Lo marcado "no verificado" hay que comprobarlo antes de darlo por cierto.**

# Bitácora — Búsqueda más inteligente, por fases

**Fecha:** 21/10/2026
**Origen:** en el panel, la búsqueda "buscame productos" mostró videos de YouTube en lugar de publicaciones.
**Continúa:** `BITACORA-PENDIENTES-PANEL.md` (sección 1.5) y `BITACORA-REVISION-17-10-PANEL.md` (decisión pendiente: qué hacer cuando la búsqueda no encuentra nada), `BITACORA-BUSQUEDA-PERSONAS.md`.
**Alcance:** `buscador.js` (compartido por la página principal y el panel) y los pintores de resultados de cada lado. Cada fase se entrega por separado, con sus pruebas y su vuelta atrás.

---

## 1. Qué se vio y por qué pasa (comprobado en el código)

- La búsqueda es **híbrida** (`BuscadorMotor.ejecutarBusquedaHibrida`, `buscador.js:369`). Busca en el catálogo; si hay **menos de 3** coincidencias, y no se pidió orden ni modalidad, la completa con internet y YouTube (`buscarEnInternetYVideo`, que llama a `chat-ia` en modo `busqueda_directa`, y éste consulta Serper y YouTube).
- Las palabras vacías (`STOPWORDS`) son artículos, preposiciones y similares. **"buscame" y "productos" no están** en esa lista, así que se buscan como si fueran el nombre de un artículo. Casi ninguna publicación las lleva en el título: salen menos de 3 coincidencias.
- YouTube devuelve videos con "productos" en el título (los dos de la captura lo tienen).
- Si **no queda ninguna palabra específica**, el código ya trata el caso como "todo cuenta igual" (`tokens.length ? calcularPuntaje : 1`): devolvería todo el catálogo. Pero hoy "productos" nunca queda vacío.
- La IA marca `entendido` (sí o no), pero **ninguna parte del código de la página usa esa señal** (solo `ai-service.js` la lee).
- El panel pinta el resultado con `renderResultadoBusquedaEnFeed`: aviso, publicaciones y, debajo, "Resultados de internet" y "Videos de YouTube". La página principal usa `procesarAccionIA` y `UIController`.
- **Lo mismo pasa en la página principal**: la función híbrida es compartida.
- **No verificado:** qué devolvió la IA exactamente (acción y `producto`); se ve en F12 → Red → fila `chat-ia` → Respuesta. Tampoco se verificó cuántas publicaciones carga el catálogo en el navegador, ni si el buscador corrige errores de ortografía.

## 2. Qué se quiere

Un buscador **intuitivo e inteligente**: que entienda cómo escribe la gente y que **nadie se quede en un callejón sin salida**. Ninguna tecnología garantiza que "nada escape". Lo que sí se puede lograr es que siempre haya algo útil que ver o un siguiente paso claro.

Principio: **capas**. Cada capa atrapa lo que la anterior dejó pasar. Reglas rápidas para lo simple; la IA solo cuando hace falta (hoy se llama a la IA en cada búsqueda, aunque sea una palabra).

## 3. Las 4 fases

| Fase | Qué es | Tamaño | Cuándo hace falta |
|---|---|---|---|
| **1. Reglas claras** | Palabras genéricas, pedido general, producto sin resultados, texto sin sentido. Internet y YouTube solo si la persona los pide. Ruta rápida sin IA para búsquedas simples | Pequeño a mediano | **Ahora** |
| **2. Tolerancia** | Corrección de errores ("¿quisiste decir bicicleta?"), búsqueda relajada ("bicicleta eléctrica" → "bicicleta" con aviso), categorías relacionadas | Mediano | Cuando se vean búsquedas fallidas por errores o por poca precisión |
| **3. Búsqueda en el servidor** | La base hace la búsqueda y ordena por relevancia, cercanía y novedad | Mediano a grande | Cuando el catálogo crezca |
| **4. Búsqueda por significado** | Entiende frases como "algo para dormir al bebé" | Grande | Cuando haya muchas publicaciones |

**Dos mejoras que acompañan a todas:**
- **Registrar las búsquedas sin resultado** (qué se busca y no se encuentra): dice qué sinónimos faltan y qué piden y nadie publica.
- **"Avísame cuando publiquen X"**: convierte una búsqueda fallida en una razón para volver.

Con el catálogo actual, las fases 1 y 2 dan casi todo el beneficio.

## 4. Fase 1 en detalle

### 4.1 Cómo se identifica la búsqueda (la "lista de preguntas")

1. **¿La IA pidió otra cosa?** (video, música, internet, publicar, buscar personas): se sigue esa acción. Solo las búsquedas de productos pasan a las siguientes preguntas.
2. **Limpieza:** se quitan las palabras vacías y una **lista de palabras genéricas** (4.2). Lo que queda son los términos específicos.
3. **¿Quedó algo?**
   - Nada → **pedido general**: se muestra lo último publicado.
   - Algo → se continúa.
4. **¿El catálogo tiene algo con esos términos?**
   - Sí → se muestran las publicaciones. Si son pocas, aparece un botón para buscar también en internet (nunca se muestra solo).
   - No → se continúa.
5. **¿Se conocen esas palabras?** (vocabulario del catálogo, lista de tipos de producto, sinónimos)
   - Alguna es conocida → **producto concreto sin resultados**: mensaje claro y opciones.
   - Ninguna → si la IA marcó "no entendido", **texto sin sentido**: mensaje amable con ejemplos. Si la IA dijo "entendido", se trata como producto concreto con un mensaje más suave ("¿Lo escribiste bien?").

### 4.2 Lista inicial de palabras genéricas (propuesta, **la revisas tú**)

- **Verbos de pedido:** busca, buscame, buscar, busco, muestrame, muestra, quiero, necesito, dame, dime, hay, tienes, tienen, encuentra, encuentrame.
- **Palabras genéricas:** producto, productos, cosa, cosas, articulo, articulos, algo, anuncio, anuncios, publicacion, publicaciones.
- Se comparan sin tildes y en minúsculas (verificar que `normalizar` lo haga así).
- Empieza en **español**. Para otros idiomas se confía en que la IA responda "lo último publicado"; mejorarlo en el servidor es la opción C (sección 8).

### 4.3 Qué ve la persona

| Escribe | Tipo | Resultado |
|---|---|---|
| búscame productos / qué cosas hay | General | Lo último publicado |
| zapatos | Normal | Sus publicaciones de zapatos |
| bicicleta eléctrica (no existe) | Concreto sin resultados | "No encontré publicaciones de 'bicicleta eléctrica' en la plataforma." con opciones: otras palabras, ver categorías, ver lo último, **botón "¿Buscar también en internet?"** |
| asdfgh | Sin sentido | "No entendí qué buscas. Prueba con 'zapatos', 'bicicleta' o 'lo último publicado'." con los botones rápidos |
| bisicleta (mal escrito) | Concreto desconocido | "No encontré 'bisicleta'. ¿Lo escribiste bien?" (la corrección real llega en la fase 2) |

En ningún caso salen videos o internet sin que la persona los pida.

### 4.4 Ruta rápida (sin IA)

- **Idea:** si la búsqueda es de una o dos palabras y **todas son conocidas** (están en el vocabulario del catálogo, en las categorías o en los sinónimos), se va directo a la búsqueda local, sin llamar a la IA. Es más rápido y ahorra cupo.
- **Cuidado:** "Juan Pérez" (buscar a una persona), "hola" o "videos" también son una o dos palabras. Por eso la ruta rápida solo se toma cuando **todas las palabras son conocidas como productos**; lo demás sigue pasando por la IA.
- **Riesgo:** si el vocabulario conocido es corto, la ruta rápida se usa poco; si es amplio, puede robar búsquedas que la IA entendería mejor. Se ajusta con pruebas.

### 4.5 Cambios por archivo (previstos)

| Archivo | Cambio |
|---|---|
| `buscador.js` | Lista de palabras genéricas; la híbrida deja de completar con internet por sí sola y devuelve el tipo de búsqueda (`tipo`); `clasificarSinResultados`; la ruta rápida **no** se hizo. *(La función de "lo último publicado" ya existía: `obtenerRecientes`.)* |
| `event-controller.js` | La página principal pinta los nuevos tipos de resultado y el botón de internet; usa la señal `entendido` |
| `panel-usuario-3.js` | El panel hace lo mismo en el feed (`renderResultadoBusquedaEnFeed`, `procesarAccionEnFeed`, el buscador del panel) |
| `ui-controller.js` | Pintar los mensajes nuevos en la página principal |
| `i18n.js` | Textos nuevos (mensajes, botones) en 15 idiomas; quechua y aimara en español. *(`i18n-institucional.js` no hizo falta: los textos de resultados viven en `CHROME_RESULTADOS_I18N`, de `i18n.js`.)* |

El panel está en revisión: **hace falta tu visto bueno para tocar `panel-usuario-3.js`**.

### 4.6 Pruebas previstas

- [ ] "búscame productos", "qué cosas hay", "muéstrame artículos": sale lo último publicado, sin YouTube.
- [ ] "zapatos", "bicicleta": sus publicaciones, como antes.
- [ ] "bicicleta eléctrica", si no existe: mensaje claro, opciones y botón de internet; al pulsarlo, salen la web y YouTube.
- [ ] "asdfgh": mensaje de "no entendí" con ejemplos y botones rápidos.
- [ ] "zapatos baratos en Lima", "solo trueque de celulares": siguen funcionando.
- [ ] "buscar a Juan Pérez", "hola", "videos de cocina peruana", "quiero publicar mi bicicleta": no se rompen por la ruta rápida.
- [ ] Panel y página principal, con y sin sesión.
- [ ] Cambiar de idioma: mensajes en el idioma elegido.
- [ ] Con la IA sin cupo o caída: la búsqueda simple sigue funcionando por la ruta rápida.

## 5. Fase 2 — Tolerancia (resumen)

- Comparación aproximada de palabras para corregir errores, usando el vocabulario del catálogo.
- Búsqueda relajada: quitar la palabra menos importante si no hay resultados, y avisarlo.
- Categorías relacionadas como sugerencia.
- Riesgo: una corrección equivocada confunde; siempre se avisa lo que se hizo ("Mostrando resultados de 'bicicleta'").

## 6. Fases 3 y 4 — Servidor y significado (resumen)

- **Fase 3:** extensiones de texto de Postgres (`pg_trgm`, `unaccent`) para búsqueda aproximada y sin tildes, y orden por relevancia, cercanía y novedad. **No verificado** si están activadas en tu proyecto. Existen en Supabase una función `buscar-articulos` y una función SQL `buscar_anuncios_ranking` que la página no usa; **no se revisaron a fondo** (en una lectura rápida: toman `usuario_id` del cuerpo de la petición y `limite` y `radio_km` no tienen tope).
- **Fase 4:** vectores (`pgvector`) y un modelo de embeddings. **No verificado** qué modelo, costo ni límites aplican en tu plan.
- Ambas solo tienen sentido cuando el catálogo crezca.

## 7. Registro de búsquedas sin resultado y "avísame" (mejoras transversales)

- Una tabla con el texto buscado, la fecha, el idioma y el tipo de resultado (sin identificar a la persona, para cuidar los datos personales).
- Riesgo: cualquiera podría llenarla de basura si se permite escribir sin control; se resuelve con una función en Supabase que valide el largo y limite la frecuencia, como en los formularios.
- "Avísame cuando publiquen X" exigiría cuenta y un aviso (notificación o correo); es una fase aparte.

## 8. Opciones fuera de este plan

- **C. Servidor (`chat-ia`):** que la IA clasifique "búscame productos" como "lo último publicado" (acción `RECIENTES`) o como "listar categorías". Exige desplegar la función; en otros idiomas ayudaría más que la lista de palabras.
- Usar la señal `entendido` para mostrar la guía de ejemplos cuando la IA no entiende.

## 9. Decisiones (estado al 21/10/2026)

- [x] **Lista de palabras genéricas (4.2):** aplicada tal como se propuso, con estos ajustes: **no se agregó "hay"** (ya estaba en `STOPWORDS`) y **se agregaron 4 palabras**: `novedades`, `recientes`, `ultimo`, `ultimos` (para que "dame lo último" o "novedades" también sean pedido general). **Revísala tú**: es la lista que más conviene ajustar con el uso real.
- [x] **Internet y YouTube solo si la persona los pide (botón).** Aplicado: la búsqueda ya no llama a internet por sí sola en ningún caso.
- [ ] **Ruta rápida sin IA (4.4): NO se incluyó.** Queda para una segunda entrega de la Fase 1 (ver sección 14.5).
- [x] **Visto bueno para `panel-usuario-3.js`:** se tocó (pedido del 21/10/2026: "hacer todos los cambios").
- [ ] **Registro de búsquedas sin resultado (sección 7):** pendiente. No se tocó Supabase.
- [ ] **Revisión de los textos nuevos** (ver 14.4): hace falta que alguien que hable esos idiomas revise **árabe, hindi, búlgaro y turco** (y de preferencia también ruso, chino, japonés y coreano). Los escribí yo y no hay revisión humana.

## 10. Qué no cambia

- Los filtros de orden, ubicación y modalidad.
- La búsqueda de personas (`BITACORA-BUSQUEDA-PERSONAS.md` sigue aparte).
- La IA para los casos que no son una búsqueda de productos (video, música, publicar, preguntas).
- Supabase: ningún cambio en esta fase.

## 11. Cómo volver atrás

Subir de nuevo los archivos anteriores del repositorio. Cada fase se entrega por separado y se puede revertir sin tocar las otras.

## 12. Límites de este plan

- Todo sale de leer el código; no se abrió la página.
- La lista de palabras genéricas es una propuesta inicial; la gente escribe de formas que no se anticipan.
- Distinguir un producto inexistente de un texto sin sentido es difícil con reglas locales, por eso se usa la señal de la IA, hoy sin uso.
- La corrección de ortografía no existe en la Fase 1 (llega en la fase 2).
- Ninguna fase garantiza que "nada escape"; por eso siempre queda una salida visible.

## 13. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 21/10/2026 | Análisis de por qué "buscame productos" muestra YouTube y plan de 4 fases | Plan; sin cambios de código |
| 21/10/2026 | **Fase 1 aplicada en los archivos** (pasos 1 a 4 de la sección 14) | Probada en simulación; **falta subir y probar en el navegador** |

---

## 14. FASE 1 — Qué se hizo (21/10/2026)

### 14.1 Archivos cambiados (solo estos 5; el resto del zip no se tocó)

| Archivo | Cambio | Tamaño del cambio |
|---|---|---|
| `js/modules/buscador.js` | Paso 1: motor | +56 / −7 líneas |
| `js/modules/ui-controller.js` | Paso 2: página principal (pintado y botones) | +47 / −2 |
| `js/modules/event-controller.js` | Paso 2: pasa la señal `entendido` | +1 / −1 |
| `js/modules/panel-usuario-3.js` | Paso 3: panel (pintado, botones, señal `entendido`) | +58 / −1 |
| `js/i18n.js` | Paso 4: 11 textos nuevos en 15 idiomas | +15 / −15 (líneas ampliadas) |

### 14.2 Qué hace ahora cada búsqueda

`ejecutarBusquedaHibrida` devuelve un campo nuevo `tipo`:

| `tipo` | Cuándo | Qué se ve |
|---|---|---|
| `general` | Después de quitar palabras vacías y genéricas no queda ninguna palabra, y no hay lugar, orden, modalidad ni presupuesto | Lo último publicado. En el panel se carga el feed normal (con likes y comentarios), igual que la acción `RECIENTES` |
| `pocos` | Hay 1 o 2 publicaciones | Las publicaciones y debajo "¿Buscar también en internet?" |
| `sin_resultados` | 0 publicaciones y alguna palabra se conoce como producto | "No encontré publicaciones de “X” en la plataforma." + botones: ver lo último, ver categorías, buscar en internet, publicar esto (en el panel no está "publicar esto") |
| `no_escribio` | 0 publicaciones, ninguna palabra conocida, y la IA sí entendió (o no hubo IA) | "No encontré “X”. ¿Lo escribiste bien?" + los mismos botones (sin "publicar") |
| `sin_sentido` | 0 publicaciones, ninguna palabra conocida y la IA marcó `entendido: false` | "No entendí qué buscas. Prueba con…" + ver lo último y ver categorías (sin botón de internet) |
| sin `tipo` | Búsquedas con lugar, orden o modalidad, o con 3 o más resultados | Igual que antes |

- **Palabras conocidas** = categorías y tipos de producto (`MAPA_CATEGORIAS`), sinónimos (`JERGA`) y palabras de títulos y categorías del catálogo cargado.
- **Botón de internet:** llama a `buscarEnInternetYVideo` (la misma función de antes) solo cuando se pulsa. El resultado se pinta con un aviso: "Estos resultados vienen de internet, no son publicaciones de la plataforma." Si no hay nada, dice "Tampoco encontramos nada en internet sobre eso." Si la persona cambia de vista mientras espera, no se pisa lo que está viendo.
- **Señal `entendido`:** ahora se usa. La página principal y el panel la pasan en `opciones.entendido` (queda en `true` salvo que la IA diga `false`). Los respaldos por fallo de IA no la pasan: se asume "entendido".
- **Seguridad:** el texto escrito por la persona se escapa antes de ponerlo en el HTML y en `data-q`, y los botones se leen por `dataset`, con el mismo patrón que ya usaba la página (`data-ui-accion`, `data-pu-accion`). Se probó con `<img src=x onerror=alert(1)> "&$&`: sale como texto, sin ejecutarse.

### 14.3 Pruebas hechas (en simulación con Node, catálogo de 7 publicaciones de ejemplo)

Comprobado:
- [x] "buscame productos", "qué cosas hay", "muéstrame artículos", "dame novedades": `general`, 7 resultados, sin internet.
- [x] "buscame productos en Lima": sigue filtrando por lugar (7 resultados).
- [x] "zapatos", "zapatos baratos en Lima": sus publicaciones, como antes.
- [x] "celular", "laptop", "bicicleta": `pocos` con botón de internet.
- [x] "asdfgh" con IA `entendido:false`: `sin_sentido`; sin dato de la IA: `no_escribio`. "bisicleta": `no_escribio`.
- [x] **Cero llamadas a internet o YouTube hechas por sí solas** en toda la tanda.
- [x] Las 11 claves nuevas existen en los 17 idiomas (quechua y aimara usan el español por respaldo, como se planeó).
- [x] Los mensajes y botones de cada tipo salen bien en la página principal y en el panel; el caso viejo (sin `tipo`) se pinta igual que antes.
- [x] Sintaxis correcta (`node --check`) en los 5 archivos.

**NO comprobado (hace falta tú, en el navegador):**
- [ ] El punto 4.6 completo, con el catálogo real, con y sin sesión, en la página principal y en el panel.
- [ ] Que "búscame productos" ya no muestre YouTube **con la IA real** (qué acción devuelve `chat-ia`: F12 → Red → `chat-ia` → Respuesta). Si la IA responde `BUSCAR` con `producto: "productos"`, funciona por la lista genérica; si responde `RECIENTES`, también.
- [ ] Pulsar "¿Buscar también en internet?" y ver la web y YouTube (depende de `chat-ia` y de la cuota de Serper/YouTube).
- [ ] Cambiar de idioma y mirar los mensajes nuevos.
- [ ] Clics en categorías, matriz y "Ver mi zona" (usan la misma función; ya no completan con internet).
- [ ] Con la IA sin cupo o caída (los respaldos llaman a la misma función).
- [ ] "buscar a Juan Pérez", "hola", "videos de cocina peruana", "quiero publicar mi bicicleta": no deberían cambiar (no pasan por este código), pero no se probaron con la IA real.

### 14.4 Textos nuevos (los 11)

`chrome_busq_general`, `chrome_busq_sin_resultados`, `chrome_busq_no_escribio`, `chrome_busq_sin_sentido`, `chrome_busq_pocos`, `chrome_btn_internet`, `chrome_btn_ultimo`, `chrome_btn_categorias`, `chrome_buscando_internet`, `chrome_aviso_externo`, `chrome_internet_vacio`.

Idiomas con texto propio: es, en, pt, fr, de, it, ru, zh, ja, ko, ar, hi, nl, tr, bg. Quechua y aimara se ven en español. **Sin revisión humana**, sobre todo árabe, hindi, búlgaro y turco. Los ejemplos del mensaje "no entendí" ("zapatos", "bicicleta") van traducidos al idioma, pero la IA es quien interpreta lo que se escribe.

### 14.5 Lo que NO se hizo

- **Ruta rápida sin IA (4.4):** pendiente. La búsqueda sigue llamando a la IA en cada consulta. El respaldo cuando la IA falla ya funciona por la búsqueda local.
- **Corrección de ortografía** (Fase 2): "bisicleta" solo dice "¿Lo escribiste bien?".
- **Registro de búsquedas sin resultado y "avísame":** pendientes.
- **Idiomas que no son español en el pedido general:** "show me products" no se reconoce como general con la lista; depende de que la IA responda `RECIENTES` (opción C, sección 8).
- **Servidor (`chat-ia`):** no se tocó.

### 14.6 Hallazgos nuevos mientras se leía el código (no se cambiaron)

1. **"lo último publicado" ya existía** (`obtenerRecientes`) y **el catálogo viene ordenado del más nuevo al más viejo** (`database.js`: `order('created_at', desc)`, **`limit(100)`**). Comprobado en el código. El límite de 100 importa para la Fase 3.
2. **"tv" no se puede buscar:** `tokenizar` descarta palabras de 2 letras o menos, aunque `tv` está en `MAPA_CATEGORIAS`. Antes devolvía todo el catálogo; ahora se trata como pedido general (mismo resultado, con el aviso "Mostrando lo último publicado"). Arreglo posible: aceptar 2 letras si la palabra está en `MAPA_CATEGORIAS`.
3. **`mapear` (buscador) y `obtenerRecientes` no copian `id`, `fotos` ni `likes_count`** del producto. **No verificado** qué efecto tiene en las tarjetas de resultados del panel (likes y comentarios). El pedido general en el panel no se ve afectado porque usa `cargarFeed`.
4. **Búsqueda con orden o modalidad y 0 resultados** ("lo más barato", "solo trueque"): sigue sin `tipo`, así que muestra el mensaje antiguo ("No encontramos artículos con…"). No se cambió a propósito.
5. **"bicicleta eléctrica"** devuelve las bicicletas que existan (`pocos`), porque el puntaje suma por palabra. Para ver "sin resultados" hace falta una búsqueda sin ninguna palabra en común. La búsqueda relajada con aviso es de la Fase 2.

### 14.7 Cómo subir y cómo volver atrás

- **Subir:** reemplazar en el repositorio estos 5 archivos por los nuevos (misma ruta): `js/modules/buscador.js`, `js/modules/ui-controller.js`, `js/modules/event-controller.js`, `js/modules/panel-usuario-3.js`, `js/i18n.js`. Los demás archivos no cambian. Después, recarga fuerte (Ctrl+F5) por la caché del navegador.
- **Volver atrás:** subir de nuevo los 5 archivos anteriores. No hay cambios en Supabase ni en las funciones del servidor.
- **Volver atrás por partes (razonado, no probado):** si solo se vuelve `panel-usuario-3.js`, el panel usa su pintado anterior: los casos sin resultados salen con el mensaje antiguo y el pedido general muestra la lista sin pasar por `cargarFeed`. Si solo se vuelve `buscador.js`, la página y el panel nuevos siguen funcionando, pero la búsqueda vuelve a completar con internet por sí sola (el problema original). Lo más seguro es volver los 5 juntos.

### 14.8 Siguiente paso recomendado

1. Subir los 5 archivos y hacer las pruebas de 14.3 (sobre todo la primera: "búscame productos" con la IA real).
2. Si todo bien, decidir la ruta rápida sin IA (4.4) y el registro de búsquedas sin resultado (7).
3. Con unas semanas de uso, mirar qué búsquedas fallan y recién entonces definir la Fase 2.
