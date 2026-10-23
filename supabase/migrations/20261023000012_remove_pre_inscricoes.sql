-- FF Soccer Pro League · tira a pré-inscrição do banco (23/10/2026, a pedido do Deko)
-- As inscrições foram feitas por outro caminho (planilha); o formulário e a aba do painel saíram do site.
-- No banco só havia pré-inscrições de teste.

alter publication supabase_realtime drop table public.pre_inscricoes;
drop function if exists public.enviar_pre_inscricao(jsonb);
drop table if exists public.pre_inscricoes;
drop sequence if exists public.pre_inscricoes_seq;
drop type if exists public.status_inscricao;
