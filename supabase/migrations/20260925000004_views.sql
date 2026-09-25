-- FF Soccer Pro League · tabelas calculadas (o site lê pronto)
-- security_invoker: cada visão respeita as mesmas regras de acesso das tabelas de origem.

-- Classificação: 3 pontos por vitória, 1 por empate. Só jogos encerrados.
create view public.classificacao with (security_invoker = true) as
with lados as (
  select temporada_id, time_casa as time_id, gols_casa as gp, gols_fora as gc from public.jogos where status = 'encerrado'
  union all
  select temporada_id, time_fora, gols_fora, gols_casa from public.jogos where status = 'encerrado'
)
select t.temporada_id, t.id as time_id, t.nome, t.cor,
       count(l.time_id)::int                                   as jogos,
       count(*) filter (where l.gp > l.gc)::int                as vitorias,
       count(*) filter (where l.gp = l.gc)::int                as empates,
       count(*) filter (where l.gp < l.gc)::int                as derrotas,
       coalesce(sum(l.gp),0)::int                              as gols_pro,
       coalesce(sum(l.gc),0)::int                              as gols_contra,
       coalesce(sum(l.gp - l.gc),0)::int                       as saldo,
       (3*count(*) filter (where l.gp > l.gc) + count(*) filter (where l.gp = l.gc))::int as pontos
from public.times t
left join lados l on l.time_id = t.id and l.temporada_id = t.temporada_id
group by t.temporada_id, t.id, t.nome, t.cor;

-- Números de cada atleta na temporada: jogos, minutos, gols, assistências, cartões, MVPs.
create view public.estatisticas_atletas with (security_invoker = true) as
select j.temporada_id, a.id as atleta_id, a.nome, a.posicao, e.time_id,
       count(distinct es.jogo_id)::int                                                      as jogos,
       coalesce(sum(es.minutos),0)::int                                                     as minutos,
       (select count(*) from public.eventos_jogo g join public.jogos jj on jj.id = g.jogo_id
          where g.atleta_id = a.id and g.tipo = 'gol' and jj.temporada_id = j.temporada_id)::int  as gols,
       (select count(*) from public.eventos_jogo g join public.jogos jj on jj.id = g.jogo_id
          where g.atleta2_id = a.id and g.tipo = 'gol' and jj.temporada_id = j.temporada_id)::int as assistencias,
       (select count(*) from public.eventos_jogo g join public.jogos jj on jj.id = g.jogo_id
          where g.atleta_id = a.id and g.tipo = 'cartao_amarelo' and jj.temporada_id = j.temporada_id)::int as amarelos,
       (select count(*) from public.eventos_jogo g join public.jogos jj on jj.id = g.jogo_id
          where g.atleta_id = a.id and g.tipo = 'cartao_vermelho' and jj.temporada_id = j.temporada_id)::int as vermelhos,
       (select count(*) from public.jogos jj
          where jj.mvp_atleta_id = a.id and jj.temporada_id = j.temporada_id)::int                as mvps
from public.escalacoes es
join public.jogos j   on j.id = es.jogo_id
join public.atletas a on a.id = es.atleta_id
left join public.elencos e on e.atleta_id = a.id and e.temporada_id = j.temporada_id
group by j.temporada_id, a.id, a.nome, a.posicao, e.time_id;

-- Regra dos 45 minutos: mostra quem ficou abaixo do mínimo em cada jogo encerrado.
create view public.minutagem_abaixo_minimo with (security_invoker = true) as
select j.id as jogo_id, j.rodada, es.time_id, es.atleta_id, a.nome,
       coalesce(es.minutos,0) as minutos, t.minutos_minimos_por_atleta as minimo
from public.escalacoes es
join public.jogos j      on j.id = es.jogo_id
join public.temporadas t on t.id = j.temporada_id
join public.atletas a    on a.id = es.atleta_id
where j.status = 'encerrado' and coalesce(es.minutos,0) < t.minutos_minimos_por_atleta;

-- Desafios de VAR usados e restantes por time em cada jogo.
create view public.var_por_jogo with (security_invoker = true) as
select j.id as jogo_id, tm.time_id,
       count(d.id)::int                                   as usados,
       (t.desafios_var_por_jogo - count(d.id))::int       as restantes
from public.jogos j
join public.temporadas t on t.id = j.temporada_id
cross join lateral (values (j.time_casa), (j.time_fora)) as tm(time_id)
left join public.desafios_var d on d.jogo_id = j.id and d.time_id = tm.time_id
group by j.id, tm.time_id, t.desafios_var_por_jogo;
