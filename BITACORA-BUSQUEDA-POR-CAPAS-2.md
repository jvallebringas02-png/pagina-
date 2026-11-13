> **Estado (13/11/2026): PASOS 1 A 4 HECHOS Y PROBADOS EN NODE. NINGUNA PANTALLA CONECTADA TODAVÍA.** Se crearon 4 archivos nuevos, se modificaron 5 existentes (cambios mínimos) y se agregaron pruebas. **`index.html` no se tocó.** **Nada se probó en un navegador real ni contra tu Supabase**: solo Node, un Supabase de mentira y una carga de scripts simulando el navegador (solo variables globales, sin `require`).

# Bitácora — Búsqueda por capas, entregas de los pasos 1 a 4

**Fecha:** 13/11/2026
**Continúa:** `BITACORA-BUSQUEDA-POR-CAPAS-1.md` (diseño del 12/11/2026)
**Zip de referencia:** el del 10/11/2026 (`pagina--main`). Todo se hizo sobre una copia de ese zip.

---

## 1. Qué se hizo

| Paso | Qué es | Archivo | Estado |
|---|---|---|---|
| 1 | Capa 0, limpieza | `js/modules/limpieza-busqueda.js` | Hecho; **subido por ti** |
| 2 | Capa 1, intención | `js/modules/intencion-busqueda.js` | Hecho; **subido por ti** |
| 3 | Entrada única que encadena las capas | `js/modules/busqueda-por-capas.js` | Hecho; **subido por ti** (el del paso 4 lo reemplaza) |
| 4 | Arreglos (inicial, "Armas", respaldo con `.or()`, pruebas en carpeta equivocada) | ver sección 3 | **Entregado; falta que lo subas** |
| 5 | Conectar las pantallas, con interruptores y respaldo | — | Pendiente |
| 6 | Probar en la página publicada (3 cuentas, computadora y celular) | — | Pendiente (tú) |
| 7 | Idiomas y textos en 15 idiomas | — | Después |

## 2. Qué hace cada pieza nueva

