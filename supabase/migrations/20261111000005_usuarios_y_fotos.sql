-- Alta de usuarios por el administrador (sin depender de correos) y fotos de órdenes.

-- ───────── Email visible en el perfil (para listar usuarios) ─────────
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.user_id and p.email is null;

create or replace function private.accept_invitation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare inv public.invitations;
begin
  if new.email_confirmed_at is null then return new; end if;
  if exists (select 1 from public.profiles p where p.user_id = new.id) then return new; end if;
  select * into inv from public.invitations i where i.email = lower(new.email);
  if not found then return new; end if;
  insert into public.profiles (user_id, agency_id, role, client_id, full_name, email)
    values (new.id, inv.agency_id, inv.role, inv.client_id, inv.full_name, lower(new.email));
  if inv.platform_admin then
    insert into public.platform_admins (user_id) values (new.id) on conflict do nothing;
  end if;
  update public.invitations set accepted_at = now() where email = inv.email;
  return new;
end $$;

-- ───────── El administrador crea la cuenta con una contraseña provisoria ─────────
-- La persona entra con esa contraseña y la cambia desde Ajustes. No se envía ningún correo.
create function public.admin_create_user(p_email text, p_password text, p_role text,
                                         p_client_id text default null, p_full_name text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare aid uuid := private.agency_id(); uid uuid := gen_random_uuid(); em text := lower(trim(p_email));
begin
  if aid is null or not private.can_admin(aid) then
    raise exception 'Solo el administrador de la agencia puede crear usuarios' using errcode = '42501';
  end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Email inválido'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'La contraseña debe tener 8 caracteres o más'; end if;
  if p_role not in ('admin','tecnico','cliente') then raise exception 'Rol inválido'; end if;
  if (p_role = 'cliente') <> (p_client_id is not null) then raise exception 'Un usuario cliente necesita su cliente asociado (y solo él)'; end if;
  if p_client_id is not null and not exists (select 1 from public.clients c where c.agency_id = aid and c.id = p_client_id) then
    raise exception 'Ese cliente no existe en la agencia';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = em) then raise exception 'Ya existe una cuenta con ese email'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
          extensions.crypt(p_password, extensions.gen_salt('bf')), now(), now(), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (uid::text, uid, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true, 'phone_verified', false),
          'email', now(), now(), now());
  insert into public.profiles (user_id, agency_id, role, client_id, full_name, email)
  values (uid, aid, p_role, p_client_id, nullif(trim(p_full_name), ''), em)
  on conflict (user_id) do update set agency_id = excluded.agency_id, role = excluded.role, client_id = excluded.client_id,
                                      full_name = excluded.full_name, email = excluded.email, active = true;
  return uid;
end $$;

-- El administrador le pone una contraseña nueva a un usuario de su agencia (si la olvidó).
create function public.admin_reset_password(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = '' as $$
declare aid uuid;
begin
  select agency_id into aid from public.profiles where user_id = p_user;
  if aid is null or not private.can_admin(aid) then
    raise exception 'Solo el administrador de la agencia puede cambiar contraseñas' using errcode = '42501';
  end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'La contraseña debe tener 8 caracteres o más'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_user;
end $$;

-- Un administrador no puede quitarse a sí mismo el acceso ni el rol (evita dejar la agencia sin dueño).
create function private.guard_profile_self() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.user_id = auth.uid() and (new.active is distinct from old.active or new.role is distinct from old.role
                                   or new.agency_id is distinct from old.agency_id) then
    raise exception 'No podés cambiar tu propio rol ni desactivarte';
  end if;
  return new;
end $$;
create trigger guard_self before update on public.profiles for each row execute function private.guard_profile_self();

revoke all on function public.admin_create_user(text,text,text,text,text), public.admin_reset_password(uuid,text) from public, anon;
grant execute on function public.admin_create_user(text,text,text,text,text), public.admin_reset_password(uuid,text) to authenticated;
revoke all on function private.guard_profile_self() from public, anon, authenticated;

-- ───────── Fotos de órdenes (antes / después) ─────────
-- Archivos en Storage, carpeta <agencia>/<orden>/<archivo>. Privado: se ven con enlaces temporales.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ot-fotos', 'ot-fotos', false, 1048576, array['image/jpeg','image/webp','image/png'])
on conflict (id) do nothing;

create function private.foto_agency(name text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin return split_part(name, '/', 1)::uuid; exception when others then return null; end $$;

create function private.owns_ot(aid uuid, otid text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.work_orders o
                 where o.agency_id = aid and o.id = otid and private.owns_machine(o.agency_id, o.machine_id))
$$;
grant execute on function private.foto_agency(text), private.owns_ot(uuid, text) to authenticated;

create policy ot_fotos_select on storage.objects for select to authenticated
  using (bucket_id = 'ot-fotos' and (private.can_staff(private.foto_agency(name))
         or private.owns_ot(private.foto_agency(name), split_part(name, '/', 2))));
create policy ot_fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'ot-fotos' and private.can_staff(private.foto_agency(name)));
create policy ot_fotos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'ot-fotos' and private.can_staff(private.foto_agency(name)));
