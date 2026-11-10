-- Registro de errores de la app: cada fallo de JavaScript en el navegador de un
-- usuario queda anotado acá, para enterarnos sin esperar a que alguien se queje.
create table public.client_errors (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  user_id    uuid,
  agency_id  uuid,
  version    text,
  url        text,
  message    text,
  stack      text,
  ua         text
);
create index client_errors_at_idx on public.client_errors (at desc);
alter table public.client_errors enable row level security;
-- Solo la consultora (platform admin) los lee. Nadie escribe directo: solo por log_error().
create policy client_errors_select on public.client_errors for select to authenticated
  using ((select private.is_platform_admin()));
revoke all on public.client_errors from anon, authenticated;
grant select on public.client_errors to authenticated;

-- La puede llamar cualquiera (también sin sesión): por eso recorta tamaños y tiene tope por hora.
create function public.log_error(p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.client_errors where at > now() - interval '1 hour') >= 300 then return; end if;
  insert into public.client_errors (user_id, agency_id, version, url, message, stack, ua)
  values (auth.uid(), private.agency_id(), left(p->>'version', 40), left(p->>'url', 300),
          left(p->>'message', 500), left(p->>'stack', 4000), left(p->>'ua', 300));
end $$;
revoke all on function public.log_error(jsonb) from public;
grant execute on function public.log_error(jsonb) to anon, authenticated;
