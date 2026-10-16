> **Estado: PREPARADO, SIN PROBAR EN LA PÁGINA REAL.** El JS pasa `node --check` y una prueba con Supabase simulado. El SQL no se ejecutó (no tengo acceso a tu base).

# Bitácora — Paginación del muro del panel (reemplaza el scroll infinito)

**Fecha:** 16/10/2026 · **Base:** `pagina--main.zip` del 15/10/2026 (+ la entrega 1 y 2 del 16/10)

## 1. Problema
El muro del panel cargaba publicaciones sin parar (scroll infinito) y no se llegaba al pie de página, donde están el Libro de Reclamaciones, Términos y Privacidad.

## 2. Qué se hizo
- **SQL nuevo `feed_muro(p_desde, p_cantidad)`** (`SQL-FEED-MURO.sql`): une `productos` y `reposts`, quita bloqueados y compartidos de publicaciones no aprobadas, y devuelve la página y el **total exacto**. Solo agrega una función; respeta RLS (`security invoker`).
- **`js/modules/panel-usuario-1.js`**: `cargarFeed(pagina)` pide una página; botones `← Anterior 1 2 … 10 Siguiente →` (mismo aspecto que el catálogo); al cambiar de página sube al inicio del muro. 10 publicaciones por página (`feedTamanoPagina`). Se eliminaron `cargarMasFeed`, `activarScrollInfinito` y el centinela.
- **Plan B automático:** si la función SQL aún no existe, el muro sigue cargando con el método anterior y muestra solo `← Anterior / Siguiente →` (sin números).
- No se tocó `index.html`, `estilos.css`, `panel-usuario-2.js` ni `panel-usuario-3.js`. Las llamadas existentes a `cargarFeed()` (publicar, bloquear, "Volver al inicio") siguen igual y cargan la página 1.

## 3. Orden para aplicar
1. Supabase → SQL Editor → pegar `SQL-FEED-MURO.sql` → Run.
2. Subir `js/modules/panel-usuario-1.js` a `js/modules/` del repositorio.
3. Ctrl+F5 y probar.

## 4. Cómo probar (marcar al hacerlo)
- [ ] Con sesión, el muro muestra 10 publicaciones y abajo los botones de página.
- [ ] Página 2, 3…: cada una trae publicaciones distintas; sube al inicio del muro.
- [ ] Se llega al **pie de página** y se abre el Libro de Reclamaciones.
- [ ] Bloquear a un usuario: sus publicaciones desaparecen del muro.
- [ ] Un compartido (🔄 compartió esto) aparece en su lugar con el comentario.
- [ ] Publicar algo nuevo: vuelve a la página 1 y aparece primero.
- [ ] Buscar algo en el panel y "Volver al inicio": vuelve a la página 1.
- [ ] Celular: los botones caben y se ven bien.
- [ ] Con 7 publicaciones o menos no salen botones (una sola página).

## 5. Límites
1. Los textos "← Anterior" y "Siguiente →" están en español fijo, igual que el catálogo (`Paginador`). No se traducen.
2. Si una publicación está oculta por las reglas de seguridad pero cuenta en el total, esa página puede salir con menos de 10.
3. Cada página se pide de nuevo a Supabase (no se guarda en memoria): es lo normal en paginación del servidor.
4. Supone que `reposts` tiene `id, usuario_id, producto_id, created_at, comentario` y `bloqueados` tiene `bloqueador_id, bloqueado_id` (tal como las usa el código actual). Si el SQL da error por una columna, copiar el mensaje.

## 6. Cómo volver atrás
Subir de nuevo el `panel-usuario-1.js` anterior. La función SQL puede quedarse (no estorba) o quitarse con `drop function public.feed_muro(integer, integer);`.

## 7. Registro
| Fecha | Cambio | Resultado |
|---|---|---|
| 16/10/2026 | Paginación del muro con SQL `feed_muro` | `node --check` OK; prueba simulada OK; falta ejecutar el SQL, subir y probar |
