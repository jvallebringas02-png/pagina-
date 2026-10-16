> **Estado: PREPARADO, SIN CONFIRMAR EN EL NAVEGADOR REAL. Los cambios pasan `node --check` y una prueba en un navegador simulado que carga los archivos reales (49 comprobaciones). Nada se probó todavía en la página publicada, ni en celular, ni se vio cómo se ve la ventana. Marcar cada punto cuando se haga.**

# Bitácora — Panel igual que la página principal: entregas 1 y 2

**Fecha:** 16/10/2026
**Continúa:** `BITACORA-PANEL-IGUAL-QUE-PAGINA-PRINCIPAL.md` (11/10), `BITACORA-ASISTENTE-PANEL.md`
**Base:** el zip del 11/10/2026. Solo cambian los 6 archivos de la sección 2; no se toca `panel-usuario-1.js` ni `panel-usuario-2.js`, ni Supabase.

---

## 1. Qué se hizo

### Entrega 1 — Pie de página y formularios dentro del panel

**Problema:** con la sesión iniciada, Contacto, Libro de Reclamaciones, Seguimiento, Opinión y Seguridad se dibujaban en la vista pública, que está oculta: la persona no los veía.

**Cambio:** con el panel activo, esas cinco pantallas se abren en una **ventana emergente**. Sin sesión, siguen igual en el centro. Los formularios no cambiaron (mismos ids, mismas funciones de Supabase, misma constancia y PDF).

- Implementación en un solo punto, `UIController.mostrarFormularioEnMuro`: si el panel está activo, dibuja en la ventana. Por eso **no hubo que tocar** las cinco pantallas ni los atajos del chat ("quiero reclamar", "contactar al administrador"): ya llaman a esa misma función.
- **La ventana se puede desplazar** (arreglo previo que pedía el análisis del 11/10): antes, `.modal-fb` tenía `overflow: hidden` y su cuerpo no tenía scroll. Se agregó la clase `modal-fb-scroll` (encabezado fijo, cuerpo con scroll). También se aplica a `Institucional.abrirModal`, que usan **Términos y Privacidad**, que probablemente tenían el mismo problema si el texto era largo (no se verificó antes).
- **Sin ids repetidos:** al abrir la ventana se vacía la zona oculta del centro, para que un formulario viejo no pise los campos del nuevo.
- **Accesibilidad básica:** `role="dialog"`, `aria-modal`, `aria-labelledby`, tecla **Esc**, clic fuera, botón ✕ con etiqueta, el fondo no se desplaza mientras está abierta, y el foco va al primer campo.
- **Cambio de idioma con la ventana abierta:** se retraduce el título y los campos **sin borrar lo escrito**. `retraducirFormularioAbierto` ahora llama a una versión base y después sincroniza el título de la ventana.
- **Seguridad se retraduce** al cambiar de idioma (antes no, porque no tiene campos): se vuelve a dibujar.
- El título de la ventana se escapa con `escHtml`.

### Entrega 2 — Buscador y asistente de IA en el panel

El panel **ya compartía el cerebro** de la página principal (`AIService` y `BuscadorMotor`; cambio 1A). Se heredó lo que faltaba:

| Situación | Antes (panel) | Ahora (panel) |
|---|---|---|
| La IA no responde (límite, servicio caído, sin conexión) | Cuadro de error en el feed, y desde el chat no pasaba nada | **Busca igual en el catálogo** y muestra los resultados (o "no encontré"). El aviso del motivo sale **una sola vez, en el chat**, ya traducido |
| Chat del panel con la IA caída | Solo la burbuja | Burbuja más resultados del catálogo en el feed (`PanelUsuario.respaldoPorFalloIA`) |
| Atajo de matriz mundial | Dibujaba en la zona oculta: no se veía nada | **Se salta en el panel** (chat y buscador de arriba); responde la IA. La página principal no cambia |
| "El Asistente IA está pensando…", sin resultados, banners, títulos de videos, música e internet, error de búsqueda | Español fijo | Traducidos (15 idiomas) |

- Los banners ("Filtrado por", "No encontramos esto en… pero sí en estas otras zonas", "Resultados de Búsqueda") **reutilizan** las traducciones que ya usa la página principal (`obtenerTextoChrome`), así que el texto es el mismo. Ojo: el banner sin filtro pasa de `Resultados para "x"` a `Resultados de Búsqueda: "x"`.
- Las frases con la palabra buscada usan marcadores `{q}` y `{lugar}`, que se reemplazan con el texto **escapado** y con una función (para que un `$&` escrito por la persona no se interprete).
- El aviso de límite y la pausa de 60 segundos ya eran compartidos (viven en `AIService`); no se tocaron.

## 2. Archivos a subir (6)

| Archivo | Ruta en el repositorio | Cambio |
|---|---|---|
| `estilos.css` | `css/estilos.css` | +3 líneas (la clase de desplazamiento) |
| `ui-controller.js` | `js/modules/ui-controller.js` | Ventana de formularios; `mostrarFormularioEnMuro` decide |
| `institucional.js` | `js/modules/institucional.js` | `abrirModal` con scroll; retraducción con título de ventana; Seguridad se retraduce |
| `event-controller.js` | `js/modules/event-controller.js` | Matriz saltada en el panel; chat del panel con respaldo; error de búsqueda traducido |
| `panel-usuario-3.js` | `js/modules/panel-usuario-3.js` | Buscador del panel (respaldo, textos traducidos, `_t`, `respaldoPorFalloIA`) |
| `i18n-institucional.js` | `js/i18n-institucional.js` | 10 claves nuevas `panel_*` en 15 idiomas. Quechua y aimara usan el español |

