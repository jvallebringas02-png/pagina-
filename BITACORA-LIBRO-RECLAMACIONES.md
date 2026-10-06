> **Estado: PREPARADO, SIN CONFIRMAR. El código ya está cambiado en `institucional.js` (falta subirlo a GitHub). El SQL de la sección 3 está escrito pero NO consta que se haya ejecutado en Supabase. Marcar cada punto cuando se haga.**

# Bitácora — Libro de reclamaciones: formulario roto y regla abierta

**Fecha:** 06/10/2026
**Continúa:** `BITACORA-SEGURIDAD.md` (Paso 7 nuevo), `BITACORA-REVISION-06-10.md`
**Archivo de código tocado:** `js/modules/institucional.js` (función `enviarReclamo`)
**Método:** consulta de `pg_policies` y de `information_schema.columns` en Supabase, comparada con el código. No se probó la página publicada.

---

## 1. Qué se encontró

### 1.1 Regla abierta en `libro_reclamaciones` (seguridad, grave)

La consulta de políticas del 06/10 mostró esta regla:

| Tabla | Regla | Qué permite |
|---|---|---|
| `libro_reclamaciones` | `enable_all_auth_libro` (ALL, `authenticated`, `true`) | Cualquier persona con cuenta puede **leer, modificar y borrar** todos los reclamos (nombre, documento, correo, teléfono). |

El Paso 1 de `BITACORA-SEGURIDAD.md` cerró 15 tablas "que la página no usa". Esta no estaba en esa lista porque la página sí la usa (para insertar), y la regla abierta quedó.

Lo demás estaba bien:

- `libro_reclamaciones`: "Cualquiera puede registrar un reclamo" (solo INSERT). Es la que necesita el formulario. Se queda.
- `mensajes_contacto`: solo INSERT. Correcto.
- `logs_acceso`: INSERT abierto (normal) y cada usuario ve solo sus logs. Correcto.
- `usuarios_geolocalizacion`: la lectura incluye `email IS NULL`, así que cualquier usuario con sesión lee las filas anónimas (IP y ubicación). El código **no usa esta tabla**, así que se cierra la lectura.

### 1.2 El formulario no coincide con la tabla (funcionamiento, probablemente roto hoy)

El primer intento de poner límites de tamaño falló con `ERROR 42703: column "detalle" does not exist`. Al listar las columnas reales se vio que el código usaba nombres que no existen:

| El código mandaba | La tabla real tiene |
|---|---|
| `tipo` | `tipo_incidencia` |
| `nombre_consumidor` | `nombre_completo` |
| `documento_identidad` | `numero_documento` |
| `email` | `correo_electronico` |
| `telefono` | `telefono` (único que coincidía) |
| `descripcion_bien_servicio` | **no existe** |
| `monto_reclamado` | **no existe** |
| `detalle` | `detalle_del_hecho` |
| `pedido_consumidor` | `pedido_concreto` |

Supabase rechaza el envío completo si una columna no existe, así que **ningún reclamo se pudo registrar** con este formulario (pendiente de confirmar con una prueba). La tabla también tiene columnas que el formulario no llena: `codigo_reclamo`, `tipo_documento`, `distrito_reclamante`, `estado_tramite`, `respuesta_administrador`, `fecha_respuesta`.

Columnas reales de `mensajes_contacto` (sin diferencias con el código): `id, nombre, email, mensaje, leido, creado_en`.

---

## 2. El cambio de código

**Archivo:** `js/modules/institucional.js`, función `enviarReclamo()`, el objeto del `insert`.

```diff
-    tipo: ...reclamoTipo...,
-    nombre_consumidor: ...reclamoNombre...,
-    documento_identidad: ...reclamoDocumento...,
-    email: ...reclamoEmail...,
-    telefono: ...reclamoTelefono... || null,
-    descripcion_bien_servicio: ...reclamoBien...,
-    monto_reclamado: monto,
-    detalle: ...reclamoDetalle...,
-    pedido_consumidor: ...reclamoPedido...
+    tipo_incidencia: ...reclamoTipo...,
+    nombre_completo: ...reclamoNombre...,
+    tipo_documento: 'No indicado',
+    numero_documento: ...reclamoDocumento...,
+    correo_electronico: ...reclamoEmail...,
+    telefono: ...reclamoTelefono... || null,
+    bien_servicio: ...reclamoBien...,
+    monto_reclamado: monto,
+    detalle_del_hecho: ...reclamoDetalle...,
+    pedido_concreto: ...reclamoPedido...
```

