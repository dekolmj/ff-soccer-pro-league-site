# CLAUDE.md · Site FF Soccer Pro League

Contexto para o Claude Code trabalhar neste repositório. Leia inteiro antes de qualquer alteração.

## O projeto

- **O que é:** site oficial da **FF Soccer Pro League**, liga de futebol de campo (11 contra 11) para alunos da FF Soccer. Temporadas de 6 meses (janeiro a junho e agosto a dezembro), jogos às quartas e sextas à noite, transmissão no YouTube, VAR com 2 desafios por equipe, mínimo de 45 minutos por atleta em cada jogo, registro individual e noite de premiação.
- **Fase atual:** lançamento em **ondas**. No ar para o público está a **Onda 1** (League e Pré-inscrição, mais Entrar e painel da equipe). O resto do site usa **dados de exemplo** e só aparece com `?demo` no endereço.
- **Ondas (`CONFIG.ONDA` em `js/config.js`):** 1 = League e Pré-inscrição · 2 = + Campeonato (início, tabela, times, atletas, jogos, faixa de resultados) · 3 = + Ao vivo · 4 = + Hall da fama e área do atleta. Páginas acima da onda somem do menu e do rodapé (`data-onda` no `index.html`) e as rotas levam para `#a-league` (`ondaDaPagina()` no `app.js`). Na onda 1 o site não consulta o banco ao abrir. Com `?demo` (ex.: `…/?demo#inicio`) tudo aparece, com a tarja de pré-lançamento, para apresentações. Para liberar uma onda, é só trocar o número.
- **Dono do projeto:** Lucas. É um projeto particular, sem vínculo com empresa. Ele **não programa**: explique tudo em português simples, sem jargão, e diga sempre o que ele precisa fazer (se precisar) e o que muda no site.
- **Site no ar:** https://dekolmj.github.io/ff-soccer-pro-league-site/ (GitHub Pages, branch `main`, pasta raiz).

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
js/painel.js          login único (#entrar) e painel da equipe FF (#painel): pré-inscrições em tempo real
assets/               escudo.webp, letreiro.webp, favicon.png, apple-touch-icon.png, og-image.jpg
apps-script/Code.gs   DESATIVADO: script antigo da planilha do Google (só histórico)
supabase/             estrutura do banco (migrations/) e gerador dos dados de exemplo (exemplo/)
docs/arquitetura.md   desenho da estrutura e decisões técnicas
README.md             passo a passo para o Lucas
.nojekyll             necessário para o GitHub Pages
```

O site é um app de página única, com rotas por `#hash`, JavaScript puro e sem frameworks. Os scripts são carregados em ordem no fim do `index.html` (config → dados-exemplo → banco → tv-canvas → app → painel) e compartilham variáveis globais; a ordem importa. Detalhes em `docs/arquitetura.md`.

- **Rotas públicas:**
  - `#inicio`
  - `#a-league`
  - `#campeonato`, `#campeonato-estatisticas`, `#campeonato-times`
  - `#atletas`, `#atleta-<time>-<numero>`, `#time-<id>`
  - `#jogos`, `#jogos-<rodada>`, `#jogo-<rodada>-<n>`
  - `#ao-vivo`
  - `#hall-da-fama`
  - `#pre-inscricao`
- **Login único:** o botão **Entrar** (`#entrar`) tem login real com e-mail e senha (Supabase Auth, biblioteca `supabase-js@2.117.2` baixada por CDN só no Entrar e no painel). Quem é da equipe FF vai para o **painel** (`#painel`, fora do menu; sem login, ele manda para `#entrar`). Outras contas veem "Acesso ainda não liberado", porque a área do atleta com login próprio ainda não existe. A tela Entrar tem só e-mail, senha e o botão Entrar: **não há "Criar senha" nem "Esqueci a senha"** (o Lucas pediu para tirar; o código de criar senha em `painel.js` ficou desligado). Contas novas da equipe e troca de senha: pelo painel do Supabase (Authentication → Add user, marcando o e-mail como confirmado), depois do convite. Só vira equipe quem está em `privado.convites_equipe` **e** confirmou o e-mail; convide pelo SQL do topo de `supabase/migrations/20260925000008_painel_equipe.sql`. E-mails da equipe ficam só no banco, nunca no código.
- **Área do atleta (demonstração):** botão "Entrar como André" na tela Entrar; rotas `#minha-area`, `#minha-area-time`, `#minha-area-inscricao`, `#minha-area-fotos`, `#minha-area-campeonatos`. O login é de mentira: entra sempre como o atleta de exemplo `falcoes-10`, André Marques.
- **Menu:** League · Campeonato · Ao vivo · Hall da fama, mais os botões Pré-inscrição e Entrar. O logo leva a `#inicio`.
- **Dados de exemplo:** gerados com semente fixa (`rng(2027)`) em `js/dados-exemplo.js` e copiados para o banco com a marca `exemplo = true` (`node supabase/exemplo/gerar.js` gera o SQL). São 8 times, 20 atletas por time e 9 rodadas. A rodada 6 tem Falcões x Lobos "ao vivo". A tabela e a artilharia são calculadas a partir dos jogos.
- **Banco:** o site lê do Supabase ao abrir (`js/banco.js`) e só desenha a página depois (até 4 s). Se o banco falhar, demorar ou não tiver jogo ao vivo, usa os dados de `dados-exemplo.js`. O que a equipe editar no banco aparece no site.
- **TV FF:** os vídeos são uma animação em canvas (função `Scene`), no lugar dos vídeos do YouTube. Os melhores momentos abrem em pop-up.
- **Configuração:** fica em `js/config.js` (`VERSAO_TERMOS`, `SUPABASE_URL`, `SUPABASE_KEY`, `ONDA`, `UNIDADES`). A chave é a pública (pode ficar no site; a `service_role` nunca). Sem `SUPABASE_URL`/`SUPABASE_KEY`, o formulário mostra "As pré-inscrições abrem em breve".
- **localStorage:** `ffl_user` guarda o login de demonstração e `ffl_pl` guarda que a tarja de pré-lançamento foi fechada. Sempre dentro de try/catch.
- **Pré-lançamento:**
  - tarja amarela `<div class="prelaunch">`: agora só aparece com `?demo` (`data-demo`);
  - `<meta name="robots" content="noindex">`: **continua**. O Lucas pediu para não liberar o site no Google ainda. Só remova quando ele pedir.

## Pré-inscrição

- **Campos:** nome, e-mail, celular, data de nascimento, unidade FF (lista em `CONFIG.UNIDADES`, no `js/config.js`; os atletas de exemplo usam outra lista, `UNITS`), **3 posições de preferência** (diferentes, em ordem), tamanho do kit, **3 números de camisa de preferência** (1 a 99, diferentes, em ordem) e **nome na camisa (até 12 letras)**.
- **Formato enviado:** `posicao` = as 3 posições juntas ("Meia · Volante · Atacante"), `posicoes` = lista das 3, `numero` = 1º número, `numeros` = lista dos 3. No banco, `posicao`/`numero` guardam a 1ª opção e `posicoes`/`numeros` as três (migração `20260929000009_tres_opcoes.sql`).
- **Aceites obrigatórios:** dois, a autorização de análise de score e histórico (LGPD) e as condições da liga.
- **Campo-armadilha:** `empresa`, invisível, para barrar robôs.
- **Sem pagamento no site ou no app.** Depois da aprovação, a FF combina o pagamento direto com o atleta. Não adicione pagamento.
- **Envio:** direto para o banco: `fetch(CONFIG.SUPABASE_URL+'/rest/v1/rpc/enviar_pre_inscricao', {method:'POST', headers:{apikey, 'Content-Type':'application/json'}, body: JSON.stringify({dados: payload})})`. A resposta é `{ok, protocolo, duplicado}`. A função valida os campos, marca e-mail repetido e **gera sempre** o protocolo `FF-2027-0008…` (ignora protocolo vindo de fora). O painel lê daí em tempo real.
- **Planilha do Google: desativada** em 30/09/2026, a pedido do Lucas. As pré-inscrições FF-2027-0001 a 0005 existem só na planilha antiga (anteriores ao banco).

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
4. **Painel da FF:** ~~login da equipe e aprovar inscrições~~ (feito, `#painel`). Falta: súmula ao vivo em tempo real, escalação e minutagem, fotos e avisos.
5. **App nas lojas** (Expo/React Native), usando o mesmo banco.
