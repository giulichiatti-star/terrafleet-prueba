-- Catálogo de productos, invitaciones de usuarios, numeración a prueba de choques
-- y el proceso diario de alertas (planteado, NO programado).

-- ───────── Catálogo de productos de la agencia ─────────
-- Se carga una vez; en el alta de máquina se elige de acá (o se tipea a mano).
create table public.catalog_models (
  agency_id     uuid not null references public.agencies(id) on delete restrict,
  id            text not null,
  brand         text not null,
  model         text not null,
  icon_key      text,
  service_group text,               -- plantilla de mantenimiento (mini | lovol | …)
  interval_h    numeric,
  interval_m    numeric,
  sale_price    numeric,
  service_price numeric,
  active        boolean not null default true,
  data          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (agency_id, id),
  unique (agency_id, brand, model)
);
create trigger touch before update on public.catalog_models for each row execute function private.touch_updated_at();
create trigger audit after insert or update or delete on public.catalog_models for each row execute function private.audit();
alter table public.catalog_models enable row level security;
-- Lo lee toda la agencia (el cliente ve el modelo de su máquina); lo edita el personal.
create policy catalog_select on public.catalog_models for select to authenticated
  using (private.can_staff(agency_id) or agency_id = (select private.agency_id()));
create policy catalog_insert on public.catalog_models for insert to authenticated
  with check (private.can_staff(agency_id));
create policy catalog_update on public.catalog_models for update to authenticated
  using (private.can_staff(agency_id)) with check (private.can_staff(agency_id));
create policy catalog_delete on public.catalog_models for delete to authenticated
  using (private.can_staff(agency_id));
grant select, insert, update, delete on public.catalog_models to authenticated;

-- ───────── Invitaciones ─────────
-- El admin anota un email con su rol; cuando esa persona crea su cuenta (y confirma
-- el email), queda vinculada sola a la agencia. Sin invitación, una cuenta no ve nada.
create table public.invitations (
  email          text primary key check (email = lower(email)),
  agency_id      uuid not null references public.agencies(id) on delete cascade,
  role           text not null check (role in ('admin','tecnico','cliente')),
  client_id      text,
  full_name      text,
  platform_admin boolean not null default false,
  created_at     timestamptz not null default now(),
  accepted_at    timestamptz,
  foreign key (agency_id, client_id) references public.clients(agency_id, id) on delete cascade,
  check ((role = 'cliente') = (client_id is not null))
);
alter table public.invitations enable row level security;
create policy invitations_all on public.invitations for all to authenticated
  using (private.can_admin(agency_id))
  with check (private.can_admin(agency_id) and (not platform_admin or (select private.is_platform_admin())));
grant select, insert, update, delete on public.invitations to authenticated;

-- Vincula la cuenta recién confirmada con su invitación.
create function private.accept_invitation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare inv public.invitations;
begin
  if new.email_confirmed_at is null then return new; end if;
  if exists (select 1 from public.profiles p where p.user_id = new.id) then return new; end if;
  select * into inv from public.invitations i where i.email = lower(new.email);
  if not found then return new; end if;
  insert into public.profiles (user_id, agency_id, role, client_id, full_name)
    values (new.id, inv.agency_id, inv.role, inv.client_id, inv.full_name);
  if inv.platform_admin then
    insert into public.platform_admins (user_id) values (new.id) on conflict do nothing;
  end if;
  update public.invitations set accepted_at = now() where email = inv.email;
  return new;
end $$;
create trigger accept_invitation after insert or update of email_confirmed_at on auth.users
  for each row execute function private.accept_invitation();

-- ───────── Numeración: el contador nunca queda atrás de una orden creada ─────────
create function private.bump_order_seq() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if new.id ~ '^OT-[0-9]+$' then
    n := substring(new.id from 4)::integer;
    update public.agencies set ot_seq = n where id = new.agency_id and ot_seq < n;
  elsif new.id ~ '^SAT-[0-9]+$' then
    n := substring(new.id from 5)::integer;
    update public.agencies set sat_seq = n where id = new.agency_id and sat_seq < n;
  end if;
  return new;
end $$;
create trigger bump_seq after insert on public.work_orders
  for each row execute function private.bump_order_seq();

-- ───────── Proceso diario de alertas (planteado, NO activo) ─────────
-- alert_outbox es la cola de avisos por email. Hoy nadie la envía.
-- Para activarlo más adelante: (1) programar private.daily_alerts() con pg_cron,
-- (2) una función que lea alert_outbox con sent_at nulo y mande los correos.
create table public.alert_outbox (
  id          bigint generated always as identity primary key,
  agency_id   uuid not null references public.agencies(id) on delete cascade,
  client_id   text,
  machine_id  text,
  kind        text not null,        -- service_proximo | service_vencido | garantia_por_vencer
  to_email    text,
  subject     text not null,
  body        text not null,
  dedupe_key  text not null,        -- evita repetir el mismo aviso
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,
  unique (agency_id, dedupe_key)
);
alter table public.alert_outbox enable row level security;
create policy alert_outbox_select on public.alert_outbox for select to authenticated
  using (private.can_staff(agency_id));
revoke all on public.alert_outbox from authenticated;
grant select on public.alert_outbox to authenticated;

-- Revisa todas las máquinas y encola los avisos que correspondan (una vez por evento).
-- El estado (soon/overdue) lo calcula la app y lo guarda en data.stage.
create function private.daily_alerts() returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer := 0; k integer;
begin
  insert into public.alert_outbox (agency_id, client_id, machine_id, kind, to_email, subject, body, dedupe_key)
  select m.agency_id, m.client_id, m.id,
         case m.data->>'stage' when 'overdue' then 'service_vencido' else 'service_proximo' end,
         nullif(c.email,''),
         case m.data->>'stage' when 'overdue' then 'Service vencido: ' else 'Service próximo: ' end
           || coalesce(m.brand,'') || ' ' || coalesce(m.model,''),
         'Equipo ' || coalesce(m.brand,'') || ' ' || coalesce(m.model,'') || ' · ' || m.hours || ' h. '
           || 'Ingresá al portal para pedir turno.',
         'service:' || m.id || ':' || (m.data->>'stage') || ':' || coalesce(m.data->>'lastServiceHours','0')
    from public.machines m join public.clients c on c.agency_id = m.agency_id and c.id = m.client_id
   where m.data->>'stage' in ('soon','overdue')
  on conflict (agency_id, dedupe_key) do nothing;
  get diagnostics k = row_count; n := n + k;

  insert into public.alert_outbox (agency_id, client_id, machine_id, kind, to_email, subject, body, dedupe_key)
  select m.agency_id, m.client_id, m.id, 'garantia_por_vencer', nullif(c.email,''),
         'Garantía por vencer: ' || coalesce(m.brand,'') || ' ' || coalesce(m.model,''),
         'La garantía vence el ' || to_char((m.data->>'warrantyEnd')::date, 'DD/MM/YYYY') || '.',
         'garantia:' || m.id || ':' || (m.data->>'warrantyEnd')
    from public.machines m join public.clients c on c.agency_id = m.agency_id and c.id = m.client_id
   where (m.data->>'warrantyEnd') ~ '^\d{4}-\d{2}-\d{2}$'
     and (m.data->>'warrantyEnd')::date between current_date and current_date + 30
  on conflict (agency_id, dedupe_key) do nothing;
  get diagnostics k = row_count; n := n + k;
  return n;
end $$;
revoke all on function private.daily_alerts() from public, anon, authenticated;
revoke all on function private.accept_invitation(), private.bump_order_seq() from public, anon, authenticated;
