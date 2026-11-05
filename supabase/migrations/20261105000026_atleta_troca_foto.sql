-- FF Soccer Pro League · o próprio atleta troca a foto na área do atleta (05/11/2026, a pedido do Deko).
-- O atleta logado só envia imagens para a pasta dele no armazenamento 'marca' (atletas/u-<id da conta>/)
-- e só grava a foto do próprio cadastro, pela função minha_foto(). A equipe continua trocando pelo painel.

create policy "atleta envia a propria foto" on storage.objects for insert to authenticated
  with check (bucket_id = 'marca' and name like 'atletas/u-' || (select auth.uid())::text || '/%');
create policy "atleta apaga a propria foto" on storage.objects for delete to authenticated
  using (bucket_id = 'marca' and name like 'atletas/u-' || (select auth.uid())::text || '/%');

create or replace function public.minha_foto(url text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_pref text; v_id uuid;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'erro','Entre de novo para trocar a foto.'); end if;
  v_pref := 'https://xsbmuzaensxrkeqwzfkp.supabase.co/storage/v1/object/public/marca/atletas/u-' || auth.uid()::text || '/';
  if url is null or left(url, length(v_pref)) <> v_pref or url ~ '[\s"<>]' then
    return jsonb_build_object('ok',false,'erro','Foto inválida.'); end if;
  update public.atletas set foto_url = url where user_id = auth.uid() returning id into v_id;
  if v_id is null then return jsonb_build_object('ok',false,'erro','Cadastro de atleta não encontrado.'); end if;
  return jsonb_build_object('ok',true,'foto_url',url);
end; $$;
revoke execute on function public.minha_foto(text) from public, anon;
grant execute on function public.minha_foto(text) to authenticated;
