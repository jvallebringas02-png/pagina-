> **Estado (14/11/2026): PASO 5 HECHO Y PROBADO EN NODE; TODAS LAS PANTALLAS QUEDAN CONECTADAS PERO APAGADAS.** Mientras los interruptores de `index.html` estén en `false`, la página se comporta exactamente como antes. **Nada se probó en un navegador real ni contra tu Supabase**: solo Node con los archivos reales de la página cargados en un entorno simulado y un Supabase de mentira.

# Bitácora — Búsqueda por capas, paso 5: conectar las pantallas

**Fecha:** 14/11/2026
**Continúa:** `BITACORA-BUSQUEDA-POR-CAPAS-2.md`
**Zip de referencia:** `pagina--main__2__1.zip` (subido el 14/11/2026). Todo se hizo sobre una copia de ese zip.

---

## 1. Estado de los pasos anteriores según ese zip

| Pieza | En el zip |
|---|---|
| Paso 1 (limpieza), paso 3 (entrada única), arreglos del intérprete, motor y datos | Presentes e idénticos a lo entregado |
| Paso 2 (`intencion-busqueda.js` y su prueba) | **No estaban.** Se entregaron otra vez el 14/11/2026 |
| Edición del `.or()` en `panel-usuario-3.js` | **No estaba.** Va incluida en el `panel-usuario-3.js` de este paso (solo hay que reemplazar el archivo) |
| Borrar 4 `.test.js` de `js/modules/` y `pruebas/interprete-busqueda-personas.js` | **Seguían ahí** |

Después de este zip dijiste que ya lo habías subido; **no pude comprobarlo** porque no llegó otro zip. Antes de apagar o prender nada, confirma con la lista de la sección 6.

## 2. Qué se conectó

Todas las búsquedas de personas de la página pasan por un solo punto, `PanelUsuario.buscarUsuariosPorNombre` (`panel-usuario-3.js`). Conectar ahí cubre varias pantallas a la vez. Además se agregó una "puerta" que decide, **sin gastar IA**, si una frase pide personas con claridad.

| Pantalla | Dónde se conecta | Interruptor(es) |
|---|---|---|
| Buscar Personas | punto central (canal `panelPersonas`); **solo aquí** se permite un apellido como "Armas" | `panelPersonas` |
| Compartir y Nuevo mensaje | punto central (canal `picker-…`); sin permiso para "Armas" | `picker` |
| Zona (filtro de la página) | punto central (canal `paginaZona`) | `paginaZona` |
| Caja principal | puerta nueva en `event-controller.js` (`manejarBusquedaPrincipal`) + punto central (canal `paginaChat`) | `principal` y `paginaChat` |
| Asistente (chat de la página) | puerta nueva en `event-controller.js` (`manejarEnvioMensaje`) + punto central (canal `paginaChat`) | `asistente` y `paginaChat` |
| Panel: buscador y chat | puertas nuevas en `panel-usuario-3.js` (`ejecutarBusquedaConIA`) y `event-controller.js` + punto central (canal `panelChat`) | `panel` y `panelChat` |

**Cómo se reparten los interruptores:**
- Los de canal (`panelPersonas`, `picker`, `paginaZona`, `paginaChat`, `panelChat`) deciden **cómo se busca**: limpieza, intérprete y motor por las capas.
- Los de puerta (`principal`, `asistente`, `panel`) deciden si una frase que las reglas reconocen como de personas **se muestra sin pasar por la IA**.

**Cambios en archivos (frente al zip del 14/11/2026):**

| Archivo | Cambio |
|---|---|
| `index.html` | +11 líneas: 3 `<script>` (limpieza, intención, entrada única) después del motor de personas y el bloque `window.BUSQUEDA_CAPAS` con los 8 interruptores en `false` |
| `js/modules/panel-usuario-3.js` | +38 −3: el punto central usa las capas si el interruptor del canal está en `true`; funciones nuevas `_fraseEsDePersonasPorCapas` y `_mostrarPersonasPorCapasEnFeed`; puerta en `ejecutarBusquedaConIA`; incluye la edición del `.or()` del paso 4 |
| `js/modules/event-controller.js` | +17 −1: puerta en el buscador principal y en el chat (página y panel) |

