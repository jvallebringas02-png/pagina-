> **Estado (24/10/2026): CÓDIGO HECHO Y PROBADO CON NODE, SIN CONECTAR A NINGUNA PANTALLA.** Hay intérprete (v3.1), motor con constructor de consulta y capa de datos. 142 + 86 + 19 pruebas pasan, todas con datos de ejemplo y un Supabase de mentira. **Nada se probó en el navegador ni contra tu Supabase real.** Ningún archivo viejo se tocó.

# Bitácora — Motor de búsqueda de personas: etapas 2 y 3

**Fecha:** 24/10/2026
**Continúa:** `BITACORA-MOTOR-BUSQUEDA-PERSONAS.md` (diseño) y `BITACORA-MOTOR-BUSQUEDA-PERSONAS-DATOS.md` (datos y decisiones)
**Idea:** que una persona escriba una frase ("búscame lo que vende piano en mi ciudad", "quien da clases de piano en mi región", "ropa de segunda mano que regalen en Lima") y la página **construya la consulta**, la muestre en el muro como etiquetas y devuelva personas. La misma lógica para las 5 pantallas que hoy buscan personas.

---

## 1. Qué archivos hay

| Archivo | Para qué sirve | Estado |
|---|---|---|
| `js/modules/interprete-busqueda-personas.js` | Convierte la frase en una **ficha** (sin consultar nada) | Actualizado (ver sección 3) |
| `js/modules/motor-busqueda-personas.js` | **Constructor de consulta** (`construirPlan`) y ejecución (`ejecutar`, `buscar`). Núcleo puro: sin red, sin pantalla | Nuevo |
| `js/modules/motor-busqueda-personas-datos.js` | Lee de Supabase, llama al motor, guarda caché y evita respuestas tardías | Nuevo |
| `pruebas/interprete-busqueda-personas.test.js` | 142 pruebas | Actualizado |
| `pruebas/motor-busqueda-personas.test.js` | 86 pruebas | Nuevo |
| `pruebas/motor-busqueda-personas-datos.test.js` | 19 pruebas | Nuevo |

Las pruebas se ejecutan desde la raíz del proyecto: `node pruebas/<archivo>.test.js`. Orden de carga en el navegador: intérprete, motor, capa de datos, y todos **antes** de `panel-usuario-3.js`.

## 2. Cómo funciona

```
frase → intérprete → FICHA → construirPlan → PLAN (criterios legibles) → ejecutar(plan, datos) → personas
                                                                          ↑
                                                       capa de datos (Supabase, caché, bloqueos)
```

**El plan** es una lista de criterios, cada uno con `id`, `etiqueta`, `aplicado` y `nota`. Para "búscame lo que vende piano en mi ciudad":

```
Busqué: Tipo: venta · Ofrece: piano · Zona: tu ciudad
```

- Solo contiene campos conocidos y valores limpios. **Nunca se arma una consulta con texto libre.** La IA, si se usa, solo llena la ficha y esta pasa por `sanear()`.
- Criterios: `tipo`, `condicion`, `oferta`, `precio`, `lugar`, `zona`, `usuario`, `nombre`, `iniciales`, `rol`.
- Todo se combina con **y**. Los tipos de oferta entre sí, con **o** ("que regale o cambie").
- `fichaSin(ficha, id)` quita un criterio (la ✕ de la etiqueta) y devuelve una ficha lista para buscar otra vez.

**Tipos de oferta** (valores que puede guardar el formulario de publicar):

| La persona dice | Se busca | Publicaciones hoy |
|---|---|---|
| vende | `modalidad = 'venta'` | 42 |
| da un servicio, da clases | `modalidad = 'servicio'` | 0 |
| cambia, trueque | `modalidad = 'trueque'` | 0 |
| regala, dona | `modalidad = 'donacion'` | 0 |
| segunda mano, usado | **por texto** en título y descripción (no existe columna de condición) | — |

El motor **no tiene escrito** que no existen servicios, trueque o donación: cuenta en los datos y avisa solo si hay 0 ("Todavía no hay servicios publicados"). El día que alguien publique el primero, la búsqueda funciona sin cambiar código (hay pruebas con datos de ese tipo).

