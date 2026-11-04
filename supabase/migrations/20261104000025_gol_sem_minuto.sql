-- FF Soccer Pro League · gol sem minuto (04/11/2026, a pedido do Deko: a súmula e a planilha não pedem mais o minuto do gol).
-- Cartões continuam com minuto. eventos_jogo.minuto passa a aceitar vazio e salvar_sumula() só exige minuto em cartão.
alter table public.eventos_jogo alter column minuto drop not null;
do $$ declare d text; begin
  d := pg_get_functiondef('public.salvar_sumula(uuid,jsonb)'::regprocedure);
  d := replace(d, 'if v_min is null or v_min < 0 or v_min > 130 then',
                  'if (v_min is null and v_tipo not in (''gol'',''gol_contra'')) or v_min < 0 or v_min > 130 then');
  execute d;
end $$;
