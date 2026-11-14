# Bitácora — Parche: error latente, correo en resultados y limpieza de archivos

**Fecha:** 14/11/2026
**Base:** zip `pagina--main__1_.zip` (paso 5 de la búsqueda por capas)
**Estado:** parche preparado y probado en Node (8 suites en verde: 44, 37, 191, 187, 53, 40, 17, 95). **No probado en navegador ni contra Supabase.**

## 1. Cambios en código (3 archivos, 1 línea relevante cada uno)

| Archivo | Cambio |
|---|---|
| `js/modules/event-controller.js` (línea 83) | `!usuarios.motor` pasa a `!(usuarios && usuarios.motor)`. Evita un `TypeError` si `usuarios` fuera `null`. Hoy no se activaba. |
| `js/modules/panel-usuario-3.js` | Se quita `\|\| u.correo_electronico` como nombre de respaldo (línea 1387) y la línea de correo en las tarjetas de Compartir y Nuevo mensaje (líneas 1541 y 1551). |
| `js/modules/panel-usuario-1.js` (línea 797) | Buscar Personas ya no muestra `✉️ correo` bajo el nombre. Sigue saliendo `@usuario` y las ofertas. |

**Efecto visible:** las tarjetas de personas dejan de mostrar el correo. Si la persona no tiene `@usuario` ni ofertas, la segunda línea queda vacía.
**No se tocó:** el correo del propio usuario en su perfil y en configuración (`panel-usuario-2.js`), que es correcto.

## 2. Archivos a borrar del repositorio (limpieza pendiente del paso 5)

```
js/modules/interprete-busqueda-personas.test.js
js/modules/motor-busqueda-personas.test.js
js/modules/motor-busqueda-personas-datos.test.js
js/modules/motor-busqueda-personas-ayuda.test.js
pruebas/interprete-busqueda-personas.js
BITACORA-PANEL-IGUAL-QUE-PAGINA-PRINCIPAL (1).md
BITACORA-PARPADEO-SESION (1).md
```

- Las 4 pruebas de `js/modules/` tienen su versión vigente en `pruebas/` (dos de ellas más vieja: intérprete y motor).
- `pruebas/interprete-busqueda-personas.js` es una copia desactualizada del intérprete real (`js/modules/interprete-busqueda-personas.js`).
- Los dos `(1)` son duplicados por descarga repetida: **compara antes de borrar** (`PANEL-IGUAL...` es idéntico en tamaño; `PARPADEO-SESION (1)` es más largo que el original, 4452 vs 2456 bytes, así que puede ser la versión buena: conserva la que tenga más contenido).
- `BITACORA-SEGURIDAD (4).md` parece una versión numerada: renómbrala a `BITACORA-SEGURIDAD.md` si es la vigente.

## 3. Cómo aplicarlo

1. Reemplaza los 3 archivos de `js/modules/` por los de esta carpeta (o aplica `parche.diff`).
2. Borra los archivos de la sección 2 (revisando los `(1)` como se indica).
3. Publica y abre la página: sin errores nuevos en la consola.
4. Prueba Buscar Personas y Compartir: las tarjetas salen sin correo.

## 4. Cómo volver atrás

Restaurar los 3 archivos del zip del 14/11/2026. Sin cambios en Supabase.

## 5. Pendientes que siguen

- [ ] Paso 6: prender los interruptores de a uno con 3 cuentas, en computadora y celular.
- [ ] Canal `paginaChat` compartido por la caja principal, el asistente y `BUSCAR_PERSONA`: probar dos búsquedas seguidas y ver que no quede el "buscando…" colgado.
- [ ] Nombres sueltos (`Juan`, `María`) siguen a la IA: decidir si la puerta los toma.
- [ ] Tope de 500 perfiles / 1000 productos del motor.