**Pasos del motor:**
1. **Riesgo:** si la ficha está bloqueada, no consulta nada y avisa de las normas sin repetir la palabra.
2. **Tipo de búsqueda:** vacía (pide escribir algo; una sola letra pide segunda pista), personas nuevas, o filtros. Sin texto pero con el botón de zona activo, lista las personas de esa zona.
3. **Publicaciones:** `estado = 'aprobado'` y alertas permitidas. Se aplica un criterio a la vez contando lo que queda, así se sabe cuál falló.
4. **Lugar:** con oferta, ciudad y país **de la publicación**, sin tildes ni mayúsculas ("callao" = "Callao"; "🌍 Global" y país "Mundo" cuentan como mundial). Sin oferta, la ubicación de la **persona**.
5. **Personas:** nombre, `@usuario` o iniciales. Puntajes: exacto 10, empieza con 7, todas las palabras 6, contiene 5, iniciales 2.
6. **Resultado:** máximo 20 (más el total). Orden: nombre, luego quienes publicaron lo pedido, luego los más recientes, o por precio si se pidió. Cada persona trae hasta 3 ofertas. Nunca trae correo.
7. **Si da 0**, dice qué criterio dejó sin nada: "Hay publicaciones con Tipo: venta, Ofrece: piano, pero ninguna con En: Trujillo".

## 3. Cambios al intérprete (v3.1)

- Frases que antes se leían mal: "búscame **lo que vende** piano" (leía "lo" como nombre), "en **la ciudad**" (era un lugar, ahora es tu zona local), "**con nombre** Juan" y "llamado Juan Pérez" (ahora separan el nombre de lo que se vende), "**quien da clases de** piano" (ahora es servicio con oferta "piano"), "quien regala o cambia" sin objeto, "**done** libros", "quien hace trueque de herramientas".
- Nuevo campo `condicion: 'usado'` ("segunda mano", "usado", "seminuevo"). `sanear` y `describir` lo conocen.
- "Todas las personas" ya no deja `todas las` como nombre (queda como búsqueda vacía).
- `sanear({iniciales:['j']})` ahora también exige segunda pista (era un pendiente de la bitácora de datos).
- **Cambio de una prueba vieja:** "juan que da clases de ingles" antes dejaba la oferta `clases de ingles`; ahora es servicio con oferta `ingles`. Es lo pedido, pero la expectativa de esa prueba cambió.

## 4. Reglas de lectura de la base (comprobadas el 24/10/2026)

| Tabla | Regla | Efecto |
|---|---|---|
| `bloqueados` | solo ves las filas donde tú bloqueaste | **No se puede leer desde el navegador quién te bloqueó** |
| `productos` | lectura pública de aprobados, y tus propias | El motor puede leer las publicaciones de otras personas |
| `usuarios` | solo ves tu fila | No se usa para buscar; las personas salen de `perfiles_publicos` |

**Bloqueo en los dos sentidos** (corrige lo que decía la bitácora anterior, donde parecía posible desde el navegador): hoy solo se oculta a quien tú bloqueaste. Para ocultar también a quien te bloqueó hace falta una función en la base. La capa de datos ya la usa si existe (`personas_ocultas()`) y, si no existe o falla, sigue con lo que puede leer. **No está ejecutada**; propuesta para el editor SQL de Supabase, a revisar antes:

```sql
create or replace function public.personas_ocultas()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select bloqueado_id from bloqueados where bloqueador_id = auth.uid()
  union
  select bloqueador_id from bloqueados where bloqueado_id = auth.uid();
$$;
revoke all on function public.personas_ocultas() from public;
grant execute on function public.personas_ocultas() to authenticated;
```

La función mezcla las dos direcciones a propósito: el navegador no sabe quién bloqueó a quién.

## 5. Decisiones tomadas al construir

> Varias de estas se propusieron en la conversación y **no tuvieron un "sí" explícito**: se asumieron para poder construir. Se pueden cambiar sin rehacer el motor.

| # | Decisión | Dónde cambiarla |
|---|---|---|
| 1 | Alertas, opción A: entra si `nivel_alerta_legal` y `nivel_alerta_ocr` están vacías o en "bajo"; "medio" o "alto" la dejan fuera | `publicacionValida` |
| 2 | Ubicación de la persona: su localidad del perfil; si falta, la ciudad de sus publicaciones aprobadas. **Solo para emparejar, no se muestra como "su localidad"** | `ubicacionDe` |
| 3 | "Vende X en Y": se compara con la ciudad y el país de la publicación | `enZona`, `enLugarNombrado` |
| 4 | Región: `productos` **no tiene región**. Se resuelve con `localidades.region`, más las publicaciones de alcance mundial, o de alcance regional dentro del mismo país. Las ciudades que no están en `localidades` no tienen región conocida | `enZona` |
| 5 | Lo mundial cuenta en "mi región" y "mi país", pero **no** en "mi ciudad" | `enZona` |
| 6 | "Quien compra X" no busca vendedores: avisa que la página no guarda lo que alguien quiere comprar. Con "vende o compra" busca lo que vende y avisa | `construirPlan` |
| 7 | Rol "vendedor, emprendedor, comerciante, artesano" = tiene alguna publicación aprobada. Otros roles no se aplican y avisan | `construirPlan` |
| 8 | Precio: sin conversión de moneda (S/ no se compara con $). "Por precio" suelto solo ordena | `coincidePrecio` |
| 9 | Segunda mano por texto, marcado en el plan como "por texto: la página no guarda la condición" | `coincideUsado` |
| 10 | Correo nunca; máximo 20; reportes no se aplican en esta versión (`reportes_count` no es confiable) | — |

