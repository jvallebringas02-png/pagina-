> **Estado (26/10/2026): CÓDIGO HECHO Y PROBADO CON NODE Y UN DOM SIMULADO. NO SE PROBÓ EN EL NAVEGADOR NI CONTRA TU SUPABASE REAL.** Todo lo marcado "no probado" hay que comprobarlo en la página publicada antes de darlo por cierto.

# Bitácora — Ayuda en "Buscar Personas": frases naturales, sinónimos, sugerencias y salidas sin resultados

**Fecha:** 26/10/2026
**Continúa:** `BITACORA-MOTOR-BUSQUEDA-PERSONAS-ETAPAS-2-Y-3.md` y `BITACORA-MOTOR-BUSQUEDA-PERSONAS-CONEXION-PANTALLAS-1.md`
**Qué se revisó:** `pagina--main.zip` (copia del 24/10/2026) y dos capturas de la página publicada (`pueba02.vercel.app`) en Brave y en Edge.
**Método:** lectura del código, pruebas con Node y una simulación de la pantalla con un DOM falso. No se abrió la página publicada.

---

## 1. Qué se encontró

| # | Problema | Dónde | Efecto |
|---|---|---|---|
| 1 | Al hacer clic en el campo de "Buscar Personas" aparecía "Nuevo alias de correo electrónico" | Extensión del navegador (Brave) | No es de la página: en Edge, sin extensiones, no aparece. El campo no tenía `name` y su `autocomplete="off"` lo ignoran casi todas las extensiones |
| 2 | `por zapatos` y `por zapato` se leían como el **nombre de una persona** | `interprete-busqueda-personas.js`, paso 6 | "por" no estaba en las palabras de relleno de los bordes (`a, que, de, y, con, para`) |
| 3 | `zapato`, `laptop`, `zapatilla` en singular tampoco se reconocían como producto | Paso 7 | `PRODUCTOS_COMUNES` solo traía plurales |
| 4 | `usuarios que vendan o den servicios` dejaba **"den"** como producto ("Ofrece: den") | `separarHace` y la regla "que vende..." | Ninguna publicación contiene "den": **0 resultados** aunque sí hay vendedores |
| 5 | `quiero zapatos`, `busco zapatos`, `necesito comprar zapatos`, `donde consigo zapatos`, `tienen zapatos`, `busco a Juan Perez` | Paso 3 (frases de arranque) | Se buscaba una persona con ese nombre: "busco a Juan Perez" buscaba "busco a Juan Perez" |
| 6 | Palabras que no están en la lista fija (`plomero`, `calzado`, `sombreros`) se tomaban como nombre | Paso 7 | La lista de productos era fija y corta |
| 7 | La búsqueda no usaba los sinónimos del buscador principal | `motor-busqueda-personas.js` | `calzado` o `tenis` no encontraban a quien vende zapatos |
| 8 | Sin resultados solo decía "No encontré a nadie con esos criterios" | `panel-usuario-1.js` | Sin ninguna salida para el usuario |
| 9 | **La ayuda de la IA de `buscarEnPanelPersonas` nunca se ejecuta** | `panel-usuario-1.js`, bloque "🤖 Pensando..." | El motor nuevo siempre devuelve un resultado (`lista.motor`), aun vacío, y la función sale antes de llegar a ese bloque. Solo se alcanzaría si el motor fallara. **No se tocó** (ver sección 7) |

## 2. Qué se cambió

