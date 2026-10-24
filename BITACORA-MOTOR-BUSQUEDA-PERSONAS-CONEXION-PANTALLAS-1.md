> **Estado (24/10/2026, actualizado): TODAS LAS PANTALLAS ESTÁN CONECTADAS EN EL CÓDIGO (pasos 2, 4, 5 y 6 hechos). Falta subir los 3 archivos nuevos y probar en navegador real (pasos 3 y 7).** Probado únicamente con Node y un navegador simulado; **nada se probó en un navegador real ni contra tu Supabase real.**

# Bitácora — Conexión de las pantallas al motor de búsqueda de personas (parte 1)

**Fecha:** 24/10/2026
**Continúa:** `BITACORA-MOTOR-BUSQUEDA-PERSONAS-ETAPAS-2-Y-3.md` (motor, datos y sección 10 con lo hecho en la segunda sesión)
**Idea:** que **todas** las pantallas que buscan personas usen el **mismo motor**. Una frase como "quien vende piano en mi ciudad" debe dar las mismas personas en cualquier pantalla. Lo único que cambia entre pantallas es **cómo se dibuja** el resultado.

---

## 1. Dónde estamos

| Pantalla | ¿Usa el motor? | Cómo busca hoy |
|---|---|---|
| **Buscar personas** (panel) | ✅ Sí (subido, falta probar) | Frases, etiquetas con ✕, avisos, ofertas |
| **Compartir** | ✅ Sí (código listo, falta subir) | Compacto; si no hay nadie y era solo un nombre, sigue el flujo viejo de "interesados en…"; el filtro de rubro sigue aparte |
| **Nuevo mensaje** | ✅ Sí (código listo, falta subir) | Igual que Compartir |
| **Chat del panel** | ✅ Sí (código listo, falta subir) | Frase completa + respaldo con el nombre del asistente |
| **Asistente y buscador principal** (página principal) | ✅ Sí (código listo, falta subir) | Acción `BUSCAR_PERSONA`: ahora manda la frase completa; si no sale nadie, reintenta con `datos.nombre` |
| **Botones de zona de los resultados** (página principal) | ✅ Sí (código listo, falta subir) | Repiten la frase completa de la búsqueda anterior |

Todas llaman a la misma función, `buscarUsuariosPorNombre` (`panel-usuario-3.js`). El interruptor `usarMotor` (tercer parámetro, apagado por defecto) ya existe: **solo "Buscar personas" lo enciende.**

## 2. Qué es igual y qué cambia entre pantallas

**Igual en todas (porque es el mismo motor):** interpretación de la frase, reglas de bloqueados y alertas, zona, tipo de oferta, personas que salen y su orden, avisos ("Todavía no hay servicios publicados") y que **nunca** se muestra el correo.

**Cambia según la pantalla (solo el dibujo):**

| Pantalla | Cómo se vería |
|---|---|
| Buscar personas | Completo: etiquetas con ✕, avisos, tarjetas con ofertas (hecho) |
| Compartir y Nuevo mensaje | Compacto: ventana pequeña, lista corta, una línea "Entendí" |
| Chat | Respuesta del asistente con las personas debajo |
| Muro / página principal | Con el dibujo propio de `UIController.mostrarResultadosPersonas` |

## 3. Lo verificado en el código (24/10/2026)

- **Compartir y Nuevo mensaje** comparten la función `buscarPersonaPicker(q, contexto)` (contextos `'compartir'` y `'nuevoMsj'`). Se conectan juntas.
- **No existe "grupo"** en ningún archivo. Compartir y el chat solo eligen **una persona**. Compartir con varias personas o con un grupo **no existe hoy** y sería una función nueva.
- **Filtro de rubro de Compartir** (`filtrarCompartirPorRubro`, `buscarUsuariosCompartir`): el motor no lo conoce. Hay que decidir si queda aparte o se vuelve un criterio del motor.
- **Asistente / buscador principal** (`event-controller.js`, rama `BUSCAR_PERSONA`): llama a `buscarUsuariosPorNombre(datos.nombre)`. Si no hay resultado, prueba `consultarAsistenteCompartir` + `buscarUsuariosCompartir` (lógica vieja). Dibuja con `UIController.mostrarResultadosPersonas`.
- **Botones de zona de resultados** (`ui-controller.js`, `filtrarResultadosPersonasPorZona`): vuelven a buscar con `buscarUsuariosPorNombre(nombre, nivel)`.
- **Quién decide que algo es "buscar persona":** el asistente, con la acción `BUSCAR_PERSONA`. Esa decisión se toma en la función del servidor `chat-ia`, que **no estaba en el zip**. No se pudo comprobar que use esa acción con frases como "quien vende piano".

## 4. Plan en 7 pasos