### `limpieza-busqueda.js` (capa 0)
`LimpiezaBusqueda.limpiar(texto)` devuelve `original`, `limpio`, `comparable`, `paraRiesgo`, `recortado` y `vacio`.
- `limpio` (para buscar): sin invisibles ni espacios de sobra, tope de 200 caracteres, sin `, ( ) % _ " \ * ` < > { }`. Conserva el guion, el apóstrofe y el `@usuario` completo (con su guion bajo).
- `comparable`: el limpio en minúsculas y sin tildes.
- `paraRiesgo`: el comparable sin guiones, apóstrofes ni puntos, solo para la lista de riesgo (`co-caina` pasa a `cocaina`).
- Las letras repetidas se reducen solo desde 3 en adelante ("holaaaaa" pasa a "holaa"); los números no se tocan.
- **No borra letras de otros alfabetos** (probado con chino, ruso, árabe y japonés).
- No quita palabras de relleno ("quien", "personas"): son pistas para la intención.

### `intencion-busqueda.js` (capa 1)
`IntencionBusqueda.decidir(texto, contexto)` devuelve: `directa` (hora, reclamo, contacto con el administrador, quiénes somos, explorar zona), `principal` (`personas`, `productos` o `ia`), `secundaria`, `ambigua`, `orden`, `ubicacionPropia`, `pistas` y `razon`.
- Con `superficie: 'personas'` (Buscar Personas, Compartir, Mensajes) siempre es personas.
- `ia` significa que ninguna regla reconoció la frase y decide la IA como hoy (videos, música, web, publicar, conversación).
- Frases ambiguas: se muestran ambas cosas (decisión por defecto de la sección 6). Ejemplo: `laptops` da productos y, aparte, quien lo vende.
- Las reglas viven en `REGLAS.es`; los otros idiomas se agregan en el paso 7 sin tocar el resto.
- Una prueba de paridad carga las líneas originales de `buscador.js` y compara 45 frases con las reglas nuevas: coinciden en acción directa, orden y ubicación propia.
- **No incluye** `detectarIntencionMatriz` (necesita el catálogo); queda donde está hasta el paso 5.

### `busqueda-por-capas.js` (entrada única)
`BusquedaPorCapas.procesar(frase, contexto)` y `BusquedaPorCapas.buscarPersonas(frase, contexto)` (esta última siempre en personas) devuelven siempre la misma forma: `{ version, texto, intencion, accion, directa, personas, respaldo, error }`.
- `accion`: `personas`, `productos`, `ia`, `directa`, `vacia` o `descartada` (llegó una búsqueda más nueva en el mismo canal).
- Si hay que buscar personas, llama a la capa de datos del motor existente (`MotorBusquedaPersonasDatos.buscar`), con su caché, su bloqueo y su descarte de respuestas tardías.
- **Interruptores:** `BusquedaPorCapas.interruptores.entrada`, `.intencion` y `.limpieza` (todos `true`). Con `entrada` en `false` devuelve `respaldo: true` y la pantalla usa el código de siempre. Si el motor lanza un error o rechaza la promesa, también devuelve `respaldo: true` con el motivo.
- Lista de riesgo con trucos de escritura: si `paraRiesgo` es de riesgo alto y el comparable no, se le da al motor la versión sin guiones y el motor la bloquea por su camino normal. El texto mostrado sigue siendo el original.
- `contexto.permitirApellidos === true` deja buscar un apellido como "Armas". Por defecto es `false`.

## 3. Cambios en archivos existentes (paso 4)

| Archivo | Cambio |
|---|---|
| `js/modules/interprete-busqueda-personas.js` | +7 líneas. Regla `0c`: "con inicial J", "iniciales J P", "nombre empieza con M", "que empiece con la letra J", "cuyo nombre comience con A y B" pasan a `ficha.iniciales`. |
| `js/modules/motor-busqueda-personas.js` | 1 línea: `buscarBase` pasa `permitirApellidos` al intérprete. |
| `js/modules/motor-busqueda-personas-datos.js` | 2 líneas: `buscar` pasa `opciones.permitirApellidos` al motor (y su comentario). |
| `js/modules/panel-usuario-3.js` | **Edición manual**, cerca de la línea 1323 (respaldo viejo de `buscarUsuariosPorNombre`): el texto se limpia antes de armar el filtro `.or()`. 5 líneas agregadas, 2 quitadas. |
| `pruebas/interprete-busqueda-personas.test.js`, `pruebas/motor-busqueda-personas.test.js` | Pruebas nuevas (14 y 8 líneas). |

**Limpieza de carpetas (hallazgo 2 de la bitácora 1):** `motor-busqueda-personas-datos.test.js` y `motor-busqueda-personas-ayuda.test.js` pasan a `pruebas/`. Se borran de `js/modules/` las cuatro pruebas (también `interprete-busqueda-personas.test.js` y `motor-busqueda-personas.test.js`, que eran copias más viejas que las de `pruebas/`) y la copia sin uso `pruebas/interprete-busqueda-personas.js`, idéntica al intérprete.

**Efecto sobre la inicial:** una letra sola ("usuarios con inicial J") sigue pidiendo una segunda pista (regla que ya existía para no listar a todos). Con lugar u oferta sí filtra ("usuarios de Callao con inicial J" encuentra a Juan).

## 4. Resultados de las pruebas (Node)

| Suite | Resultado |
|---|---|
| `limpieza-busqueda.test.js` | 53 de 53 |
| `intencion-busqueda.test.js` | 191 de 191 |
| `busqueda-por-capas.test.js` | 44 de 44 |
| `interprete-busqueda-personas.test.js` | 187 de 187 (eran 175) |
| `motor-busqueda-personas.test.js` | 95 de 95 (eran 89) |
| `motor-busqueda-personas-datos.test.js` | 17 de 17 |
| `motor-busqueda-personas-ayuda.test.js` | 40 de 40 |

Además: carga de los 6 scripts como en el navegador (solo variables globales, sin `require`) y la frase `busca quien venda laptops` devolvió a "Juan Pérez".

## 5. Hallazgos de la revisión del código (13/11/2026)

Corrigen o precisan lo dicho en la bitácora 1:

1. **Las comas y paréntesis no rompen el motor nuevo.** El motor trae los perfiles con `select('*').limit(500)` y filtra en el navegador. El riesgo estaba solo en el **respaldo viejo** (`panel-usuario-3.js`, `.or()` con la primera palabra y la primera letra sin limpiar). Ya está tapado (sección 3).
2. **Las funciones de intención son más de cuatro:** en `buscador.js` hay seis `detectarIntencion*` sueltas (ExplorarLocalidad, QuienesSomos, Reclamo, ContactoAdmin, Orden, UbicacionPropia), `detectarPreguntaHora` y `BuscadorMotor.detectarIntencionMatriz`. Orden real hoy: hora, matriz (no en el panel), idioma, reclamo, contacto; luego la IA; y después quiénes somos gana a explorar zona.
3. **Cuatro pruebas** (no dos) estaban en `js/modules/`, y las de intérprete y motor eran copias más viejas.
4. **`BuscadorMotor.normalizar` borra todo lo que no sea a-z y 0-9:** `北京 手机`, `Москва ноутбук` y `مرحبا` quedan vacíos. **No se puede reutilizar como limpieza compartida** (rompería los 15 idiomas) y habrá que revisarla en el paso 7.
5. **La lista de riesgo dejaba pasar `co-caina`** (con guion). Con `paraRiesgo` se bloquea. `cocaína`, `c.o.c.a.i.n.a`, `armas` y `quien vende a r m a s` ya se bloqueaban.
6. **Tope de escala:** el motor trae como máximo 500 perfiles y 1000 productos y busca en el navegador. Con 9 personas no importa, pero pasado ese tope la búsqueda no daría error y no encontraría a las personas de más. Pendiente para cuando crezca.
7. **Error latente** (`event-controller.js`, rama `BUSCAR_PERSONA`): usa `usuarios.motor` cuando `usuarios` puede ser nulo. Hoy la función siempre devuelve una lista, así que no se activa. Revisar en el paso 5.
8. **El motor encuentra por categoría:** `quien vende celulares` devolvió a quien publicó una laptop de la misma categoría. Es comportamiento del motor existente (no de las capas) y conviene mirarlo con datos reales.
9. **Una pantalla de personas no es solo Buscar Personas:** Compartir y Mensajes también usan `superficie: 'personas'`. `permitirApellidos` es una opción aparte que debe pasarse en `true` solo desde Buscar Personas.

## 6. Decisiones

**Tomadas por ti (bitácora 1):** el buscador principal, el asistente y Buscar Personas usan el mismo algoritmo, por capas, para todos los lugares de búsqueda. En esta sesión pediste hacer los pasos 1 a 6 en una sola entrega (sin idiomas) y subiste los pasos 1, 2 y 3.

**Tomadas por defecto (según mi recomendación; no las rechazaste y puedes cambiarlas):**
- Frase ambigua: se muestran ambas cosas (`laptops` da productos y, aparte, quien lo vende).
- "Armas" como apellido: permitido solo en Buscar Personas, por opción explícita.
- `gente de mi zona` / `usuarios de mi zona` **ya no se desvían a la matriz de zona** cuando la frase pide personas con claridad (hoy sí, cuando la IA la marca como persona). Es una diferencia a propósito con el comportamiento actual.

## 7. Pendientes

- [ ] Que subas los cambios del paso 4 (sección 3) y confirmes que la página carga y que Buscar Personas responde como antes.
- [ ] Paso 5: cargar los 3 archivos nuevos en `index.html` y conectar Buscar Personas, el buscador principal, el asistente y el chat del panel, uno por uno, con interruptores apagables y el código viejo como respaldo.
- [ ] Revisar el error latente de `usuarios.motor` (hallazgo 7).
- [ ] Decidir si se muestra el correo en resultados (hoy se revisa que no salga).
- [ ] Una letra sola ("inicial J" sola): ¿se queda pidiendo una segunda pista o se permite listar?
- [ ] Paso 6, con 3 cuentas (sin sesión, la tuya y otra), en computadora y celular.
- [ ] Paso 7: idiomas, reglas por idioma (`REGLAS.es` ya está preparado) y revisar `BuscadorMotor.normalizar`.
- [ ] Función SQL con bloqueo en ambos sentidos, privacidad de mensajes, estado de cuenta, servicios y donaciones (siguen sin datos y quedan para después).

## 8. Lo que NO está probado

- **Ninguna pantalla usa todavía las capas**: la página se comporta exactamente igual que antes.
- Todo se probó con Node y un Supabase de mentira (9 personas ficticias). **No se probó contra tu Supabase real**, ni sus reglas de seguridad (RLS), ni la vista `perfiles_publicos`, ni la IA (Groq y `chat-ia`), ni tu página en Vercel, ni un navegador real, ni el celular.
- Nadie probó todavía la edición manual de `panel-usuario-3.js` en la página publicada (sí se comprobó su sintaxis, el diff y la expresión con textos peligrosos).

## 9. Cómo volver atrás

- **Archivos nuevos** (`limpieza-busqueda.js`, `intencion-busqueda.js`, `busqueda-por-capas.js` y sus pruebas): se borran sin afectar la página, porque ningún `<script>` los carga todavía.
- **Archivos modificados** (intérprete, motor, datos y `panel-usuario-3.js`): se restauran con las versiones del zip del 10/11/2026. Los cambios son de 1 a 7 líneas cada uno.
- Sin cambios en Supabase.

## 10. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 13/11/2026 | Revisión del código del zip del 10/11/2026 | Hallazgos de la sección 5 |
| 13/11/2026 | Paso 1: capa de limpieza | Archivos nuevos; 53/53; subido por ti |
| 13/11/2026 | Paso 2: capa de intención | Archivos nuevos; 191/191; subido por ti |
| 13/11/2026 | Paso 3: entrada única con interruptores y respaldo | Archivos nuevos; 39 pruebas (44 con el paso 4); subido por ti |
| 13/11/2026 | Paso 4: inicial, "Armas", respaldo con `.or()`, pruebas en su carpeta | 5 archivos modificados, 2 pruebas movidas, 5 archivos por borrar; 7 suites en verde; **falta que lo subas** |
