> **Estado: análisis y diseño hechos. Todavía no se escribió código. Falta decidir los puntos de la sección 6 y empezar por la sección 7.**

# Bitácora — Buscador, asistente y búsqueda de personas en el panel de usuario

**Fecha:** 05/10/2026
**Proyecto:** remarket-db (`pueba02.vercel.app`)
**Relacionada con:** `BITACORA-BUSQUEDA-PERSONAS.md` (paso 15a) y `BITACORA-PLAN-PANEL-Y-CORREO.md` (pasos 15 y 15a).
**Para retomar:** traer este archivo junto con las dos anteriores y seguir desde la sección 7.

---

## 1. Cómo funciona hoy (leído en el código, sin probar en el navegador)

### 1.1 Buscador de arriba y asistente
- Son el mismo cuadro de la página pública: al abrir el panel, `assistantBox` se mueve a la columna derecha (`assistantSlotRight`) y al salir vuelve (`panel-usuario-1.js`, `mostrar` y `ocultar`).
- **Buscador del header con el panel abierto:** `event-controller.js` llama a `PanelUsuario.ejecutarBusquedaConIA(query)`. Esa función manda el texto a la IA (`AIService.enviarMensaje`, función `chat-ia`), recibe una etiqueta `[ACCION: ...]` y la ejecuta con `procesarAccionEnFeed`.
- **Chat del costado con el panel abierto:** usa la respuesta ya generada y la pasa a `procesarAccionEnFeed`, sin llamar otra vez a la IA.
- **Acciones que reconoce:** `BUSCAR`, `CATEGORIA`, `LISTAR_CATEGORIAS`, `EXPLORAR_LOCALIDAD`, `QUIENES_SOMOS`, `VIDEO`, `MUSICA`, `INTERNET`, `PUBLICAR`, `BUSCAR_PERSONA` y `RECIENTES`. Para `EXPLORAR_LOCALIDAD` y `QUIENES_SOMOS` el código detecta la intención por su cuenta y manda sobre lo que diga la IA.
- **Productos:** todo usa `BuscadorMotor` (sinónimos, ciudad, presupuesto, orden por relevancia).

### 1.2 Búsqueda de personas
- **Motor único:** `buscarUsuariosPorNombre` (`panel-usuario-3.js`, ~línea 1256), usado por Compartir, Nuevo mensaje, el buscador y el chat IA. Lee `perfiles_publicos`.
- **Puntaje:** 10 nombre completo exacto, 7 empieza con lo escrito, 5 coincidencia dentro del nombre, 2 coincidencia por iniciales (`j p` encuentra a "Juan Pérez"). Muestra 12 como máximo y deja fuera a quien busca y a los bloqueados.
- **Búsqueda por nombre e inicial: confirmado por el usuario el 05/10, funciona.**
- **Zona:** `obtenerLocalidadIdsPorNivel` (~línea 1548) calcula local, regional o país a partir del `localidad_id` **de quien busca**.
- **Compartir** tiene su propio mini asistente (`consultarAsistenteCompartir`, ~línea 1491) que interpreta frases y busca por categoría y zona (`buscarUsuariosCompartir`, ~línea 1569). Esa "categoría" es la del perfil de la persona, no lo que publica.
- **Pantalla "Buscar Personas"** (`panel-usuario-1.js`, ~líneas 516 a 589): tiene su **propio cuadro de texto**, botones Local, Regional y País, espera 350 ms al escribir y, si no hay coincidencia por nombre, pregunta a la IA.

### 1.3 Barra de botones rápidos
- Está en la página pública (`index.html`, `sidebarQuick`, ~línea 108): ¿Cómo publico?, ¿Cómo vendo?, Ver mi zona, Lo último publicado, Categorías, Mundial y Buscar algo.
- Está fuera del cuadro del asistente, por eso **no se mueve al panel**: dentro del panel esos botones no se ven.

