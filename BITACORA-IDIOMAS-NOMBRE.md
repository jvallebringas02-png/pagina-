> **Estado (26/11/2026): ARREGLO LISTO Y PROBADO EN NODE; FALTA PROBARLO EN LA PÁGINA DE PRUEBA con el idioma cambiado.**

# Bitácora — Buscar por nombre fallaba en todos los idiomas menos español

**Base:** zip `pagina--main__1__1.zip` (con la guía, `i18n-buscar-personas.js` y los interruptores `ampliar`, `red`, `guia` encendidos).
**Archivo cambiado:** `js/modules/motor-busqueda-personas.js` (4 líneas). **Prueba nueva:** `pruebas/idiomas-nombre.test.js` (91).

## 1. El fallo
Con la página en **inglés, francés, alemán, árabe**, etc., buscar `Ana Torres`, `@anat` o `Pérez` **no devolvía a nadie**, aunque existieran. En español funcionaba.

**Causa:** el motor sacaba el valor a buscar quitando `"Nombre: "` del *texto de la etiqueta* (`c.etiqueta.replace(/^Nombre: /, '')`, igual con `Usuario: @` e `Iniciales: `). Esas etiquetas ahora se traducen (`Name: Ana Torres`, `Nom : Ana Torres`), así que el `replace` no quitaba nada y se buscaba "Name: Ana Torres".
**Efecto extra:** si el archivo `i18n-buscar-personas.js` no llegara a cargar, el nombre se buscaba como la palabra `nombreEt` y la pantalla mostraba `noConNadie` en vez de un texto.

## 2. El arreglo
Cada criterio de nombre, usuario e iniciales guarda ahora su valor en `valor`, y el motor lee `c.valor`. La etiqueta queda solo para mostrar. Si `valor` no existe, usa el camino anterior.

## 3. Pruebas
- `idiomas-nombre.test.js`: 14 idiomas × (nombre y apellido, apellido, @usuario, iniciales, una sola inicial, nombre inexistente). **Sin el arreglo: 42 fallos de 91. Con el arreglo: 91 de 91.**
- Las otras 12 suites siguen en verde (44, 37, 114, 73, 191, 187, 53, 40, 17, 95, 50, 37).

## 4. Lo que verifiqué del informe que pegaste (la sesión anterior)
| Afirmación | Resultado en mi simulación con el zip nuevo |
|---|---|
| Lo escrito por la persona no se traduce | **Cierto.** |
| "I found nobody with Name: Pedro Gonzales" suena torpe | **Cierto.** También `Je n'ai trouvé personne avec Nom : ...` y `No encontré a nadie con Nombre: ...`: sale de `noConNadie` con la etiqueta entera. |
| `kjhsdf qwe` no activa la guía, se busca como nombre | **Cierto.** `red` no lo detecta: no puede distinguirlo de un nombre real que no está en la base. |
| La guía no saltó con `personas` ni `usuarios` | **No lo pude reproducir.** Con `ampliar`, `red` y `guia` encendidos y canal `panelPersonas`, salta con `personas`, `usuarios` y `kiero ver gente`, con 3 botones y traducida (inglés, francés). Si en tu página no sale, probablemente corre archivos distintos de este zip (revisar caché y que `guia-busqueda.js`, `i18n-guia-busqueda.js` y `i18n-buscar-personas.js` estén publicados). |
| La traducción de la guía no está verificada | **Parcial:** inglés y francés se ven bien; el resto sigue sin revisión de nativos. |

## 5. Pendiente (sin tocar)
- [ ] Cambiar las frases de "no encontré" para que usen solo el valor ("con el nombre Pedro Gonzales"): hay que escribir una clave nueva en los 14 idiomas; requiere revisión de nativos en varios.
- [ ] Detectar texto sin sentido (`kjhsdf qwe`: sin vocales o más de 4 consonantes seguidas) para mandarlo a la guía en vez de buscarlo como nombre.
- [ ] `pruebas/simulacion-paso6.js` (mío) falla con este zip porque no carga los archivos nuevos; no afecta la página.
- [ ] Limpieza del paso 5 y fechas dudosas de bitácoras anteriores.

## 6. Subir
`js/modules/motor-busqueda-personas.js` (reemplaza) y `pruebas/idiomas-nombre.test.js` (nuevo). Volver atrás: restaurar el motor anterior. Sin cambios en Supabase.
