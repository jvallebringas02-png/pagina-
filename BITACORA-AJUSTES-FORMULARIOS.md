> **Estado: PLAN, SIN CÓDIGO TODAVÍA. Esta bitácora recoge lo que se vio al probar la Fase 1 en `pueba02.vercel.app` el 07/10/2026 y los ajustes propuestos a los dos formularios. Nada se cambió en `institucional.js` ni en `i18n-institucional.js`. Hay decisiones abiertas en la sección 5; marcar cada punto cuando se haga.**

# Bitácora — Ajustes a los formularios del Libro de Reclamaciones y de Comunícate con el Administrador

**Fecha:** 07/10/2026
**Continúa:** `BITACORA-FASE1-CONSTANCIA.md` (la constancia ya funciona en la página real), `BITACORA-LIBRO-RECLAMACIONES.md`, `BITACORA-MODERACION-FORMULARIOS.md`
**Archivos que se tocarían:** `js/modules/institucional.js` y `js/i18n-institucional.js`. No se tocan el SQL, ningún `panel-usuario-*.js` ni la función `chat-ia`.
**Alcance:** solo la presentación y las validaciones de los dos formularios de la página principal. No cambia lo que se guarda ni la constancia.

---

## 1. Qué se probó el 07/10/2026

Con el SQL de la Fase 1 ya ejecutado en Supabase y los dos `.js` subidos:

| Prueba | Resultado |
|---|---|
| Reporte en el Libro de Reclamaciones (sin sesión) | Salió la constancia con código `LR-2026-000001-EHDD`, fecha local y UTC, resumen, nota y botón "Guardar como PDF / Imprimir" |
| Mensaje al administrador | Salió el aviso verde y la constancia con código `MC-2026-000001-B233` |
| Correo sin `@` en el mensaje al administrador | El navegador lo bloqueó con su aviso estándar |
| Se abrió una pestaña con título `LR-2026-0000…` | Parece la ventana de impresión con el código como título (no se vio la vista previa) |

**Todavía sin comprobar:** que las filas de Supabase lleven exactamente esos dos códigos; la vista previa de impresión (solo la constancia) en PC y en celular; el error con la red apagada; un idioma de derecha a izquierda; el botón 🚩 Reportar de una tarjeta.

## 2. Qué se encontró (a partir de las capturas y del código)

1. **Los campos no tienen etiqueta fija.** Solo llevan texto de ayuda dentro de la casilla (placeholder), que desaparece al escribir. Con la casilla llena no se distingue, por ejemplo, el documento del teléfono.
2. **Los obligatorios no se marcan; solo los opcionales dicen "(opcional)".**
   - Reclamo: obligatorios tipo, nombre, documento, correo, producto o servicio, detalle y pedido; opcionales teléfono y monto.
   - Contacto: obligatorios nombre, correo y mensaje.
   - El correo solo dice "Tu correo". La persona se entera de que es obligatorio al intentar enviar.
3. **No se explica para qué se pide el correo.**
4. **No hay `minlength` ni `maxlength`.** Los límites reales están en la base (ver sección 4); la persona solo se entera después de enviar.
5. **El monto reclamado aparece también en "Reporte" y "Queja"**, donde casi nunca aplica. Es opcional (no tiene `required`).
6. **El botón dice "Registrar reclamo" aunque el tipo elegido sea "Reporte".**
7. **El aviso del mensaje al administrador dice "Te responderemos a tu correo pronto".** Promete una respuesta, contradice la nota de la constancia ("no implica compromiso") y todavía no existe el panel de administrador para responder.
8. **El texto del asistente al abrir el formulario** dice "el equipo te responderá" y, en el Libro, "quedará constancia de tu reclamo". No nombra el correo. (No se ubicó dónde está definido ese texto.)

## 3. Ajustes propuestos

### 3.1 Los dos formularios
- [ ] **Etiqueta fija** sobre cada casilla (con `<label for="...">` enlazado al campo), sin quitar el texto de ayuda como ejemplo.
- [ ] **Asterisco (*)** en los obligatorios y una línea al inicio: "* Campos obligatorios".
- [ ] **Frase bajo el correo** que diga para qué se usa. Propuesta de partida (el texto final lo debe confirmar quien redacte la política de privacidad): "Lo usaremos solo para contactarte por este envío."
- [ ] **`minlength` y `maxlength`** alineados con la base (tabla de la sección 4), para avisar antes de enviar.

### 3.2 Libro de Reclamaciones
- [ ] **Monto reclamado:** mostrarlo solo cuando el tipo sea **"Reclamo"** y ocultarlo en "Queja" y "Reporte". Si está oculto, se envía vacío (la función ya acepta `null`). Esperar la respuesta de INDECOPI antes de darlo por definitivo (sección 5).
- [ ] **Botón:** texto neutro ("Enviar") o que cambie según el tipo, en lugar de "Registrar reclamo" fijo.

