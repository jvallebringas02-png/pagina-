> **Estado (24/10/2026): DISEÑO, SIN CÓDIGO DEL MOTOR. Solo existe el intérprete (etapa 1, sin conectar). Esta bitácora describe la lógica del motor que se construiría en la etapa 2. Todo sale de leer el código y de los datos que describió la otra sesión; nada se probó en el navegador. Lo marcado "por confirmar" hay que comprobarlo antes de construir.**

# Bitácora — Motor de búsqueda de personas (por venta, localidad y categoría)

**Fecha:** 24/10/2026
**Continúa:** `BITACORA-BUSQUEDA-PERSONAS.md` (secciones 3 a 7)
**Idea:** que una persona pida, con una frase, buscar a otra por **nombre**, por **lo que vende**, por **localidad** o por **categoría**, y que las cinco pantallas que hoy buscan personas usen el mismo motor.

---

## 1. Las tres piezas (cada una hace una sola cosa)

| Pieza | Qué hace | Estado |
|---|---|---|
| **Intérprete** | Lee la frase y la convierte en una ficha. No consulta nada. | Hecho (etapa 1), sin conectar |
| **Motor** | Recibe la ficha y busca en Supabase. Devuelve personas. | Pendiente (etapa 2) |
| **Presentación** | Muestra las tarjetas y el texto "Busqué: …". | Pendiente (etapa 2) |

La IA **no escribe la consulta**. Si se usa, solo ayuda a llenar la ficha, y la ficha se valida igual.

## 2. La ficha (lo que entrega el intérprete)

`{ nombre, zona, lugar, oferta, rol, orden, riesgo, intencion }`

- `nombre`: "Juan Pérez" o null · `zona`: 'local' | 'regional' | 'pais' | 'mundial' | null · `lugar`: "Trujillo" o null
- `oferta`: lo que vende ("ropa", "laptops") o null · `rol`: "emprendedores", "vendedores"… o null
- `orden`: 'recientes' ("nuevo usuario") o null · `riesgo`: alto (se bloquea), medio (se avisa) o null
- `intencion`: 'nombre', 'filtro', 'nuevos' o 'vacia'

## 3. Lógica del motor, paso a paso

**Paso 0 — Riesgo.** Si `riesgo.nivel` es "alto", el motor no busca y la pantalla muestra el aviso de que eso va contra las normas. Si es "medio", busca y no dice nada especial. (Ver decisión sobre apellidos en la sección 8.)

**Paso 1 — Qué tipo de búsqueda es.**
- `nuevos`: devolver los últimos registrados (ordenar por fecha de registro). *Por confirmar:* si `perfiles_publicos` trae la fecha.
- `nombre`: ir al paso 2.
- `filtro` (sin nombre, solo zona, lugar, oferta o rol): ir al paso 3.
- `vacia`: pedir que escriba algo; no consultar.

**Paso 2 — Por nombre** (ya existe: `buscarUsuariosPorNombre`).
Usa el texto **limpio** (letras, números, guion, apóstrofe) para el filtro de Supabase, y ordena en el navegador por parecido: nombre completo exacto (10), empieza con el texto (7), contiene (5), iniciales (2). Excluye a quien busca y a los bloqueados.

**Paso 3 — Por lo que vende (`oferta`) o por categoría.**
1. Buscar primero **publicaciones** aprobadas cuyo título, descripción o categoría coincidan con la oferta ("laptops" → categoría Tecnología y título que contenga "laptop").
2. Tomar los `usuario_id` de esas publicaciones (sin repetir).
3. Leer esas personas en `perfiles_publicos`.
4. Mostrar hasta 3 cosas que cada persona ofrece.
- La categoría **sale de las publicaciones**, no del perfil: las 9 personas tienen "General".
- Una palabra de oferta se traduce a una categoría con una tabla corta (laptop, celular → Tecnología; ropa, zapatos → Ropa; mueble → Hogar…). Si no hay categoría clara, se busca solo por texto.