## 3. Qué hace una pantalla con las capas prendidas

- **Punto central:** si el canal está prendido, hay texto y no hay ficha forzada (los botones de ejemplo), llama a `BusquedaPorCapas.buscarPersonas`. Si las capas fallan o devuelven respaldo, sigue el motor de siempre. Lo que devuelve es lo mismo de antes (lista con `nombre_completo` y la propiedad `.motor`), así que las pantallas no cambian cómo dibujan.
- **Puerta:** devuelve `true` solo si hay sesión, el interruptor está prendido, la entrada única y la intención no están apagadas, la frase **no** es una acción directa (hora, reclamo…) y las reglas dicen personas **sin ambigüedad**. Si no, sigue la IA como hoy.
- **Frases que ahora no pasan por la IA:** `@jperez`, `busca quien venda laptops`, `Juan Pérez`, `usuarios con inicial J en Callao`, `usuarios de mi zona`.
- **Frases que siguen a la IA:** `laptops` (ambigua), `videos de gatos`, `qué hora es`, `mi zona`, conversación.
- **Sin la IA no sale la burbuja de texto del asistente** (por ejemplo, el comentario en lenguaje natural): solo salen las tarjetas de personas. Es un cambio de apariencia que conviene mirar en el paso 6.
- **"Usuarios de mi zona"** ya no se desvía a la matriz de zona cuando las reglas ven una petición de personas (decisión de la bitácora 2). En el panel se dibuja directo, sin pasar por `procesarAccionEnFeed`, justamente para que no lo desvíe.

## 4. Orden recomendado para prender (en `index.html`, el bloque `window.BUSQUEDA_CAPAS`)

1. `panelPersonas: true` → probar **Buscar Personas**.
2. `picker: true` → probar **Compartir** y **Nuevo mensaje**.
3. `paginaZona: true` → probar el filtro de zona de la página.
4. `paginaChat: true` y `principal: true` → probar la **caja principal** (con las dos prendidas).
5. `asistente: true` → probar el **asistente de la página**.
6. `panelChat: true` y `panel: true` → probar el **panel** (buscador de arriba y chat).

**Cómo apagar algo:** poner ese valor en `false` y volver a publicar. No hace falta tocar más. También se puede apagar desde la consola del navegador, sin publicar: `BUSQUEDA_CAPAS.principal = false` o `BusquedaPorCapas.interruptores.entrada = false` (apaga toda la entrada única; todas las pantallas vuelven al código de siempre).

## 5. Pruebas (Node)

| Suite | Resultado |
|---|---|
| `limpieza-busqueda.test.js` | 53 de 53 |
| `intencion-busqueda.test.js` | 191 de 191 |
| `busqueda-por-capas.test.js` | 44 de 44 |
| **`conexion-pantallas.test.js` (nueva)** | **37 de 37** |
| `interprete-busqueda-personas.test.js` | 187 de 187 |
| `motor-busqueda-personas.test.js` | 95 de 95 |
| `motor-busqueda-personas-datos.test.js` | 17 de 17 |
| `motor-busqueda-personas-ayuda.test.js` | 40 de 40 |

`conexion-pantallas.test.js` carga los archivos **reales** (`index.html`, `panel-usuario-3.js`, `event-controller.js` y los módulos) en un entorno simulado y comprueba, entre otras cosas:
- el orden de los scripts y que los 8 interruptores vienen en `false`;
- con interruptor apagado, el camino de siempre y sin pasar por las capas (`co-caina` no se bloquea); con interruptor prendido, se bloquea;
- "Armas" permitido solo en Buscar Personas, y bloqueado en Compartir y Mensajes;
- la ficha forzada y el texto vacío no pasan por las capas;
- apagar la entrada única da respaldo con las mismas personas;
- en la caja principal, el asistente y el panel: con el interruptor apagado se llama a la IA; prendido y con frase de personas, no; con frase ambigua u otra cosa, sí.

