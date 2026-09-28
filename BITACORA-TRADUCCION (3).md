# Bitácora — Traducción multilingüe de remarket-db

**Esta es la bitácora principal y la única que se mantiene al día.** Las bitácoras de sesión (`BITACORA-SESION-*.md`) quedaron como historial en `docs/bitacoras/`; lo importante de cada una ya está resumido aquí.

Para retomar el trabajo en cualquier conversación: traer este archivo y seguir desde la sección 5.

**Última actualización:** 28/09/2026

---

## 1. Cómo se traduce (arquitectura)

Cada tipo de contenido se traduce de una forma distinta:

| Tipo de contenido | Cómo se traduce | Dónde vive |
|---|---|---|
| Textos fijos y cortos (menú, botones, footer, banners y etiquetas de resultados, categorías, modalidades, mensajes de guía, formularios) | Diccionario fijo escrito a mano, 17 idiomas | `js/i18n.js`, `js/i18n-institucional.js` |
| Contenido largo o legal (Términos, Privacidad, "Quiénes somos", artículo del muro) | Texto en español en Supabase (`contenido_administrable`). Se traduce con IA la primera vez que alguien lo pide en un idioma y se guarda en la columna `traducciones` | `js/modules/institucional.js`, `js/modules/contenido-info.js` |
| Contenido de usuarios (título y descripción de productos) | Igual: se traduce con IA al mostrarse y se guarda en `productos.traducciones` | `js/modules/buscador.js` → `TraduccionProductos` |

**Algoritmo de traducción bajo demanda:**
1. Se muestra el texto en español de inmediato.
2. En segundo plano se busca si ya hay una traducción guardada para ese idioma.
3. Si existe, se muestra sin gastar IA.
4. Si no existe, se pide a Groq (función Edge `traducir-texto`).
5. Al responder, se cambia el texto en pantalla y se guarda en Supabase para la próxima persona.

**Regla:** si el contenido existe antes de escribir el código y casi no cambia, va en el código fuente. Si lo genera un usuario o puede crecer sin límite, va en la base de datos con este algoritmo.

**Excepción a propósito:** en documentos legales (Términos, Privacidad), quechua y aymara no se traducen con IA. Se muestra el español con un aviso (`IDIOMAS_LEGAL_SOLO_ES` en `institucional.js`).

**Detalles a recordar:**
- Los textos fijos de resultados se dibujan al momento de mostrar la lista. Si la persona cambia de idioma con una lista ya en pantalla, esa lista no se repinta hasta la siguiente búsqueda (pendiente, ver sección 5).
- El Asistente responde en el idioma en que escribe la persona, no en el del selector.
- Los productos sin `id` de Supabase (los 6 de ejemplo de `database.js` y los de dummyjson) no se traducen a propósito: no hay dónde guardar la traducción.

---

## 2. Qué está hecho

- ✅ Header, menú, buscador, footer, botones rápidos del panel lateral
- ✅ Banner de bienvenida, banner "IA Autónoma", título "Patrocinadores"
- ✅ Mensajes de guía del Asistente (`obtenerMensajeGuia`)
- ✅ Formularios guiados: Contacto Admin y Libro de Reclamaciones
- ✅ Términos, Privacidad y "Quiénes somos" (filas confirmadas en Supabase)
- ✅ **Paso 7:** textos fijos de resultados (títulos, 8 banners, "Resultados para:", Disponible / Patrocinado / Contactar / Reportar / Ver detalles) y nombres de categoría y modalidad, en búsqueda, "Ver mi zona" y catálogo inicial
- ✅ Traducción de productos en resultados de búsqueda, en "Ver mi zona" y en el catálogo inicial
- ✅ Artículo central del muro traducido con el endpoint nuevo
- ✅ Separación de cuenta de Groq: chat en una cuenta, traducciones en otra
- ✅ Limpieza en Supabase (28/09/2026) de las traducciones `ru`, `bg`, `qu`, `ay` guardadas por error en inglés

**Prueba en vivo del 28/09/2026 (aimara):** la función `traducir-texto` responde (`modelo: openai/gpt-oss-20b`), la consola sin errores 429, y los títulos, descripciones, categorías y botones salieron en aimara. Ver el riesgo de calidad en la sección 4.

---

## 3. Groq: cómo está configurado hoy

- **Dos cuentas de Groq:** la del chat (función `chat-ia`) y la de traducciones (función `traducir-texto`, secreto `GROQ_API_KEY_TRADUCCION`).
- **Límite del plan gratis:** 8,000 tokens por minuto por modelo y por organización. Crear más keys no ayuda.
- **Función `traducir-texto`:** prueba `openai/gpt-oss-20b`, luego `openai/gpt-oss-120b`, luego `qwen/qwen3.8-27b` (este último es incierto y se salta si no existe). Pone un tope de tokens según el largo del texto y `reasoning_effort: low`. Los modelos se pueden cambiar sin tocar código con el secreto opcional `MODELOS_TRADUCCION` (IDs separados por coma).
- **Cliente:** `TraduccionProductos.TAMANO_TANDA = 1` (una llamada a la vez) y `traducirTextoIA` reintenta si recibe 429 o 503 (esperas de 4 y 10 segundos). Tarda más la primera vez (una página de 9 productos puede tardar cerca de 30 segundos) pero queda guardado.
- **Modelos retirados por Groq (no usar):** `llama-3.1-8b-instant`, `llama-3.3-70b-versatile` (16/08/2026), `qwen/qwen3-32b`, `llama-4-scout` (17/07/2026). Lista vigente: console.groq.com/docs/models
- **Las funciones Edge no están en el repositorio.** La baja del modelo pasó desapercibida por eso. Pendiente guardarlas en `supabase/functions/`.

---

