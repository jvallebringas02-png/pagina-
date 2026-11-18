> **Estado (18/11/2026): PLAN, SIN CÓDIGO NUEVO.** En esta sesión solo se leyó el zip `pagina--main__2__1.zip` (14/11/2026), se corrieron sus pruebas en Node y se probaron 33 frases con el intérprete real. **No se cambió ningún archivo de la página. Nada se probó en un navegador real ni contra tu Supabase.** Las cifras de esfuerzo son estimaciones.

# Bitácora — Búsqueda por capas, parte 4: que la búsqueda de personas guíe en vez de fallar

**Fecha:** 18/11/2026
**Continúa:** `BITACORA-BUSQUEDA-POR-CAPAS-3.md` (paso 5: pantallas conectadas)
**Idea (tuya):** si la persona escribe algo y no se distingue su intención, el sistema no adivina ni muestra "No encontré a nadie": la guía con preguntas y botones hasta entender qué desea. Debe valer en todos los idiomas de la página.

---

## 1. Punto de partida (verificado en el zip del 14/11/2026)

- Las capas ya existen: `limpieza-busqueda.js`, `intencion-busqueda.js`, `busqueda-por-capas.js`, con 8 interruptores en `true` en `index.html` (`window.BUSQUEDA_CAPAS`).
- Pruebas: 9 de 10 suites pasan. Falla `conexion-pantallas.test.js` (1 de 37) porque exige interruptores apagados. La versión nueva que subiste pasa **37 de 37**.
- Ya hay un inicio de red de seguridad: `MotorBusquedaPersonasDatos.nombresConocidos` y `contexto.esNombreConocido` en la capa de intención (`nombres-conocidos.test.js`, 50 pruebas). Pero el intérprete sigue asignando `ficha.nombre` con todo lo que sobra, sin comprobarlo.
- El filtro `.or()` del respaldo ya está limpio (13/11/2026).
- Sueltos que siguen en el zip: `parche.diff` (raíz y `pruebas/`), `pruebas/resultado-simulacion.txt`, `pruebas/interprete-busqueda-personas.js` (copia), 4 `.test.js` dentro de `js/modules/`, 2 bitácoras con "(1)". Las bitácoras de capas no están en `BITACORA-README.md` ni en `README.md`.
- El mensaje "No encontré a nadie con esos criterios." sale del motor (solo en español) y se dibuja en **4 lugares**: `panel-usuario-1.js` (línea ~756), `panel-usuario-3.js` (~1534 y ~2282) y `ui-controller.js` (~383).

## 2. Qué falla hoy (33 frases inventadas, probadas con el código real; NO son búsquedas de tus usuarios)

| Familia | Ejemplos | Qué hace hoy |
|---|---|---|
| Pedir un perfil | `dime quién es Ana Torres`, `conoces a Carlos`, `perfil de jperez` | busca "dime es Ana Torres", "conoces a Carlos"… como nombre |
| Zona dicha de otra forma | `busca a Mario cerca donde vivo`, `mario que viva cerca`, `usuarios en mi barrio`, `vecinos` | la zona se pierde; busca "Mario cerca donde vivo" |
| Oficios con verbo | `alguien que arregle celulares`, `quien repara laptops` | busca "arregle celulares" como nombre |
| Orden | `los más nuevos`, `los últimos registrados`, `se unieron esta semana` | lo toma como nombre |
| Informales o mal escritas | `kiero ver gente`, `listame los usuarios`, `usuarios d mi zona`, `un usuaro` | nombre o iniciales equivocadas ("d") |
| Cosas que la página no tiene | `verificados`, `con foto`, `mejor reputación` | las busca como nombre |
| Otros idiomas | `find Mario near me`, `who sells shoes in Lima` | todo como nombre (el intérprete solo entiende español) |
| Control (bien) | `Juan Pérez`, `@jperez`, `quien vende ropa`, `gente que regale cosas`, `usuarios con inicial J`, `Mario de Callao` | se entienden bien |

Aproximadamente 8 de 33 se entienden bien. Es una muestra difícil a propósito: sirve para ver **dónde** falla, no cuánto.

## 3. Objetivo y principios

