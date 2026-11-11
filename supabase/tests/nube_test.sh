#!/bin/bash
# Prueba nube.js contra la base real usando una agencia y dos usuarios de prueba
# que se crean al empezar y se borran al terminar (pase lo que pase).
# Uso (desde la raíz del repo):  bash supabase/tests/nube_test.sh        (capa de datos)
#                                 bash supabase/tests/nube_test.sh ui     (app completa)
# Requiere: .env con SUPABASE_URL y SUPABASE_ANON_KEY, supabase CLI vinculada, node.
set -uo pipefail
cd "$(dirname "$0")/../.."
[ -f ./.env ] && { set -a; . ./.env; set +a; }

DEPS="${TMPDIR:-/tmp}/terrafleet-test-deps"
[ -d "$DEPS/node_modules/jsdom" ] || npm install --silent --prefix "$DEPS" @supabase/supabase-js@2.45.4 jsdom@24 >/dev/null
export TEST_DEPS="$DEPS"
export SUPABASE_JS="$DEPS/node_modules/@supabase/supabase-js"

RND="$(openssl rand -hex 6)"
export T_PW="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20)"
export T_STAFF="zz-staff-$RND@test.invalid" T_CLI="zz-cli-$RND@test.invalid"
# SQL de administración: en GitHub Actions va por psql (docker); en la Mac, por la CLI de Supabase.
if [ -n "${GITHUB_ACTIONS:-}" ]; then
  q() { printf '%s' "$1" | docker run --rm -i -e SUPABASE_DB_URL postgres:17 sh -c 'psql "$SUPABASE_DB_URL" -q -v ON_ERROR_STOP=1 -f -' 2>&1 | grep -E "ERROR|error" ; }
else
  q() { supabase db query --linked "$1" 2>&1 | grep -E "ERROR|error" | grep -v -i "version" ; }
fi

limpiar() {
  q "do \$\$ declare a uuid; begin
       for a in select id from public.agencies where name = 'ZZ PRUEBA NUBE' loop
         delete from public.machine_history where agency_id = a;
         delete from public.work_order_parts where agency_id = a;
         delete from public.work_orders where agency_id = a;
         delete from public.notifications where agency_id = a;
         delete from public.parts where agency_id = a;
         delete from public.catalog_models where agency_id = a;
         delete from public.invitations where agency_id = a;
         delete from public.machines where agency_id = a;
         delete from auth.users where id in (select user_id from public.profiles where agency_id = a);
         delete from public.clients where agency_id = a;
         delete from public.audit_log where agency_id = a;
         delete from public.client_errors where agency_id = a;
         delete from public.agencies where id = a;
       end loop;
       delete from public.client_errors where message in ('ping') or message like '%error de prueba ZZ%';
       delete from public.audit_log where table_name = 'agencies' and coalesce(new_row->>'name', old_row->>'name') = 'ZZ PRUEBA NUBE';
     end \$\$;"
}
trap limpiar EXIT
limpiar

q "do \$\$ declare a uuid := gen_random_uuid(); s uuid := gen_random_uuid(); c uuid := gen_random_uuid(); begin
     insert into public.agencies (id, name) values (a, 'ZZ PRUEBA NUBE');
     insert into public.clients (agency_id, id, name) values (a, 'c1', 'placeholder');
     insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                             raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new)
       values ('00000000-0000-0000-0000-000000000000', s, 'authenticated', 'authenticated', '$T_STAFF', extensions.crypt('$T_PW', extensions.gen_salt('bf')), now(), now(), now(),
               '{\"provider\":\"email\",\"providers\":[\"email\"]}', '{}', '', '', '', ''),
              ('00000000-0000-0000-0000-000000000000', c, 'authenticated', 'authenticated', '$T_CLI', extensions.crypt('$T_PW', extensions.gen_salt('bf')), now(), now(), now(),
               '{\"provider\":\"email\",\"providers\":[\"email\"]}', '{}', '', '', '', '');
     insert into public.profiles (user_id, agency_id, role, client_id) values (s, a, 'admin', null), (c, a, 'cliente', 'c1');
   end \$\$;"

if [ "${1:-}" = "ui" ]; then node supabase/tests/ui_test.mjs; else node supabase/tests/nube_test.mjs; fi
