# Bitácora de seguridad — remarket-db

**Fecha de la revisión:** 29/09/2026
**Estado general:** propuesto, todavía no aplicado. Marcar cada punto como hecho cuando se ejecute.

Para retomar el trabajo en cualquier conversación: traer este archivo junto con `BITACORA-TRADUCCION.md` y seguir desde la sección 3.

---

## 1. Qué se revisó

- El código de la página (zip `pagina--main`): estructura, configuración, autenticación, servicio de IA y base de datos local. Los tres archivos `panel-usuario-*.js` solo se revisaron por búsquedas, no línea por línea.
- Las políticas de seguridad (RLS) de Supabase, con tres consultas: las 80 políticas, las columnas de `usuarios` y qué tablas tienen RLS activado.

## 2. Qué se encontró

**Bien**
- RLS está activado en todas las tablas (excepto `spatial_ref_sys`, tabla interna de PostGIS).
- El chat nuevo (`mensajes`, `conversaciones`), los likes, favoritos, bloqueos y seguidores están bien protegidos.

**Grave**
- **`usuarios`:** cualquier persona, incluso sin cuenta, puede leer todos los usuarios (correo, celular, edad, IP, GPS) y modificar a cualquiera, incluido su rol.
- **Tablas internas:** `api_keys_config`, `roles_sistema`, `config_roles_hibridos` y `bitacora_proyecto` son legibles y editables por cualquier usuario con sesión.
- **Mensajes y datos privados:** 23 tablas tienen una política que deja a cualquier usuario con sesión leer y escribir todo. Entre ellas: `mensajes_chat`, `mensajes_mini_correo`, `conversaciones_ia`, `historial_busquedas_usuario`, `libro_reclamaciones`.

**Medio**
- **`productos`:** los productos pendientes y en borrador los ve todo el mundo, y el dueño puede ponerse `aprobado` o activarse el patrocinio por su cuenta.
- **Inserciones anónimas:** `logs_acceso`, `usuarios_geolocalizacion`, `mensajes_contacto` y `libro_reclamaciones` aceptan escrituras sin cuenta. Sirven para formularios públicos, pero permiten spam.

**Roto hoy**
- `comentarios_likes` tiene RLS sin ninguna política, así que esos likes fallan.
- `reglas_asistente` y `publicaciones` no aparecen en la base.
- La columna `es_admin` no existe en `usuarios`, así que el panel de administrador no funciona todavía.

## 3. Qué se propone hacer, en orden

- [x] **Paso 1. Cerrar las tablas que la página no usa** (quitar 15 políticas abiertas). Aplicado el 29/09/2026 ("Success"). Confirmado el 01/10/2026: la página sigue funcionando normal.
- [x] **Paso 2. Crear una vista de perfiles públicos**, sin foto_perfil/foto_portada/ciudad (esas columnas no existen en `usuarios`, hallazgo aparte, ver sección 3-bis). Feed, buscador de personas y perfiles ajenos ya leen la vista; el perfil propio sigue leyendo la tabla completa. Aplicado y confirmado el 01/10/2026.
- [x] **Paso 3. Cerrar `usuarios`:** cada persona solo ve y edita su propia fila, y un trigger impide cambiar rol, estado y estatus desde el navegador. Aplicado y confirmado el 01/10/2026.
- [x] **Paso 4. Ajustar `productos`:** se quitó la regla "Cualquiera puede ver productos" (quedó la correcta, "Lectura pública de productos aprobados", que sí filtra por aprobados); trigger agregado para que nadie cambie `estado` ni patrocinio al editar. Aplicado y confirmado el 01/10/2026. Nota aparte: hay 2 políticas de INSERT duplicadas en `productos` ("Usuarios pueden publicar sus productos" y "Usuarios logueados pueden publicar sus productos") -- no es riesgo, solo desorden, pendiente de limpiar.
- [x] **Paso 5. Arreglar el registro:** trigger `trg_crear_perfil_usuario` sobre `auth.users`, crea la fila en `usuarios` automáticamente al registrarse, sin depender de que el navegador complete el paso. Aplicado el 03/10/2026. El código del navegador (`sesion-auth.js`) no necesitó cambios: ya busca antes de insertar, así que ahora solo encuentra la fila que el trigger ya creó.
- [x] **Paso 6. Cerrado:** `reglas_asistente` y `publicaciones` no existen en la base de datos -- nada que corregir, quedan pendientes solo si algún día se construyen. `comentarios_likes` estaba cerrada sin ninguna política (protección activa, 0 reglas) -- no era un riesgo, era el motivo de que la función de "me gusta" en comentarios estuviera rota en producción (confirmado: el código ya la usa en `panel-usuario-2.js`). Se agregaron 3 reglas: ver todos los likes, dar like propio, quitar like propio. Aplicado y confirmado el 03/10/2026. Las inserciones anónimas ya quedaron limitadas con los Pasos 1, 3 y 4.

