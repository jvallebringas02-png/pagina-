> **Estado (24/10/2026): PASO 1 DE 7 SUBIDO, SIN PROBAR EN NAVEGADOR. SOLO "BUSCAR PERSONAS" USA EL MOTOR.** Las demás pantallas siguen con la búsqueda de siempre. Probado únicamente con Node y un navegador simulado; **nada se probó en un navegador real ni contra tu Supabase real.**

# Bitácora — Conexión de las pantallas al motor de búsqueda de personas (parte 1)

**Fecha:** 24/10/2026
**Continúa:** `BITACORA-MOTOR-BUSQUEDA-PERSONAS-ETAPAS-2-Y-3.md` (motor, datos y sección 10 con lo hecho en la segunda sesión)
**Idea:** que **todas** las pantallas que buscan personas usen el **mismo motor**. Una frase como "quien vende piano en mi ciudad" debe dar las mismas personas en cualquier pantalla. Lo único que cambia entre pantallas es **cómo se dibuja** el resultado.

---

## 1. Dónde estamos

| Pantalla | ¿Usa el motor? | Cómo busca hoy |
|---|---|---|
| **Buscar personas** (panel) | ✅ Sí (subido, falta probar) | Frases, etiquetas con ✕, avisos, ofertas |
| **Compartir** | ❌ No | Nombre, apellido o iniciales; botones Local/Regional/País; filtro de rubro |
| **Nuevo mensaje** | ❌ No | Igual que Compartir |
| **Chat del panel** | ❌ No | Búsqueda vieja |
| **Asistente y buscador principal** (página principal) | ❌ No | Acción `BUSCAR_PERSONA`: manda solo `datos.nombre` |
| **Botones de zona de los resultados** (página principal) | ❌ No | Vuelven a llamar a la búsqueda vieja con el último nombre |

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
| 2 | Conectar **Compartir** y **Nuevo mensaje**, versión compacta | Claude | `panel-usuario-3.js` | ⬜ |
| 3 | Subir y probar con 2 cuentas | Tú | — | ⬜ |
| 4 | Conectar el **chat del panel** | Claude | `panel-usuario-3.js` (quizá `panel-usuario-2.js`) | ⬜ |
| 5 | Conectar **asistente y buscador principal**: pasar la frase completa (`queryOriginal`) al motor; dibujar etiquetas, avisos y ofertas | Claude | `event-controller.js`, `ui-controller.js` | ⬜ |
| 6 | Conectar los **botones de zona** de resultados | Claude | `ui-controller.js` | ⬜ |
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
