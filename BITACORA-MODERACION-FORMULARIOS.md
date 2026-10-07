> **Estado: PROPUESTO, SIN CÓDIGO TODAVÍA. Esta bitácora es el diseño del algoritmo, a confirmar
> antes de escribir una sola línea. Marcar cada punto cuando se implemente y se pruebe.**

# Bitácora — Moderación y orientación en los 4 formularios abiertos al público

**Fecha:** 07/10/2026
**Continúa:** `BITACORA-LIBRO-RECLAMACIONES.md` (el formulario ya quedó funcionando y el hueco de
seguridad ya se cerró), `BITACORA-PLAN-PANEL-Y-CORREO.md`
**Archivos que se tocarían:** `js/modules/institucional.js` (Libro de Reclamaciones, Comunícate
con el Administrador, Comentario sobre la página -- nuevo), `js/modules/panel-usuario-2.js` o
`-3.js` (Comentarios de publicaciones), y un archivo nuevo compartido (ver sección 2).
**Método:** lectura del filtro que ya existe en el chat (`panel-usuario-3.js`,
`moderarMensaje` / `evaluarNivelesAlerta`), comparado con lo que hoy tienen los otros 4 lugares.
No se tocó código todavía.

---

## 1. Punto de partida: qué protección tiene cada lugar hoy

| Lugar | Filtro de palabras | Revisión de IA | Qué pasa si el texto es un problema |
|---|---|---|---|
| Chat entre usuarios | Sí, **bloquea el envío** (`moderarMensaje`) | Sí, después del filtro (`evaluarNivelesAlerta`) | No se envía; se explica el motivo |
| Publicar un producto | Sí | Sí | No se publica |
| Comunícate con el Administrador | No | No | Se guarda tal cual, sin ningún filtro |
| Libro de Reclamaciones | No | No | Se guarda tal cual, sin ningún filtro |
| Comentar una publicación | No (solo `escHtml` contra código malicioso) | No | Se guarda tal cual; solo se puede reportar después |
| Comentario sobre la página | No existe esta función todavía | -- | -- |

**Corrección sobre lo que se había dicho antes:** el filtro de palabras del chat no "avisa y deja
seguir" -- es un bloqueo real. Si el mensaje tiene `whatsapp`, `yape`, `cuenta bancaria`, un
número de 6 a 9 dígitos, etc., el código corta el envío ahí mismo (`js/modules/panel-usuario-3.js`,
función `moderarMensaje`, usada en `enviarMensajeChat`). Este diseño parte de ese comportamiento
real, no de una versión suavizada.

---

## 2. El algoritmo: una sola capa de moderación, reutilizada en los 4 lugares

En vez de escribir el filtro 4 veces, la idea es sacar `FILTRO_PALABRAS_PROHIBIDAS` y
`moderarMensaje` del chat y ponerlos en un lugar compartido (por ejemplo `js/modules/moderacion.js`,
cargado antes que los módulos que lo usan), para que el chat, las publicaciones y estos 4 lugares
nuevos llamen a la misma función, con el mismo comportamiento, en vez de 4 copias que se puedan
desalinear con el tiempo.

```
función moderarTexto(texto):
    si el texto contiene una palabra de la lista prohibida → { permitido: false, motivo: "..." }
    si el texto contiene un número de 6 a 9 dígitos seguidos → { permitido: false, motivo: "..." }
    si no → { permitido: true }
```

Esta función **no cuesta nada** (no llama a ningún servidor, es instantánea) y es la primera
barrera en los 4 lugares. La pregunta de fondo que falta resolver en cada uno es: **¿además del
filtro de palabras, hace falta la revisión por IA (como en el chat), sí o no?** Porque esa sí
cuesta cuota de Groq, que ya es el punto débil del proyecto (ver `BITACORA-LIBRO-RECLAMACIONES.md`
y la bitácora de límite de uso de IA).

---

## 3. Decisión por cada lugar (propuesta, a confirmar)

### 3.1 Comunícate con el Administrador -- filtro de palabras + revisión de IA

Es el más parecido al chat: una persona le escribe directo a otra (el administrador), puede haber
intento de acoso o de pedir datos fuera de la plataforma, y el volumen de mensajes es bajo
(nadie escribe al administrador tan seguido como chatea con otro usuario). Por eso sí alcanza la
cuota:

1. Antes de enviar: `moderarTexto()`. Si bloquea, se muestra el aviso y no se manda.
2. Si pasa el filtro: una sola llamada a la IA (igual que `evaluarNivelesAlerta`, pero más simple,
   solo para detectar insultos, amenazas o contenido ilegal -- no hace falta todo lo que revisa el
   chat).
3. Si la IA lo rechaza: `"No pudimos enviar tu mensaje. Revísalo e inténtalo de nuevo."`
4. Si todo pasa: se guarda, y el asistente confirma qué va a pasar después
   (`"Recibimos tu mensaje, te responderán por correo."`).

### 3.2 Libro de Reclamaciones -- SOLO filtro de palabras, nunca revisión de IA

Aquí la decisión es distinta a propósito, por una razón legal, no técnica: un reclamo es un
**derecho del consumidor**. La ley no permite que la empresa rechace o filtre un reclamo por su
contenido o su tono (ver INDECOPI). Por eso:

- **Sí** se aplica `moderarTexto()`, pero solo contra **spam y datos de contacto fuera de lugar**
  (por ejemplo, alguien que use el campo de reclamo para pedir pagos por WhatsApp) -- nunca contra
  el tono o las palabras de la queja en sí.
- **No** se usa revisión de IA. No se le puede decir a alguien "tu reclamo no se pudo enviar"
  porque la IA interpretó mal su enojo legítimo.
- El límite de tamaño (`lr_largos`, ya escrito en `BITACORA-LIBRO-RECLAMACIONES.md`, sección 3.3)
  sí se aplica, porque eso es spam, no contenido.
- Si el texto tiene algo preocupante (insultos fuertes, amenazas), se guarda igual, y queda como
  tarea para cuando exista el panel de administrador: marcarlo para revisión manual, no bloquear
  el envío.

### 3.3 Comentar una publicación -- SOLO filtro de palabras

El volumen de comentarios puede ser alto, así que una revisión de IA en cada uno agotaría la cuota
de Groq rápido (el mismo problema que ya pasó con el chat, ver la bitácora del límite de uso de
IA). Por eso:

- `moderarTexto()` antes de guardar. Si bloquea, se avisa y no se publica el comentario.
- La moderación de fondo sigue siendo el botón **Reportar** que ya existe, para lo que el filtro
  de palabras no puede detectar (contenido ofensivo sin esas palabras puntuales).

### 3.4 Comentario sobre la página (función nueva, todavía no existe)

Como ya se había hablado: un "Déjanos tu opinión" en el pie de página, con calificación y
comentario, que el administrador aprueba antes de que se vea públicamente. Por eso:

- `moderarTexto()` antes de guardar (barato, igual que los otros 3).
- **No hace falta IA**, porque ya hay una persona (el administrador) revisando antes de publicar
  -- la aprobación manual ya cumple el papel que en el chat cumple la IA.

---

## 4. Resumen de la decisión

| Lugar | Filtro de palabras | Revisión de IA | Por qué |
|---|---|---|---|
| Comunícate con el Administrador | Sí, bloquea | **Sí** | Volumen bajo, mensaje 1 a 1, riesgo de acoso |
| Libro de Reclamaciones | Sí, pero solo contra spam/contacto | **No** | Es un derecho del consumidor, no se puede filtrar por tono |
| Comentar una publicación | Sí, bloquea | **No** | Volumen alto, ya existe el botón Reportar |
| Comentario sobre la página | Sí, bloquea | **No** | Hay aprobación manual del administrador antes de publicar |

---

## 5. Qué confirma el asistente en cada caso (mensajes, estilo del que ya existe)

- **Comunícate con el Admin:** `"Recibimos tu mensaje, te responderán por correo."`
- **Libro de Reclamaciones:** el ya diseñado en la bitácora anterior -- código de seguimiento,
  constancia descargable, enlace de seguimiento (`BITACORA-LIBRO-RECLAMACIONES.md`, pendiente de
  construir).
- **Comentario:** no hace falta mensaje del asistente, el comentario aparece al instante si pasa
  el filtro.
- **Comentario sobre la página:** `"Gracias por tu opinión. La revisaremos antes de publicarla."`

Estos textos van en los 17 idiomas, siguiendo la misma regla ya usada en el resto del proyecto:
quechua y aimara quedan en español hasta que un hablante nativo los revise.

---

## 6. Pendientes antes de escribir código

- [ ] Confirmar esta tabla de decisiones (sección 4) -- en particular si de verdad se quiere
      revisión de IA en "Comunícate con el Administrador" o se prefiere dejar los 4 lugares solo
      con filtro de palabras, por simpleza y costo cero.
- [ ] Sacar `FILTRO_PALABRAS_PROHIBIDAS` y `moderarMensaje` de `panel-usuario-3.js` a un archivo
      compartido, sin cambiar su comportamiento en el chat (revisar que nada se rompa ahí).
- [ ] Escribir los textos nuevos (confirmaciones, avisos) en los 17 idiomas.
- [ ] Construir primero el Libro de Reclamaciones (código + constancia + seguimiento, ya diseñado
      aparte) antes de tocar los otros 3, porque es el único con una norma legal de por medio.
- [ ] Revisar con un abogado o con INDECOPI si el límite de tamaño o el filtro de spam en el Libro
      de Reclamaciones podría interpretarse como un obstáculo al derecho de reclamar -- aunque no
      filtre el contenido, conviene confirmarlo antes de publicarlo.

## 7. Cómo se probaría cada uno, una vez construido

1. Escribir un mensaje con "mi whatsapp es..." en cada uno de los 4 lugares: debe bloquearse igual
   en los 4.
2. Escribir un reclamo enojado pero legítimo, sin datos de contacto: debe enviarse sin problema
   (confirmar que el Libro de Reclamaciones nunca lo rechaza por el tono).
3. Escribir un insulto fuerte en "Comunícate con el Administrador": debe rechazarlo la IA.
4. El mismo insulto en un comentario de publicación: debe guardarse (no hay IA ahí), y confirmar
   que el botón Reportar sigue disponible.
5. Enviar una opinión sobre la página: debe aparecer como "pendiente de revisión", no publicarse
   sola.