- El pedido de una persona casi nunca debe terminar en "No encontré a nadie" **por culpa del algoritmo**. Si termina así, es porque no hay datos o porque pidió algo que la página no ofrece.
- Cada fase es pequeña, con su interruptor y sus pruebas, y se deshace con un `false`.
- No se toca la búsqueda de productos ni Supabase (salvo la fase 5).
- Los interruptores nuevos van en `BusquedaPorCapas.interruptores` (como `entrada`, `limpieza`, `intencion`), no en `window.BUSQUEDA_CAPAS`: `conexion-pantallas.test.js` exige exactamente esas 8 claves.
- La IA **no** entra en esta parte. Si se quiere, será un interruptor aparte, apagado.

## 4. Fases

### Fase 0 — Ordenar la base
- Subir `conexion-pantallas.test.js` nuevo.
- Borrar los sueltos de la sección 1.
- Añadir las bitácoras de capas (1 a 4) al `BITACORA-README.md` y al `README.md`.
- Riesgo: ninguno.

### Fase 1 — Red de seguridad (interruptor `red`)
- `interprete-busqueda-personas.js`, paso 6: recibe `contexto.esNombreConocido`; lo que sobra se divide en "parece nombre" y `ficha.sin_entender`.
  - `Mario cerca donde vivo` → nombre Mario; sin entender: "cerca donde vivo".
  - `arregle celulares` → sin nombre; sin entender.
  - Un nombre real que todavía no está en la base (`Pedro Gonzales`) se sigue buscando como nombre.
- `motor-busqueda-personas.js`: si no hay nada que buscar, devuelve `necesita_guia`; si hay nombre y algo sin entender, busca y avisa qué no entendió.
- Los 4 lugares que dibujan el vacío pasan a usar **una** función común.
- Pruebas: `sin-entender.test.js` (las familias de la sección 2) y repetir las 10 suites.

### Fase 2 — Ampliar lo que reconoce (interruptor `ampliar`)
- Zona: "cerca donde vivo", "donde vivo", "que viva cerca", barrio, distrito, vecinos.
- Relleno de arranque: "dime quién es", "conoces a", "muéstrame el perfil de", "listame", "kiero ver".
- Orden: "los más nuevos", "últimos registrados", "se unieron esta semana".
- Oficios: "alguien que arregle/repara/cocine" se lee como servicio.
- Errores de escritura: comparación con unas 40 palabras clave con una letra de diferencia.
- Lo que la página no tiene (verificados, foto, reputación): aviso honesto.
- Esta fase no termina: se amplía con las frases reales (fase 5).

### Fase 3 — La guía (interruptor `guia`)
- Archivo nuevo `js/modules/guia-busqueda.js`, función pura: recibe ficha, lo ya respondido y los datos reales, y devuelve el paso siguiente (`preguntar`, `buscar`, `mostrar_cercano`, `avisar`).
- Reglas:
  1. Dice qué entendió antes de preguntar.
  2. Una pregunta por turno, con 3 o 4 botones y la opción de escribir otra cosa.
  3. Los botones salen de los datos reales; no ofrece nada que dé "no hay".
  4. No repite preguntas.
  5. Máximo 3 preguntas; después muestra lo más cercano.
  6. Si el pedido es claro desde el inicio, no pregunta nada.
- Al tocar un botón se completa la ficha y se busca con ella (`opciones.ficha` ya existe y salta la lectura del texto).
- Pruebas: máquina de estados (máximo 3, sin repetir, opciones con datos, sin datos → avisa) e integración con las pantallas.

### Fase 4 — Idiomas
- Archivo `js/i18n-guia-busqueda.js` con unas 15 a 20 frases en los 15 idiomas; quechua y aimara caen al español.
- Los botones traducidos hacen que la guía funcione aunque la página no entienda la frase.
- Revisión nativa pendiente: árabe, hindi, búlgaro, turco.
- Patrones de reconocimiento en otros idiomas: después, empezando por inglés.

