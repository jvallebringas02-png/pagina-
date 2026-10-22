> **Estado (22/10/2026): CAMBIOS APLICADOS Y PROBADOS EN EL NAVEGADOR (prueba general y bloqueados: salió bien). Quedan pruebas puntuales sin hacer (ver sección "Pruebas").**

# Bitácora — Secuencia rara al reabrir, velocidad de la página y usuarios bloqueados

**Fecha:** 22/10/2026 · **Continúa:** `BITACORA-PARPADEO-SESION.md` (19/10) y `BITACORA-SESION-COLISION-SESIONES.md`

## 1. Qué se vio
Al cerrar la pestaña (sin cerrar sesión) y volver a entrar:
1. Aparecía la página de **invitado** (botón "Mi Cuenta", "Artículos Destacados" vacío).
2. Luego el panel con "Cargando publicaciones…".
3. Por último el muro.

Después de arreglarlo, el usuario reportó además que la página principal y el panel tardaban en cargar, y que no existía forma de ver ni desbloquear a los usuarios bloqueados.

## 2. Causas
1. **La sesión se preguntaba tarde.** `main.js` esperaba, una tras otra, la ubicación por IP (ipapi.co), los productos de Supabase y 100 productos de `dummyjson.com` ANTES de preguntar si había sesión. Mientras tanto el HTML mostraba el invitado.
2. **`sessionStorage` se borra al cerrar la pestaña.** Al volver solo quedaba la sesión de Supabase (en `localStorage`), consultada después de esas esperas.
3. **El catálogo de invitado también esperaba esas cargas**, aunque no usa esos productos.
4. **El muro pedía los autores uno por uno** (`await` dentro de un `for` en `renderItemsFeed`).
5. **`tesseract.js` y `jsQR`** se descargaban en todas las visitas aunque casi nadie sube fotos.
6. **El bloqueo era de un solo sentido:** se podía bloquear, pero no había lista ni opción de desbloquear.

## 3. Qué se cambió

### `index.html`
- Script en el `<head>`: si hay un token `sb-…-auth-token` en `localStorage`, pone la clase `con-sesion` en `<html>`. Con ella se oculta la página de invitado (`#publicView`) y el pie de página, y se muestra "Cargando tu cuenta…". Red de seguridad: a los 10 s sin panel se quita la clase.
- Se quitaron las etiquetas `<script>` de `tesseract.js` y `jsQR`.
- Botón nuevo **Usuarios bloqueados** en el menú del panel (`data-action="bloqueados"`).

### `js/main.js`
- La sesión se consulta primero. Si no hay sesión, se quita la clase `con-sesion`.
- Carga pesada (IP + productos + índice del buscador) en `iniciarCargaPesada()`, que corre una sola vez y no bloquea la sesión:
  - **Sin sesión:** empieza de inmediato, y el catálogo de invitado ya no la espera.
  - **Con sesión:** empieza cuando el muro ya se pintó (`window._feedListo`) o a los 8 s como máximo.
- Al terminar la IP se reaplica la ciudad guardada y se refresca la tarjeta "Tu Alcance" (`PanelUsuario.cargarLocalidad()`).
- `window._esperarCargaPesada(ms)`: para que buscador y asistente esperen la carga (máx. 5 s).

### `js/modules/event-controller.js`
- `manejarBusquedaPrincipal`, `manejarEnvioMensaje` y `ejecutarAccionGuia` esperan `_esperarCargaPesada(5000)` antes de usar el índice.

### `js/modules/panel-usuario-1.js`
- `renderItemsFeed`: autores y "me gusta" se piden **todos a la vez** (`Promise.all`).
- **Copia del muro** (`_primerFeed`, `_leerCacheFeed`, `_guardarCacheFeed`, `limpiarCacheFeed`): solo en la primera carga tras abrir/refrescar, se pinta la copia guardada (clave `remarket_feed_cache_<id>` en `localStorage`, máx. 24 h, máx. 400 KB) y luego se reemplaza por el muro nuevo. No se pisa si la persona está escribiendo dentro del muro. Publicar, bloquear o cambiar de página no usan la copia.
- `cargarBloqueados()` y `desbloquearUsuario()`; `menuClick('bloqueados')`.

### `js/modules/panel-usuario-2.js`
- `toggleBloqueado` borra la copia del muro al bloquear.

### `js/modules/auth-modales.js`
- La copia del muro se borra al cerrar sesión (`logout` y `updateUIForUser(null)`).

