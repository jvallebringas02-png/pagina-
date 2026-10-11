# Bitácora: aviso del documento, etiqueta de Seguimiento y pie de página (11/10/2026)

## Qué cambió
1. **Pie de página:** se quitó el enlace "Reportar" (llamaba a la IA con `iaResponde('reportar')`). El Libro de Reclamaciones, que está en la misma columna, cubre ese caso. La clave `quick_reportar` se conserva: la usa el botón rápido del asistente.
2. **Etiqueta de Seguimiento (pie) y título de su pantalla:** ahora dice "Seguimiento de mi reclamo o de mi mensaje al administrador" (15 idiomas en `i18n.js`; título de pantalla solo es/en, como el resto de esa pantalla).
3. **Aviso del documento en el formulario del Libro:** texto fijo bajo el campo de documento (`hint_documento_reclamo`): sin puntos ni guiones, se necesita con el código para consultar, hay que escribirlo igual.
4. **Aviso al enviar:** debajo de "Guarda este código..." aparece `aviso_seg_reclamo` (solo reclamos).
5. **Constancia y PDF:** una frase final en inglés (y en español si `CONSTANCIA_CON_ESPANOL` se activa) que indica usar la página de seguimiento con el código y el documento tal como figura en la constancia.

## Idiomas
- Textos nuevos (3 y 4) en 15 idiomas. **Quechua y aimara no llevan el texto nuevo**: caen a español (la IA inventa palabras en esos idiomas). Agregar cuando haya traductor de confianza.
- Las traducciones nuevas las redactó Claude: conviene que alguien que hable cada idioma las revise, sobre todo árabe, hindi, búlgaro y turco.
- La constancia sigue en inglés a propósito.

## Archivos para subir
`index.html`, `js/i18n.js`, `js/i18n-institucional.js`, `js/modules/institucional.js`.

## Probado (simulado en Node)
Sintaxis de los tres .js; 17 idiomas cargan, 15 con las dos claves nuevas y qu/ay con respaldo en español; la constancia incluye la frase nueva y sigue escapando el documento; no queda ninguna etiqueta vieja de `footer_seguimiento`.

## No probado (hacerlo en el navegador)
- Que el pie ya no muestre "Reportar" y que la columna Transparencia se vea bien.
- El aviso bajo el campo de documento en pantalla chica, y que al cambiar de idioma con el formulario abierto se traduzca sin borrar lo escrito.
- El aviso al enviar y la frase en el PDF (Guardar como PDF).
- Cómo se ve la etiqueta larga del pie en cada idioma (puede partirse en dos líneas).

## Cómo volver atrás
Subir de nuevo los 4 archivos anteriores.

## Pendiente (no incluido)
- Quitar en Supabase las dos políticas de INSERT del Libro y de contacto (ver conversación).
- Revisar `fn_generar_codigo` y `fn_codigo_contacto`.
- Decidir si los reportes de publicaciones siguen yendo al Libro de Reclamaciones.
