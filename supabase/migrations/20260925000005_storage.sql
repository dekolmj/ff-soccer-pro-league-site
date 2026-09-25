-- FF Soccer Pro League · armazenamento de arquivos
--   'fotos'  (privado): fotos dos jogos. Atletas logados baixam; só a equipe FF envia e apaga.
--   'marca'  (público): escudos dos times e imagens do site.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fotos', 'fotos', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('marca', 'marca', true,  2097152,  array['image/png','image/webp','image/svg+xml','image/jpeg'])
on conflict (id) do nothing;

create policy "logado baixa fotos" on storage.objects for select to authenticated
  using (bucket_id = 'fotos');
create policy "equipe envia fotos" on storage.objects for insert to authenticated
  with check (bucket_id in ('fotos','marca') and (select public.eh_equipe_ff()));
create policy "equipe altera fotos" on storage.objects for update to authenticated
  using (bucket_id in ('fotos','marca') and (select public.eh_equipe_ff()))
  with check (bucket_id in ('fotos','marca') and (select public.eh_equipe_ff()));
create policy "equipe apaga fotos" on storage.objects for delete to authenticated
  using (bucket_id in ('fotos','marca') and (select public.eh_equipe_ff()));
