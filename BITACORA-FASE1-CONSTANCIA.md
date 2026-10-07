> **Estado: PREPARADO, SIN CONFIRMAR. Es una RECONSTRUCCIÓN (el original de la Fase 1 no estaba disponible). El código pasa `node --check` y una prueba simulada (30 comprobaciones). El SQL NO se ejecutó (no hay Postgres disponible) y nada se probó en la página real. Marcar cada punto cuando se haga.**

# Bitácora — Fase 1: código de reclamo y constancia en PDF (Libro de Reclamaciones y Comunícate con el Administrador)

**Fecha:** 07/10/2026
**Continúa:** `BITACORA-LIBRO-RECLAMACIONES.md`
**Alcance:** solo página principal. Sin cuenta, sin panel, sin IA, sin correo, sin tocar ningún `panel-usuario-*.js`.
**Base del código:** el `institucional.js` y el `i18n-institucional.js` del zip del 07/10 (versión de las columnas corregidas, antes de la constancia).

## 0. Qué cambió respecto a la primera versión de esta fase

- **El comprobante va SIEMPRE en inglés** (decisión del 07/10: la página es de alcance mundial). Ya no hay 16 claves nuevas en 15 idiomas: los textos del documento están fijos en `htmlConstancia`.
- Solo quedan **2 claves nuevas** en 15 idiomas, para lo que se ve en pantalla: `btn_guardar_pdf` y `msg_guarda_codigo`. Quechua y aimara caen al español.
- **Lo que la persona escribe se imprime tal cual**, en su idioma, sin traducir.
- La constancia lleva una **nota fija**: la página solo conecta usuarios, no es parte de ninguna operación entre ellos y la constancia no implica reconocimiento de responsabilidad.
- Si el tipo es **reporte**, la nota añade que es un aviso al administrador, no un reclamo dirigido a un vendedor o proveedor.
- Interruptor `Institucional.CONSTANCIA_CON_ESPANOL` (por defecto `false`): en `true`, cada etiqueta sale "inglés / español" y la nota se repite en español. Sirve si decides que INDECOPI o un abogado deben poder leerlo.
- La fecha sale en hora local del navegador **y** en UTC, para que no haya dudas de zona horaria.

## 1. Qué hace

Al enviar, la persona ve su **código** (`LR-2026-000007-K7Q2` para reclamos, `MC-2026-000003-ZZZZ` para mensajes), la fecha y hora, y un resumen de lo que escribió. Un botón **"Guardar como PDF / Imprimir"** abre la impresión del navegador solo con la constancia; el nombre sugerido del archivo es el código. El PDF lo genera el navegador; no se envía ni se guarda ningún archivo en el servidor.

Los datos y el código quedan guardados en Supabase. Si el navegador bloquea la ventana nueva, se usa un iframe oculto como respaldo.

## 2. Archivos

| Archivo | Cambio |
|---|---|
| `fase1-constancia.sql` | Columna `codigo` en `mensajes_contacto`; secuencias; índices únicos; funciones `registrar_reclamo` y `registrar_contacto` (validan tamaños, guardan en las columnas reales y devuelven código y fecha). |
| `js/modules/institucional.js` | `enviarReclamo` y `enviarContacto` llaman a esas funciones (`supabase.rpc`). Nuevas: `htmlConstancia`, `mostrarConstancia`, `imprimirConstancia`, `formatearFechaConstancia`. |
| `js/i18n-institucional.js` | 2 claves nuevas (`btn_guardar_pdf`, `msg_guarda_codigo`) en 15 idiomas. |

## 3. Orden para aplicarlo

1. [ ] Ejecutar en Supabase el **Paso 0** de `fase1-constancia.sql` (solo lectura) y mirar: largo de `codigo_reclamo` (debe admitir 19 caracteres), si `estado_tramite` es obligatorio, valores permitidos de `tipo_incidencia`, tipo de `id`.
2. [ ] Ejecutar los Pasos 1 y 2 **en una copia** del proyecto; probar con el Paso 3.
3. [ ] Ejecutarlos en el proyecto real.
4. [ ] Subir a GitHub `js/modules/institucional.js` y `js/i18n-institucional.js`. Esperar a Vercel, Ctrl+F5.
5. [ ] Probar (sección 4).
6. [ ] Opcional, solo después de probar: el Paso 4 del SQL (cerrar el INSERT directo).

## 4. Pruebas

