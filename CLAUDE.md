# CLAUDE.md · Site FF Soccer Pro League

Contexto para o Claude Code trabalhar neste repositório. Leia inteiro antes de qualquer alteração.

## O projeto

- **O que é:** site oficial da **FF Soccer Pro League**, liga de futebol de campo (11 contra 11) para alunos da FF Soccer. Temporadas de 6 meses (janeiro a junho e agosto a dezembro), jogos às quartas e sextas à noite, transmissão no YouTube, VAR com 2 desafios por equipe, registro individual e noite de premiação.
- **Fase atual:** lançamento em **ondas**. No ar para o público está a **Onda 1** (League e Pré-inscrição, mais Entrar e painel da equipe). O resto do site usa **dados de exemplo** e só aparece com `?demo` no endereço.
- **Ondas (`CONFIG.ONDA` em `js/config.js`):** 1 = League e Pré-inscrição · 2 = + Campeonato (tabela, atletas, jogos) · 3 = + Ao vivo · 4 = + área do atleta. Páginas acima da onda somem do menu e do rodapé (`data-onda` no `index.html`) e as rotas levam para `#a-league` (`ondaDaPagina()` no `app.js`). Na onda 1 o site não consulta o banco ao abrir. Com `?demo` (ex.: `…/?demo#inicio`) tudo aparece, com a tarja de pré-lançamento, para apresentações. Para liberar uma onda, é só trocar o número.
- **Dono do projeto:** Deko (o projeto começou na conta do Lucas e foi trazido para a do Deko; chame sempre de Deko). É um projeto particular, sem vínculo com empresa. O Deko **não programa**: explique tudo em português simples, sem jargão, e diga sempre o que o Deko precisa fazer (se precisar) e o que muda no site.
- **Site no ar:** endereço principal **https://ffproleague.vercel.app** (Vercel). Os endereços antigos https://ff-soccer-pro-league-site.vercel.app e https://dekolmj.github.io/ff-soccer-pro-league-site/ (GitHub Pages) levam automaticamente para o novo (script no topo do `<head>` do `index.html`). Todos publicam a branch `main`, pasta raiz.

## Como publicar

- **Publicação automática:** todo push na branch `main` publica o site em 1 a 2 minutos. Não existe etapa de build.
- **Uma mudança por commit:** mensagem curta em português que diga o que mudou no site (ex.: "Tira a aba Atletas do Campeonato").
- **Teste antes do push:**
  - Abra o `index.html` num navegador (Playwright, se disponível) e navegue pelas rotas afetadas.
  - Confira que não há erro no console.
  - Confira que nada rola para os lados na largura de celular (390 px).
- **Nunca quebre a pré-inscrição.** Depois de qualquer mudança, confira que o formulário valida e que o envio monta o JSON esperado.

## Estrutura atual

```
index.html            estrutura da página (cabeçalho, menu, rodapé, <main id="app">)
css/site.css          todo o visual
js/config.js          CONFIG: banco (Supabase), versão dos termos, onda e unidades FF
js/dados-exemplo.js   times, atletas e jogos de exemplo (reserva, se o banco não responder)
js/banco.js           lê times, atletas e jogos do Supabase e monta as mesmas variáveis
js/tv-canvas.js       animação da TV FF (Scene, initCanvases)
js/app.js             páginas, roteador, menu, área logada, vídeo em pop-up, pré-inscrição
js/painel.js          login único (#entrar) com perfis e painel da equipe FF (#painel): abas e pré-inscrições em tempo real
js/cadastros.js       abas Times, Atletas e Histórico do painel (cadastros feitos pelo cliente)
assets/               escudo.webp, letreiro.webp, favicon.png, apple-touch-icon.png, og-image.jpg
apps-script/Code.gs   DESATIVADO: script antigo da planilha do Google (só histórico)
supabase/             estrutura do banco (migrations/) e gerador dos dados de exemplo (exemplo/)
docs/arquitetura.md   desenho da estrutura e decisões técnicas
README.md             passo a passo para o Deko
.nojekyll             necessário para o GitHub Pages
.github/workflows/    acordar-banco.yml: consulta o banco todo dia (06:17 de Brasília) para o Supabase grátis não pausar o projeto
```

O site é um app de página única, com rotas por `#hash`, JavaScript puro e sem frameworks. Os scripts são carregados em ordem no fim do `index.html` (config → dados-exemplo → banco → tv-canvas → app → painel → cadastros) e compartilham variáveis globais; a ordem importa. Detalhes em `docs/arquitetura.md`.

