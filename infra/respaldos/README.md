# TerraFleet — respaldos de la base de datos

Repositorio **privado**. Cada día a las 03:00 (hora Argentina) GitHub guarda acá una
copia completa de la base de Supabase (proyecto MAQ-TRA BARADERO).

- `respaldos/AAAA-MM-DD.sql.gz` — copia del día (se conservan las últimas 60).
- Contiene los datos del negocio (esquemas `public` y `private`) y las cuentas de
  usuario (`auth.users`, con las contraseñas cifradas tal como las guarda Supabase).
- La copia también mantiene activo el proyecto gratuito (Supabase pausa los
  proyectos sin actividad durante 7 días).

## Restaurar

1. Crear un proyecto Supabase nuevo (o usar uno vacío).
2. `gunzip -c respaldos/AAAA-MM-DD.sql.gz | psql "<cadena de conexión del proyecto>"`
3. Apuntar la app al proyecto nuevo (URL y clave pública en `js/06-nube-ui.js`).

## Correr una copia a mano

Pestaña **Actions** → "Respaldo diario" → **Run workflow**.

La cadena de conexión está en el secreto `SUPABASE_DB_URL` de este repo. Si se cambia
la contraseña de la base hay que actualizarlo.