### 3.3 Comunícate con el Administrador
- [ ] **Aviso al enviar:** cambiar "¡Mensaje enviado! Te responderemos a tu correo pronto." por un texto que no prometa plazos ni respuesta (por ejemplo, "Mensaje recibido"). Revisar también el aviso del reclamo (`exito_reclamo`) por si tiene una promesa parecida.
- [ ] **Texto del asistente:** localizar dónde se define el mensaje "Aquí tienes el formulario…" y ajustarlo para nombrar el correo y no prometer respuesta.

## 4. Límites que deben usar los campos

Salen de las reglas CHECK (`lr_validacion`, `mc_validacion`) y del tamaño de las columnas, confirmados con las consultas del 07/10/2026. Donde la columna es más corta que la regla, **manda la columna**.

| Formulario | Campo | Mínimo | Máximo |
|---|---|---|---|
| Reclamo | Nombre completo | 2 | 150 |
| Reclamo | Documento | 4 | 20 |
| Reclamo | Correo | formato válido | 100 (columna) |
| Reclamo | Teléfono (opcional) | — | 20 (columna) |
| Reclamo | Producto o servicio | 1 | 300 |
| Reclamo | Monto (opcional) | 0 | 100 000 000 |
| Reclamo | Detalle de lo ocurrido | 5 | 3000 |
| Reclamo | Solución esperada | 3 | 1500 |
| Contacto | Nombre | 1 | 120 |
| Contacto | Correo | formato válido | 200 |
| Contacto | Mensaje | 1 | 2000 |

## 5. Decisiones abiertas

- [ ] **Monto:** ¿opcional siempre, solo en "Reclamo", o quitarlo hasta que existan servicios pagados? Preguntar a INDECOPI o al abogado qué datos exige el formato. La propuesta de partida es mostrarlo solo en "Reclamo".
- [ ] **Texto del correo:** redacción final de la frase sobre el uso del correo (relacionada con la política de privacidad, que todavía debe declarar qué datos se guardan).
- [ ] **Constancia bilingüe:** hoy sale solo en inglés. Existe el interruptor `Institucional.CONSTANCIA_CON_ESPANOL` (por defecto `false`) para mostrar "inglés / español". Decidir si se activa.
- [ ] **Aviso al enviar:** ¿"Mensaje recibido" u otro texto? Depende de si habrá respuesta y de cuándo exista el panel de administrador.

## 6. Otras observaciones de la prueba (no son parte de este ajuste)

- **Asistente:** en un mensaje cortado en la captura, el asistente afirma que los datos están "en servidores con certificaciones de seguridad" y que se hacen "copias de seguridad periódicas". Verificar que eso sea cierto o quitarlo del `PROMPT_BASE` de `chat-ia` (esa función no está en el repo).
- **Nombre del sitio en la constancia:** sale `pueba02.vercel.app`, el dominio de pruebas. Una constancia emitida ahí no vale para producción; revisar cuando exista el dominio definitivo.
- **Números repetidos:** el reclamo viejo es `LR-2026-000001` (06/10, con el trigger) y el nuevo `LR-2026-000001-EHDD`. No chocan, pero pueden confundir.
- **Datos de prueba en las tablas:** las pruebas dejaron nombres y correos reales en `libro_reclamaciones` y `mensajes_contacto`. Antes de abrir al público, mirar qué filas hay y borrarlas. Las secuencias no se reinician solas (`alter sequence seq_reclamo restart with 1;` y lo mismo con `seq_contacto`, si se quiere que el primer código real sea `000001`).

## 7. Archivos y textos nuevos

| Archivo | Cambio previsto |
|---|---|
| `js/modules/institucional.js` | Etiquetas, asteriscos, frase del correo, `minlength`/`maxlength`, monto condicional, botón y aviso. |
| `js/i18n-institucional.js` | Claves nuevas de etiquetas, de "* Campos obligatorios", de la frase del correo y de los avisos, en 15 idiomas (quechua y aimara caen al español). Los nombres exactos se definen al escribir el código, comprobando que no choquen con las claves existentes. |

Las traducciones nuevas no tendrían revisión nativa; queda como pendiente, igual que en el resto de la página.

## 8. Orden y pruebas

1. [ ] Cerrar las decisiones de la sección 5 (al menos la del monto y la del aviso).
2. [ ] Escribir el cambio y probarlo en un navegador antes de subir.
3. [ ] Subir los dos `.js`, esperar a Vercel, Ctrl+F5.
4. [ ] Probar: etiquetas visibles con la casilla llena; asteriscos; aviso del navegador al faltar un campo obligatorio o al pasarse de largo; monto que aparece solo en "Reclamo"; botón correcto por tipo; aviso nuevo al enviar el mensaje; en un idioma de derecha a izquierda (árabe) y en uno largo (alemán), para ver que las etiquetas no rompan el diseño.
5. [ ] Repetir un reclamo y un mensaje y comprobar que siguen apareciendo la constancia y el código, y que la fila de Supabase lleva el mismo código.

**Cómo volver atrás:** volver a subir los dos `.js` anteriores del repo (los de la Fase 1). No hay cambios en la base de datos.

## 9. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 07/10/2026 | Se probó la Fase 1 en `pueba02.vercel.app` y se planearon estos ajustes | Solo plan; sin código |