- Se mantuvieron el bien o servicio y el monto en el formulario (son datos relevantes de un libro de reclamaciones), así que se agregan como columnas nuevas (sección 3).
- `tipo_documento` va con el texto fijo `'No indicado'` porque el formulario tiene un solo campo de documento. **Mejora pendiente:** un selector DNI / CE / Pasaporte / RUC (requiere textos nuevos en `i18n-institucional.js`).
- `node --check` pasa sin errores.
- No se tocó ninguna otra función ni el formulario visual.

## 2-bis. Segundo cambio: la opción "Reporte" se veía como "Reclamo"

**Qué pasaba:** el selector del formulario tiene 3 opciones (`reclamo`, `queja`, `reporte`), pero la tercera usaba el mismo texto que la primera (`opt_reclamo`), así que en todos los idiomas se veía "Reclamo" dos veces. El valor que se guarda en la base era correcto; solo el texto visible estaba repetido.

**Archivos:**
- `js/i18n-institucional.js`: se agregó la clave `opt_reporte` en los **17 idiomas**, justo después de `opt_queja`.
- `js/modules/institucional.js`: la tercera opción usa ahora `t('opt_reporte')`, tanto al crear el formulario como al cambiar de idioma (2 sitios).

**Textos agregados:** es "Reporte", en "Report", pt "Denúncia", fr "Signalement", de "Meldung", it "Segnalazione", ru "Сообщение о нарушении", zh "举报", ja "通報", ko "신고", ar "بلاغ", hi "रिपोर्ट", nl "Melding", tr "Bildirim", bg "Сигнал". **Quechua y aimara quedan en español ("Reporte")** a propósito, siguiendo la decisión de no inventar traducciones de esos idiomas.

**Pruebas hechas:** `node --check` sin errores en los 2 archivos; los 17 idiomas tienen `opt_reporte`; la comparación con el zip original confirma que solo cambiaron esas líneas. **Falta:** revisión nativa de las traducciones y probar el selector en varios idiomas en la página real.

Con este cambio, los archivos a subir a GitHub son **2**: `js/modules/institucional.js` y `js/i18n-institucional.js`.

---

## 3. SQL a ejecutar en Supabase (en este orden)

### 3.1 Agregar columnas y código automático

```sql
begin;

alter table libro_reclamaciones
  add column if not exists bien_servicio varchar(300),
  add column if not exists monto_reclamado numeric(12,2);

-- el formulario no pide estos dos datos: que no sean obligatorios
alter table libro_reclamaciones
  alter column tipo_documento drop not null,
  alter column distrito_reclamante drop not null;

create or replace function fn_codigo_reclamo() returns trigger
language plpgsql as $$
begin
  if new.codigo_reclamo is null then
    new.codigo_reclamo := 'LR-' || to_char(now(),'YYYY') || '-' || lpad(new.id::text,6,'0');
  end if;
  return new;
end $$;

drop trigger if exists trg_codigo_reclamo on libro_reclamaciones;
create trigger trg_codigo_reclamo before insert on libro_reclamaciones
  for each row execute function fn_codigo_reclamo();

commit;
```

### 3.2 Cerrar las reglas abiertas

```sql
begin;
drop policy enable_all_auth_libro on libro_reclamaciones;
drop policy "Usuarios ven su propia geolocalización" on usuarios_geolocalizacion;
commit;
```

Con esto nadie puede leer los reclamos desde la página (el formulario solo inserta). El administrador los lee desde el panel de Supabase, que no depende de estas reglas.

### 3.3 Límites de tamaño contra spam (opcional, después de probar)