- **Rotas públicas:**
  - ~~`#inicio`~~: a página Início saiu em 23/10/2026, a pedido do Deko: a tela inicial é sempre a **FF Pro League** (`#a-league`), inclusive com `?demo`. `#inicio` e endereços desconhecidos levam para `#a-league`; o logo também.
  - `#libertadores` (Libertadores FF, criada em 21/10/2026; vale na onda 1): resumo da última Copa FF em Fut7 antes do calendário 2027, com 5 cartões (times de 10 a 12 atletas, uniforme, fotos, final ao vivo, e muito mais)
  - `#a-league`
  - `#campeonato`, `#campeonato-estatisticas` (FF Pro League; Estatísticas em 4 colunas, igual à Libertadores: Artilharia, Assistências, Cartões amarelos e MVPs, 10 de cada; o quadro "Times" (melhor ataque/defesa) saiu; a aba Times saiu em 21/10/2026, a pedido do Deko; `#campeonato-times` leva para `#campeonato` e o link do rodapé saiu; as páginas `#time-<id>` continuam, pelos links da tabela) e `#campeonato-libertadores` (Libertadores FF: fase de grupos com **dados de exemplo**, 3 grupos de 4 times sem brasileiros, em `LIB_GRUPOS` no `app.js`; a tabela é calculada dos placares (`r`), 2 primeiros avançam; desde 21/10/2026 **sem jogos: todos zerados**, em ordem alfabética; trocar pelos times e jogos reais quando houver). A Libertadores tem as mesmas duas abas da FF Pro League, com os mesmos textos e padrões (22/10/2026: só mudam as particularidades: grupos, "Fut7 · fase de grupos", legenda "Próxima fase" e o grupo em cada jogo): Tabela e jogos (`#campeonato-libertadores`, cada grupo numa linha: a tabela do grupo à esquerda e o quadro "Jogos · Grupo X" à direita, cada um com a sua rodada (`LR` por grupo; no celular os jogos ficam logo abaixo do grupo): 6 rodadas de exemplo às quartas, 04/11 a 09/12, `LIB_DATAS`/`LIB_HORA` e `libJogosBox(G)`, setas `button.lnav`) e Estatísticas (`#campeonato-libertadores-estatisticas`, 4 colunas: Artilharia, Assistências, Cartões amarelos e MVPs, por enquanto vazias, em `libEstatHTML()`). Desde 21/10/2026 a página tem a escolha de competição no topo (`.comps`, em `camp()` no `app.js`); quando a Libertadores tiver dados, montar as abas dela ali.
  - `#atletas`, `#atleta-<time>-<numero>`, `#time-<id>`
  - `#jogos`, `#jogos-<rodada>`, `#jogo-<rodada>-<n>`
  - `#ao-vivo`
  - ~~`#hall-da-fama`~~: a página saiu em 21/10/2026, a pedido do Deko. O conteúdo chegou a ir para o Campeonato ("Destaques da temporada"), mas também saiu, porque repetia a aba Estatísticas; o endereço antigo leva para `#campeonato`. Não volte a citar "Hall da fama" no site.
  - `#pre-inscricao`