**Paso 4 — Por localidad.**
- `local`, `regional`, `pais`: como hoy, con la localidad de **quien busca** (`obtenerLocalidadIdsPorNivel`). Si quien busca no tiene localidad guardada, se muestra "Define tu localidad en Configuración" **en vez de una lista vacía**.
- `mundial`: se quita el filtro de zona.
- `lugar` ("Trujillo", "Perú"): se compara con la ciudad o el país **de la persona**, sin depender de la localidad de quien busca. *Por confirmar:* si se usa el texto (`pais`, `ciudad`) o los identificadores de `localidades`.

**Paso 5 — Combinar.** Todos los criterios se suman con **Y**: "ropa en Trujillo" = vende ropa **y** está en Trujillo. Si la combinación no da nadie, el motor dice cuál criterio no encontró nada ("Hay personas que venden ropa, pero ninguna en Trujillo") y ofrece quitar el lugar.

**Paso 6 — Resultado.** Máximo 20 personas, ordenadas así: coincidencia exacta de nombre, luego quienes publicaron algo de lo pedido, luego los más recientes. Cada tarjeta lleva foto, nombre, ubicación, hasta 3 ofertas y los botones Ver perfil y Mensaje. Arriba va `describir(ficha)`: "Busqué: ropa · en Trujillo".

## 4. Dónde se conecta (los 5 lugares de hoy)

1. Chat de la página principal — `event-controller.js` (acción `BUSCAR_PERSONA`).
2. Chat del panel — `panel-usuario-3.js` (acción `BUSCAR_PERSONA`).
3. Sección "Buscar personas" — `panel-usuario-1.js` (`buscarEnPanelPersonas`).
4. Selector de Compartir y Nuevo mensaje — `panel-usuario-3.js` (`buscarPersonaPicker`).
5. Cambio de zona sobre los resultados — `ui-controller.js`.
Código nuevo en `js/modules/panel-usuario-4.js`. El código viejo no se borra hasta probar. Se quita el respaldo `consultarAsistenteCompartir`, que llama a la IA directo desde el navegador y probablemente no funciona.

## 5. Datos que se usan y lo que dicen (según la otra sesión)

- 9 personas, todas "activo". Categoría del perfil: todas "General" (no sirve).
- 42 publicaciones: Ropa 26, Hogar 13 y Tecnología; **todas son "venta"**; **0 de "Servicios"**.
- `perfiles_publicos` es una vista sin filtro de suspendidos; alimenta autores, chats y perfiles. **No se toca**: si se necesita ocultar suspendidos, se crea una vista nueva solo para buscar (etapa 4).
- `reportes_count` está en 0 aunque hay un reporte: probablemente no se actualiza. Para "un reporte oculta" habría que usar la tabla `reportes`.

## 6. Qué respuestas honestas debe dar el motor

- "Da clases" y "servicios": "Todavía no hay servicios publicados."
- "Regala" y "cambia": "Todavía no hay publicaciones de trueque o donación."
- Sin localidad de quien busca: "Define tu localidad en Configuración."
- Nada encontrado: decir qué criterio falló y ofrecer quitarlo.
- Frase bloqueada: aviso claro de normas, sin repetir la palabra.

## 7. Límites y riesgos

- **No es una barrera de seguridad.** La lista de palabras es un freno. La protección real va al publicar y en los reportes.
- **Listado masivo:** el navegador no puede impedir que alguien con sesión lea toda la vista. Con 9 personas no importa; es el motivo real de la función SQL con límites (etapa 4).
- **Privacidad:** no mostrar correo en los resultados de búsqueda por oferta (hoy "Buscar personas" muestra el correo cuando existe: revisar).
- **Bloqueo en los dos sentidos:** hoy solo se oculta a quien **yo** bloqueé; que quien me bloqueó no me vea requiere una función en la base (etapa 4).
- Frases en idiomas distintos del español: el intérprete solo entiende español (y algo de inglés en la lista de riesgo).

## 8. Decisiones pendientes

- [ ] Lista de riesgo: armas (con excepciones "de agua, silicona, juguete"), heroína y pasta base, "escort" salvo auto.
- [ ] Apellidos como "Armas": ¿se dejan pasar cuando la palabra está solo en el nombre? (`riesgo.soloNombre`)
- [ ] ¿"Lugar" se compara por texto o por `localidades`? (depende de las columnas)
- [ ] ¿Se muestra el correo en los resultados?
- [x] ¿Esta versión del intérprete o la de la otra sesión? **Resuelto 24/10:** una sola versión (v3), hecha sobre la de esta bitácora (riesgo, lugares, oferta, rol, "nuevos") sumándole iniciales, `@usuario`, precio, "qué hace" y `sanear()` del intérprete de la otra sesión. No debe cargarse ningún otro intérprete: ambos usaban la misma variable global.

