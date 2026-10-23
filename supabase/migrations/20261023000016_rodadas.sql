-- FF Soccer Pro League · rodadas criadas à mão no painel (passo 3: Times → Grupos → Rodadas → Atletas)
-- A rodada tem número e data; os jogos dela continuam em public.jogos (coluna rodada = número).
-- Uma rodada só pode ser apagada sem jogos (conferido na tela e aqui, por gatilho).

create table if not exists public.rodadas (
  id            uuid primary key default gen_random_uuid(),
  temporada_id  smallint not null references public.temporadas(id),
  numero        int not null check (numero between 1 and 99),
  data          date,
  criado_em     timestamptz not null default now(),
  unique (temporada_id, numero)
);

alter table public.rodadas enable row level security;
create policy "leitura publica" on public.rodadas for select to anon, authenticated using (true);
create policy "equipe insere" on public.rodadas for insert to authenticated with check ((select privado.eh_equipe_ff()));
create policy "equipe altera" on public.rodadas for update to authenticated using ((select privado.eh_equipe_ff())) with check ((select privado.eh_equipe_ff()));
create policy "equipe apaga" on public.rodadas for delete to authenticated using ((select privado.eh_equipe_ff()));

-- Não deixa apagar nem renumerar rodada que já tem jogos.
create or replace function privado.conferir_rodada()
returns trigger language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.jogos where temporada_id = old.temporada_id and rodada = old.numero)
     and (tg_op <> 'UPDATE' or new.numero <> old.numero or new.temporada_id <> old.temporada_id) then
    raise exception 'Esta rodada já tem jogos. Tire os jogos dela antes.';
  end if;
  return coalesce(new, old);
end; $$;
revoke execute on function privado.conferir_rodada() from public, anon, authenticated;
create trigger conferir_rodada before update or delete on public.rodadas for each row execute function privado.conferir_rodada();

-- Histórico também registra rodadas.
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
  end;
  insert into public.historico (user_id, quem, tabela, acao, registro, resumo)
  values (auth.uid(), v_quem, tg_table_name,
          case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'alterou' else 'apagou' end,
          coalesce(r->>'id', r->>'atleta_id'), v_res);
  return null;
end; $$;
revoke execute on function privado.registrar_historico() from public, anon, authenticated;
create trigger historico_rodadas after insert or update or delete on public.rodadas for each row execute function privado.registrar_historico();

-- Rodadas que já têm jogos passam a existir como rodada (data do primeiro jogo, no horário de Brasília).
insert into public.rodadas (temporada_id, numero, data)
select temporada_id, rodada, min((data_hora at time zone 'America/Sao_Paulo')::date)
  from public.jogos group by temporada_id, rodada
on conflict (temporada_id, numero) do nothing;