- **Login único com perfis** (22/10/2026): o botão **Entrar** (`#entrar`) tem login real com e-mail e senha (Supabase Auth, biblioteca `supabase-js@2.117.2` baixada por CDN só no Entrar e no painel). Depois do login, a função do banco `meu_perfil()` diz quem é a pessoa: **equipe FF** (administrador ou editor) vai para o **painel** (`#painel`, fora do menu; sem login, ele manda para `#entrar`); **atleta** vê na tela Entrar o selo "Atleta · <time>" e a conta dele (a área do atleta com os dados reais abre na onda 4, se ele estiver num time do site); quem não é nenhum dos dois vê "Acesso ainda não liberado". O tipo fica em `localStorage` (`ffl_perfil`) só para o botão do topo apontar para o lugar certo. Se o banco ainda não tiver `meu_perfil()`, o painel cai no jeito antigo (só `equipe_ff`). **Primeiro acesso do atleta:** link na tela Entrar; só cria senha quem tem o e-mail cadastrado pela equipe (`primeiro_acesso_liberado()`), e a conta só se liga ao atleta depois de confirmar o e-mail (gatilhos `ligar_atleta`). Não há "Esqueci a senha". Contas novas da equipe e troca de senha: pelo painel do Supabase (Authentication → Add user, marcando o e-mail como confirmado), depois do convite. Só vira equipe quem está em `privado.convites_equipe` **e** confirmou o e-mail; convide pelo SQL do topo de `supabase/migrations/20260925000008_painel_equipe.sql`. E-mails da equipe ficam só no banco, nunca no código.
- **Painel da equipe (abas):** Pré-inscrições (só com `CONFIG.PRE_INSCRICAO:true`) · **Times** (nome, técnico, cor, ordem e escudo) · **Atletas** (dados, contato, time, número, nome na camisa, kit e foto; botão "Cadastrar aprovados", também só com a pré-inscrição ligada, preenche a partir das aprovadas) · **Histórico** (quem mudou o quê, gravado pelo banco) · **Acessos** (só administradores, 23/10/2026: Funcionários FF com contas e convites pendentes, troca de perfil Administrador/Editor e "+ Convidar funcionário"; Atletas com a situação do acesso. O **envio do convite por e-mail ainda não existe**: os botões "Enviar convite" aparecem desligados com "em breve"; falta o serviço de e-mail (Resend + domínio ffsoccer.com.br) e uma função no servidor. Funções `listar_acessos()`, `convidar_equipe()` e `alterar_papel()` em `supabase/migrations/20261023000012_acessos.sql`). Editor cadastra e edita; **só administrador apaga** times e atletas. O atleta é gravado de uma vez pela função `salvar_atleta()` (dados, contato e elenco); `excluir_atleta()` deixa inativo quem já jogou. Escudos e fotos vão para o armazenamento público `marca` (`escudos/`, `atletas/`). Estrutura no banco: `supabase/migrations/20261022000011_perfis_e_cadastros.sql`. Atenção: o site público só mostra os times e atletas do banco quando ele tem jogo ao vivo (`banco.js`); os de exemplo (`exemplo = true`) continuam até o lançamento.
- **Área do atleta (demonstração):** o cartão "Entrar como André" da tela Entrar **saiu em 23/10/2026**, a pedido do Deko; a área de demonstração só abre para quem já tinha entrado como André (`ffl_user` no navegador). Rotas: rotas `#minha-area`, `#minha-area-time`, `#minha-area-inscricao`, `#minha-area-campeonatos`, `#minha-area-perfil` (Meu time, desde 21/10/2026, mostra só Presença, Agenda do time e Elenco: a escalação no campinho e o Mural do time saíram, a pedido do Deko; o aviso "Escalação publicada" do Meu painel saiu junto) (o perfil público do atleta mostrado dentro da área, com o menu lateral; `P.atleta(id,1)` devolve só o miolo. O mesmo perfil pelo Campeonato continua em `#atleta-<time>-<numero>`). A aba "Fotos e vídeos" (`#minha-area-fotos`) foi tirada em 21/10/2026, a pedido do Deko (ninguém vai subir fotos e vídeos); o endereço antigo leva para `#minha-area`,. O "Meu card da temporada" (card para postar) também saiu, em 21/10/2026. A seção "Fotos da rodada" do Início saiu junto. O login é de mentira: entra sempre como o atleta de exemplo `falcoes-10`, André Marques.
- **Menu:** Libertadores FF · FF Pro League (o link da `#a-league`; chamava "League" até 21/10/2026) · Campeonato · Ao vivo, mais os botões Pré-inscrição e Entrar. O logo leva a `#a-league`.
- **Botões Pré-inscrição e Entrar escondidos** (`CONFIG.BOTOES_PRE_E_ENTRAR:false`, pedido do Deko em 05/10/2026): somem do topo, do menu do celular e do rodapé (`data-pre` no `index.html`, `semBotoes()` no `app.js`). Os endereços `#pre-inscricao` e `#entrar` continuam abrindo para quem tiver o link (a equipe entra por `ffproleague.vercel.app/#entrar`). Logado, a bolinha com a inicial aparece. Com `?demo`, tudo aparece. `true` mostra de novo.
- **Dados de exemplo:** gerados com semente fixa (`rng(2027)`) em `js/dados-exemplo.js` e copiados para o banco com a marca `exemplo = true` (`node supabase/exemplo/gerar.js` gera o SQL). São 8 times, 20 atletas por time e 9 rodadas. A tabela e a artilharia são calculadas a partir dos jogos. **Temporada zerada desde 22/10/2026** (`CONFIG.TEMPORADA_ZERADA:true`, a pedido do Deko): `zerarTemporada()` no `app.js` roda depois de carregar os dados (exemplo ou banco) e apaga placares, eventos, MVPs e números dos atletas; o 1º jogo da rodada 1 fica "ao vivo" no 1', 0x0 (o Ao vivo e a faixa do topo precisam de um jogo); listas vazias mostram "Nenhum registro ainda."; o chat do Ao vivo usa mensagens de começo de jogo. `false` volta aos jogos de exemplo com placares (rodada 6, Falcões x Lobos ao vivo).
- **Banco pausado (22 e 23/10/2026):** o Supabase grátis pausa o projeto depois de ~7 dias sem uso; religar levou um dia (incidente do Supabase). Desde 23/10 o GitHub Actions consulta o banco todo dia (`.github/workflows/acordar-banco.yml`, só com a chave pública). O GitHub desliga agendamentos de repositórios sem nenhum commit por 60 dias: se isso acontecer, reative na aba Actions.
- **Banco:** o site lê do Supabase ao abrir (`js/banco.js`) e só desenha a página depois (até 4 s). Se o banco falhar, demorar ou não tiver jogo ao vivo, usa os dados de `dados-exemplo.js`. O que a equipe editar no banco aparece no site.
- **TV FF:** os vídeos são uma animação em canvas (função `Scene`), no lugar dos vídeos do YouTube. A seção "Melhores momentos" (replays) foi tirada do Ao vivo e do Início em 21/10/2026, a pedido do Deko: ninguém vai cortar vídeos. O pop-up de vídeo (`openVideo`) ficou no código, sem uso.
- **Configuração:** fica em `js/config.js` (`VERSAO_TERMOS`, `SUPABASE_URL`, `SUPABASE_KEY`, `ONDA`, `BOTOES_PRE_E_ENTRAR`, `PRE_INSCRICAO`, `TEMPORADA_ZERADA`, `UNIDADES`). A chave é a pública (pode ficar no site; a `service_role` nunca). Sem `SUPABASE_URL`/`SUPABASE_KEY`, o formulário mostra "As pré-inscrições abrem em breve".
- **Visitas (Vercel Web Analytics):** ligado em 09/10/2026. O contador fica no fim do `<head>` do `index.html` e só carrega em endereços `.vercel.app` (sem cookies). Os números ficam na aba Analytics do projeto no Vercel e podem ser consultados pela ferramenta do Vercel (contagem de visualizações). O site usa rotas por `#`, então as visitas aparecem todas na página `/`.
- **Faixa de resultados** (ticker preto com os jogos da rodada, no topo): **saiu em 23/10/2026**, a pedido do Deko. A função `ticker()` ficou no `app.js` e não faz nada sem o elemento `#ticker`.
- **localStorage:** `ffl_user` guarda o login de demonstração e `ffl_perfil` o tipo de conta logada (`ffl_pl`, da tarja de pré-lançamento, não é mais usado). Sempre dentro de try/catch.
- **Pré-lançamento:**
  - tarja amarela de pré-lançamento: **saiu em 23/10/2026**, a pedido do Deko (nem com `?demo`);
  - `<meta name="robots" content="noindex">`: **continua**. O Deko pediu para não liberar o site no Google ainda. Só remova quando o Deko pedir.

