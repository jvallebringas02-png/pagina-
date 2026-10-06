> **Estado: el arreglo está preparado y probado en un navegador (Chromium). Falta subirlo a GitHub y desplegar en Vercel.**

# Bitácora — Fallo XSS en tarjetas y resultados (`ui-controller.js`)

**Fecha:** 05/10/2026
**Archivo cambiado:** `js/modules/ui-controller.js` (ningún otro archivo)

---

## 1. Qué se encontró

Es el hallazgo n.º 1 de `BITACORA-CONFIG-PASSWORD.md` (sección 6), el que estaba marcado como "lo más urgente".

**Cómo funciona el fallo, sin tecnicismos.** La página arma las tarjetas pegando texto para formar HTML. Parte de ese texto lo escribe quien publica (título, descripción, etc.). Los botones se armaban así: `onclick="UIController.abrirModal('TITULO', ...)"`, con el título metido entre comillas dentro del JavaScript del botón.

- `escHtml` no escapaba la comilla simple `'`.
- El código intentaba compensarlo poniendo una barra `\` delante de cada `'`.
- Si el texto ya traía su propia barra `\` antes de la comilla, las dos barras se anulaban entre sí y la comilla quedaba libre. Desde ahí, lo que siguiera en el título se ejecutaba como código, en el navegador de **cualquiera que viera la tarjeta**.

**Alcance real.** La revisión del 05/10 había ubicado solo las líneas 66-68. Al corregir se vio que el mismo patrón estaba en más sitios del mismo archivo:

| Sitio (línea en el zip del 05/10) | Dato que entraba al `onclick` o al HTML sin escape suficiente | Quién lo controla |
|---|---|---|
| Tarjeta de producto (66-68) y fila de resultado (71) | título, descripción, `usuario_id`, ícono, precio, `id` | quien publica el producto |
| Videos y resultados web (73, 91, 110) | `link` | resultados de búsqueda externa |
| Botón "Publicar esto" (73) | texto buscado | quien busca |
| Lista de categorías (232) y matriz de localidad (196) | nombre de categoría, fila, columna | datos de la base |
| Lista de personas (280-284) | `id` de usuario | UUID generado por Supabase (riesgo bajo) |
| `abrirModal` (363) | ícono (iba sin escapar a `innerHTML`) | quien publica el producto |

---

## 2. El cambio

1. **`escHtml`** ahora escapa también `'` (`&#39;`).
   - Ojo: por sí solo no cierra el fallo dentro de un `onclick`, porque el navegador convierte `&#39;` otra vez en `'` antes de ejecutar el JavaScript. Por eso hace falta el punto 2.
2. **Los textos ya no van dentro de ningún `onclick`.** Viajan en atributos `data-*` (ya escapados) y los clics los atiende **un solo listener al final del archivo**, que lee los datos con `dataset` (siempre como texto puro, nunca como código).
   - Acciones del listener: `detalles`, `contactar`, `reportar`, `abrirlink`, `publicar-sugerido`, `celda`, `categoria`, `vistaprevia`, `mensajepersona`.
   - Los botones usan las mismas clases de antes, así que se ven igual.
   - Ya no hace falta `event.stopPropagation()`: el botón interior gana sobre la fila que lo contiene.
3. **`escVal()`**, función nueva: escapa cualquier valor, también números (`escHtml(0)` devolvía vacío). Se usa en precio, `id`, `usuario_id`, ícono y cantidad.
4. **Enlaces externos** (videos y resultados web): solo se abren si empiezan con `http://` o `https://`, y con `noopener`. Un enlace `javascript:` ya no se abre.
5. **`abrirModal`**: el ícono ahora pasa por `escHtml`.
6. **Descripción corta de la fila de resultado**: ahora se recorta a 100 caracteres *antes* de escapar. Era necesario por el punto 1: como ahora los apóstrofes se escapan, recortar el texto ya escapado podía partir un `&#39;` a la mitad y mostrar restos como `&#3`.