## 4. Riesgo abierto: calidad del aimara y el quechua

En la prueba en aimara, varias traducciones de productos parecen incorrectas ("vendo zapatos" salió como "ñanaka jach'a"; "venta de zapatos" como "suma ch'aska", donde "ch'aska" significa "estrella" en quechua). Los modelos pequeños suelen inventar palabras en estos idiomas, y como la traducción se guarda en Supabase, un error queda fijo para todos.

Opciones (sin decidir):
1. Traducir a quechua y aimara solo la interfaz y dejar los productos en español (lo más seguro; ya se hace con los documentos legales).
2. Probar `openai/gpt-oss-120b` primero (cambiando `MODELOS_TRADUCCION`) y comparar.
3. Que un hablante nativo revise una muestra antes de mostrarla al público.

Pesa más por la idea de destacar quechua y aimara ante patrocinadores públicos: una mala traducción visible puede hacer más daño que dejar el español.

---

## 5. Pendientes (en orden sugerido)

- [ ] **Decidir qué hacer con la calidad de quechua/aimara en productos** (sección 4).
- [ ] **Feed de usuarios logueados** (`panel-usuario-1.js` → `renderPost`): sin traducción de productos.
- [ ] **"Quiénes somos" en el breadcrumb** (`ui-controller.js`, línea ~140): sigue fijo en español.
- [ ] **Guardar las funciones Edge en el repo** (`supabase/functions/traducir-texto/index.ts` y `chat-ia`).
- [ ] **Repintar los resultados ya dibujados al cambiar de idioma.**
- [ ] **Quechua y aimara como idiomas emblemáticos** en el selector (ideas en la sección 6).
- [ ] Otros pendientes menores: detector de idioma por escritura ("casa o departamento" detecta portugués por error), "cambiar" como disparador de cambio de idioma, `<html lang>` y RTL para árabe, "¿Otro idioma? Traduce aquí" fijo en español, nombres de idioma "(Chino)" fijos en `index.html`.
- [ ] Definir qué hacer con los 6 productos de ejemplo de `database.js` y con los patrocinadores (datos de prueba).
- [ ] Bug aparte: "Tool call validation failed" (error 400) en `chat-ia`.
- [ ] Mejora futura: pedir título y descripción en una sola llamada, o traducir al publicar en vez de al visitar.
- [ ] **Panel de usuario completo** (Perfil, Publicar, Mensajes, Configuración): decidido que espera. El feed logueado no cuenta aquí.

---

## 6. Idea: quechua y aymara como idiomas emblemáticos

Destacarlos en vez de listarlos por orden alfabético: valor cultural y argumento comercial para patrocinadores del Estado peruano. Propuesta sin implementar: ponerlos primero en el selector con una etiqueta tipo "Idiomas originarios del Perú 🇵🇪", y una línea traducible en el muro o footer. Depende de resolver antes la calidad (sección 4).

---

## 7. Bugs ya resueltos (para no repetirlos)

- `obtenerMensajeGuia()` se usaba pero no estaba escrita en `i18n.js` (rompía 3 botones).
- `NOMBRES_IDIOMAS` no tenía `ru`, `bg`, `qu`, `ay`: se pedía traducir al inglés y se guardaba como si fuera ese idioma.
- Condición de carrera en el muro al cambiar de idioma rápido (`_turnoMuro` en `contenido-info.js`).
- `CONFIG.TRADUCCION_API_URL` no existía en `config.js`.
- `traducirTextoIA` escondía todos los errores; ahora los deja en la consola con el prefijo `remarket-db:`.
- Modelo de Groq retirado (404 `model_not_found`).
- 429 por pedir muchas traducciones a la vez.
- "Ver mi zona" no disparaba la traducción de productos.

---

## 8. Mapa de archivos

| Archivo | Contenido sobre traducción |
|---|---|
| `js/i18n.js` | `UI_TRANSLATIONS`, mensajes de guía, `CHROME_RESULTADOS_I18N`, `CATEGORIAS_I18N`, `MODALIDADES_I18N`, `obtenerIdiomaPreferido()` |
| `js/i18n-institucional.js` | `INSTITUCIONAL_TEXTOS` (formularios) |
| `js/modules/institucional.js` | Documentos legales y "Quiénes somos" |
| `js/modules/contenido-info.js` | Artículo del muro |
| `js/modules/buscador.js` | `TraduccionProductos` |
| `js/modules/ui-controller.js` | Tarjetas y banners de resultados |
| `js/modules/panel-usuario-3.js` | `traducirTextoIA`, `NOMBRES_IDIOMAS`, reintentos |
| `js/config.js` | `TRADUCCION_API_URL` |
| Supabase (fuera del repo) | Funciones Edge `traducir-texto` y `chat-ia` |

**Bitácoras de sesión (historial, en `docs/bitacoras/`):** `BOTONES-GUIA`, `BOTONES-GUIA2`, `CUOTA-GROQ`, `LIMITE-GROQ`, `IDIOMAS-FALTANTES`.

---

## 9. Cómo probar un cambio

1. Subir a GitHub y esperar "Ready" en Vercel.
2. Abrir la página con `Ctrl + Shift + R` y la consola (F12) abierta.
3. Elegir el idioma primero, y recién después buscar o tocar "Ver mi zona".
4. Esperar unos 30 segundos. Buscar en la consola mensajes que empiecen con `remarket-db:`.
5. Probar la función directo desde la consola:
```javascript
fetch(CONFIG.TRADUCCION_API_URL,{method:'POST',headers:{'Content-Type':'application/json',apikey:MI_API_KEY,Authorization:'Bearer '+MI_API_KEY},body:JSON.stringify({texto:'vendo zapatos',idioma:'inglés'})}).then(r=>r.json()).then(console.log)
```