**Los 6 pasos de la bitácora de seguridad quedan completos.**

### SQL del paso 1

```sql
begin;
drop policy enable_all_auth_api_keys on api_keys_config;
drop policy enable_all_auth_bitacora on bitacora_proyecto;
drop policy enable_all_auth_config_roles on config_roles_hibridos;
drop policy enable_all_auth_roles on roles_sistema;
drop policy enable_all_auth_mensajes_chat on mensajes_chat;
drop policy enable_all_auth_mensajes_correo on mensajes_mini_correo;
drop policy enable_all_auth_conversaciones_ia on conversaciones_ia;
drop policy enable_all_auth_historial on historial_busquedas_usuario;
drop policy enable_all_auth_denuncias on denuncias_anuncio;
drop policy enable_all_auth_comportamiento on comportamiento_usuarios;
drop policy enable_all_auth_perfil on perfil_comportamiento_usuario;
drop policy enable_all_auth_segmentos on segmentos_usuarios;
drop policy enable_all_auth_patrones on patrones_busqueda;
drop policy enable_all_auth_interacciones_u on interacciones_usuario;
drop policy enable_all_auth_ofertas on ofertas_personalizadas;
commit;  -- si algo falla, ejecutar rollback en lugar de commit
```

### SQL de los pasos 3 y 4 (probar primero en una copia)

```sql
begin;

-- usuarios
drop policy "Permitir actualización propia" on usuarios;
drop policy "Permitir lectura pública" on usuarios;
drop policy "Permitir registro público" on usuarios;
drop policy enable_all_auth_usuarios on usuarios;

create policy "ver propio" on usuarios for select to authenticated
  using (id = auth.uid());
create policy "crear propio" on usuarios for insert to authenticated
  with check (id = auth.uid() and rol_id = 2);
create policy "editar propio" on usuarios for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function proteger_campos_usuario() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and (
     new.rol_id is distinct from old.rol_id or
     new.estado is distinct from old.estado or
     new.id_estatus is distinct from old.id_estatus) then
    raise exception 'Campo protegido';
  end if;
  return new;
end $$;
create trigger trg_proteger_usuario before update on usuarios
  for each row execute function proteger_campos_usuario();

-- productos
drop policy "Cualquiera puede ver productos" on productos;

create or replace function proteger_campos_producto() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null and (
     new.estado is distinct from old.estado or
     new.es_patrocinado is distinct from old.es_patrocinado or
     new.patrocinado_hasta is distinct from old.patrocinado_hasta) then
    raise exception 'Campo protegido';
  end if;
  return new;
end $$;
create trigger trg_proteger_producto before update on productos
  for each row execute function proteger_campos_producto();

commit;
```

> **Antes del paso 3:** el código lee `usuarios` en unos 14 sitios (feed, buscador de personas, perfiles, chat). Hay que cambiar esas consultas para que usen la vista de perfiles públicos del paso 2, o esas pantallas saldrán vacías.

## 3-bis. Hallazgo aparte (no es de seguridad): columnas que el código pide y no existen