### 1.4 Formulario de publicar
- Tipo: producto (venta, trueque o donación), servicio (se guarda con `modalidad = 'servicio'`) u otro (texto libre).
- El trueque tiene el campo "¿Qué buscas a cambio?" (`pubBuscaCambio`). El servicio recomienda alcance Local.
- **No existe** una publicación del tipo "necesito X" sin ofrecer nada.

### 1.5 Reglas del Asistente
- Hay una pantalla para el administrador que guarda instrucciones en la tabla `reglas_asistente` (~líneas 1930 a 1984). La protección real es la política de esa tabla en Supabase. El panel de administrador figura como pendiente en la bitácora del plan (paso 14).

---

## 2. Problemas encontrados

1. **La zona escrita en una frase no se aplica.** En la acción `BUSCAR_PERSONA` se llama a `buscarUsuariosPorNombre(nombre)` **sin nivel de zona** (`panel-usuario-3.js` ~línea 1795 y `event-controller.js` ~línea 78). Lo que la IA ponga como "nombre" (por ejemplo "mi localidad") se busca como apellido y no coincide con nadie.
2. **La zona depende del `localidad_id` de quien busca.** Si no lo tiene, `obtenerLocalidadIdsPorNivel` devuelve vacío y la búsqueda termina sin resultados. Configuración guarda la ciudad como texto (`ciudad`) y esa columna no existe (ver 1.12 de la bitácora del plan), así que tampoco se guarda. En la captura del 05/10, "Tu Alcance" decía "Perú · Define tu localidad en Configuración".
3. **Mensajes que confunden.** Con solo el botón de zona y sin texto sale "No encontramos a nadie en esa zona. Prueba con otro filtro" (`panel-usuario-1.js` ~línea 588). Con texto y sin resultados sale "No encontré a nadie llamado ..." aunque lo pedido fuera una zona.
4. **Lentitud al escribir** (captura del 05/10, se escribió "am"): espera 350 ms, consulta `perfiles_publicos` y, si no hay coincidencia por nombre, llama a la IA ("Pensando..."). **No se midió cuál de las dos tarda.**
5. **Dos buscadores en el panel** (el del header y el cuadro de "Buscar Personas") con caminos distintos, por eso se comportan distinto.
6. **Límites de la búsqueda por nombre:** el servidor trae 60 personas sin orden antes de puntuar, no busca por `@usuario`, y al servidor solo le llega la primera palabra.
7. **Los botones rápidos no están en el panel** (paso 15 de la bitácora del plan).
8. **No existe búsqueda por lo que una persona ofrece** (producto, servicio, trueque, donación).

---

## 3. Diseño propuesto (todavía no construido)

### 3.1 Cómo la página entiende qué se pregunta
Primero con **reglas en el navegador**, y la IA solo si no se entiende (así se cuida la cuota de Groq). Se miran en este orden:
1. Nombre, iniciales o `@usuario`: búsqueda por nombre (ya funciona).
2. Palabra de lugar: "mi ciudad", "mi país", "mundial" o el nombre de un sitio.
3. Algo que se ofrece. La palabra indica el caso: "vende" es venta, "cambia" o "trueque" es trueque, "regala" o "dona" es donación, "arregla" o "da clases" es servicio.
4. Tipo de persona (categoría del perfil).
5. Frases combinadas: se juntan los filtros ("quién arregla celulares en mi ciudad").

Si no entiende nada, consulta a la IA. Si tampoco hay respuesta, enseña un ejemplo en vez de dejar la pantalla vacía.

### 3.2 Cómo se buscan las personas por lo que ofrecen
1. Se buscan en `productos` las publicaciones aprobadas que coinciden (con los sinónimos de `BuscadorMotor`).
2. La zona se resuelve con el país y la ciudad **de la publicación** (el buscador ya los usa), para no depender del `localidad_id` de la persona.
3. Se toman los dueños (`usuario_id`), se quita a quien busca y a los bloqueados, y se leen sus datos de `perfiles_publicos`.
4. Orden: más coincidencias primero, y entre iguales, más cerca.
5. Si no hay resultados, se amplía de a un paso (localidad, región, país, mundo) y se avisa que se amplió.

