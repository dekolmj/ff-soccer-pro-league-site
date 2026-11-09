-- FF Soccer Pro League · cliques nos patrocinadores (09/11/2026, a pedido do Deko).
-- Cada clique num logo da faixa de patrocinadores do site é anotado: só qual patrocinador e quando (nada de quem clicou).
-- O site anota pela função registrar_clique_patro(); a equipe FF vê os números no painel (aba Patrocinadores) pela cliques_patrocinadores().
create table if not exists public.patro_cliques (
  id              bigserial primary key,
  patrocinador_id uuid not null references public.patrocinadores(id) on delete cascade,
  quando          timestamptz not null default now()
);
create index if not exists patro_cliques_patro_quando on public.patro_cliques (patrocinador_id, quando desc);
alter table public.patro_cliques enable row level security;  -- sem políticas: ninguém lê ou grava direto, só pelas funções abaixo
revoke all on public.patro_cliques from anon, authenticated;

create or replace function public.registrar_clique_patro(patrocinador uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- só patrocinador que está no site e tem link; no máximo 60 cliques por minuto para o mesmo patrocinador (evita robô inflando o número)
  if not exists (select 1 from public.patrocinadores p where p.id = patrocinador and p.ativo and p.link is not null) then return; end if;
  if (select count(*) from public.patro_cliques c where c.patrocinador_id = patrocinador and c.quando > now() - interval '1 minute') >= 60 then return; end if;
  insert into public.patro_cliques (patrocinador_id) values (patrocinador);
end; $$;
revoke execute on function public.registrar_clique_patro(uuid) from public;
grant execute on function public.registrar_clique_patro(uuid) to anon, authenticated;

create or replace function public.cliques_patrocinadores()
returns table (patrocinador_id uuid, total bigint, ultimos_7_dias bigint, ultimo timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.patrocinador_id, count(*), count(*) filter (where c.quando > now() - interval '7 days'), max(c.quando)
    from public.patro_cliques c
   where (select privado.eh_equipe_ff())
   group by c.patrocinador_id;
$$;
revoke execute on function public.cliques_patrocinadores() from public, anon;
grant execute on function public.cliques_patrocinadores() to authenticated;
