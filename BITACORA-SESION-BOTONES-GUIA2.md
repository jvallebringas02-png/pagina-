> **Estado: RESUELTO** — `obtenerMensajeGuia()` ya está escrita en `js/i18n.js` con las 4 claves en los 17 idiomas (sección 8). Validado con `node --check`, cobertura de idiomas por script y una prueba funcional aislada de la función -- falta solo probarlo en el sitio en vivo después de subir el archivo (punto 3 de la sección 8.4).

# Bitácora — Bug en los botones de guía del panel lateral ("Ver mi zona", "Lo último publicado", "Buscar algo")

Este documento resume el diagnóstico hecho en esta sesión, antes de tocar código. Sigue el mismo formato que `BITACORA-TRADUCCION.md`, para que cualquier conversación futura (esta u otra) pueda retomar el tema sin perder contexto.

**Fecha:** 25/09/2026

---

## 1. Síntoma reportado

Al hacer clic en los botones del panel lateral **"Ver mi zona"** y **"Lo último publicado"**, no pasa nada visible — el usuario reporta que antes funcionaban.

## 2. Causa raíz encontrada (confirmada leyendo el código, no solo suponiendo)

En `js/modules/event-controller.js`, la función `ejecutarAccionGuia(tipo)` — la que manejan estos botones — llama a una función `obtenerMensajeGuia(...)` que **no existe en ningún archivo del proyecto**. Se buscó en todo el repo (`grep -rn "obtenerMensajeGuia"`) y solo aparece en los *llamados*, nunca en una *definición*.

Como JavaScript corta la ejecución apenas encuentra una función indefinida, y esa llamada es la primera línea dentro de cada rama del `if`, **el resto del código de esa rama nunca se ejecuta** — por eso no se ve nada, ni siquiera un error visible en pantalla (solo en la consola del navegador).

### Líneas exactas afectadas (`event-controller.js`, dentro de `ejecutarAccionGuia`)
```js
} else if (tipo === 'zona') {
    UIController.mostrarRespuestaIA(obtenerMensajeGuia('zona'));       // <- revienta aquí
    var matrizGuia = BuscadorMotor.obtenerMatrizPorLocalidad();         // nunca se llega a ejecutar
    UIController.mostrarMatrizLocalidad(matrizGuia);
} else if (tipo === 'recientes') {
    UIController.mostrarRespuestaIA(obtenerMensajeGuia('recientes'));  // <- revienta aquí
    ...
    query: obtenerMensajeGuia('novedades_label'), ...                  // segunda llamada rota
} else if (tipo === 'buscar') {
    UIController.mostrarRespuestaIA(obtenerMensajeGuia('buscar'));     // <- revienta aquí también
    ...
```

### Botones afectados (3, no solo los 2 reportados)
| Botón | Tipo | ¿Roto? |
|---|---|---|
| Ver mi zona | `zona` | Sí — reportado |
| Lo último publicado | `recientes` | Sí — reportado |
| Buscar algo | `buscar` | Sí — no reportado, pero mismo bug |
| ¿Cómo publico? | `publicar` | No usa `obtenerMensajeGuia`, no está afectado |
| Categorías | `categorias` | No usa `obtenerMensajeGuia`, no está afectado |
| Mundial | `mundial` | No usa `obtenerMensajeGuia`, no está afectado |

## 3. Por qué pasó (contexto, no para culpar a nadie)

`BITACORA-TRADUCCION.md` (la bitácora de traducción, sección "Mapa de archivos") ya menciona esta función como si existiera: *"`event-controller.js` -> Usa `obtenerMensajeGuia()` para los mensajes de guía"*. Es decir, estaba **planeada** como parte del trabajo de traducción de los mensajes de guía de estos botones, se llegó a referenciar en `event-controller.js`, pero **nunca se llegó a escribir** en `i18n.js`. Quedó a mitad de camino entre dos sesiones de trabajo.

## 4. Verificaciones ya hechas (para no repetirlas)

- Sin errores de sintaxis en ningún archivo del proyecto (`node --check` limpio en los 20 archivos JS).
- Las funciones de las que sí depende cada botón (`obtenerMatrizPorLocalidad`, `mostrarMatrizLocalidad`, `obtenerRecientes`, `mostrarResultadosBusqueda`) sí existen y están bien escritas -- el problema es exclusivamente la función faltante.
- Se descartó que sea un problema de despliegue (Vercel/GitHub desactualizado) -- es un bug real en el código fuente, confirmado leyendo el ZIP más reciente que subió el usuario.

## 5. Qué falta hacer (el plan, antes de escribir el código)

1. **Crear `obtenerMensajeGuia(tipo)` en `js/i18n.js`**, siguiendo el mismo patrón que las demás funciones de idioma (lee `idiomaDetectado`, devuelve el texto de un diccionario, con `'es'` como respaldo si el idioma no está).
2. **Definir el mensaje para cada `tipo` usado**, en los 17 idiomas:
   - `'zona'` -> algo como *"Aquí tienes lo que hay disponible cerca de ti"*
   - `'recientes'` -> *"Esto es lo último que se publicó"*
   - `'novedades_label'` -> una etiqueta corta para el encabezado de resultados (ej. *"Lo más reciente"*), ya que se usa como `query` en `mostrarResultadosBusqueda`, no como mensaje de chat
   - `'buscar'` -> *"Escribe arriba lo que estás buscando"*