### Fase 5 — Guardar frases que fallan (requiere SQL y tu decisión)
- Tabla en Supabase y función SQL con límites. Se guarda solo la frase limpia, **sin cuenta ni IP**, con retención corta (propuesta: 60 días).
- No se guardan frases bloqueadas por riesgo ni las que parezcan correo o teléfono.
- Hay que decirlo en la política de privacidad.

## 5. Cantidad de cambios (estimación)

| Fase | Archivos existentes | Archivos nuevos | Pruebas | Líneas |
|---|---|---|---|---|
| 0 | 2 README (y ~10 borrados) | 0 | subir 1 | — |
| 1 | `interprete`, `motor`, `busqueda-por-capas` y 4 puntos de dibujo | 0 | 1 suite | ~150 |
| 2 | `interprete` | 0 | amplía la suite | 150–250 |
| 3 | `busqueda-por-capas`, los 4 puntos de dibujo, `index.html` | 1 | 2 suites | 300–400 |
| 4 | `index.html` | 1 | 1 suite | ~350 |
| 5 | `busqueda-por-capas` | 1 SQL | 1 suite | ~120 |

Total: unos 12 archivos existentes y 6 nuevos; entre 1000 y 1300 líneas, más de la mitad en textos de idiomas.

## 6. Qué NO resuelve (aunque se haga todo)

1. **No hay datos:** 9 perfiles y 42 publicaciones, todas de venta. Servicios, donaciones y trueques seguirán respondiendo "todavía no hay".
2. **La página cree que entendió y se equivoca:** la guía solo aparece cuando se detecta que no se entendió (por eso va primero la fase 1).
3. **Piden algo que la página no tiene:** solo se puede avisar.
4. **Frases muy raras o en otro idioma:** la guía con botones ayuda, pero no entiende la frase.
5. **"Cerca" es solo la localidad guardada**, no una distancia.

## 7. Por qué no se hace todo en una sola entrega

- La **fase 5** necesita que tú ejecutes SQL en tu Supabase y decidas lo de privacidad.
- La **fase 4** necesita revisión de hablantes nativos en 4 idiomas.
- Las fases **1 y 3** cambian lo que ven las 8 pantallas conectadas: probarlas todas juntas, sin poder simular tu Supabase ni tu celular, hace difícil saber qué pieza falló.
- La **fase 2** nunca termina.
- Varias sesiones han editado los mismos archivos (el 18/11 se detectó que una sesión paralela ya había construido `limpieza-busqueda.js` e `intencion-busqueda.js` con otra API). Cada entrega debe decir sobre qué zip se hizo.

Lo que sí se puede entregar junto: **fases 0 a 4**, con interruptores independientes, apagados por defecto y encendibles de a uno.

## 8. Decisiones pendientes (con propuesta por defecto)

- [ ] ¿IA como último recurso? **Propuesta:** apagada.
- [ ] Máximo de preguntas de la guía. **Propuesta:** 3.
- [ ] ¿Guardar frases fallidas y por cuánto? **Propuesta:** sí, 60 días, sin cuenta ni IP; solo tras actualizar la política de privacidad.
- [ ] Idioma con patrones después del español. **Propuesta:** inglés.
- [ ] ¿Los interruptores nuevos dentro de `BusquedaPorCapas.interruptores`? **Propuesta:** sí.

## 9. Cómo se probará

- **Yo, antes de entregar:** pruebas en Node con los archivos reales de la página (las 10 suites existentes más las nuevas) y, si el entorno lo permite, un navegador sin pantalla con un Supabase de mentira y capturas en tamaño de celular.
- **Tú, en pueba02:** con tu cuenta y con una segunda cuenta, en computadora y en celular: las frases de la sección 2, cada interruptor por separado, y lo que no se puede simular (tus datos reales y tus reglas de seguridad).

## 10. Cómo volver atrás

Cada fase vive en su interruptor (`false` = camino de antes) y en archivos nuevos o en cambios pequeños. Para quitar una fase: poner su interruptor en `false`; para quitarla del todo, volver a subir el archivo anterior del repo. No hay cambios en Supabase hasta la fase 5.

## 11. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 18/11/2026 | Lectura del zip del 14/11, pruebas en Node, 33 frases con el intérprete real y plan por fases | Documento; sin cambios de código |
