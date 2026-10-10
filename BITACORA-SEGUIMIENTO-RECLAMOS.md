> **Estado: PROPUESTO, SIN CÓDIGO. Esta bitácora es el diseño de la pantalla de seguimiento y la
> lista de decisiones que faltan. No se escribió ni se probó nada. Marcar cada punto cuando se haga.**

# Bitácora — Seguimiento del reclamo y de la atención con el administrador

**Fecha:** 10/10/2026
**Continúa:** `BITACORA-FASE1-CONSTANCIA.md` (código + constancia, que es la base de esto),
`BITACORA-LIBRO-RECLAMACIONES.md`, `BITACORA-MODERACION-FORMULARIOS.md`
**Archivos que se tocarían:** `js/modules/institucional.js` (pantalla nueva), `js/i18n-institucional.js`
(textos), `index.html` (enlace en el pie de página), una función nueva en Supabase (SQL).
**Método:** lectura del zip de la página del 09/10. Se buscó en todo `js/` e `index.html` cualquier
rastro de consulta o seguimiento (`seguimiento`, `estado_tramite`, `respuesta_administrador`,
`consultar`): **no hay ninguno**. No se ejecutó nada contra Supabase.

---

## 1. Punto de partida: qué hay hoy

Al enviar un reclamo o un mensaje al administrador, la persona recibe un **código** y una
**constancia imprimible** (`mostrarConstancia`, `imprimirConstancia` en `institucional.js`). Ahí
termina el recorrido:

| | Reclamo | Contacto con el administrador |
|---|---|---|
| Documento que recibe | "Constancia de reclamo" | "Ticket de atención" |
| Datos que lleva | tipo, nombre, documento, correo, teléfono, producto, monto, detalle, solución pedida | nombre, correo, mensaje |
| ¿Puede consultar cómo va? | **No** | **No** |
| ¿Puede recuperar el código si lo pierde? | **No** | **No** |

La constancia solo prueba que el envío ocurrió. No prueba que alguien lo haya leído.

**Una promesa sin respaldo:** el mensaje de éxito del contacto dice *"Te responderemos a tu correo
pronto"*. Hoy no hay panel de administrador, lista de pendientes ni aviso de mensajes nuevos. Ya
estaba anotada en `BITACORA-CHAT-IA-Y-ASISTENTE.md` (pendiente 8).

**Dependencia crítica:** todo esto se apoya en la Fase 1, y la Fase 1 sigue **sin confirmar**: su
SQL no se ejecutó, y el archivo `fase1-constancia.sql` **no viene en el zip** del 09/10.

---

## 2. Qué se quiere (la pantalla)

Un enlace **"Seguimiento de mi reclamo"** en el pie de página (bajo Transparencia). La persona
escribe su código y una segunda clave, y ve:

```
Seguimiento de tu reclamo
Código:      LR-2026-000007-K7Q2
Registrado:  08 oct 2026, 23:41
Tipo:        Reclamo
Estado:      Respondido

Respuesta del administrador (09 oct 2026, 10:15)
"..."
```

Si nadie respondió todavía: **"Pendiente. Aún no hay respuesta."**

El asistente también la abre si alguien escribe "¿cómo va mi reclamo?", igual que ya abre los
formularios.

---

## 3. Datos

La tabla `libro_reclamaciones` ya tiene las columnas `estado_tramite`, `respuesta_administrador` y
`fecha_respuesta` (según `BITACORA-LIBRO-RECLAMACIONES.md`). La fecha y hora del envío también
existe: la constancia ya la devuelve (`res.fecha`).

**Se muestra:** código, fecha y hora del envío, tipo, estado, respuesta y fecha de la respuesta.

**Nunca se muestra:** documento, correo, teléfono, domicilio ni el detalle del reclamo. Esos datos
ya están en el PDF que la persona guardó, y la respuesta del administrador podría citarlos.

**Pendiente de comprobar en la base real:** si `estado_tramite` es obligatorio o tiene valores
permitidos fijos. El Paso 0 de `fase1-constancia.sql` (solo lectura) lo revisa; hay que ejecutarlo
antes de definir los estados de la sección 5.

---

## 3.1 ¿Y el contacto con el administrador?

Se ve igual, pero la tabla de mensajes (`mensajes_contacto`) puede **no tener** columnas de estado
ni de respuesta. Hay que revisarlo en Supabase antes de prometer seguimiento ahí.

---

## 4. Cómo entra la persona (las dos llaves)

La respuesta del administrador puede contener datos personales. Si bastara el código, cualquiera
que lo vea (por ejemplo, en una foto del PDF) leería la respuesta. Por eso se pide una segunda clave:

| Caso | Segunda clave propuesta | Por qué |
|---|---|---|
| Reclamo | Número de documento | Ya se pide en el formulario |
| Contacto con el administrador | Correo | No se pide documento, y no conviene empezar a pedirlo |

**El código de hoy es débil para esto.** Termina en 4 caracteres al azar (por ejemplo
`LR-2026-000007-K7Q2`); la parte numérica es una secuencia que cualquiera puede intuir. La
Fase 1 ya lo advierte: *"si se agrega consulta por código, hace falta un token más largo"*.

Reglas para que no se pueda adivinar:
- La respuesta ante un error es **la misma** si el código no existe o si la segunda clave no
  coincide ("No encontramos un registro con esos datos"). Así nadie descubre qué códigos existen.
