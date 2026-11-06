-- FF Soccer Pro League · o atleta edita as próprias posições e o celular em "Meus dados" (06/11/2026, a pedido do Deko).
-- Os outros campos (nome, unidade, e-mail, nascimento, time e camisa) continuam só com a equipe FF.
create or replace function public.meus_dados(posicoes jsonb, celular text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_pos public.posicao[]; v_dig text; v_cel text;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'erro','Entre de novo para salvar.'); end if;
  select id into v_id from public.atletas where user_id = auth.uid();
  if v_id is null then return jsonb_build_object('ok',false,'erro','Cadastro de atleta não encontrado.'); end if;
  if jsonb_typeof(coalesce(posicoes,'[]'::jsonb)) <> 'array' then return jsonb_build_object('ok',false,'erro','Posição inválida.'); end if;
  if exists (select 1 from jsonb_array_elements_text(coalesce(posicoes,'[]'::jsonb)) p where p not in ('GOL','LAT','ZAG','VOL','MEI','ATA')) then
    return jsonb_build_object('ok',false,'erro','Posição inválida.'); end if;
  select array_agg(p::public.posicao order by o) into v_pos from jsonb_array_elements_text(coalesce(posicoes,'[]'::jsonb)) with ordinality as y(p, o);
  if cardinality(v_pos) > 3 then return jsonb_build_object('ok',false,'erro','Escolha até 3 posições.'); end if;
  if (select count(distinct p) from unnest(v_pos) p) < cardinality(v_pos) then return jsonb_build_object('ok',false,'erro','Escolha posições diferentes.'); end if;
  v_dig := regexp_replace(coalesce(celular,''), '\D', '', 'g');
  if v_dig like '55%' and length(v_dig) > 11 then v_dig := substr(v_dig, 3); end if;
  if length(v_dig) not in (10, 11) then return jsonb_build_object('ok',false,'erro','Celular com DDD: (11) 99999-9999.'); end if;
  v_cel := '(' || left(v_dig,2) || ') ' || substr(v_dig, 3, length(v_dig)-6) || '-' || right(v_dig,4);
  update public.atletas set posicao = v_pos[1], posicoes = v_pos where id = v_id;
  update public.atletas_privado set celular = v_cel where atleta_id = v_id;
  return jsonb_build_object('ok',true,'posicoes',to_jsonb(v_pos),'celular',v_cel);
end; $$;
revoke execute on function public.meus_dados(jsonb, text) from public, anon;
grant execute on function public.meus_dados(jsonb, text) to authenticated;