### 2.1 `js/modules/interprete-busqueda-personas.js`
- "por" se agrega a las palabras de relleno de los bordes del nombre (arregla #2).
- El vocabulario compara sin `s`/`es` final: `zapato` = `zapatos` (arregla #3).
- Los verbos `den`, `hagan`, `tengan` se reconocen después de "que", y `da`, `dan`, `den`, `hacen`, `tienen`, `tengan`, `ofrecen`, `ofrezcan`, `brindan`, `prestan` no quedan como producto (arregla #4).
- Frases de arranque ampliadas (arregla #5): `busco`, `buscando`, `encuentro`, `comprar`, `conseguir`, `consigo`; `quiero`/`necesito`/`deseo`/`me gustaria`/`me interesa` solos; `donde consigo/encuentro/compro`, `tienen`, `tiene`, `hay`. Admiten "a / al / un / una" detrás.
  - "quiero comprar zapatos" **no** se marca como `compra` (no soportado): quien quiere comprar necesita encontrar a quien vende, que es justo lo que se busca.

### 2.2 `js/modules/motor-busqueda-personas.js`
- **Sinónimos** (arregla #7). `GRUPOS_BASE` (zapato/zapatilla/tenis/calzado, celular/smartphone/teléfono, laptop/notebook, computadora/compu/pc, televisor/tv, bicicleta/bici, carro/auto/coche/vehículo, casaca/chompa, polo/camiseta, ropa/prenda, comida/alimento) más la función opcional `contexto.sinonimos`. Cada palabra pedida se cumple con ella o con cualquiera de sus sinónimos (`coincideOferta(p, tokens, grupos)`).
- **Vocabulario desde las publicaciones** (arregla #6). `vocabularioDe(datos)` saca las palabras de 4+ letras de categorías y títulos y se las pasa al intérprete (`palabrasProducto`).
  - **Se excluyen** las palabras que también son nombre o apellido de alguien en `perfiles` (ante la duda, "Juan" es una persona) y unas pocas palabras de intención (`vendo`, `busco`, `nuevo`, `usado`...).
  - Si la página tiene "zapatos", también valen como producto `calzado` y `tenis` (salvo que alguien se llame así).
- **`alternativas(res, datos, contexto)`**: cuando no hay resultados, prueba búsquedas parecidas y devuelve hasta 3 **que sí dan resultados**, cada una con su ficha lista para volver a buscar:
  - `ampliar`: la zona del nivel actual hacia afuera (local → regional → país → mundial), la primera que tenga a alguien.
  - `quitar`: precio, "segunda mano", lugar, zona o tipo (de a uno).
  - `como_oferta` / `como_nombre`: la otra lectura de una palabra suelta.
  - No se calculan si hay resultados, si la búsqueda está bloqueada por riesgo, ni si falta la localidad.
  - Se descartó ofrecer "quitar lo que ofrece": da resultados sin relación con lo pedido.
- **`sugerencias(datos, contexto)`**: búsquedas para tocar, con las categorías publicadas (sin "General" ni "Otros"), los tipos (venden, dan servicios, hacen trueque, regalan) y las ciudades con publicaciones. Cada una se prueba con el mismo motor y **solo se ofrece si da resultados**; el número es de personas, no de publicaciones. Siempre termina con "Gente nueva". Respeta bloqueados.
- `buscar()` ahora devuelve también `alternativas` (lista vacía si no hacen falta). Todo lo anterior sigue igual.

### 2.3 `js/modules/motor-busqueda-personas-datos.js`
- `sugerencias(opciones)` nuevo, usa la misma caché de 60 s (no hace lecturas extra a Supabase).
- `sinonimosPagina()`: si `BuscadorMotor.obtenerGrupoSinonimos` existe en la página, se lo pasa al motor; si no, el motor usa solo sus grupos propios. Se consulta al momento de buscar, así que el orden de carga de los `<script>` no importa.
- La lectura con caché se movió a `datosVigentes()` para compartirla entre `buscar` y `sugerencias`. Mismo comportamiento.

### 2.4 `js/modules/panel-usuario-1.js`
- **Campo de búsqueda** (arregla #1): `type="search"`, `name="buscar-personas-panel"`, `autocorrect/autocapitalize` apagados, `spellcheck="false"` y `data-lpignore`, `data-1p-ignore`, `data-bwignore`, `data-protonpass-ignore`, `data-form-type="other"`.
- **Placeholder**: "Nombre, iniciales o lo que vende (ej: zapatos en Lima)...".
- **Estado sin búsqueda**: una línea de ayuda y botones con las sugerencias (`_pintarVacioPanelPersonas`, `_cargarSugerenciasPanelPersonas`, `usarSugerenciaPanelPersonas`).
- **Sin resultados** (`_pintarResultadoMotorPanelPersonas`): bajo el mensaje, "Pero puedo mostrarte:" con los botones de `alternativas`; si no hay ninguna, "Prueba con alguna de estas:" con las sugerencias. No aparecen si falta la localidad ni si la búsqueda fue bloqueada. `usarAlternativaPanelPersonas` vuelve a buscar con la ficha y ajusta los botones Local/Regional/País.
- Los textos de los botones salen por `escHtml`.

## 3. Archivos para subir

`js/modules/interprete-busqueda-personas.js`, `js/modules/motor-busqueda-personas.js`, `js/modules/motor-busqueda-personas-datos.js`, `js/modules/panel-usuario-1.js`, y la prueba nueva `pruebas/motor-busqueda-personas-ayuda.test.js`.

No se tocaron `index.html`, `buscador.js` ni ninguna tabla de Supabase.

## 4. Probado (Node y DOM simulado)

| Prueba | Resultado |
|---|---|
| `pruebas/interprete-busqueda-personas.test.js` | 142 de 142 |
| `pruebas/motor-busqueda-personas.test.js` | 86 de 86 |
| `pruebas/motor-busqueda-personas-datos.test.js` | 17 de 17 |
| `pruebas/motor-busqueda-personas-ayuda.test.js` (nueva) | 40 de 40 |

La prueba nueva cubre: sinónimos (con los de `buscador.js` reales y sin ellos), vocabulario de publicaciones, que `Juan` y `Zapata` sigan siendo nombres, las frases de intención, que ninguna sugerencia dé 0 y que su número coincida con el de la búsqueda real, que lo bloqueado no cuente, las salidas (quitar lugar, quitar precio, ampliar zona, otra lectura), que no haya alternativas cuando sí hay resultados ni cuando la búsqueda es de riesgo.

Simulación de pantalla: el estado vacío pinta 6 botones con su número, y una búsqueda sin resultados pinta el botón de salida y guarda la alternativa para `usarAlternativaPanelPersonas`.

**Sobre el conteo de la capa de datos:** en la copia del 24/10 la prueba de datos da **17**, y la bitácora de etapas 2 y 3 dice 19. No se investigó la diferencia; puede ser una versión distinta de ese archivo de pruebas.

## 5. No probado (hacerlo en el navegador)

- Que ya **no aparezca** el aviso de alias de correo en Brave. Puede que la extensión ignore los atributos. Si sigue, se quita desde la propia extensión (sitios donde no debe actuar) o se identifica cuál es.
- Que `por zapatos`, `por zapato`, `quiero zapatos` y `calzado` den el mismo resultado que `zapatos`.
- Que los botones de ejemplo salgan al entrar, con números iguales a lo que da cada búsqueda al tocarlos, y que se vean bien en pantalla chica (envuelven en varias líneas).
- Que el botón de salida ("En cualquier lugar", "Buscar en tu región"...) vuelva a buscar y deje bien marcados los botones Local/Regional/País.
- Con tus datos reales: que `vocabularioDe` no robe nombres de personas. Se excluyen los nombres y apellidos de los perfiles leídos (hasta 500), pero una persona fuera de esa lectura podría quedar como producto.
- Que `BuscadorMotor.obtenerGrupoSinonimos` entregue grupos razonables con tus títulos.
- Velocidad: las sugerencias hacen una búsqueda por cada botón (unas 10 a 15) sobre los datos en caché. Con 1000 publicaciones debería ser instantáneo, pero no se midió en el navegador.

## 6. Cosas a vigilar

- `carro` ahora también encuentra "auto", y "auto" coincide con el inicio de palabras como "automático". Puede aparecer algún resultado de más.
- `tenis` también es el deporte; `tenis de mesa` podría aparecer al buscar calzado.
- Las categorías se ofrecen con el nombre que tengan en tus publicaciones. Si hay variantes ("Ropa" y "ropa y accesorios"), saldrán como botones distintos.
- Los textos nuevos están solo en español, como el resto de esta pantalla. No pasan por `i18n.js`.

## 7. Pendiente (no incluido)

- [ ] **Asistente IA de la derecha**: que comente cada búsqueda y ofrezca los mismos botones. Hoy no se entera de lo que pasa en "Buscar Personas".
- [ ] **El bloque de IA de `buscarEnPanelPersonas` (hallazgo #9)** sigue sin ejecutarse. Decidir si se reconecta solo cuando haya duda real o se elimina.
- [ ] **Tolerancia a errores de escritura** (`selular`, `zapatso`): "¿Querías decir celular?".
- [ ] **Registro de búsquedas sin resultado** para saber qué palabras faltan. **Requiere una tabla nueva en Supabase y tu visto bueno antes de crearla.** Guardar solo el texto, sin datos personales.
- [ ] Acciones en las tarjetas de resultado ("ver todo lo que vende").
- [ ] Las otras 4 pantallas que usan el motor (Compartir, Nuevo mensaje, Chat/buscador principal...) no reciben los botones de ejemplo ni de salida; solo el panel de "Buscar Personas". Los sinónimos y el vocabulario sí les llegan, porque viven en el motor.

## 8. Cómo volver atrás

Subir de nuevo los 4 archivos anteriores de `js/modules/` y borrar `pruebas/motor-busqueda-personas-ayuda.test.js`. Los cambios no tocan datos ni tablas, así que no hay nada que deshacer en Supabase.