- Límite de intentos fallidos por código y por persona.
- La consulta se hace por una **función de Supabase** que devuelve solo los campos de la sección 3.
  La tabla sigue sin poder leerse desde la página (así quedó después del arreglo del
  `07/10`: no se debe volver a abrir esa lectura).

---

## 5. Cómo responde el administrador (mientras no haya panel)

1. Entra a Supabase → Table Editor → `libro_reclamaciones`.
2. Abre la fila del reclamo (busca por `codigo_reclamo`).
3. Escribe `respuesta_administrador`, pone `fecha_respuesta` y cambia `estado_tramite`.

Estados propuestos (a confirmar tras el Paso 0): **Pendiente → En revisión → Respondido → Cerrado**.

El texto que escribe el administrador pasa por `escHtml` al mostrarse, igual que todo lo demás
(ver `BITACORA-XSS-TARJETAS.md`): aunque lo escriba una persona de confianza, no se pega sin
escapar.

---

## 6. Piezas técnicas (sin código todavía)

1. [ ] Función de Supabase `consultar_seguimiento(codigo, clave)`: devuelve solo los campos de la
       sección 3; mensaje de error idéntico para "no existe" y "clave incorrecta"; límite de intentos.
2. [ ] Pantalla en `institucional.js` (misma forma que las otras: `mostrarFormularioEnMuro`) con
       el formulario de consulta y la tarjeta de resultado. Escapar todo con `escHtml`.
3. [ ] Enlace "Seguimiento de mi reclamo" en `index.html` (pie, columna Transparencia) y en el
       diccionario del pie.
4. [ ] Textos en `i18n-institucional.js`, con la regla de siempre: quechua y aimara caen a español
       hasta que los revise un hablante nativo.
5. [ ] Que el asistente abra la pantalla con "¿cómo va mi reclamo?".
6. [ ] Si se acuerda un token más largo: cambiar la generación del código en la función
       `registrar_reclamo`. Los códigos ya entregados (de 4 caracteres) seguirían existiendo y solo
       podrían consultarse con documento, no solo por código.

---

## 7. Orden (nada de esto va antes de lo anterior)

1. [ ] **Ejecutar y probar la Fase 1** en Supabase real (reclamo y contacto devuelven código y
       constancia). Conseguir el archivo `fase1-constancia.sql`, que no está en el zip.
2. [ ] Ejecutar el Paso 0 (solo lectura) y anotar cómo es `estado_tramite` y qué columnas tiene
       `mensajes_contacto`.
3. [ ] Decidir la sección 8.
4. [ ] Recién entonces, construir las piezas de la sección 6.

---

## 8. Decisiones abiertas

- [ ] **¿Quién va a leer y responder?** Si hoy nadie, la frase *"Te responderemos pronto"* hay que
      cambiarla por *"Recibimos tu mensaje"*, y el seguimiento mostraría siempre "Pendiente".
- [ ] **Alcance:** ¿seguimiento solo para reclamos, o también para el contacto con el administrador?
- [ ] **Estados** que se muestran (sección 5).
- [ ] **Plazo de respuesta:** ¿se muestra? La bitácora de la Fase 1 cita 15 días hábiles
      (Ley 31435) pero la marca como dato de fuentes secundarias. **No ponerlo hasta confirmarlo con
      INDECOPI o un abogado.**
- [ ] **Segunda clave** (sección 4) y **largo del código** nuevo.
- [ ] **Idioma de la respuesta:** el administrador escribe en un idioma; la persona puede estar
      usando la página en otro. ¿Se traduce con IA (gasta cuota) o se muestra tal cual?
- [ ] **Política de privacidad:** debe decir que se guardan documento, correo y teléfono, y que la
      respuesta se consulta con código y clave.
- [ ] **Conservación:** la norma que encontró la Fase 1 indica 2 años desde el registro. Ninguna
      limpieza de Supabase debe tocar `libro_reclamaciones`.
- [ ] **Copia por correo:** sigue fuera de esta fase (necesita un servicio de envío).

---

## 9. Cómo se probaría, una vez construido

1. Enviar un reclamo real y consultar con código + documento: debe mostrar "Pendiente".
2. Responder desde Supabase y volver a consultar: debe mostrar la respuesta, su fecha y el estado.
3. Consultar con el código correcto y un documento equivocado: debe salir el **mismo** mensaje que
   con un código inexistente.
4. Equivocarse varias veces seguidas: debe bloquear los intentos por un rato.
5. Revisar en F12 → Red que la respuesta de la función **no incluya** documento, correo, teléfono ni
   detalle.
6. Escribir en la respuesta del administrador `<b>prueba</b>`: debe verse como texto, sin negrita.
7. Con una cuenta normal, ejecutar `await supabase.from('libro_reclamaciones').select('*')`:
   debe seguir devolviendo vacío o error (la tabla no se debe volver a abrir).
8. Escribir "¿cómo va mi reclamo?" al asistente: debe abrir la pantalla.

## 10. Cómo volver atrás

Quitar el enlace del pie y borrar la función `consultar_seguimiento`. Las columnas de la tabla y la
Fase 1 no se tocan.

## 11. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 10/10/2026 | Diseño del seguimiento y lista de decisiones | Solo documento. Sin código, sin SQL, sin pruebas |