## Pré-inscrição

- **OCULTA desde 21/10/2026** (`CONFIG.PRE_INSCRICAO:false`, a pedido do Deko: as inscrições estão sendo feitas por planilha). Some tudo, inclusive com `?demo`: botões e links (`data-pre`), a página (`#pre-inscricao` leva para `#a-league`), a pergunta "A pré-inscrição garante minha vaga?" da League, o "Fazer pré-inscrição" do Início e da tela Entrar, o passo "Pré-inscrição enviada" em Minha inscrição e, desde 23/10/2026, também a aba Pré-inscrições do painel e o botão "Cadastrar aprovados" (o painel abre em Times) (`preOn()` no `app.js`). Em 23/10 o Deko chegou a pedir para apagar tudo e voltou atrás: **fica oculto, sem apagar**, porque pode voltar. As descrições do `<head>` perderam o "Faça sua pré-inscrição.". **Nada foi apagado**: `true` traz tudo de volta (e aí repor a frase nas descrições). No banco, a tabela `pre_inscricoes` e a função `enviar_pre_inscricao` continuam (só com testes).
- **Campos:** nome, e-mail, celular, data de nascimento, unidade FF (lista em `CONFIG.UNIDADES`, no `js/config.js`; os atletas de exemplo usam outra lista, `UNITS`), **3 posições de preferência** (diferentes, em ordem), tamanho do kit, **3 números de camisa de preferência** (1 a 99, diferentes, em ordem) e **nome na camisa (até 12 letras)**.
- **Formato enviado:** `posicao` = as 3 posições juntas ("Meia · Volante · Atacante"), `posicoes` = lista das 3, `numero` = 1º número, `numeros` = lista dos 3. No banco, `posicao`/`numero` guardam a 1ª opção e `posicoes`/`numeros` as três (migração `20260929000009_tres_opcoes.sql`).
- **Aceites obrigatórios:** dois, a autorização de análise de score e histórico (LGPD) e as condições da liga.
- **Campo-armadilha:** `empresa`, invisível, para barrar robôs.
- **Sem pagamento no site ou no app.** Depois da aprovação, a FF combina o pagamento direto com o atleta. Não adicione pagamento.
- **Envio:** direto para o banco: `fetch(CONFIG.SUPABASE_URL+'/rest/v1/rpc/enviar_pre_inscricao', {method:'POST', headers:{apikey, 'Content-Type':'application/json'}, body: JSON.stringify({dados: payload})})`. A resposta é `{ok, protocolo, duplicado}`. A função valida os campos, marca e-mail repetido e **gera sempre** o protocolo `FF-2027-0008…` (ignora protocolo vindo de fora). O painel lê daí em tempo real.
- **Planilha do Google: desativada** em 30/09/2026, a pedido do Deko. As pré-inscrições FF-2027-0001 a 0005 existem só na planilha antiga (anteriores ao banco).