## 6. Lo que NO está hecho

- [ ] **Conectar las pantallas.** Ninguna llama todavía al motor. Orden previsto: "Buscar personas" (`panel-usuario-1.js`, `buscarEnPanelPersonas`), selector de Compartir y Nuevo mensaje (`buscarPersonaPicker`), chat del panel, chat de la página principal (`event-controller.js`), botones de zona (`ui-controller.js`). Todas pasan por `buscarUsuariosPorNombre` (`panel-usuario-3.js`); la forma prevista es darle un tercer parámetro de interruptor y dejar el código viejo como respaldo.
- [ ] **Salida en el muro:** línea "Entendí…", etiquetas con ✕, avisos y botón "Define tu localidad". La página principal usa otro dibujo (`UIController.mostrarResultadosPersonas`).
- [ ] **El asistente solo manda `datos.nombre`.** Para frases largas tiene que mandar el texto completo o una ficha que pase por `sanear`. En el buscador principal hay que decidir cómo se distingue "buscar personas" de "buscar productos".
- [ ] **Textos** en el sistema de traducción (15 idiomas). Hoy los avisos y etiquetas están en español dentro del motor.
- [ ] **Pruebas en el navegador** con 3 cuentas (sin sesión, la propia y otra), en computadora y celular.
- [ ] **"Ver más":** el motor devuelve el total pero no recibe desplazamiento.
- [ ] Función `personas_ocultas()` en la base (sección 4), si se quiere el bloqueo en los dos sentidos.
- [ ] Revisar `with_check` de las reglas `INSERT` de `productos`, `bloqueados` y `usuarios` (la consulta mostró `qual = null`, normal en INSERT, pero no se vio la condición real). Consulta de solo lectura:

```sql
select tablename, policyname, cmd, with_check
from pg_policies
where cmd = 'INSERT' and tablename in ('productos', 'bloqueados', 'usuarios');
```

- [ ] Reglas duplicadas en `bloqueados` (dos de ver, dos de borrar) y `productos` (dos de publicar): dejar una de cada una.

## 7. Límites y riesgos

- **No es una barrera de seguridad.** La lista de riesgo es un freno; la protección real va al publicar y en los reportes. El filtro de alertas también corre en el navegador: la base deja leer cualquier publicación aprobada.
- **Listado masivo:** con 9 personas y 42 publicaciones se filtra en el navegador. Con más datos hace falta una función SQL con límites.
- `perfiles_publicos` no filtra cuentas suspendidas; no se toca.
- **La ubicación por publicaciones es un respaldo:** quien vende en San Jerónimo y vive en Lima aparecería en San Jerónimo.
- **Región incompleta** hasta que las ciudades de las publicaciones (San Jerónimo, Pacora, Urpipata…) estén en `localidades`. Los dos "Sofia" con países distintos parecen datos de prueba y no se tocaron.
- **Segunda mano** depende de que quien publica lo escriba. Para hacerlo bien, el formulario necesitaría un campo "Condición: nuevo / usado" (decisión pendiente, no incluida).
- Pendientes menores del intérprete: "Ng" y "Ly" se leen como iniciales; "co-caina" pasa la lista de riesgo; "da clases" sin la palabra "que" o "quien" delante (por ejemplo "Juan da clases de inglés") no se reconoce como servicio.
- El intérprete solo entiende español.
- **Todo probado con Node y datos de ejemplo.**

## 8. Cómo volver atrás

Los tres archivos nuevos no cambian nada por sí solos: si no se cargan en `index.html` y ninguna pantalla los llama, la página sigue igual. El intérprete actualizado es compatible con el anterior (se agregó un campo y se mejoraron frases; la ficha vieja sigue siendo válida). Cuando se conecte una pantalla, se desconecta quitando la llamada nueva en esa pantalla.

## 9. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 24/10/2026 | Intérprete v3.1: tipo de oferta, segunda mano, "con nombre", "mi ciudad", "da clases", donar | 142 pruebas pasan (121 + 21 nuevas; una expectativa cambió) |
| 24/10/2026 | `motor-busqueda-personas.js`: plan de búsqueda y ejecución | 86 pruebas pasan |
| 24/10/2026 | Consulta de reglas de lectura (`pg_policies`) | `bloqueados` solo permite ver los míos; el bloqueo en los dos sentidos necesita una función en la base |
| 24/10/2026 | `motor-busqueda-personas-datos.js`: lectura de Supabase, caché, respuestas tardías | 19 pruebas pasan, con cliente de mentira |
| 24/10/2026 | Esta bitácora | Sin conectar a ninguna pantalla |
