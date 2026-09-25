-- FF Soccer Pro League · estrutura base
-- Temporadas, unidades, times, atletas, elencos, jogos, súmula, VAR, prêmios, fotos e avisos.
-- Dados pessoais (e-mail, celular, nascimento) ficam separados em atletas_privado.

-- ============ Tipos ============
create type public.posicao as enum ('GOL','LAT','ZAG','VOL','MEI','ATA');
create type public.tamanho_kit as enum ('P','M','G','GG','XG');
create type public.status_temporada as enum ('planejada','inscricoes','em_andamento','encerrada');
create type public.status_jogo as enum ('agendado','ao_vivo','encerrado','adiado','cancelado');
create type public.tipo_evento as enum ('gol','gol_contra','cartao_amarelo','cartao_vermelho','substituicao','penalti_perdido','defesa_penalti');
create type public.resultado_var as enum ('pendente','mantida','revertida');
create type public.papel_equipe as enum ('admin','editor');

-- ============ Equipe FF (quem usa o painel) ============
create table public.equipe_ff (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  papel      public.papel_equipe not null default 'editor',
  criado_em  timestamptz not null default now()
);

-- true se quem está logado faz parte da equipe FF
create or replace function public.eh_equipe_ff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.equipe_ff where user_id = (select auth.uid()));
$$;

create or replace function public.eh_admin_ff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.equipe_ff where user_id = (select auth.uid()) and papel = 'admin');
$$;

-- atualiza atualizado_em automaticamente
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql set search_path = '' as $$
begin new.atualizado_em := now(); return new; end; $$;

-- ============ Temporadas e unidades ============
create table public.temporadas (
  id           smallint generated always as identity primary key,
  nome         text not null unique,                 -- ex.: 'Temporada 2027'
  inicio       date,
  fim          date,
  status       public.status_temporada not null default 'planejada',
  desafios_var_por_jogo smallint not null default 2 check (desafios_var_por_jogo between 0 and 5),
  minutos_minimos_por_atleta smallint not null default 45 check (minutos_minimos_por_atleta between 0 and 120),
  criado_em    timestamptz not null default now()
);

create table public.unidades (
  id     smallint generated always as identity primary key,
  nome   text not null unique,
  ativa  boolean not null default true
);

