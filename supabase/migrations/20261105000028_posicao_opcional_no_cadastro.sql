-- FF Soccer Pro League · posição opcional no cadastro do atleta (05/11/2026, a pedido do Deko: a lista do cliente veio sem posições).
-- salvar_atleta() deixa de exigir a posição; se vier, continuam valendo até 3, diferentes. atletas.posicao já aceitava vazio (migração 23).
do $$ declare d text; a text := 'if v_pos is null or cardinality(v_pos) < 1 then return jsonb_build_object(''ok'',false,''erro'',''Escolha a posição.''); end if;'; begin
  d := pg_get_functiondef('public.salvar_atleta(jsonb)'::regprocedure);
  if position(a in d) = 0 then raise exception 'trecho não encontrado'; end if;
  d := replace(d, a, 'if cardinality(v_pos) < 1 then v_pos := null; end if;');
  execute d;
end $$;
