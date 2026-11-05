-- FF Soccer Pro League · cartão sem minuto (05/11/2026, a pedido do Deko: a súmula e a planilha não pedem mais minuto em nenhum lance).
-- salvar_sumula() deixa de exigir o minuto do cartão (o do gol já não era exigido desde a migração 25). Se vier, continua de 0 a 130.
do $$ declare d text; begin
  d := pg_get_functiondef('public.salvar_sumula(uuid,jsonb)'::regprocedure);
  if position('if (v_min is null and v_tipo not in (''gol'',''gol_contra'')) or v_min < 0 or v_min > 130 then' in d) = 0 then raise exception 'trecho não encontrado'; end if;
  d := replace(d, 'if (v_min is null and v_tipo not in (''gol'',''gol_contra'')) or v_min < 0 or v_min > 130 then',
                  'if v_min < 0 or v_min > 130 then');
  execute d;
end $$;
