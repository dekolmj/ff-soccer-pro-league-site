-- FF Soccer Pro League · patrocinadores (faixa de logos antes do rodapé, em todas as páginas)
-- A equipe FF cadastra pelo painel (aba Patrocinadores): nome, logo, link, ordem e se aparece no site.
-- O site lê só os que estão "no site". Só administrador apaga. Histórico registra as mudanças.

create table if not exists public.patrocinadores (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (char_length(nome) between 1 and 60),
  logo_url   text check (logo_url is null or char_length(logo_url) <= 400),
  link       text check (link is null or (char_length(link) <= 300 and link ~* '^https?://')),
  ordem      int not null default 0 check (ordem between 0 and 999),
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

alter table public.patrocinadores enable row level security;
create policy "publico ve ativos" on public.patrocinadores for select to anon using (ativo);
create policy "logado ve ativos e equipe ve todos" on public.patrocinadores for select to authenticated using (ativo or (select privado.eh_equipe_ff()));
create policy "equipe insere" on public.patrocinadores for insert to authenticated with check ((select privado.eh_equipe_ff()));
create policy "equipe altera" on public.patrocinadores for update to authenticated using ((select privado.eh_equipe_ff())) with check ((select privado.eh_equipe_ff()));
create policy "admin apaga" on public.patrocinadores for delete to authenticated using ((select privado.eh_admin_ff()));

-- Histórico também registra patrocinadores.
create or replace function privado.registrar_historico()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r jsonb := to_jsonb(coalesce(new, old)); v_quem text; v_res text;
begin
  select nome into v_quem from public.equipe_ff where user_id = auth.uid();
  if v_quem is null and auth.uid() is null then return null; end if;
  v_res := case tg_table_name
    when 'times'    then r->>'nome'
    when 'atletas'  then r->>'nome'
    when 'elencos'  then (select a.nome from public.atletas a where a.id = (r->>'atleta_id')::uuid) || ' · ' || coalesce(r->>'time_id','') || ' nº ' || coalesce(r->>'numero','')
    when 'jogos'    then (select t.nome from public.temporadas t where t.id = (r->>'temporada_id')::smallint) || ' · rodada ' || coalesce(r->>'rodada','')
                         || ' · ' || coalesce(r->>'time_casa','') || ' x ' || coalesce(r->>'time_fora','')
                         || case when (r->>'sumula_fechada')::boolean then ' · súmula fechada' else '' end
    when 'rodadas'  then (select t.nome from public.temporadas t where t.id = (r->>'temporada_id')::smallint) || ' · rodada ' || coalesce(r->>'numero','')
                         || coalesce(' · ' || to_char((r->>'data')::date, 'DD/MM/YYYY'), '')
    when 'transmissao' then case when (r->>'no_ar')::boolean then 'ligada' else 'desligada' end || coalesce(' · ' || nullif(r->>'titulo',''), '')
    when 'patrocinadores' then r->>'nome' || case when (r->>'ativo')::boolean then '' else ' · fora do site' end
  end;
  insert into public.historico (user_id, quem, tabela, acao, registro, resumo)
  values (auth.uid(), v_quem, tg_table_name,
          case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'alterou' else 'apagou' end,
          coalesce(r->>'id', r->>'atleta_id'), v_res);
  return null;
end; $$;
revoke execute on function privado.registrar_historico() from public, anon, authenticated;
create trigger historico_patrocinadores after insert or update or delete on public.patrocinadores for each row execute function privado.registrar_historico();