Cada paso se prueba antes del siguiente. Si algo falla, se sabe cuál fue.

| # | Paso | Quién | Archivos | Estado |
|---|---|---|---|---|
| 1 | Probar "Buscar personas" ya subida y contar qué se ve | Tú | — | ⏳ **Pendiente** |
| 2 | Conectar **Compartir** y **Nuevo mensaje**, versión compacta | Claude | `panel-usuario-3.js` | ✅ Hecho (sin probar en navegador) |
| 3 | Subir y probar con 2 cuentas | Tú | — | ⏳ Pendiente |
| 4 | Conectar el **chat del panel** | Claude | `panel-usuario-3.js` | ✅ Hecho (sin probar en navegador) |
| 5 | Conectar **asistente y buscador principal**: pasar la frase completa (`queryOriginal`) al motor; dibujar etiquetas, avisos y ofertas | Claude | `event-controller.js`, `ui-controller.js` | ✅ Hecho (sin probar en navegador) |
| 6 | Conectar los **botones de zona** de resultados | Claude | `ui-controller.js` | ✅ Hecho (sin probar en navegador) |
| 7 | Probar todo con 3 cuentas (sin sesión, la propia y otra), en computadora y celular | Tú | — | ⬜ |

**Opcionales (después de los 7):** textos en los 15 idiomas (hoy los avisos y etiquetas están en español dentro del motor); "Ver más" (el motor trae máximo 20 y no recibe desplazamiento); función `personas_ocultas()` en Supabase para ocultar también a quien te bloqueó (hoy solo se oculta a quien tú bloqueaste).

## 5. Paso 1: qué probar (Ctrl+F5 antes, para no usar archivos viejos)

En Panel de usuario → **Buscar personas**, con sesión iniciada:

| Escribe | Debe pasar |
|---|---|
| `quien vende piano en mi ciudad` | Aparece "🤖 Entendí:" con etiquetas (Tipo, Ofrece, Zona) y, si hay coincidencias, tarjetas |
| `quien da clases de piano` | "Todavía no hay servicios publicados" |
| Un nombre que exista | Tarjeta con nombre y, si lo tiene, @usuario |
| Clic en la ✕ de una etiqueta | Busca otra vez sin ese criterio |
| Solo el botón 📍 Local, sin texto | Lista a la gente de tu zona; si no tienes localidad, pide definirla |

**Si falla:** abrir consola (F12 → Console) y copiar el mensaje rojo.
- "Motor de búsqueda de personas falló…" → la pantalla ya cayó a la búsqueda de siempre; algo de Supabase no coincide (por ejemplo una columna).
- No aparece "Entendí:" → `index.html` no se actualizó o el navegador usa la versión vieja.

## 6. Pendientes de confirmar antes de seguir

- [ ] Que `perfiles_publicos` **no trae correo ni teléfono**: la capa de datos la lee con `select('*')`.
- [ ] Qué columnas tiene realmente `perfiles_publicos` (`pais`, `nombre_usuario`, `created_at`). Si faltan, no se rompe, pero la ubicación por país y el orden por recientes pierden precisión.
- [ ] Cuántas personas y publicaciones reales hay, para saber si los resultados son los esperados.
- [ ] Decidir qué hacer con el **filtro de rubro** de Compartir.
- [ ] Decidir si se quiere **compartir con varias personas o grupos** (función nueva, otra etapa).
- [ ] Revisar con quien mantiene `chat-ia` que la acción `BUSCAR_PERSONA` se use con frases largas.
- [ ] Las decisiones 1 a 10 de la tabla de la sección 5 de la bitácora anterior siguen sin un "sí" explícito (en especial la 1: alertas medio/alto excluidas, y la 5: lo mundial cuenta en "mi región").

## 7. Límites y riesgos

- **Filtrado en el navegador:** con pocas personas y publicaciones funciona. Con cientos de personas hará falta una función SQL con límites.
- **No es una barrera de seguridad:** la lista de riesgo es un freno; la protección real va al publicar y en los reportes.
- **Datos de lectura amplia:** la capa de datos trae hasta 500 perfiles y 1000 publicaciones al navegador.
- **Segunda mano** depende de que quien publica lo escriba; un campo "nuevo/usado" en el formulario lo resolvería.
- **Todo probado con Node y datos de ejemplo.**

## 8. Cómo volver atrás

- **Todo el motor:** quitar de `index.html` las 3 líneas `<script>` nuevas (intérprete, motor y capa de datos). Sin el motor cargado, "Buscar personas" usa el código de siempre.
- **Una pantalla:** quitar la llamada con `usarMotor = true` en esa pantalla. Cada pantalla conserva la búsqueda vieja como respaldo, también cuando el motor lanza un error.

## 9. Archivos del paso 1 (ya subidos)

