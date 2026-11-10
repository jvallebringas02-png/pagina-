> **Estado (10/11/2026): DISEÑO EN PALABRAS. NO HAY CÓDIGO NUEVO.** Define una sola "ficha de intención" que compartan el buscador principal, la búsqueda de personas y la IA. Los idiomas quedan para después (decisión del dueño); este diseño solo deja el sitio listo.

# Bitácora — Contrato único de intención de búsqueda

**Continúa:** `BITACORA-BUSQUEDA-PERSONAS-COMO-DEBERIA-SER.md` (22/10) y `BITACORA-MOTOR-BUSQUEDA-PERSONAS*.md`.

## 1. El problema, verificado en el código

Hoy hay **tres formas distintas** de entender lo que la persona escribió:

| Quién | Dónde | Qué devuelve | Límite |
|---|---|---|---|
| Reglas de personas | `interprete-busqueda-personas.js` | Ficha: `nombre, usuario, iniciales, zona, lugar, oferta, hace, precio, rol, orden, condicion` | Solo español, frases fijas |
| Buscador principal | `buscador.js` (`extraerPresupuesto`, sinónimos) | Texto + presupuesto con una regex propia | Duplica lo que ya hace el intérprete (precio) |
| IA (`chat-ia`) | `ai-service.js` → `_parsearRespuesta` | JSON: `accion, producto, categoria, nombre, titulo, tema, orden, ubicacion, modalidad, nivel_matriz` | `BUSCAR_PERSONA` solo trae `nombre` |

Los tres dicen casi lo mismo con **nombres de campo distintos** (`oferta` = `producto`, `lugar` = `ubicacion`, `hace` = `modalidad`). Por eso no se comportan igual.

## 2. Idea central

> **Una sola ficha. Distintos "llenadores". Un solo motor.**

- La **ficha** es el contrato: la lista fija de campos que significan "qué quiere esta persona".
- Los **llenadores** son quienes la completan: (a) reglas en español, (b) IA. Cualquiera de los dos devuelve la misma ficha.
- El **motor** busca con la ficha y no sabe ni le importa quién la llenó.
- La IA **nunca escribe consultas**; solo llena campos, y `sanear()` descarta lo que no sea un campo conocido con valor permitido (esto ya existe y se queda).

```
texto ──► reglas (gratis) ──► ¿entendió? ──sí──► FICHA ──► motor ──► resultados
                                  │
                                  no
                                  ▼
                           IA (cuota Groq) ──► JSON ──► sanear() ──► FICHA
```

## 3. La ficha (campos)

Se parte de la ficha del intérprete, que ya es la más completa. Equivalencias con lo que usa hoy la IA:

| Campo de la ficha | Significa | Hoy en la IA se llama |
|---|---|---|
| `objetivo` **(nuevo)** | Qué se busca: `'personas'` o `'publicaciones'` | `accion` (`BUSCAR_PERSONA` / `BUSCAR`) |
| `nombre` | Nombre de persona | `nombre` |
| `usuario` | `@usuario` | — |
| `iniciales` | `['j','p']` | — |
| `oferta` | Lo que se vende u ofrece | `producto` |
| `categoria` | Categoría de la página | `categoria` |
| `hace` | `vende, servicios, regala, cambia` | `modalidad` |
| `hace_no_soportado` | `compra` (se avisa) | — |
| `precio` | `{min, max, orden, moneda}` | (solo en regex del buscador) |
| `zona` | `local, regional, pais, mundial` | `nivel_matriz` / `ubicacion` |
| `lugar` | Ciudad o país nombrado | `ubicacion` |
| `rol` | emprendedores, vendedores… | — |
| `orden` | `recientes` | `orden` |
| `condicion` | `usado` | — |
| `fuente` **(nuevo)** | Quién la llenó: `'reglas'` o `'ia'` | — |
| `confianza` **(nuevo)** | `'alta'` si las reglas reconocieron un patrón; `'baja'` si lo que quedó cayó en "nombre" por descarte | — |
| `sugerencia_idioma` **(nuevo, reservado)** | Idioma detectado (queda vacío hasta la fase de idiomas) | `idioma` |

**Regla de oro:** la ficha no contiene texto para mostrar. Contiene datos. Cómo se ve ("Ofrece: ropa") lo decide la pantalla.

## 4. Quién llena la ficha, y cuándo

1. **Siempre primero las reglas.** Son gratis y rápidas.
2. **La IA solo entra si `confianza` es `'baja'`** y ningún nombre coincide en la base. Hoy "necesito un gasfitero" termina en `nombre = gasfitero` por descarte: eso es justo `confianza: 'baja'`.
3. **Límite de uso:** si no hay cuota de Groq, se sigue con lo que dieron las reglas y el mensaje amable. Nunca se deja la pantalla en blanco.
4. **La IA responde solo JSON con los campos de la sección 3.** Se pide el JSON; lo demás se descarta en `sanear()`.

