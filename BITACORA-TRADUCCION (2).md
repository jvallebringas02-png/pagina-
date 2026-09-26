# Bitácora — Traducción multilingüe de remarket-db

Este documento resume el estado del trabajo de traducción del proyecto, las decisiones tomadas, y qué falta. Sirve como punto de partida para retomar el tema en cualquier conversación (esta u otra) sin perder contexto.

**Última actualización:** 24/09/2026

---

## 1. Decisión de arquitectura (la más importante de anotar)

Hay dos maneras de traducir en este proyecto, y **cada una se usa para un tipo distinto de contenido**:

| Tipo de contenido | Cómo se traduce | Dónde vive |
|---|---|---|
| Textos fijos, cortos, que casi nunca cambian (menú, botones, banner de bienvenida, mensajes de guía del Asistente) | Diccionario fijo en JS, escrito a mano para los 17 idiomas | `js/i18n.js`, `js/i18n-institucional.js` |
| Contenido largo o legal (Términos, Privacidad, "Quiénes Somos") | Vive en Supabase (`contenido_administrable`). Se traduce con IA **la primera vez** que alguien lo pide en un idioma, y se cachea ahí mismo (columna `traducciones`) para no volver a traducirlo | `institucional.js` → `mostrarDocumentoLegal` |
| Contenido de usuarios (título/descripción de productos) | Mismo patrón: se traduce con IA al mostrarse, en segundo plano (no bloquea el render), y se cachea en la fila del producto (`productos.traducciones`) | `buscador.js` → `TraduccionProductos` |

**El algoritmo de traducción bajo demanda, en palabras simples** (aplica a los dos casos de la tabla que usan IA):
1. Se muestra el texto en español de inmediato — nunca se espera a la traducción para mostrar algo.
2. En paralelo, se busca en la base de datos si ya existe una traducción guardada para ese texto en ese idioma.
3. Si existe → se muestra al instante, sin gastar nada de IA.
4. Si no existe → se le pide a Groq que la traduzca.
5. Apenas responde, se muestra en pantalla (reemplazando el español) **y se guarda en la base de datos**, para que la próxima persona que lo pida en ese mismo idioma la encuentre ya lista en el paso 3.

**Por qué esta mezcla:** un diccionario fijo es simple pero obliga a tocar código y redesplegar cada vez que cambia un texto. Para lo legal específicamente, además, traducir todo de una vez con IA sin revisión es riesgoso.

**Excepción a propósito — quechua y aymara en documentos legales:** para Términos y Privacidad, esos dos idiomas **no** pasan por traducción automática — se muestra el español con un aviso corto, porque una IA general no es confiable traduciendo texto legal a esos idiomas todavía.

**Por qué los productos no pueden ir en el código fuente:** los productos los publica la gente constantemente, después de que el código ya está desplegado — no existen todavía cuando se sube a GitHub, así que no hay forma de tenerlos "listos" de antemano en `i18n.js`. Por eso su traducción solo puede vivir en la base de datos (cada producto ya tiene su fila, y ahí se le agrega la traducción cuando se genera). La regla general: si el contenido existe antes de escribir el código y no cambia (menú, footer, botones) → va en el código fuente; si lo genera un usuario o puede crecer sin límite (productos, mensajes) → va en la base de datos con el algoritmo de traducir-y-guardar.

---

## 2. Qué está hecho (confirmado revisando el código, no solo lo que "se pidió")

- ✅ Header, menú, buscador
- ✅ Footer completo (encabezados + 7 enlaces)
- ✅ Los 7 botones rápidos del panel lateral (Cómo publico, Cómo vendo, Ver mi zona, Lo último publicado, Categorías, Mundial, Buscar algo)
- ✅ Banner de bienvenida y banner "IA Autónoma"
- ✅ Título "Patrocinadores"
- ✅ Mensajes de guía del Asistente
- ✅ Formularios guiados (Contacto Admin, Libro de Reclamaciones)
- ✅ Traducción de título/descripción de productos en **resultados de búsqueda**, con caché en Supabase
- ✅ El Asistente detecta el idioma real en que escribe la persona y responde en ese idioma — el selector de arriba (🌐) se usa aparte, sobre todo para resultados de búsqueda web/video, no obliga al Asistente a responder en ese idioma si el usuario escribe en otro