| Archivo | Dónde | Acción |
|---|---|---|
| `index.html` | raíz | Reemplazado |
| `panel-usuario-1.js` | `js/modules/` | Reemplazado |
| `panel-usuario-3.js` | `js/modules/` | Reemplazado |
| `motor-busqueda-personas.js` | `js/modules/` | Reemplazado |
| `motor-busqueda-personas-datos.js` | `js/modules/` | Nuevo (reconstruido, ver nota) |

> **Nota:** `motor-busqueda-personas-datos.js` se reconstruyó porque no venía en el zip. Si conservas el original, compáralo.

## 10. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 24/10/2026 | Paso 1: "Buscar personas" conectada al motor y subida | Pruebas en Node: 142 + 86 + 17 pasan; falta probar en navegador |
| 24/10/2026 | Revisión de Compartir, Nuevo mensaje, chat, asistente y botones de zona | No existen grupos; el asistente manda solo el nombre; la decisión de "buscar persona" vive en `chat-ia` (no revisada) |
| 24/10/2026 | Esta bitácora | Plan de 7 pasos definido; solo el paso 1 está hecho |

## 11. Segunda entrega: pasos 2, 4, 5 y 6 (24/10/2026)

**Archivos a reemplazar** (los otros ya los subiste en el paso 1):

| Archivo | Dónde | Qué cambió |
|---|---|---|
| `panel-usuario-3.js` | `js/modules/` | `buscarPersonaPicker` (Compartir y Nuevo mensaje) usa el motor; helpers nuevos `_motorPersonasListo`, `buscarPersonasDesdeAsistente`, `_entendiMotorHtml`, `_pintarPickerMotor`; chat del panel y `renderResultadosPersonasEnFeed` dibujan etiquetas, avisos, @usuario y ofertas |
| `event-controller.js` | `js/modules/` | Rama `BUSCAR_PERSONA` pasa la frase completa (`queryOriginal`) al motor |
| `ui-controller.js` | `js/modules/` | `mostrarResultadosPersonas` dibuja "Entendí", avisos, mensaje del motor y ofertas; los botones de zona repiten la frase completa |

**Cómo se comporta cada pantalla**
- **Compartir y Nuevo mensaje:** línea compacta "🤖 Entendí: …" y la lista con @usuario y la primera oferta. Si no hay nadie y la frase pedía publicaciones (vende, da clases, precio, lugar…), se muestra el mensaje honesto del motor. Si no hay nadie y la frase era solo un nombre, sigue el flujo de siempre (la IA de Compartir: "interesados en…"). El **filtro de rubro** no cambió.
- **Chat del panel y asistente de la página principal:** se busca con la frase completa. Si no sale nadie y la frase no pedía publicaciones, se reintenta con el nombre que sacó el asistente (ej. "quiero hablar con Carlos Vega" → "Carlos Vega").
- **Botones de zona (página principal):** repiten la frase de la búsqueda anterior. Si la frase ya trae su propia zona ("en mi ciudad") o un lugar, esa manda sobre el botón.
- **Respaldo:** si el motor no está cargado o lanza un error, todas las pantallas usan la búsqueda de siempre.
- **Respuestas tardías:** cada pantalla tiene su propio canal; la respuesta vieja se descarta si ya hay una más nueva.

**Pruebas:** 142 + 86 + 17 pasan. Prueba de humo en Node con navegador simulado: selector con frase, con servicio (aviso "todavía no hay servicios"), con nombre y con nombre inexistente (cae al flujo viejo); asistente con frase y con respaldo; chat del panel con resultado y vacío; respuesta tardía descartada; HTML en títulos sale escapado. **No se pudo simular `ui-controller.js` completo ni `event-controller.js`** (dependen de muchas partes de la página): esas dos están revisadas por sintaxis y por lectura, no ejecutadas.

**Hallazgo (no es un error, es una decisión tuya ya registrada):** el apellido **"Armas"** está bloqueado por la lista de riesgo ("Carlos Armas" no se puede buscar). Existe el interruptor `permitirApellidos` en el intérprete, pero **ninguna pantalla lo activa**. Si quieres que se pueda buscar a personas con ese apellido, hay que decidirlo y activarlo.

**Pendientes después de probar:** textos en 15 idiomas, "Ver más", función `personas_ocultas()`, revisar que el asistente (`chat-ia`) use `BUSCAR_PERSONA` con frases largas, filtro de rubro de Compartir, grupos o varias personas (no existen hoy).

| Fecha | Cambio | Resultado |
|---|---|---|
| 24/10/2026 | Pasos 2, 4, 5 y 6: Compartir, Nuevo mensaje, chat del panel, asistente y botones de zona conectados al motor | Pruebas en Node correctas; falta subir y probar en navegador |
