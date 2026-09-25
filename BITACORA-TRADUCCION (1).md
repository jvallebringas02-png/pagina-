# Bitácora — Traducción multilingüe de remarket-db

Este documento resume el estado del trabajo de traducción del proyecto, las decisiones tomadas, y qué falta. Sirve como punto de partida para retomar el tema en cualquier conversación (esta u otra) sin perder contexto.

**Última actualización:** 24/09/2026

---

## 1. Decisión de arquitectura (la más importante de anotar)

Hay dos maneras de traducir en este proyecto, y **cada una se usa para un tipo distinto de contenido**:

| Tipo de contenido | Cómo se traduce | Dónde vive |
|---|---|---|
| Textos fijos, cortos, que casi nunca cambian (menú, botones, mensajes de guía del Asistente) | Diccionario fijo en JS, escrito a mano para los 17 idiomas | `js/i18n.js`, `js/i18n-institucional.js` |
| Contenido largo o legal (Términos, Privacidad, "Quiénes Somos") | Vive en Supabase (`contenido_administrable`). Se traduce con IA **la primera vez** que alguien lo pide en un idioma, y se cachea ahí mismo (columna `traducciones`) para no volver a traducirlo | `institucional.js` → `mostrarDocumentoLegal` |
| Contenido de usuarios (título/descripción de productos) | Mismo patrón: se traduce con IA al mostrarse, en segundo plano (no bloquea el render), y se cachea en la fila del producto (`productos.traducciones`) | `buscador.js` → `TraduccionProductos` |

**Por qué esta mezcla:** un diccionario fijo es simple pero obliga a tocar código y redesplegar cada vez que cambia un texto. Para lo legal específicamente, además, traducir todo de una vez con IA sin revisión es riesgoso — mejor traducir bajo demanda y **dejar quechua/aymara en español** para documentos legales (`IDIOMAS_LEGAL_SOLO_ES` en `institucional.js`), ya que un modelo de IA general no traduce esos idiomas con la fiabilidad que exige un texto legal.

---

## 2. Qué está hecho (por pieza, no por "quién lo hizo")

- ✅ **Footer completo** (encabezados de columna + 7 enlaces) — traducido en los 17 idiomas vía diccionario fijo.
- ✅ **Mensajes de guía del Asistente** (botones rápidos: zona, novedades, buscar) — traducidos vía diccionario fijo (`obtenerMensajeGuia` en `i18n.js`, usado desde `event-controller.js`).
- ✅ **Términos y condiciones / Política de privacidad** — sistema de traducción bajo demanda + caché en Supabase, con quechua/aymara excluidos a propósito.
- ✅ **Formularios guiados** (Contacto Admin, Libro de Reclamaciones) — título, placeholders, botones y mensajes de éxito/error traducidos vía diccionario fijo (`i18n-institucional.js`).
- ✅ **Contenido de productos en resultados de búsqueda** (`mostrarResultadosBusqueda`) — traducción en segundo plano + caché en Supabase (`productos.traducciones`).

### Columna necesaria en Supabase (ya aplicada)
```sql
ALTER TABLE productos ADD COLUMN IF NOT EXISTS traducciones JSONB DEFAULT '{}'::jsonb;
```

---

## 3. Qué falta

- [ ] **Confirmar que `contenido_administrable` tenga las filas** `titulo = 'terminos_condiciones'` y `titulo = 'privacidad'` (o el nombre exacto que use el código), con `tipo_contenido = 'institucional'`. Sin esas filas, el sistema cae directo a español aunque el idioma elegido sea otro — esto fue lo que se vio en las pruebas con bulgarian.
- [ ] **Replicar el patrón de traducción de productos** (`TraduccionProductos`, Paso 6) a dos lugares más que todavía no lo tienen:
  - `renderizarArticulos` (catálogo inicial de invitados, antes de buscar nada)
  - `panel-usuario-1.js` → `renderPost` (feed de usuarios logueados)
- [ ] **Panel de usuario completo** (Perfil, Publicar, Mensajes, Configuración) — decidido explícitamente que puede esperar. Cuando se retome, seguir el mismo patrón mixto de la sección 1: diccionario fijo para labels/botones cortos, y el patrón Supabase+IA+caché para cualquier texto largo que aparezca ahí.
- [ ] **`PROMPT_BASE` de la función Edge `chat-ia` es muy largo** — causa que se agote la cuota gratuita de Groq (8,000 tokens/minuto) con solo 2-3 mensajes seguidos (error 429). No es un bug de traducción, pero afecta las pruebas del Asistente en general. Pendiente acortarlo.
- [ ] Hay también un bug aparte (no de traducción): error 400 "Tool call validation failed" en `buscar_en_internet`/`buscar_videos_youtube` — el modelo arma mal la llamada a esas herramientas.

---

## 4. Mapa de archivos (para no perderse)

| Archivo | Qué contiene sobre traducción |
|---|---|
| `js/i18n.js` | Diccionario `UI_TRANSLATIONS` (menú, footer, botones), `obtenerIdiomaPreferido()`, mensajes de guía del Asistente |
| `js/i18n-institucional.js` | Diccionario `INSTITUCIONAL_TEXTOS` para los formularios (Contacto, Reclamo) |
| `js/modules/institucional.js` | `mostrarDocumentoLegal` — el sistema de traducción bajo demanda + caché para Términos/Privacidad/Quiénes Somos |
| `js/modules/buscador.js` | `TraduccionProductos` — traducción en segundo plano + caché para productos |
| `js/modules/event-controller.js` | Usa `obtenerMensajeGuia()` para los mensajes de guía |
| `js/modules/ui-controller.js` | Renderiza las tarjetas de producto respetando el caché de traducción (`data-id`/`data-campo`) |

---

## 5. Próximo paso sugerido al retomar

Seguir con el punto pendiente de la sección 3 que se decida trabajar primero — lo más natural es replicar `TraduccionProductos` al catálogo de invitados y al feed logueado, ya que es extender un patrón que ya existe y funciona, en vez de construir algo nuevo.