### Columna necesaria en Supabase (ya aplicada)
```sql
ALTER TABLE productos ADD COLUMN IF NOT EXISTS traducciones JSONB DEFAULT '{}'::jsonb;
```

---

## 3. Problema detectado: cuota de Groq compartida entre chat y traducciones

**El hallazgo:** el chat del Asistente y **todas** las traducciones (Términos, Privacidad, mensajes entre usuarios, productos) llaman a la **misma cuenta de Groq**, con el mismo límite (plan gratuito: 30 peticiones/minuto, 8,000 tokens/minuto).

**El riesgo concreto:** el Paso 6 (traducción de productos) dispara la traducción de **todos los productos de una página de resultados a la vez, en paralelo, sin límite**. Una búsqueda con 9 productos = hasta 18 peticiones a Groq casi simultáneas (título + descripción de cada uno) — eso solo ya usa más de la mitad del límite por minuto, y si alguien está chateando con el Asistente al mismo tiempo, se agota y las traducciones fallan en silencio (se quedan en español sin avisar por qué).

**Solución pendiente de aplicar:** limitar cuántas traducciones nuevas se piden a la vez (de a 2-3, con una pequeña espera entre tandas), en vez de las peticiones simultáneas actuales. No afecta a lo que ya está cacheado en la base de datos — solo protege el momento en que hay que traducir algo por primera vez.

**Causa raíz aparte, para el chat en general (no solo traducción):** el `PROMPT_BASE` que se manda en cada mensaje del chat es muy largo, lo que también acelera que se agote la cuota. Pendiente acortarlo.

---

## 4. Idea nueva: quechua y aymara como idiomas emblemáticos (pendiente de construir)

**La idea:** no tratar quechua y aymara como "dos idiomas más" en la lista alfabética del selector, sino destacarlos a propósito — remarket-db sería de las pocas plataformas digitales peruanas que les da un lugar real. Esto tiene un valor doble:
- Cultural: le da visibilidad real a idiomas originarios del Perú.
- Comercial: es un argumento fuerte para conseguir patrocinadores del Estado peruano (municipalidades, Ministerio de Cultura, etc.) — mucho más específico y convincente que "tenemos 17 idiomas".

**Cómo se vería (propuesta, sin construir todavía):**
1. En el selector de idioma (🌐): sacar quechua y aymara del orden alfabético y ponerlos primero, o en su propia sección con una etiqueta tipo "Idiomas originarios del Perú 🇵🇪".
2. Una línea corta y visible en el muro o footer, traducible, del estilo: *"remarket-db es una de las pocas plataformas peruanas con soporte para quechua y aymara"*.
3. Usar esto como parte del discurso al acercarse a patrocinadores públicos peruanos.

**Estado:** solo conversado, no se ha tocado código todavía. Falta decidir el texto exacto antes de implementarlo.

---

## 5. Qué falta (lista de pendientes, en orden sugerido)

- [x] **Confirmar contenido de Términos/Privacidad en Supabase** — confirmado: las 3 filas existen (`quienes_somos`, `politica_privacidad`, `terminos_condiciones`), con contenido en español y traducciones ya generándose y cacheándose por uso real (ej. `terminos_condiciones` ya tiene 6 idiomas guardados).
- [x] **Limitar las traducciones simultáneas de productos** (Paso 6) a 2-3 a la vez — hecho: ahora se traduce de a 3 en tandas (`TAMANO_TANDA` en `buscador.js`), esperando cada tanda antes de la siguiente.
- [x] **Replicar la traducción de productos** en el catálogo inicial de invitados (`renderizarArticulos`/`renderizarTarjetaArticulo` en `ui-controller.js`) — hecho, con caché y `data-truncar` para respetar si el texto se muestra completo o recortado.
  - [ ] Falta aún: `panel-usuario-1.js` → `renderPost` (feed de usuarios logueados)