### Cómo se marca "no entendí" (hoy no existe)
`confianza: 'baja'` es la pieza que falta. Se activa cuando:
- Lo que queda como `nombre` tiene palabras de relleno de pedido ("tenga", "necesito", "me puede", "regalar"…).
- Lo que queda como `nombre` **no coincide con nadie** (se sabe después de buscar).

## 5. Qué cambia en cada pieza

| Pieza | Cambio | Riesgo |
|---|---|---|
| Intérprete | Añadir `objetivo`, `fuente`, `confianza`. Pasos 1 a 3 del plan del 10/11 (ampliar reglas, mensaje al fallar, tolerar tipeo) | Bajo: 142 pruebas lo protegen |
| `chat-ia` (función de Supabase) | Que en modo "ficha" devuelva los campos de la sección 3, no solo `nombre` | Medio: ampliar las instrucciones del modelo |
| `ai-service.js` | Una función `entenderConIA(texto)` que devuelva ficha ya pasada por `sanear()` | Bajo |
| `buscador.js` | Reemplazar `extraerPresupuesto` por el intérprete (una sola lógica de precio) | Medio: afecta la página principal |
| Motor | Sin cambios de fondo; ya recibe `ficha` en `contexto.ficha` | Bajo |

## 6. Orden de trabajo

- [ ] 1. Pasos 1 a 3 del plan del 10/11 (reglas en español, mensaje al fallar, tolerar tipeo), con 40 pruebas nuevas.
- [ ] 2. Añadir `confianza` y `objetivo` a la ficha (+ pruebas).
- [ ] 3. Corregir la ruta de las pruebas (hoy `require('../js/modules/…')` falla desde `js/modules/`).
- [ ] 4. `chat-ia`: modo "ficha". Probar con 20 frases y comparar contra lo que da el intérprete.
- [ ] 5. `ai-service.js`: `entenderConIA` + `sanear()`.
- [ ] 6. Conectar la IA como respaldo **solo** de la búsqueda de personas.
- [ ] 7. Mover el buscador principal al mismo intérprete (último, porque toca la página pública).

## 7. Qué deja listo para los idiomas (sin hacerlos ahora)

- La IA ya entiende cualquier idioma: con el contrato único, "who sells shoes" devuelve la misma ficha que "quien vende zapatos". No hay que traducir reglas.
- **Antes de traducir pantallas hay que separar dato de texto.** Hoy el motor arma etiquetas ("Nombre: juan") y luego las lee con `replace(/^Nombre: /, '')` (`motor-busqueda-personas.js` ~línea 395). Con el contrato, la etiqueta se genera en la pantalla desde los campos, y ese código frágil desaparece.
- Quechua y aimara: la IA los cubre solo en parte. Se probará cuando llegue la fase de idiomas.

## 8. Decisiones que hay que tomar

1. ¿La IA entra solo para personas, o también para el buscador principal? (Recomendado: personas primero.)
2. ¿Cuántas llamadas a la IA por persona y por día? (Hay un límite de uso en `BITACORA-LIMITE-USO-IA.md`; reutilizarlo.)
3. Tolerancia a errores de tipeo: solo cuando **ningún nombre** coincide, y como pregunta ("¿Quisiste decir zapatos?"), nunca automática. Un apellido real como "Zapata" está a una letra de "zapato".
4. ¿Se avisa a la persona cuando se usó la IA? (Recomendado: sí, "Entendí con ayuda de la IA".)

## 9. Pruebas que debería pasar al terminar

- [ ] "quien vende zapatos" da la misma ficha por reglas y por IA.
- [ ] "alguien que tenga una laptop" → `oferta: laptop`, `confianza: alta`.
- [ ] "necesito un gasfitero" → `oferta: gasfitero` (regla del artículo "un/una").
- [ ] "busco a juan" sigue siendo `nombre: juan`.
- [ ] "piano" sin nadie que lo venda: mensaje claro, sin botón que lleve a cero resultados.
- [ ] Sin cuota de IA: se muestra el resultado de las reglas, nunca pantalla en blanco.
- [ ] La IA no puede devolver campos fuera de la lista ni saltarse la lista de riesgo (`sanear()` la vuelve a aplicar).
- [ ] Las 142 pruebas del intérprete y las del motor siguen pasando.

## 10. Riesgos
- La IA puede inventar un campo o un valor: por eso todo pasa por `sanear()`.
- Si las reglas marcan `confianza: 'alta'` por error, la IA nunca se consulta. Hay que revisar con frases reales.
- Mover el buscador principal al intérprete cambia la página pública: se hace al final y con pruebas.

## Registro
- 10/11/2026 — Diseño en palabras. Sin código.