-- ============ Times ============
create table public.times (
  id            text primary key check (id ~ '^[a-z0-9-]+$'),   -- ex.: 'falcoes' (usado nas rotas #time-falcoes)
  temporada_id  smallint not null references public.temporadas(id),
  nome          text not null,
  cor           text not null default '#F2C14D' check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  escudo_url    text,
  tecnico       text,
  criado_em     timestamptz not null default now(),
  unique (temporada_id, nome)
);
create index on public.times (temporada_id);

-- ============ Atletas ============
-- Parte pública: aparece no site.
create table public.atletas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users(id) on delete set null,  -- login do atleta (quando tiver)
  nome          text not null,
  apelido       text,
  posicao       public.posicao not null,
  unidade_id    smallint references public.unidades(id),
  foto_url      text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index on public.atletas (unidade_id);
create trigger atletas_atualizado before update on public.atletas
  for each row execute function public.tocar_atualizado_em();

-- Parte privada: só o próprio atleta e a equipe FF veem.
create table public.atletas_privado (
  atleta_id   uuid primary key references public.atletas(id) on delete cascade,
  email       text not null,
  celular     text not null,
  nascimento  date not null,
  observacoes text                                    -- anotações internas da FF
);
create unique index atletas_privado_email on public.atletas_privado (lower(email));

-- Atleta dentro de um time numa temporada (número e nome na camisa).
create table public.elencos (
  id            uuid primary key default gen_random_uuid(),
  temporada_id  smallint not null references public.temporadas(id),
  time_id       text not null references public.times(id) on delete cascade,
  atleta_id     uuid not null references public.atletas(id) on delete cascade,
  numero        smallint not null check (numero between 1 and 99),
  nome_camisa   text not null check (char_length(nome_camisa) between 1 and 12),
  kit           public.tamanho_kit not null,
  capitao       boolean not null default false,
  criado_em     timestamptz not null default now(),
  unique (temporada_id, atleta_id),        -- um time por temporada
  unique (time_id, numero)                 -- número não repete no time
);
create index on public.elencos (time_id);
create index on public.elencos (atleta_id);

-- ============ Jogos ============
create table public.jogos (
  id              uuid primary key default gen_random_uuid(),
  temporada_id    smallint not null references public.temporadas(id),
  rodada          smallint not null check (rodada >= 1),
  ordem           smallint not null default 1,             -- n em #jogo-<rodada>-<n>
  data_hora       timestamptz,
  local           text,
  time_casa       text not null references public.times(id),
  time_fora       text not null references public.times(id),
  status          public.status_jogo not null default 'agendado',
  gols_casa       smallint check (gols_casa >= 0),
  gols_fora       smallint check (gols_fora >= 0),
  minuto_atual    smallint check (minuto_atual between 0 and 130),
  youtube_url     text,
  melhores_momentos_url text,
  mvp_atleta_id   uuid references public.atletas(id),
  sumula_fechada  boolean not null default false,          -- súmula conferida e publicada
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  check (time_casa <> time_fora),
  unique (temporada_id, rodada, ordem)
);
create index on public.jogos (temporada_id, rodada);
create index on public.jogos (time_casa);
create index on public.jogos (time_fora);
create index on public.jogos (mvp_atleta_id);
create trigger jogos_atualizado before update on public.jogos
  for each row execute function public.tocar_atualizado_em();

-- Quem jogou e quantos minutos (regra: mínimo de 45 por atleta).
create table public.escalacoes (
  jogo_id      uuid not null references public.jogos(id) on delete cascade,
  atleta_id    uuid not null references public.atletas(id),
  time_id      text not null references public.times(id),
  titular      boolean not null default false,
  posicao      public.posicao,
  entrou_min   smallint not null default 0 check (entrou_min between 0 and 130),
  saiu_min     smallint check (saiu_min between 0 and 130),
  minutos      smallint check (minutos between 0 and 130),  -- minutos efetivamente jogados
  primary key (jogo_id, atleta_id)
);
create index on public.escalacoes (atleta_id);
create index on public.escalacoes (time_id);

-- Súmula: gols, cartões, substituições.
create table public.eventos_jogo (
  id                 uuid primary key default gen_random_uuid(),
  jogo_id            uuid not null references public.jogos(id) on delete cascade,
  minuto             smallint not null check (minuto between 0 and 130),
  tipo               public.tipo_evento not null,
  time_id            text not null references public.times(id),
  atleta_id          uuid references public.atletas(id),     -- autor do gol / quem levou cartão / quem saiu
  atleta2_id         uuid references public.atletas(id),     -- assistência / quem entrou
  observacao         text,
  criado_em          timestamptz not null default now()
);
create index on public.eventos_jogo (jogo_id, minuto);
create index on public.eventos_jogo (atleta_id);
create index on public.eventos_jogo (atleta2_id);
create index on public.eventos_jogo (time_id);

-- VAR: cada time tem N desafios por jogo (padrão 2, definido na temporada).
create table public.desafios_var (
  id          uuid primary key default gen_random_uuid(),
  jogo_id     uuid not null references public.jogos(id) on delete cascade,
  time_id     text not null references public.times(id),
  minuto      smallint not null check (minuto between 0 and 130),
  motivo      text not null,
  resultado   public.resultado_var not null default 'pendente',
  criado_em   timestamptz not null default now()
);
create index on public.desafios_var (jogo_id, time_id);
create index on public.desafios_var (time_id);

create or replace function public.limitar_desafios_var()
returns trigger language plpgsql set search_path = '' as $$
declare limite smallint; usados int;
begin
  select t.desafios_var_por_jogo into limite
    from public.jogos j join public.temporadas t on t.id = j.temporada_id where j.id = new.jogo_id;
  select count(*) into usados from public.desafios_var
    where jogo_id = new.jogo_id and time_id = new.time_id and id <> new.id;
  if usados >= limite then
    raise exception 'Este time já usou os % desafios de VAR do jogo', limite;
  end if;
  return new;
end; $$;
create trigger desafios_var_limite before insert or update on public.desafios_var
  for each row execute function public.limitar_desafios_var();

-- ============ Hall da fama / premiação ============
create table public.premios (
  id            uuid primary key default gen_random_uuid(),
  temporada_id  smallint not null references public.temporadas(id),
  categoria     text not null,                 -- 'Artilheiro', 'Craque da temporada', 'Campeão'…
  atleta_id     uuid references public.atletas(id),
  time_id       text references public.times(id),
  descricao     text,
  check (atleta_id is not null or time_id is not null)
);
create index on public.premios (temporada_id);
create index on public.premios (atleta_id);
create index on public.premios (time_id);

-- ============ Fotos ============
create table public.fotos (
  id            uuid primary key default gen_random_uuid(),
  jogo_id       uuid references public.jogos(id) on delete set null,
  caminho       text not null unique,          -- caminho no bucket 'fotos'
  legenda       text,
  publicada     boolean not null default false,
  enviada_por   uuid references auth.users(id) default auth.uid(),
  criado_em     timestamptz not null default now()
);
create index on public.fotos (jogo_id);
create index on public.fotos (enviada_por);

create table public.fotos_atletas (
  foto_id    uuid not null references public.fotos(id) on delete cascade,
  atleta_id  uuid not null references public.atletas(id) on delete cascade,
  primary key (foto_id, atleta_id)
);
create index on public.fotos_atletas (atleta_id);

-- ============ Avisos ============
create table public.avisos (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  corpo         text not null,
  publico       boolean not null default true,   -- false = só atletas logados
  publicado_em  timestamptz,                      -- null = rascunho
  criado_por    uuid references auth.users(id) default auth.uid(),
  criado_em     timestamptz not null default now()
);
create index on public.avisos (publicado_em desc);
create index on public.avisos (criado_por);