## Identidade visual (não mude sem pedido)

- **Tema:** escuro, único, sem modo claro.
- **Cores:** fundo `#0A0A09`, cartões `#191915`, texto `#FAF9F5`, texto secundário `#A8A495` e dourado `#F2C14D` como destaque.
- **Fontes (Google Fonts):**
  - Big Shoulders Display, para títulos em maiúsculas;
  - Barlow, para o texto;
  - Barlow Condensed, para rótulos e números.
- **Marca:** escudo "FF Soccer Pro League" e letreiro branco e dourado. O nome sempre aparece como **FF Soccer Pro League**.
- **Idioma:** textos em português do Brasil, diretos e sem floreio.

## Regras

- **Mexa só no pedido.** Não mude layout, cores, textos ou rotas que não foram pedidos.
- **Nada de segredos no repositório:** senhas, tokens ou chaves privadas. Ele é **público**.
- **Materiais internos ficam fora deste repositório:** pitch, preços, proposta e logos originais ficam no repositório privado `ff-soccer-pro-league-materiais`.
- **Dados pessoais de inscritos** nunca entram no código nem em commits.
- **Sem bibliotecas novas** sem motivo claro. Se precisar, carregue por CDN com versão fixa.
- **Tamanho:** mantenha o site leve e funcionando no celular.

## Próximos passos planejados

1. ~~**Separar o `index.html` em arquivos**~~ (feito).
2. **Banco de dados no Supabase:** estrutura criada (pasta `supabase/`) e aplicada no projeto **FF Soccer Project** (`xsbmuzaensxrkeqwzfkp`, São Paulo, organização FF Soccer). O site ainda não usa o banco. Falta: Postgres, login e armazenamento de fotos. ~~Trocar o destino da pré-inscrição~~ (feito: só banco). Falta importar da planilha as inscrições FF-2027-0001 a 0005, se forem reais.
3. **Dados reais:** o site já lê do banco. Falta trocar os dados de exemplo (`exemplo = true`) pelos times, atletas e jogos reais e, no lançamento, apagar os exemplos.
4. **Painel da FF:** ~~login da equipe e aprovar inscrições~~ (feito, `#painel`). ~~Etapa 1: login com perfis, Times e Atletas~~ (feito em 22/10/2026). Falta: etapa 2 (Jogos e Súmula depois do jogo, no computador), etapa 3 (Libertadores e Acessos: convidar equipe pelo painel), avisos. **Sem controle de minutagem** (tirado do site inteiro em 21/10/2026, a pedido do Deko: Meu painel, Meu time, perfil do atleta, estatísticas e Hall da fama; a coluna `minutos` de `escalacoes` no banco ficou sem uso na tela).
5. **App nas lojas** (Expo/React Native), usando o mesmo banco.
