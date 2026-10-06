> **Estado: REVISIÓN HECHA, SIN CAMBIOS DE CÓDIGO. Es un diagnóstico: dice qué se encontró y qué falta. Todo lo marcado "no verificado" hay que comprobarlo antes de darlo por cierto.**

# Bitácora — Revisión de los zips del 06/10/2026 y estado de seguridad

**Fecha:** 06/10/2026
**Qué se revisó:** `pagina--main.zip` (zip 1, se tomó como lo que hay en GitHub) y `files.zip` (zip 2, los arreglos de `BITACORA-XSS-PANELES.md`)
**Método:** lectura del código y comparación de archivos. No se abrió la página publicada ni se tuvo acceso a Supabase ni a GitHub.
**Continúa:** `BITACORA-XSS-PANELES.md`, `BITACORA-SEGURIDAD.md`, `BITACORA-LIMITE-USO-IA.md`

---

## 1. Qué es cada zip

- **Zip 1 (`pagina--main`):** el proyecto completo. No trae carpeta `.git`, así que se asumió que es la descarga de la rama principal de GitHub (no verificado). Ya incluye el `ui-controller.js` corregido (listener `abrirlink` y `data-ui-accion` en las tarjetas), aunque `BITACORA-XSS-TARJETAS.md` todavía dice "falta subirlo".
- **Zip 2 (`files`):** 4 archivos `.js` más `BITACORA-XSS-PANELES.md`. Los 4 archivos son distintos de los del zip 1, así que **no están subidos**.

## 2. ¿Está completo el zip 2?

Sí, para el arreglo XSS de los paneles:

| Archivo | Líneas (zip 1 → zip 2) | Quitadas / agregadas |
|---|---|---|
| `panel-usuario-2.js` | 1047 → 1045 | 4 / 2 |
| `panel-usuario-3.js` | 1987 → 2010 | 9 / 32 |
| `institucional.js` | 484 → 484 | 1 / 1 |
| `event-controller.js` | 264 → 264 | 2 / 2 |

- Los 4 pasan `node --check` sin errores.
- Están cubiertos todos los sitios de la tabla de `BITACORA-XSS-PANELES.md`: reportar usuario (línea 890), los selectores de persona (1368, 1409, 1469 y los de `panel-usuario-2.js`), categorías (1886) y links del feed (1904), el botón "Visitar" y los dos `e.message`.
- No quedó ningún `nombreEscapado` ni `.replace(/'/g, ...)` suelto.
- El listener nuevo (`data-pu-accion`) solo abre enlaces `http://` o `https://`, con `noopener`.
- `institucional.js` depende del listener de `ui-controller.js`, que ya está en el zip 1; no hace falta resubirlo.
- **No verificado:** que `panel-usuario-2.js` del zip 2 incluya también el cambio de `BITACORA-CONFIG-PASSWORD.md` (esa bitácora pide reemplazar `index.html` y `panel-usuario-2.js`). Súbelo una sola vez con ambos cambios.

## 3. Estado de seguridad: ¿ya no es vulnerable?

**No.** Hay arreglos listos, pero la mayoría no está publicada y quedan cosas abiertas.

**Sigue vulnerable (publicado hoy):**
- [ ] **Código inyectado en el panel:** un nombre con comilla (por ejemplo el del otro usuario en el botón 🚩 del chat) puede ejecutar código. Arreglo en el zip 2, sin subir.
- [ ] **Claves de `api_keys_config`:** sin rotar. Sus políticas RLS no se revisaron; si la tabla se pudiera leer con la clave pública, es lo más grave.
- [ ] **`chat-ia` y `traducir-texto`:** sin sesión ni límite de uso. Ver `BITACORA-LIMITE-USO-IA.md`.
- [ ] **Moderación saltable:** `panel-usuario-3.js:633` fuerza `estado: 'aprobado'`.
- [ ] **Políticas de base de datos** sin crear o corregir: `comentarios_likes`, `reglas_asistente`, `publicaciones`.

**Sin saber si es problema:**
- **Los ~160 `innerHTML` sin auditar.** Hay 161 en total:

  | Archivo | `innerHTML` |
  |---|---|
  | `panel-usuario-3.js` | 51 |
  | `panel-usuario-1.js` | 33 |
  | `panel-usuario-2.js` | 29 |
  | `ui-controller.js` | 13 |
  | `institucional.js` | 11 |
  | `auth-modales.js` | 6 |
  | `event-controller.js` | 4 |
  | `paginador.js`, `main.js` | 3 cada uno |
  | `contenido-info.js`, `i18n.js`, `sesion-auth.js` | 1 cada uno |