- [ ] **Quechua/aymara como idiomas emblemáticos** — definir el texto exacto y aplicar el cambio en el selector + footer/muro.
- [ ] **Panel de usuario completo** (Perfil, Publicar, Mensajes, Configuración) — decidido que puede esperar. Alcance confirmado: son las secciones de administración de cuenta, no el contenido que la persona navega (el feed logueado sigue contando como parte de la página principal/muro, no de este punto).
- [ ] **Nuevo hallazgo — "chrome" de resultados de búsqueda sin traducir (Paso 7, no iniciado):** textos fijos en español, escritos directo en `ui-controller.js`, que no pasan por ningún sistema de traducción (ni diccionario ni `TraduccionProductos`, que solo cubre título/descripción del producto):
  - El título "Resultados de Búsqueda" — hardcodeado 8 veces distintas en el archivo.
  - Banners informativos: "Esto es lo que hay en tu ciudad/país...", "Filtrado por:", "Búsqueda Híbrida", "Búsqueda global", "Mostrando resultados de [ciudad], [país]", "Ordenado del más barato/caro", "Tu zona", "Quiénes somos".
  - Etiquetas y botones de cada tarjeta: "Disponible", "Patrocinado", "Zona lejana", "Referencia Global", "Contactar", "Reportar".
  - Nombre de categoría (ej. "Ropa") y modalidad (ej. "venta") del producto — vienen tal cual de la base de datos, en español, sin traducir.
  - Propuesta: diccionario fijo en `i18n.js` para las ~15 frases (17 idiomas) + tabla pequeña de traducción para categorías/modalidades. **Decisión del usuario: queda solo anotado por ahora, no implementar todavía.**
- [x] **Acortar el `PROMPT_BASE`** de la función Edge `chat-ia` — resuelto de otra forma: en vez de acortar el prompt, se separó la cuenta de Groq del chat y las traducciones (`BITACORA-SESION-CUOTA-GROQ.md`), que era la causa que más se agotaba. El `PROMPT_BASE` del chat en sí sigue igual de largo, pero ya no compite con las traducciones por la misma cuota.
- [ ] Bug aparte: error 400 "Tool call validation failed" en `buscar_en_internet`/`buscar_videos_youtube`.

---

## 6. Mapa de archivos (para no perderse)

| Archivo | Qué contiene sobre traducción |
|---|---|
| `js/i18n.js` | Diccionario `UI_TRANSLATIONS` (menú, footer, botones, banners), `obtenerIdiomaPreferido()`, mensajes de guía del Asistente |
| `js/i18n-institucional.js` | Diccionario `INSTITUCIONAL_TEXTOS` para los formularios (Contacto, Reclamo) |
| `js/modules/institucional.js` | `mostrarDocumentoLegal` — sistema de traducción bajo demanda + caché para Términos/Privacidad/Quiénes Somos |
| `js/modules/buscador.js` | `TraduccionProductos` — traducción en segundo plano + caché para productos |
| `js/modules/event-controller.js` | Usa `obtenerMensajeGuia()` para los mensajes de guía |
| `js/modules/ui-controller.js` | Renderiza las tarjetas de producto respetando el caché de traducción (`data-id`/`data-campo`) |
| `js/modules/ai-service.js` | Envía `idiomaInterfaz` al chat, pero el chat responde según el idioma en que escribe la persona, no según el selector |
| `js/modules/panel-usuario-3.js` | `traducirTextoIA` — función genérica de traducción, comparte cuota de Groq con el chat |

---

## 7. Próximo paso sugerido al retomar

Empezar por el punto de la sección 5 que decidan — lo más urgente es confirmar el contenido legal en Supabase (rápido de revisar) y limitar las traducciones simultáneas (evita que sigan fallando en silencio).
