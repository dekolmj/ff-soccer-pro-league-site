-- FF Soccer Pro League · unidade FF de cada time (no painel, o campo Unidade substituiu o campo Técnico)
-- A coluna tecnico continua no banco, sem uso na tela.
alter table public.times add column if not exists unidade_id smallint references public.unidades(id);
create index if not exists times_unidade_id_idx on public.times (unidade_id);
