-- FF Soccer Pro League · quem pode ler e gravar cada coisa (RLS)
--
-- Resumo:
--   visitante (anon)       lê dados da liga (times, atletas, jogos, súmula, prêmios, avisos públicos);
--                          envia pré-inscrição só pela função enviar_pre_inscricao().
--   atleta logado          + lê os próprios dados privados, fotos publicadas e avisos internos.
--   equipe FF              lê e grava tudo pelo painel.
--   admin FF               + gerencia a equipe e apaga inscrições.

alter table public.equipe_ff        enable row level security;
alter table public.temporadas       enable row level security;
alter table public.unidades         enable row level security;
alter table public.times            enable row level security;
alter table public.atletas          enable row level security;
alter table public.atletas_privado  enable row level security;
alter table public.elencos          enable row level security;
alter table public.jogos            enable row level security;
alter table public.escalacoes       enable row level security;
alter table public.eventos_jogo     enable row level security;
alter table public.desafios_var     enable row level security;
alter table public.premios          enable row level security;
alter table public.fotos            enable row level security;
alter table public.fotos_atletas    enable row level security;
alter table public.avisos           enable row level security;
alter table public.pre_inscricoes   enable row level security;

-- Tabelas públicas da liga: todo mundo lê, só a equipe FF grava.
do $$
declare t text;
begin
  foreach t in array array['temporadas','unidades','times','atletas','elencos','jogos',
                           'escalacoes','eventos_jogo','desafios_var','premios'] loop
    execute format('create policy "leitura publica" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "equipe insere" on public.%I for insert to authenticated with check ((select public.eh_equipe_ff()))', t);
    execute format('create policy "equipe altera" on public.%I for update to authenticated using ((select public.eh_equipe_ff())) with check ((select public.eh_equipe_ff()))', t);
    execute format('create policy "equipe apaga" on public.%I for delete to authenticated using ((select public.eh_equipe_ff()))', t);
  end loop;
end $$;

-- Dados privados do atleta: o próprio atleta e a equipe FF.
create policy "dono ou equipe le" on public.atletas_privado for select to authenticated
  using ((select public.eh_equipe_ff())
         or atleta_id in (select id from public.atletas where user_id = (select auth.uid())));
create policy "equipe insere" on public.atletas_privado for insert to authenticated
  with check ((select public.eh_equipe_ff()));
create policy "equipe altera" on public.atletas_privado for update to authenticated
  using ((select public.eh_equipe_ff())) with check ((select public.eh_equipe_ff()));
create policy "equipe apaga" on public.atletas_privado for delete to authenticated
  using ((select public.eh_equipe_ff()));

-- Fotos: atletas logados veem as publicadas; a equipe vê e gerencia todas.
create policy "logado ve publicadas" on public.fotos for select to authenticated
  using (publicada or (select public.eh_equipe_ff()));
create policy "equipe insere" on public.fotos for insert to authenticated
  with check ((select public.eh_equipe_ff()));
create policy "equipe altera" on public.fotos for update to authenticated
  using ((select public.eh_equipe_ff())) with check ((select public.eh_equipe_ff()));
create policy "equipe apaga" on public.fotos for delete to authenticated
  using ((select public.eh_equipe_ff()));

create policy "logado ve marcacoes" on public.fotos_atletas for select to authenticated
  using (exists (select 1 from public.fotos f where f.id = foto_id
                 and (f.publicada or (select public.eh_equipe_ff()))));
create policy "equipe insere" on public.fotos_atletas for insert to authenticated
  with check ((select public.eh_equipe_ff()));
create policy "equipe apaga" on public.fotos_atletas for delete to authenticated
  using ((select public.eh_equipe_ff()));

-- Avisos: públicos para todos; internos só para logados; rascunhos só para a equipe.
create policy "visitante ve publicos" on public.avisos for select to anon
  using (publico and publicado_em is not null and publicado_em <= now());
create policy "logado ve publicados" on public.avisos for select to authenticated
  using ((publicado_em is not null and publicado_em <= now()) or (select public.eh_equipe_ff()));
create policy "equipe insere" on public.avisos for insert to authenticated
  with check ((select public.eh_equipe_ff()));
create policy "equipe altera" on public.avisos for update to authenticated
  using ((select public.eh_equipe_ff())) with check ((select public.eh_equipe_ff()));
create policy "equipe apaga" on public.avisos for delete to authenticated
  using ((select public.eh_equipe_ff()));

-- Pré-inscrições: ninguém de fora lê nem grava direto (só pela função).
create policy "equipe le" on public.pre_inscricoes for select to authenticated
  using ((select public.eh_equipe_ff()));
create policy "equipe analisa" on public.pre_inscricoes for update to authenticated
  using ((select public.eh_equipe_ff())) with check ((select public.eh_equipe_ff()));
create policy "admin apaga" on public.pre_inscricoes for delete to authenticated
  using ((select public.eh_admin_ff()));

-- Equipe FF: a equipe se vê; só admin adiciona ou remove.
create policy "equipe se ve" on public.equipe_ff for select to authenticated
  using ((select public.eh_equipe_ff()));
create policy "admin insere" on public.equipe_ff for insert to authenticated
  with check ((select public.eh_admin_ff()));
create policy "admin altera" on public.equipe_ff for update to authenticated
  using ((select public.eh_admin_ff())) with check ((select public.eh_admin_ff()));
create policy "admin apaga" on public.equipe_ff for delete to authenticated
  using ((select public.eh_admin_ff()));

-- Visitantes nunca tocam nas tabelas sensíveis, nem por engano de política.
revoke all on public.pre_inscricoes, public.atletas_privado, public.equipe_ff from anon;
revoke all on sequence public.pre_inscricoes_seq from anon, authenticated;
revoke execute on function public.eh_equipe_ff(), public.eh_admin_ff() from public, anon;
grant execute on function public.eh_equipe_ff(), public.eh_admin_ff() to authenticated;