- **`insertAdjacentHTML` y `outerHTML`** en `panel-usuario-1.js` (338, 342), `panel-usuario-3.js` (970, 974, 1073, 1082) y `panel-usuario-2.js` (864): no se comprobó que todo lo que reciben esté escapado. La bitácora dice que mensajes y comentarios sí pasan por `escHtml`.
- **Botones `onclick` que solo llevan un id** (~50): riesgo bajo mientras esas columnas sean UUID de Supabase (no verificado el tipo).
- **Datos ya guardados:** un nombre malicioso que ya esté en la base sigue ahí. Falta la consulta de la sección 6 de `BITACORA-XSS-TARJETAS.md`.

**Arreglado:**
- Tarjetas y resultados del buscador (`ui-controller.js`), ya en el zip 1.
- Los 4 archivos del zip 2, pendientes de subir y probar.
- No se encontró `eval`, `document.write` ni `new Function`.

## 4. Otros hallazgos

- **`BITACORA-SEGURIDAD (2).md` y `(3).md` son idénticas** (mismo hash). Borrar una y renombrar la otra a `BITACORA-SEGURIDAD.md`, que es como la nombran las demás bitácoras.
- **Encabezados desactualizados:** `BITACORA-XSS-TARJETAS.md` dice "falta subirlo" aunque ya está en el zip 1. `BITACORA-CONFIG-PASSWORD.md`, `BITACORA-SESION-COLISION-SESIONES.md` y `BITACORA-README.md` también dicen "falta subir"; no se comprobó cuáles ya están en el zip 1.
- **`README.md`:** sigue diciendo 16 idiomas (son 17) y su sección "Estructura del Proyecto" está vacía. El README corregido de `BITACORA-README.md` no está subido.
- **Sin favicon, meta descripción ni Open Graph** en `index.html`.
- **Datos de prueba en el buscador** (a propósito, para probar el algoritmo, según el dueño del proyecto): 6 productos fijos en `database.js`, hasta 100 de `dummyjson.com`, y dos patrocinadores de respaldo en `institucional.js`. No tienen `id` de Supabase, por eso no se traducen. Propuesta pendiente: un interruptor `USAR_DATOS_DE_PRUEBA` en `config.js` para apagarlos el día del lanzamiento.
- **Correos:** el link mágico y el correo de confirmación del registro ya llegan (dicho por el dueño). Quedan por actualizar el punto 16 de `BITACORA-PLAN-PANEL-Y-CORREO.md` y la idea de la pregunta secreta.
- **Un pendiente que no se encontró en el código:** el `alert('Términos y Condiciones: pendiente de implementación')` de `BITACORA-TRADUCCION.md` no aparece en el zip 1; probablemente ya está resuelto.
- **Traducción:** la parte mejor trabajada del proyecto. Faltan la revisión nativa de idiomas y las pruebas con Supabase real.

## 5. Orden recomendado

1. [ ] Subir los 4 archivos del zip 2 a `js/modules/` (y `index.html` si aplica `CONFIG-PASSWORD`). Esperar Vercel, Ctrl+F5, hacer las pruebas de la sección 6 de `BITACORA-XSS-PANELES.md`.
2. [ ] Rotar las claves de `api_keys_config` y revisar la RLS de esa tabla.
3. [ ] Pasar en Supabase la consulta de nombres y datos sospechosos.
4. [ ] Límite de uso y sesión en `chat-ia` y `traducir-texto` (`BITACORA-LIMITE-USO-IA.md`; necesita los dos `index.ts`).
5. [ ] Corregir `estado: 'aprobado'` forzado y crear las políticas que faltan.
6. [ ] Auditar los `innerHTML` restantes, empezando por `panel-usuario-3.js`, `panel-usuario-1.js` y `panel-usuario-2.js`.
7. [ ] Limpiar: bitácoras duplicadas, encabezados, README, favicon y meta etiquetas.

## 6. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 06/10/2026 | Revisión de los dos zips y del estado de seguridad | Diagnóstico; sin cambios de código ni de Supabase |