> Las seis cosas van juntas: `ui-controller.js` define la ventana y `institucional.js` la usa; el panel usa las claves nuevas. Subir solo algunas puede dejar algo roto.

## 3. Cómo probar (marcar al hacerlo)

Recargar con **Ctrl+F5** después del despliegue.

**Formularios en el panel (con sesión):**
- [ ] Pie → Libro de Reclamaciones: se abre la ventana y se ve **entera**; se puede bajar hasta el botón; se envía; sale la constancia y "Guardar como PDF" funciona.
- [ ] Lo mismo con Seguimiento, Contacto, Opinión y Seguridad.
- [ ] Cerrar con la ✕, con Esc y con un clic fuera.
- [ ] Escribir "quiero hacer un reclamo" en el chat del panel: se abre la ventana al terminar el flujo guiado.
- [ ] **Celular:** la ventana cabe, el teclado no tapa el botón, y el formulario largo del Libro se desplaza.
- [ ] Cambiar de idioma con la ventana abierta y texto escrito: se traduce y no se borra lo escrito.
- [ ] **Términos y Privacidad** (pie): se pueden leer hasta el final en celular.
- [ ] **Sin sesión:** los cinco formularios se abren en el centro, igual que antes.

**Buscador del panel:**
- [ ] Las 9 pruebas de `BITACORA-ASISTENTE-PANEL.md` (bicicleta; "lo más barato"; "solo trueque de celulares"; "cerca de mí"; videos; red apagada; "buscar a Juan Pérez"; "quiero publicar una bicicleta"; y repetir 3 o 4 sin sesión).
- [ ] **Con la IA sin cupo o sin internet:** el aviso sale **una sola vez** en el chat, y el feed muestra resultados del catálogo o "no encontré", en tu idioma.
- [ ] `zapatos` en el chat y en el buscador de arriba del panel: ya no queda "muerto"; responde la IA.
- [ ] Idioma italiano: "pensando…", "no encontré…" y los títulos salen en italiano.

## 4. Decisiones que se tomaron por defecto (cambiables)

- Formularios del panel en **ventana emergente**, no en el feed.
- Atajo de **matriz mundial saltado** en el panel; pintarla en el feed queda para después.
- El respaldo de **novedades y categorías** cuando no hay resultados queda para una segunda etapa.
- Se tocó `panel-usuario-3.js`, que estaba en revisión (pedido por ti el 16/10).

## 5. Límites y cosas que no se hicieron

1. **No se vio cómo queda la ventana.** El navegador simulado no calcula diseño: no pude comprobar alto, margen, cómo se ve en celular ni cómo se comporta con el teclado abierto. Es lo primero que hay que mirar.
2. **Las traducciones nuevas (10 claves × 15 idiomas) son mías, sin revisión nativa.** Conviene que alguien revise árabe, hindi, búlgaro y turco, y la forma "(lugar)" de francés, italiano y ruso.
3. **Los reclamos enviados desde el panel siguen quedando anónimos** en la base (sin `usuario_id`). Es la sección 8 de la bitácora del 11/10.
4. **La Parte 3 (traducir el resto del panel) NO está hecha:** el feed, las tarjetas, el perfil, los mensajes y el resto siguen en español. Son entre 110 y 210 frases; se hace por tandas.
5. **No se cubre el respaldo de novedades/categorías** ni la matriz en el feed del panel.
6. **El flujo guiado del chat** (preguntas paso a paso de "quiero reclamar") sigue usando su propio texto en español en esa parte (`Institucional.procesarRespuestaReclamo`). No se tocó.
7. Las dos ventanas del sitio (la de formularios y la de `abrirModal`) tienen aspecto distinto: la de formularios va centrada; la de Términos y Privacidad sigue alineada a la derecha, como antes.

## 6. Cómo volver atrás

Subir de nuevo los 6 archivos anteriores del repositorio. No hay SQL ni cambios en Supabase.

## 7. Qué se probó y qué no

**Probado (navegador simulado con los archivos reales, 49 comprobaciones):** la ventana aparece solo con el panel activo; contiene el formulario; tiene `role=dialog`; el fondo no se desplaza y se restaura; la zona oculta se vacía y no quedan ids repetidos; se envía contacto dentro de la ventana y sale la constancia; Esc, clic fuera y ✕ cierran; las 5 pantallas abren; abrir otra no apila; el título y los campos se retraducen sin borrar lo escrito; Seguridad se vuelve a dibujar en alemán; sin sesión todo sigue en el centro; `abrirModal` recibe el desplazamiento; con la IA caída el aviso sale una sola vez y el feed muestra el catálogo; sin resultados sale en italiano y el texto de la persona (con `<img onerror>` y `$&`) se ve como texto; si falla hasta el respaldo no queda cargando; el flujo normal no cambió; "pensando…" en japonés; videos vacíos en alemán; quechua usa el español; el chat del panel usa el respaldo; la matriz se salta en el panel y **sigue funcionando en la página principal**; el error del buscador de arriba sale en italiano.
**No probado:** diseño y celular; la página publicada; los idiomas de derecha a izquierda dentro de la ventana; la IA real con el límite real.

## 8. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 16/10/2026 | Entrega 1: formularios en ventana con desplazamiento dentro del panel | `node --check` OK; simulado OK; falta subir y probar |
| 16/10/2026 | Entrega 2: buscador del panel con respaldo, matriz saltada y textos traducidos | `node --check` OK; simulado OK; falta subir y probar |