### `js/modules/panel-usuario-3.js`
- `cargarScriptExterno()`: `tesseract.js` y `jsQR` se descargan solo la primera vez que se sube una foto.

### Supabase
- `SQL-DESBLOQUEAR-USUARIOS.sql`: políticas para que cada persona vea y borre **sus propios** bloqueos. **Ejecutado** por el usuario. No activa ni desactiva RLS.

## 4. Pruebas simuladas (funciones de prueba, no navegador)
| Caso | Antes | Ahora |
|---|---|---|
| Panel con sesión | ~6,2 s | ~0,16 s |
| Catálogo de invitado | ~6,2 s | ~0,17 s |
| Muro, 10 autores (200 ms c/u) | 2000 ms | 202 ms |
| Refrescar el panel con copia guardada | spinner hasta el muro | muro de inmediato, luego se actualiza |
| Después de cerrar sesión | — | la copia se borra |

Los tiempos reales dependen de la red; la simulación solo prueba el orden del código.

## 5. Pruebas en el navegador
Hechas por el usuario:
- [x] Prueba general: cerrar la pestaña, volver a entrar y refrescar el panel. Se ve "Cargando tu cuenta…" y luego el panel, sin pasar por el invitado.
- [x] Entrar con otra cuenta (daniel): muestra su propio muro y su propia ciudad.
- [x] Usuarios bloqueados: se ve el botón, la lista y funciona Desbloquear (con el SQL ejecutado).

Pendientes (no se probaron):
- [ ] Publicar con foto: filtro de QR y lector de texto (ahora bajo demanda; la primera vez puede tardar más).
- [ ] Foto con QR de pago o enlace externo: debe rechazarse.
- [ ] Publicar algo nuevo: aparece arriba del muro, sin la copia vieja.
- [ ] Bloquear a alguien y refrescar: sus publicaciones no reaparecen.
- [ ] Buscar algo apenas se entra al panel.
- [ ] Sin sesión (ventana privada): el invitado se ve igual que antes.
- [ ] Cuenta **sin ciudad guardada**: "Tu Alcance" muestra la ciudad y no "Global".
- [ ] Celular.

## 6. Qué se pierde / riesgos
- Con red muy lenta, "Cargando tu cuenta…" puede durar hasta 10 s; después se muestra el invitado y, si la sesión llega luego, cambia al panel.
- La copia del muro puede mostrar un instante datos viejos (me gusta, comentarios, una publicación ya borrada) hasta que llega el muro nuevo. Se guarda en el navegador y se borra al cerrar sesión; en un computador compartido sin cerrar sesión, queda guardada.
- El buscador y el asistente pueden tardar unos segundos si se usan apenas se entra.
- El texto "Usuarios bloqueados" del menú no está traducido (solo español).
- El botón del encabezado sigue diciendo "Mi Cuenta" un instante antes de mostrar el nombre.

## 7. Cómo volver atrás
Subir de nuevo los archivos anteriores: `index.html`, `main.js`, `event-controller.js`, `panel-usuario-1.js`, `panel-usuario-2.js`, `panel-usuario-3.js`, `auth-modales.js`. Si solo falla el filtro de fotos: `index.html` y `panel-usuario-3.js`. Si solo falla la copia del muro: `panel-usuario-1.js`.

## 8. Sigue pendiente
- Mostrar el nombre del usuario en el botón del encabezado desde el primer instante.
- Que `feed_muro` (SQL) ya traiga nombre y foto del autor (quita una ronda de consultas).
- Revisar si se usa Tailwind (se carga desde internet en cada visita) y cargar los idiomas (`i18n.js`, 135 KB) solo cuando se necesiten.
- Traducir el texto del menú "Usuarios bloqueados".

## Registro
| Fecha | Cambio | Resultado |
|---|---|---|
| 22/10/2026 | Sesión primero + ocultar invitado si hay token | Probado: sin secuencia rara |
| 22/10/2026 | Catálogo de invitado sin esperar cargas pesadas | Simulación OK |
| 22/10/2026 | Autores en paralelo; `tesseract`/`jsQR` bajo demanda | Simulación OK; foto sin probar |
| 22/10/2026 | Copia del muro + carga pesada diferida | Probado en refrescar; casos de borde pendientes |
| 22/10/2026 | Usuarios bloqueados (lista y desbloquear) + SQL | Probado: salió bien |