## 6. Lista para comprobar en tu proyecto (antes de prender nada)

- [ ] `js/modules/` tiene `limpieza-busqueda.js`, `intencion-busqueda.js` y `busqueda-por-capas.js`.
- [ ] `pruebas/` tiene `intencion-busqueda.test.js` y `conexion-pantallas.test.js`.
- [ ] `index.html`, `event-controller.js` y `panel-usuario-3.js` son los de este paso (el de `panel-usuario-3.js` ya trae el `.or()` corregido).
- [ ] Están **borrados** los 4 `.test.js` de `js/modules/` y `pruebas/interprete-busqueda-personas.js`.
- [ ] Con todos los interruptores en `false`, la página carga y se comporta igual que antes (Buscar Personas, Compartir, el buscador y el asistente).
- [ ] En la consola del navegador no aparece ningún error nuevo al abrir la página.

## 7. Qué NO está probado y qué hay que mirar en el paso 6

- No se probó en un navegador real, ni contra tu Supabase real (RLS, vista `perfiles_publicos`), ni con la IA, ni en Vercel, ni en celular.
- **Probar con 3 cuentas** (sin sesión, la tuya y otra), en computadora y celular, y **después de prender cada interruptor**.
- Sin sesión, la puerta no actúa y la frase va a la IA como hoy.
- Mirar que: las tarjetas de personas se vean igual que antes; la caja principal no deje el "buscando…" colgado; el chat de la página y el del panel respondan sin la burbuja de la IA; "Armas" aparezca solo en Buscar Personas.
- Con la caja principal prendida, mirar la **cuota de la IA**: debería bajar en las frases de personas.

## 8. Pendientes

- [ ] Subir lo del paso 5 y confirmar la lista de la sección 6.
- [ ] Paso 6: prender los interruptores de a uno, en el orden de la sección 4.
- [ ] **Frases ambiguas** (`laptops`): por ahora siguen a la IA y a la búsqueda de productos como hoy; mostrar además a quien lo vende (la decisión 9.3) queda para una entrega aparte.
- [ ] Acciones directas que hoy resuelve la IA (`quiénes somos`, `explorar zona`) y la matriz de categorías: sin tocar.
- [ ] Revisar el error latente de `usuarios.motor` en `event-controller.js` (rama `BUSCAR_PERSONA`): no se activa, pero sigue ahí.
- [ ] Alinear con `BITACORA-CONTRATO-UNICO-INTENCION.md` (10/11): la capa de intención hace el papel de su campo `objetivo`; `confianza` y la IA como respaldo siguen pendientes.
- [ ] Una letra sola ("inicial J" sola): ¿se queda pidiendo una segunda pista?
- [ ] ¿Se muestra el correo en resultados? (hoy se revisa que no salga).
- [ ] Paso 7: idiomas y revisar `BuscadorMotor.normalizar` (borra todo lo que no sea a-z y 0-9).
- [ ] Tope de 500 perfiles y 1000 productos del motor cuando la base crezca.

## 9. Cómo volver atrás

- **Sin publicar nada:** poner el interruptor en `false` (o `BusquedaPorCapas.interruptores.entrada = false`).
- **Quitar el paso 5 por completo:** restaurar `index.html`, `event-controller.js` y `panel-usuario-3.js` del zip del 14/11/2026 (pierdes también la corrección del `.or()`, que se puede repetir a mano con las 2 líneas de la bitácora 2).
- Sin cambios en Supabase.

## 10. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 14/11/2026 | Revisión del zip del 14/11/2026 | Faltaban los archivos de intención, la edición del `.or()` y los borrados |
| 14/11/2026 | Paso 5: conexión de las pantallas con interruptores apagados | 3 archivos modificados, 1 prueba nueva; 8 suites en verde; **falta subirlo y probarlo (paso 6)** |
