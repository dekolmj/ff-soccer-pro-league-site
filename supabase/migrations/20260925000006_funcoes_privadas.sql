-- FF Soccer Pro League · tira da API pública as funções internas de permissão
-- eh_equipe_ff() e eh_admin_ff() só servem às regras de acesso; num esquema não exposto,
-- ninguém consegue chamá-las por /rest/v1/rpc. As regras continuam funcionando.

create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

alter function public.eh_equipe_ff() set schema privado;
alter function public.eh_admin_ff() set schema privado;