No se tocó el resto de las funciones del archivo. Diferencia total: unas 80 líneas entre quitadas y agregadas.

---

## 3. Pruebas hechas (Playwright / Chromium)

Se cargó el `ui-controller.js` original y el corregido en el mismo entorno de prueba, con datos maliciosos en cada campo.

- **Original:** los 15 casos principales ejecutaron código (tarjeta y fila × 6 campos, enlaces de video/web, categoría, ícono del modal), más el caso de la lista de personas. Esto confirma que el fallo era real y que la prueba lo detecta.
- **Corregido:** 0 casos ejecutaron código. Un enlace `javascript:` no llegó a `window.open`.
- **Uso normal (corregido):** un título con apóstrofe, comillas, `&` y `<b>` llega idéntico al modal y al reporte; el precio `0` sigue mostrando `S/ 0`; una descripción larga con apóstrofes no muestra restos `&#`; "Contactar" recibe el `usuario_id` correcto.
- `node --check`: sin errores.

**Lo que NO se probó:** la página completa en Vercel (las pruebas usan datos de ejemplo y funciones simuladas para `Institucional`, `PanelUsuario` y `Paginador`) y los clics en la **matriz de localidad** (se cambió igual que las categorías, pero no la ejecuté).

---

## 4. Pendientes: el mismo patrón sigue en otros archivos (NO corregido aquí)

Números de línea del zip del 05/10/2026.

- `institucional.js:79`: `window.open` con el enlace de patrocinadores.
- `panel-usuario-3.js:890`: nombre del otro usuario dentro de un `onclick`. Es el más serio de la lista, porque ese nombre lo controla otra persona.
- `panel-usuario-2.js:460` y `474`; `panel-usuario-3.js:1367`, `1409`, `1470`: nombre con `.replace(/'/g, ...)`, el mismo escape que se pudo burlar.
- `panel-usuario-3.js:1907`: `window.open` con un enlace.
- Esos archivos usan su propio `PanelUsuario.escHtml`, que no revisé.
- `event-controller.js:236` y `251`: `e.message` sin escapar.
- Quedan unos 160 `innerHTML` por auditar.

La solución es la misma de esta bitácora: `data-*` + un listener delegado, y escapar siempre lo que viene de la base.

---

## 5. Cómo aplicarlo

- [ ] Reemplazar `js/modules/ui-controller.js` en el repositorio y hacer push.
- [ ] Esperar el despliegue en Vercel y recargar con Ctrl+F5.
- [ ] Probar en la página real:
  - [ ] tarjeta: Ver detalles, Contactar y Reportar;
  - [ ] resultados de búsqueda: clic en la fila, y Contactar/Reportar dentro de la fila (no debe abrirse además el modal);
  - [ ] abrir un video y un resultado web;
  - [ ] buscar algo sin resultados y pulsar "Publicar esto";
  - [ ] lista de categorías y matriz de localidad (clic en una celda);
  - [ ] buscar personas: Vista previa y Mensaje.
- [ ] **Revertir** si algo falla: volver a subir la versión anterior de `ui-controller.js` (queda en el historial de GitHub). No hay cambios en la base de datos.

## 6. Revisar si alguien ya lo aprovechó

Consulta de solo lectura para ver si hay productos con caracteres sospechosos (puede mostrar también títulos legítimos con comillas; es solo para revisar a mano):

```sql
select id, usuario_id, titulo, left(descripcion, 80) as descripcion, icono
from productos
where titulo ~ '[\\<>"]'
   or descripcion ~ '[\\<>]'
   or icono ~ '[<>"]';
```

Si aparece algo raro, no lo borres sin mirarlo: anota el `id` y el `usuario_id` primero.

---

## 7. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 05/10/2026 | `ui-controller.js` corregido (punto 2 de esta bitácora) | Probado en Chromium; falta subir y probar en producción |