3. **No tocar la lógica de `ejecutarAccionGuia`** -- el resto de la función ya está bien escrito, el único problema es la pieza faltante.
4. Después de escribir la función, **probar los 3 botones** (zona, recientes, buscar) para confirmar que ahora sí se completa la ejecución hasta el final.

## 6. Cómo se relaciona con los pendientes ya anotados en `BITACORA-TRADUCCION.md`

Este bug es, en la práctica, uno de los pendientes que ya estaban implícitos en esa bitácora (el "Mapa de archivos" ya prometía esta función). No es un pendiente nuevo de la lista de la sección 5 de `BITACORA-TRADUCCION.md`, pero está directamente relacionado con "textos fijos que faltan agregar al diccionario", que es la misma categoría de trabajo.

---

## 7. Otros pendientes detectados en esta sesión (no son este bug, pero quedaron anotados para no perderlos)

- **El artículo central "La importancia de la economía circular"** (`ContenidoInfo.mostrarEnMuro`) no está predefinido como el resto de la interfaz -- depende de una carga en vivo a Supabase y, si no hay fila en la base de datos, traduce con IA **cada vez** sin cachear nunca. Se propuso pasarlo a `UI_TRANSLATIONS` (predefinido), igual que el pie de página, ya que es texto corto e institucional que casi no cambia. **Estado: propuesto, no implementado todavía.**
- Los pendientes ya listados en `BITACORA-TRADUCCION.md` (sección 5) siguen abiertos: acortar el `PROMPT_BASE` del servidor, replicar la traducción de productos en `panel-usuario-1.js` (feed de usuarios logueados), quechua/aymara como idiomas emblemáticos, y el bug de "Tool call validation failed" en la búsqueda de internet/YouTube (este último vive en la función Edge de Supabase, fuera del alcance de este repositorio).

---

## 8. Plan detallado de implementación (escrito antes de tocar código, para que otra sesión pueda revisarlo o retomarlo)

### 8.1 La función — mismo patrón que `textoUI()`

Reutiliza el mecanismo que ya existe (`textoUI(clave, porDefecto)`, líneas 344-350 de `i18n.js`) en vez de inventar uno nuevo. Va pegada justo debajo de esa función, mismo archivo, mismo estilo:

```js
function obtenerMensajeGuia(tipo) {
    var claves = { zona: 'guia_zona', recientes: 'guia_recientes', novedades_label: 'guia_novedades_label', buscar: 'guia_buscar' };
    var clave = claves[tipo];
    if (!clave) return '';
    return textoUI(clave, UI_TRANSLATIONS.es[clave] || '');
}
```

### 8.2 Las 4 claves nuevas, en los 17 idiomas

Prefijo `guia_` a propósito, para no confundirlas con `quick_zona` y compañía (que son el *texto del botón*, no el *mensaje que aparece al hacer clic* -- son cosas distintas aunque hablen de lo mismo).

| Clave | Para qué | Texto en español (borrador) |
|---|---|---|
| `guia_zona` | Mensaje de chat antes de mostrar la matriz de "tu zona" | "📍 Aquí tienes lo que hay disponible cerca de ti." |
| `guia_recientes` | Mensaje de chat antes de mostrar lo último publicado | "🆕 Esto es lo último que se publicó." |
| `guia_novedades_label` | Etiqueta corta del encabezado de resultados -- no es mensaje de chat, es el `query` que se muestra como título en `mostrarResultadosBusqueda` | "Lo más reciente" |
| `guia_buscar` | Mensaje de chat al pulsar "Buscar algo", antes de darle foco a la barra de búsqueda | "🔎 Escribe arriba lo que estás buscando." |

Cada clave se inserta dentro del bloque de cada uno de los 17 idiomas en `UI_TRANSLATIONS`, con la misma técnica ya usada para `banner_ia` en la sesión de traducción anterior: insertar por posición dentro del objeto existente, no reescribir el archivo entero, para no arriesgar nada de lo que ya está.

**Salvedad de siempre para quechua y aimara:** traducción de buena fe, no de hablante nativo -- entra en la misma revisión pendiente que ya acumulan las demás traducciones qu/ay de este proyecto (ver `BITACORA-TRADUCCION.md`, sección "Qué falta").

### 8.3 Lo que NO se toca

`ejecutarAccionGuia` en `event-controller.js` queda intacta -- confirmado en la sección 2 de esta bitácora, el problema nunca fue esa función, solo la pieza faltante que llamaba.

### 8.4 Validación después de escribirlo

1. `node --check js/i18n.js` -- sin errores de sintaxis.
2. Extracción aislada de `UI_TRANSLATIONS` (fuera del navegador, con Node) para confirmar que las 4 claves nuevas existen en los 17 idiomas -- ninguno debe quedar sin alguna de las 4.
3. Probar en el sitio los 3 botones afectados (Ver mi zona, Lo último publicado, Buscar algo) y confirmar que ahora sí aparece el mensaje de chat correspondiente y se completa la acción (matriz de zona / lista de recientes / foco en la barra).

---

## 9. Próximo paso

Escribir `obtenerMensajeGuia()` en `i18n.js` con los 4 textos en los 17 idiomas (sección 8 de esta bitácora), y probar los 3 botones afectados.
