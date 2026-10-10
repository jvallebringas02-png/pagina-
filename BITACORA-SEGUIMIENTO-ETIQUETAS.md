> **Estado: PREPARADO, SIN CONFIRMAR. El código pasa `node --check` y una prueba simulada (15 comprobaciones). No se probó en la página real. Marcar cada punto cuando se haga.**

# Bitácora — Etiquetas visibles en el formulario de Seguimiento

**Fecha:** 10/10/2026
**Continúa:** `BITACORA-SEGUIMIENTO-RECLAMOS.md`
**Base:** `institucional.js` e `i18n-institucional.js` del zip del 10/10 (el que ya tiene el seguimiento).
**Alcance:** solo la pantalla de seguimiento. No toca el SQL ni los demás formularios.

## 1. Por qué

En la prueba real (10/10) el seguimiento **funcionó**: con el código `LR-2026-000003-M6PS` y el documento de la constancia mostró tipo, fecha (15:43, igual que el PDF) y estado "Pendiente". Pero los dos campos eran cajas iguales, **sin etiqueta**, y el texto de ayuda desaparece al escribir. No se distinguía qué dato pedía el segundo campo.

## 2. Qué cambia

- Cada campo lleva una **etiqueta fija** encima: "Código de tu constancia" y la del segundo dato.
- La etiqueta del segundo campo **se adapta al código** mientras se escribe:

| El código empieza con | Etiqueta del segundo campo |
|---|---|
| `LR-` | Número de documento que escribiste en el reclamo |
| `MC-` | Correo que escribiste en el mensaje (el teclado del celular pasa a modo correo) |
| otra cosa o vacío | Segundo dato: tu número de documento (si fue un reclamo) o tu correo (si fue un mensaje) |

- Si el código ya viene escrito (desde la constancia o un formulario), la etiqueta correcta aparece desde el inicio.
- El texto de ayuda del campo pasa a "Tal como lo escribiste".
- Al cambiar de idioma con el formulario abierto, las etiquetas se retraducen.
- La consulta (`obtener_seguimiento`) no cambia.

## 3. Archivos

| Archivo | Cambio |
|---|---|
| `js/modules/institucional.js` | Etiquetas en `mostrarSeguimiento`; función nueva `actualizarEtiquetaClave`; retraducción |
| `js/i18n-institucional.js` | 4 claves nuevas (`lbl_seg_campo_codigo`, `lbl_seg_clave_generica`, `lbl_seg_clave_reclamo`, `lbl_seg_clave_mensaje`) y nuevo `ph_clave_seg`, en **español e inglés**. El resto de idiomas cae al español, como el resto del seguimiento |

## 4. Cómo aplicarlo

1. [ ] Subir los dos archivos a GitHub. Esperar a Vercel, Ctrl+F5.
2. [ ] Probar (sección 5).

## 5. Pruebas

- [ ] Abrir el seguimiento desde el pie: se ven las dos etiquetas aunque los campos estén vacíos.
- [ ] Escribir un código `LR-…`: la etiqueta pide el número de documento. Con `MC-…`, el correo.
- [ ] Abrir el seguimiento desde la constancia recién enviada: el código ya está y la etiqueta es la correcta.
- [ ] Consultar con el documento correcto: muestra el estado. Con uno incorrecto: "no encontrado".
- [ ] Cambiar el idioma con el formulario abierto.
- [ ] En el celular, comprobar que las etiquetas no se cortan.

## 6. Qué se probó y qué no

**Probado (simulado en Node, 15 comprobaciones):** etiquetas visibles; adaptación a `LR`, `MC` y vacío (mayúsculas o minúsculas); modo de teclado; código prellenado; inglés y cambio de idioma; italiano cae al español.
**No probado:** la página real, ni los navegadores móviles.

## 7. Pendientes que se vieron en la prueba

- [ ] El **asistente no abre el seguimiento** con "tengo este código": respondió con las instrucciones de reportar una publicación. Falta una frase de detección y, de preferencia, que reconozca códigos `LR-…` y `MC-…`.
- [ ] El seguimiento, como los demás formularios, se dibuja en la zona que se oculta con sesión iniciada: **en el panel no se vería**.
- [ ] Los riesgos del SQL de seguimiento (IP, `md5`, `pg_sleep`, código corto) siguen por revisar: el archivo `seguimiento.sql` no está en el zip.
- [ ] Traducir los textos del seguimiento a los demás idiomas.

## 8. Cómo volver atrás

Subir de nuevo los dos archivos anteriores del repo.

## 9. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 10/10/2026 | Etiquetas visibles y adaptables en el seguimiento | `node --check` OK; prueba simulada 15/15; falta subir y probar en la página real |