### 3.3 Cómo se presenta en el muro
- **Título** que repite lo entendido: "Personas de tu localidad que ofrecen celulares".
- **Una tarjeta por persona:** foto, nombre, lugar, categoría y hasta 3 ofertas que coinciden, cada una con etiqueta fija de caso (💰 Venta, 🔄 Trueque, 🎁 Donación, 🔧 Servicio). En la venta se ve el precio, y en el trueque lo que pide a cambio.
- **Botones:** Ver perfil y Mensaje. Al tocar una oferta se abre esa publicación.
- **Sin resultados:** aviso con botones para ampliar la zona.
- **Sin localidad guardada:** "Define tu localidad en Configuración" con botón que lleve a Configuración.

### 3.4 Navegación por cuadros y niveles
Recorrido: **Mundo › País › Región › Localidad › tipo y categoría › personas › perfil o publicación.**
- Cada cuadro muestra cuántas ofertas hay; los vacíos no se muestran.
- **Ruta arriba** (cada palabra se puede tocar) y botón **Atrás**.
- Si la persona tiene localidad guardada, empieza ahí y puede subir.
- La acción "explorar mi localidad" que ya existe sirve de base para el nivel de categorías.

### 3.5 Misma funcionalidad en el buscador y en el asistente
- Son dos puertas al mismo lugar: las dos terminan en el muro con los mismos cuadros.
- La frase decide en qué nivel se abre ("personas de Perú" abre en el país; "quién arregla celulares en Surco" salta a las personas).
- El asistente además **explica lo que entendió** y propone el siguiente paso con **botones** que hacen lo mismo que tocar un cuadro.
- Las reglas de reconocimiento van en la página, como ya se hace con `detectarIntencionExplorarLocalidad` y `detectarIntencionQuienesSomos`. El texto de instrucciones de la IA (`chat-ia`) está en Supabase, no en el zip.

### 3.6 Un solo buscador, más visual
- **Al hacer clic en el cuadro**, un menú de atajos con ícono: Personas cerca de mí, Quién da servicios, Quién regala, Trueques, Explorar por país, más las últimas búsquedas.
- **Al escribir**, sugerencias en vivo con foto y nombre dentro del mismo menú.
- **La zona como etiqueta dentro del cuadro** (`📍 Perú ✕`), en lugar de la fila de botones Local, Regional y País.
- **Etiquetas de intención** (Todo, Personas, Productos) para que la página no tenga que adivinar.
- **Más rápido:** tarjetas grises de carga en vez del círculo, empezar a buscar desde 2 letras, no llamar a la IA mientras se escribe (solo con Enter o si no hubo resultados, avisando que piensa) y mostrar de inmediato los últimos resultados.

### 3.7 Que la persona descubra qué puede preguntar
- Ejemplos que cambian solos en el texto gris del buscador ("quién arregla celulares en mi ciudad", "personas de Perú", "@usuario").
- Botones rápidos en el panel, con ícono y una palabra corta.
- Saludo del asistente con ejemplos tocables.
- Cuando no entiende, que enseñe un ejemplo.
- Una pista de una sola vez al entrar al panel, con botón Saltar bien visible.
- Un botón "¿Qué puedo preguntar?" junto al buscador.
- Todo con dibujo **y** una palabra corta, y pensado para el celular.
- Los textos nuevos pasan por el sistema de traducción (17 idiomas). Quechua y aimara siguen en español (decisión del 29/09).

---

## 4. Casos de publicación y qué busca cada lado

| Quien publica | Quien busca | Cómo se resuelve |
|---|---|---|
| Venta | Quiere comprar | Por producto, puede filtrar por precio |
| Trueque (con "qué busca a cambio") | Quiere cambiar | Por lo que da o por lo que pide a cambio |
| Donación | Necesita algo gratis | Por modalidad donación |
| Servicio | Necesita el servicio | Por servicio, con la zona como filtro fuerte |
| Otro | Depende | Texto libre; hoy es la única vía para "necesito X" |