## 9. Pasos para construirlo (método: datos, funciones, visual, textos)

- [ ] 1. **Datos:** ejecutar la consulta de solo lectura de `BITACORA-BUSQUEDA-PERSONAS.md` (sección 4) y revisar las columnas de `perfiles_publicos`, `productos` y `localidades`.
- [ ] 2. Decidir producto vs. servicio y la tabla palabra → categoría.
- [ ] 3. **Funciones:** `panel-usuario-4.js` con el motor (pasos 0 a 6) y pruebas con datos de ejemplo.
- [ ] 4. **Visual:** una sola tarjeta de resultados y el texto "Busqué: …".
- [ ] 5. **Textos:** pasarlos al sistema de traducción (15 idiomas).
- [ ] 6. Conectar los 5 lugares, uno por uno.
- [ ] 7. Probar con 3 cuentas (sin sesión, la propia y otra distinta), en computadora y celular.

## 10. Cómo volver atrás

El motor vive en un archivo nuevo y el código viejo no se borra: se desconecta quitando el `<script>` de `panel-usuario-4.js` en `index.html` y las llamadas nuevas.

## 11. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 24/10/2026 | Diseño del motor y su lógica | Documento; sin código del motor. Falta confirmar columnas con la consulta de solo lectura |
| 24/10/2026 | Intérprete v3: unión de los dos intérpretes | `js/modules/interprete-busqueda-personas.js` (v3) y `pruebas/interprete-busqueda-personas.test.js`: 121 pruebas pasan (las 66 anteriores más 55 nuevas). Sigue sin conectar a ninguna pantalla |

## 12. Intérprete v3 (24/10/2026)

**Qué se agregó a la versión 2** (la ficha crece, los campos anteriores no cambian):
- `usuario` (de `@jvalle`), `iniciales` (de "j", "J P", "jp", "J.P.", "j y p") y `necesita_segunda_pista` (una sola letra sola no lista a nadie).
- `hace` (`vende`, `servicios`, `regala`, `cambia`) y `hace_no_soportado` (`compra`: se detecta y se avisa, hoy la página no guarda lo que alguien quiere comprar). "Que venda o compre o de servicios" ya no deja basura en `oferta`.
- `precio` `{ min, max, orden, moneda, ambiguo }`: "menos de 500 soles", "entre 100 y 300 dólares", "más baratos". "Por precio" suelto queda `ambiguo` y se ordena del más barato. "Caro" y "Sol" siguen siendo nombres.
- `intencion: 'usuario'` para `@usuario` solo; las iniciales cuentan como `'nombre'`.
- `sanear(fichaExterna)`: valida la ficha que llene la IA (solo campos conocidos, textos cortos y limpios) y vuelve a aplicar la lista de riesgo.
- "quién vende laptops..." ya no deja "quien" como nombre.
- Riesgo: "vende / compra / busco drogas" ahora **bloquea** (antes solo avisaba); "drogas" suelta sigue solo avisando. `@usuario` también pasa por la lista de riesgo.
- `describir()` no repite una búsqueda bloqueada, y muestra usuario, iniciales, qué hace y precio.

**Apellido "Armas" (decisión pendiente, ahora con interruptor):** por defecto "Carlos Armas" sigue **bloqueado** (modo estricto). Con `contexto.permitirApellidos === true` pasa como búsqueda de persona (`riesgo.permitidoComoApellido`), solo si la frase es un nombre sin oferta, sin verbos de pedido ("compro", "busco", "venta") y sin otra palabra de riesgo antes. Quien lo active debe buscar **solo por nombre** y nunca por oferta.

**Límites:** un lugar nombrado fuera de la lista (`LUGARES_CONOCIDOS`) solo se reconoce después de "en"; servicios sin la palabra "servicio" ("da clases de inglés") quedan como `oferta`; el intérprete solo entiende español; probado con Node, no en el navegador.