- [ ] Reclamo sin sesión: aparece código, fecha y resumen; en Supabase la fila lleva el mismo código y `bien_servicio`.
- [ ] Mensaje al administrador: lo mismo, con código `MC-…`.
- [ ] "Guardar como PDF": en PC (Chrome y Firefox) y en el celular. En iPhone/Safari conviene probar con atención.
- [ ] El PDF contiene solo la constancia, no la página entera, y su nombre sugerido es el código.
- [ ] Con la página en italiano o árabe: el botón sale en ese idioma, el comprobante en inglés y lo escrito por la persona intacto.
- [ ] Botón 🚩 Reportar de una tarjeta: abre el formulario con el producto y termina en constancia con la nota de reporte.
- [ ] Doble clic en enviar: no crea dos filas (el botón se desactiva mientras envía).
- [ ] Error: apagar la red y enviar; debe mostrar el error y dejar reintentar.
- [ ] Probar en la copia que las validaciones rechazan: tipo inválido, correo sin `@`, texto más largo que el límite.

## 5. Qué se probó y qué no

**Probado (simulado en Node, 30 comprobaciones):** reclamo y contacto exitosos; HTML peligroso escapado; teléfono vacío omitido; monto con 2 decimales; comprobante en inglés con la página en italiano y árabe; texto en árabe del usuario conservado; modo bilingüe; nota de reporte; error del servidor (botón reactivado); respuesta sin código; monto inválido (no envía); el PDF no lleva el botón y su título es el código; respaldo por iframe; 15 idiomas con las claves nuevas y quechua/aimara cayendo al español.
**No probado:** el SQL (nunca se ejecutó); las funciones contra Supabase real; la impresión en navegadores reales; revisión nativa de los textos nuevos de pantalla.

## 6. Límites

- El PDF lo hace el navegador y **cualquiera puede editarlo**; el valor lo da el código, comprobable en Supabase.
- Si la persona **no guarda** la constancia y pierde el código, no puede recuperarlo (la tabla no se puede leer desde la página).
- La constancia no se retraduce (el botón y el aviso de pantalla tampoco si se cambia de idioma después de enviar).
- **No lleva plazo de respuesta.** Fuentes secundarias indican 15 días hábiles (Ley 31435, 2022); confirmar con INDECOPI o un abogado antes de ponerlo.
- No incluye domicilio ni tipo de documento (se guarda "No indicado"); sigue en pendientes.
- No se envía copia por correo.
- `estado_tramite` y el id de la publicación/vendedor no se tocan en esta fase.
- Los 4 caracteres al azar del código no son un secreto fuerte: si se agrega consulta por código, hace falta un token más largo.

## 7. Cómo volver atrás

- Código: subir los dos archivos anteriores del repo (los del zip del 07/10).
- SQL: bloque "VOLVER ATRÁS" al final del archivo (las columnas y secuencias pueden quedarse). Si ejecutaste el Paso 4, recrea las reglas de INSERT.

## 8. Decisiones abiertas

- [ ] **Idioma del comprobante:** hoy solo inglés. ¿Se activa `CONSTANCIA_CON_ESPANOL`? Preguntar a INDECOPI o a un abogado si lo exigen en español cuando el consumidor está en Perú.
- [ ] **Redacción de la nota** de la constancia ("solo conecta usuarios… no implica reconocimiento de responsabilidad"): revisarla con un abogado junto con la declaración jurada y los Términos y Condiciones.
- [ ] **Separar "reporte" de "reclamo/queja"** y preguntar en el formulario si el asunto es sobre la página o sobre un vendedor/publicación.
- [ ] **Guardar el id de la publicación y del vendedor** cuando el reporte sea sobre un anuncio.
- [ ] ¿Se bloquea algo en el Libro de Reclamaciones? Recomendación: **nada se bloquea**; a lo sumo una marca `requiere_revision` para el administrador.
- [ ] ¿Revisión con IA en Comunícate con el Administrador? Recomendación: solo después del límite de uso de IA.
- [ ] Seguimiento por código (consultar estado y respuesta): requiere otra función en Supabase y un token más largo; no está en esta fase.
- [ ] Copia del comprobante por correo.
- [ ] Domicilio y tipo de documento reales.
- [ ] Conservar los registros: la norma que encontré indica 2 años desde el registro. Que ninguna limpieza de Supabase toque `libro_reclamaciones`.

## 9. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 07/10/2026 | Fase 1 preparada la primera vez (SQL, JS, 15 idiomas) | `node --check` OK; prueba simulada 21/21; archivos no disponibles después |
| 07/10/2026 | Fase 1 reconstruida: comprobante en inglés, nota de plataforma como nexo, 2 claves en 15 idiomas | `node --check` OK; prueba simulada 30/30; falta SQL, subida y prueba real |