```sql
alter table mensajes_contacto
  add constraint mc_largos check (char_length(nombre) <= 120 and char_length(email) <= 200 and char_length(mensaje) <= 2000) not valid;

alter table libro_reclamaciones
  add constraint lr_largos check (char_length(detalle_del_hecho) <= 3000 and char_length(pedido_concreto) <= 1500 and char_length(nombre_completo) <= 150) not valid;
```

---

## 4. Cómo comprobar que funcionó

1. [ ] Subir `institucional.js` e `i18n-institucional.js` a GitHub, esperar Vercel, Ctrl+F5.
2. [ ] **Sin iniciar sesión**, enviar un reclamo de prueba desde el Libro de Reclamaciones: debe mostrar "enviado con éxito".
3. [ ] En Supabase, verificar que la fila llegó, con `codigo_reclamo` tipo `LR-2026-000001`.
4. [ ] Con una cuenta normal, comprobar que ya no puede leer la tabla: `supabase.from('libro_reclamaciones').select()` desde la consola debe devolver lista vacía o error.
5. [ ] Probar también el formulario de "Comunícate con el Admin" (no cambió, pero conviene confirmarlo).

## 5. Riesgos y cómo volver atrás

- **Si el envío sigue fallando** después del cambio, el mensaje de error de Supabase dirá qué columna o regla falta. Candidatos: `estado_tramite` (puede ser obligatorio o tener valores permitidos fijos) y `tipo_incidencia` (puede aceptar solo ciertos valores; el formulario manda `reclamo`, `queja` o `reporte`).
- **Revertir las reglas** (deja la tabla abierta otra vez; solo si algo se rompe):

```sql
create policy enable_all_auth_libro on libro_reclamaciones
  for all to authenticated using (true) with check (true);
create policy "Usuarios ven su propia geolocalización" on usuarios_geolocalizacion
  for select to authenticated
  using (((auth.uid())::text = email) OR (email IS NULL));
```

- **Revertir el trigger:** `drop trigger if exists trg_codigo_reclamo on libro_reclamaciones;`. Las columnas nuevas pueden quedarse sin problema (quitarlas borraría los datos que tengan).
- **Lo que no se deshace:** mientras `enable_all_auth_libro` estuvo activa, cualquier usuario con cuenta pudo leer los reclamos. Si ya había reclamos reales, tenerlo presente para la política de privacidad.

## 6. Pendientes

- [ ] Ejecutar 3.1 y 3.2 en Supabase (mejor primero en una copia).
- [ ] Subir `institucional.js` e `i18n-institucional.js` a GitHub y probar (incluye el selector con "Reporte" en varios idiomas).
- [ ] Selector de tipo de documento en el formulario.
- [ ] Límites de tamaño (3.3) y captcha (por ejemplo Cloudflare Turnstile) en "Comunícate con el Admin" y en el libro de reclamaciones.
- [ ] Cuando exista el panel de administrador: mostrar estos textos **siempre con `escHtml`**, porque los escribe cualquier visitante anónimo.
- [ ] Decidir cómo la persona recibe la copia o el código de su reclamo (hoy no se le muestra ni se le envía), y revisar con la normativa peruana vigente qué debe entregarse al consumidor.
- [ ] Anotar este Paso 7 en `BITACORA-SEGURIDAD.md`.

## 7. Registro

| Fecha | Cambio | Resultado |
|---|---|---|
| 06/10/2026 | Consulta de políticas de `libro_reclamaciones`, `mensajes_contacto`, `logs_acceso`, `usuarios_geolocalizacion` | Regla abierta `enable_all_auth_libro` encontrada |
| 06/10/2026 | Intento de límites de tamaño | Error 42703: columna `detalle` no existe (SQL no aplicado) |
| 06/10/2026 | Consulta de columnas reales | Código y tabla no coinciden; formulario probablemente roto |
| 06/10/2026 | `institucional.js` ajustado a las columnas reales | `node --check` OK; falta subirlo y probar |
| 06/10/2026 | Opción "Reporte" con texto propio en 17 idiomas | `node --check` OK; falta subir y probar |