---

## 5. Lo que no se sabe o no se verificó

- Las instrucciones de la función `chat-ia` (cómo decide la IA cada acción) viven en Supabase.
- Si `productos` guarda la región. En el código solo vi `pais` y `ciudad`; la región aparece en la tabla `localidades`.
- Cuál de las dos partes causa la lentitud (consulta a la base o llamada a la IA).
- Cuántas cuentas tienen `localidad_id` vacío.
- Nada de esto se probó en el navegador.

---

## 6. Decisiones abiertas

1. Qué ve un visitante **sin sesión** al buscar personas: nada, solo cuadros con cantidades, o publicaciones sin datos de personas.
2. **Una tarjeta por persona** con sus ofertas (sirve para "quién") o **una por publicación** (sirve para "qué hay").
3. Si el recorrido incluye el nivel de **región** o va de país a ciudad.
4. Atajos como **menú bajo el buscador** o como **pantalla de tarjetas grandes** al entrar a "Buscar Personas".
5. En el panel: los **mismos siete botones** de la página pública o una barra propia con los de personas y zonas.
6. Si la búsqueda entiende también el lado **"busco a cambio"** del trueque.
7. Si se permite publicar un **"necesito X"**.

---

## 7. Orden de trabajo propuesto (un cambio a la vez: datos, funciones, visual, textos)

- [ ] 1. **Medir la lentitud:** F12, pestaña Red, escribir "am" en Buscar Personas y ver si hay una petición a `perfiles_publicos` o también una a `chat-ia`, y cuánto tarda cada una.
- [ ] 2. **Datos:** consulta de solo lectura `select nombres, localidad_id, pais from perfiles_publicos;` para ver cuántas cuentas no tienen `localidad_id`.
- [ ] 3. **Datos:** crear la columna `ciudad` en `usuarios` (SQL ya propuesto en el punto 1.12 de la bitácora del plan).
- [ ] 4. **Datos:** ver las columnas de `productos` y `localidades` (consulta en la bitácora de búsqueda de personas) y decidir si la zona sale de la publicación o de la localidad.
- [ ] 5. **Arreglo pequeño:** aviso "Define tu localidad en Configuración" con botón, en lugar de "No encontramos a nadie en esa zona".
- [ ] 6. **Arreglo pequeño:** que `BUSCAR_PERSONA` reciba la zona escrita en la frase.
- [ ] 7. **Arreglo pequeño:** mensaje de "no encontré" que no diga "llamado ..." cuando se pidió una zona.
- [ ] 8. **Rendimiento:** esqueleto de carga, buscar desde 2 letras, IA solo con Enter o sin resultados.
- [ ] 9. **Funciones nuevas** en un archivo nuevo (`panel-usuario-4.js`, con `Object.assign(PanelUsuario, {...})` y su `<script>` en `index.html`); lo viejo no se toca hasta el final.
- [ ] 10. **Visual:** tarjetas por persona, etiquetas de caso, ruta y botón Atrás, cuadros por niveles.
- [ ] 11. **Botones rápidos en el panel** y atajos en el buscador (paso 15 del plan).
- [ ] 12. **Textos** al sistema de traducción.
- [ ] 13. **Probar con 3 cuentas** (sin sesión, la propia y otra distinta).

**Pendiente menor de otra conversación:** el `README.md` de este zip todavía dice "16 Idiomas"; el selector tiene 17 (corrección ya preparada en `BITACORA-README.md`).

---

## 8. Lecciones de esta conversación

- Una función que nadie sabe que existe es como si no existiera: la guía visual (ejemplos, botones, tarjetas) forma parte del trabajo, no es un extra.
- Cuando dos entradas (buscador y chat) hacen casi lo mismo, conviene que terminen en **una sola función** que pinte el muro.
- Una lista vacía sin explicación se lee como "no hay nadie". Siempre decir **por qué** no hay resultados y qué hacer.
