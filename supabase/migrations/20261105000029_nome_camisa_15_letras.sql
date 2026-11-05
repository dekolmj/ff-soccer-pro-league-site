-- FF Soccer Pro League · nome na camisa com até 15 letras (05/11/2026, a pedido do Deko: a lista do cliente tinha nomes de 13 e 14 letras).
-- Vale para o cadastro do atleta e o Elenco do painel. A pré-inscrição (oculta) continua com 12.
alter table public.elencos drop constraint elencos_nome_camisa_check;
alter table public.elencos add constraint elencos_nome_camisa_check check (char_length(nome_camisa) between 1 and 15);
do $$ declare d text; begin
  d := pg_get_functiondef('public.salvar_atleta(jsonb)'::regprocedure);
  if position('char_length(trim(e->>''nome_camisa'')) > 12' in d) = 0 then raise exception 'trecho não encontrado'; end if;
  d := replace(d, 'char_length(trim(e->>''nome_camisa'')) > 12', 'char_length(trim(e->>''nome_camisa'')) > 15');
  d := replace(d, 'Nome na camisa com 1 a 12 letras.', 'Nome na camisa com 1 a 15 letras.');
  execute d;
end $$;
