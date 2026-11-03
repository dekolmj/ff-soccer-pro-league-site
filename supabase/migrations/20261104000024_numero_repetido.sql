-- FF Soccer Pro League · número de camisa pode repetir no mesmo time (04/11/2026, a pedido do Deko:
-- no Atlético Nacional, Ysaac e Felipe Suzuki ficam os dois com a 14 por enquanto).
-- O painel avisa e pede confirmação antes de repetir; o site separa os dois atletas mesmo com o mesmo número.
alter table public.elencos drop constraint if exists elencos_time_id_numero_key;
do $$ declare d text; begin
  d := pg_get_functiondef('public.salvar_atleta(jsonb)'::regprocedure);
  d := replace(d, 'if exists (select 1 from public.elencos where time_id = e->>''time_id'' and numero = v_num and atleta_id is distinct from v_id) then',
                  'if false then  -- número repetido no time é permitido desde 04/11/2026');
  execute d;
end $$;