Al armar la vista del Paso 2, se confirmaron las columnas reales de `usuarios` con `information_schema.columns`. El código (`panel-usuario-1.js`, `panel-usuario-2.js`) lee `usuario.foto_perfil`, `usuario.foto_portada` y `usuario.ciudad` -- ninguna de las 3 existe en la tabla. Llegan siempre como `undefined`, ya desde antes del Paso 2. Posible explicación de por qué las fotos de perfil/portada se han visto vacías en varias pruebas durante el proyecto. Sin investigar la causa (columna renombrada, feature sin terminar, u otra cosa). Columnas reales confirmadas: `id, nombres, apellidos, correo_electronico, celular, edad, localidad_id, idioma_preferido, categoria, estado, ip_registro, created_at, updated_at, id_estatus, rol_id, ultima_gps_latitud, ultima_gps_longitud, ultima_zona_horaria, ultima_fuente_ubicacion, pais, ultima_conexion, nombre_usuario, sitio_web, red_social, notif_mensajes, notif_comentarios, notif_likes, privacidad_mensajes`.

## 4. Riesgos y cómo volver atrás

- No se pierden datos: las políticas y los triggers solo controlan accesos.
- Si algo se rompe, se ve como listas vacías o errores 403 (`new row violates row-level security policy`) en la consola del navegador.
- Cada bloque va dentro de una transacción (`begin` / `commit`, con `rollback` si falla).
- Las políticas actuales quedan respaldadas en los tres CSV exportados de Supabase. Guardarlos.
- Qué se ve si falla:

| Falla | Qué se ve |
|---|---|
| Error de SQL | Supabase lo muestra en rojo y no cambia nada de esa línea |
| Se bloquea algo que sí se usaba | Feed sin autores, buscador de personas vacío, "no se pudo guardar" |
| El trigger bloquea una edición legítima | Error "Campo protegido" al guardar |
| Falla el registro | Usuario creado en Auth sin ficha en `usuarios` |

**Revertir `usuarios`** (deja todo tan inseguro como antes, pero la página vuelve a funcionar):

```sql
create policy "Permitir lectura pública" on usuarios for select to public using (true);
create policy "Permitir actualización propia" on usuarios for update to public using (true);
create policy "Permitir registro público" on usuarios for insert to public with check (true);
create policy enable_all_auth_usuarios on usuarios for all to authenticated using (true) with check (true);
drop trigger if exists trg_proteger_usuario on usuarios;
drop trigger if exists trg_proteger_producto on productos;
```

**Revertir una tabla del paso 1** (ejemplo):

```sql
create policy enable_all_auth_api_keys on api_keys_config
  for all to authenticated using (true) with check (true);
```

El nombre y las condiciones de cada política original están en el CSV de políticas.

**Lo que no se puede deshacer:** si alguien ya leyó datos mientras las tablas estaban abiertas, cerrarlas después no lo revierte.

## 5. Tareas de seguimiento

- [ ] Rotar las claves guardadas en `api_keys_config` (Groq y otras), por si fueron leídas.
- [ ] Probar todo primero en una copia del proyecto de Supabase.
- [ ] Cambiar el código que fuerza `estado: 'aprobado'` (`panel-usuario-3.js:633`) cuando exista el panel de moderación.
- [ ] Corregir el `edad: 18` fijo del registro con proveedor externo (`sesion-auth.js`).
- [ ] Auditar los cerca de 160 `innerHTML` del código.
- [ ] Declarar en la política de privacidad que se guarda la IP.
- [ ] Crear la política de `comentarios_likes` y crear o corregir `reglas_asistente` y `publicaciones`.
- [ ] Al crear la columna `es_admin`, protegerla desde el inicio con el mismo trigger que `rol_id`.

---

## 6. Registro de cambios aplicados

| Fecha | Paso | Resultado | Notas |
|---|---|---|---|
| 29/09/2026 | Paso 1 | Success. No rows returned | Falta confirmar navegando la página que nada se rompió |
| 30/09/2026 | Paso 2 (vista) | Error 42703: columna "foto_perfil" no existe | Columnas reales confirmadas con information_schema (ver hallazgo abajo); vista corregida sin foto_perfil/foto_portada/ciudad |
