-- FF Soccer Pro League · marcação dos dados de exemplo
-- exemplo = true: registro criado só para a apresentação. No lançamento oficial, apague com:
--   delete from public.jogos   where exemplo;   -- leva junto escalações, súmula e VAR
--   delete from public.atletas where exemplo;   -- leva junto elencos
--   delete from public.times   where exemplo;
-- Registros criados pela equipe FF no painel nascem com exemplo = false e não são afetados.

alter table public.times   add column ordem   smallint not null default 0,   -- ordem de exibição no site
                           add column exemplo boolean  not null default false;
alter table public.atletas add column exemplo boolean  not null default false;
alter table public.jogos   add column exemplo boolean  not null default false;
