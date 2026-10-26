-- FF Soccer Pro League · transmissão ao vivo (aba Ao vivo do painel)
-- Uma linha só: o link da live do YouTube (ou do canal), um título e se está no ar.
-- O site lê esta linha na página Ao vivo; só a equipe FF altera. Histórico registra quem ligou e desligou.

create table if not exists public.transmissao (
  id             smallint primary key default 1 check (id = 1),
  link           text check (link is null or char_length(link) <= 300),
  titulo         text check (titulo is null or char_length(titulo) <= 80),
  no_ar          boolean not null default false,
  atualizado_em  timestamptz not null default now()
);
insert into public.transmissao (id) values (1) on conflict (id) do nothing;

alter table public.transmissao enable row level security;
create policy "leitura publica" on public.transmissao for select to anon, authenticated using (true);
create policy "equipe altera" on public.transmissao for update to authenticated using ((select privado.eh_equipe_ff())) with check ((select privado.eh_equipe_ff()));

-- Histórico também registra a transmissão.
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
  end;
  insert into public.historico (user_id, quem, tabela, acao, registro, resumo)
  values (auth.uid(), v_quem, tg_table_name,
          case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'alterou' else 'apagou' end,
          coalesce(r->>'id', r->>'atleta_id'), v_res);
  return null;
end; $$;
revoke execute on function privado.registrar_historico() from public, anon, authenticated;
create trigger historico_transmissao after update on public.transmissao for each row execute function privado.registrar_historico();
