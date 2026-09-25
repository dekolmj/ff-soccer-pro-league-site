# CLAUDE.md · Site FF Soccer Pro League

Contexto para o Claude Code trabalhar neste repositório. Leia inteiro antes de qualquer alteração.

## O projeto

- **O que é:** site oficial da **FF Soccer Pro League**, liga de futebol de campo (11 contra 11) para alunos da FF Soccer. Temporadas de 5 a 6 meses, jogos às quartas e sextas à noite, transmissão no YouTube, VAR com 2 desafios por equipe, mínimo de 45 minutos por atleta em cada jogo, registro individual e noite de premiação.
- **Fase atual:** pré-lançamento. As páginas usam **dados de exemplo**, lidos do banco (Supabase), e só a **pré-inscrição é real**.
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
js/config.js          CONFIG: endereço da pré-inscrição e versão dos termos
js/dados-exemplo.js   times, atletas e jogos de exemplo (reserva, se o banco não responder)
js/banco.js           lê times, atletas e jogos do Supabase e monta as mesmas variáveis
js/tv-canvas.js       animação da TV FF (Scene, initCanvases)
js/app.js             páginas, roteador, menu, área logada, vídeo em pop-up, pré-inscrição
assets/               escudo.webp, letreiro.webp, favicon.png, apple-touch-icon.png, og-image.jpg
apps-script/Code.gs   Google Apps Script que recebe a pré-inscrição e grava na planilha
supabase/             estrutura do banco (migrations/) e gerador dos dados de exemplo (exemplo/)
docs/arquitetura.md   desenho da estrutura e decisões técnicas
README.md             passo a passo para o Lucas (publicar e ligar a planilha)
.nojekyll             necessário para o GitHub Pages
```

O site é um app de página única, com rotas por `#hash`, JavaScript puro e sem frameworks. Os scripts são carregados em ordem no fim do `index.html` (config → dados-exemplo → banco → tv-canvas → app) e compartilham variáveis globais; a ordem importa. Detalhes em `docs/arquitetura.md`.

- **Rotas públicas:**
  - `#inicio`
  - `#a-league`
  - `#campeonato`, `#campeonato-estatisticas`, `#campeonato-times`
  - `#atletas`, `#atleta-<time>-<numero>`, `#time-<id>`
  - `#jogos`, `#jogos-<rodada>`, `#jogo-<rodada>-<n>`
  - `#ao-vivo`
  - `#hall-da-fama`
  - `#pre-inscricao`
- **Área logada (demonstração):** `#entrar`, `#minha-area`, `#minha-area-time`, `#minha-area-inscricao`, `#minha-area-fotos`, `#minha-area-campeonatos`. O login é de mentira: entra sempre como o atleta de exemplo `falcoes-10`, André Marques.
- **Menu:** League · Campeonato · Ao vivo · Hall da fama, mais os botões Pré-inscrição e Entrar. O logo leva a `#inicio`.
- **Dados de exemplo:** gerados com semente fixa (`rng(2027)`) em `js/dados-exemplo.js` e copiados para o banco com a marca `exemplo = true` (`node supabase/exemplo/gerar.js` gera o SQL). São 8 times, 20 atletas por time e 9 rodadas. A rodada 6 tem Falcões x Lobos "ao vivo". A tabela e a artilharia são calculadas a partir dos jogos.
- **Banco:** o site lê do Supabase ao abrir (`js/banco.js`) e só desenha a página depois (até 4 s). Se o banco falhar, demorar ou não tiver jogo ao vivo, usa os dados de `dados-exemplo.js`. O que a equipe editar no banco aparece no site.
- **TV FF:** os vídeos são uma animação em canvas (função `Scene`), no lugar dos vídeos do YouTube. Os melhores momentos abrem em pop-up.
- **Configuração:** fica em `js/config.js`, `var CONFIG={FORM_ENDPOINT:'…/exec',VERSAO_TERMOS:'2026-09'}`. `FORM_ENDPOINT` é a URL do Apps Script. `SUPABASE_URL` e `SUPABASE_KEY` apontam para o banco; a chave é a pública de leitura (pode ficar no site; a `service_role` nunca). Vazio, o formulário mostra "As pré-inscrições abrem em breve".
- **localStorage:** `ffl_user` guarda o login de demonstração e `ffl_pl` guarda que a tarja de pré-lançamento foi fechada. Sempre dentro de try/catch.
- **Pré-lançamento:**
  - tarja amarela `<div class="prelaunch">`;
  - `<meta name="robots" content="noindex">`.
  - Só remova no lançamento oficial, quando o Lucas pedir.

## Pré-inscrição

- **Campos:** nome, e-mail, celular, data de nascimento, unidade FF, posição, tamanho do kit, **número da camisa (1 a 99)** e **nome na camisa (até 12 letras)**.
- **Aceites obrigatórios:** dois, a autorização de análise de score e histórico (LGPD) e as condições da liga.
- **Campo-armadilha:** `empresa`, invisível, para barrar robôs.
- **Sem pagamento no site ou no app.** Depois da aprovação, a FF combina o pagamento direto com o atleta. Não adicione pagamento.
- **Envio:** `fetch(CONFIG.FORM_ENDPOINT, {method:'POST', body: JSON.stringify(payload)})`, sem Content-Type, para não disparar preflight. A resposta é `{ok, protocolo, duplicado}`.
- **Code.gs:** grava uma linha por inscrição com protocolo `FF-2027-0001…`, marca e-mail repetido, protege contra fórmulas e valida os campos no servidor. Se mudar o `Code.gs`, avise o Lucas: ele precisa colar o código no Apps Script e criar uma **nova versão** da implantação para manter a mesma URL.

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
2. **Banco de dados no Supabase:** estrutura criada (pasta `supabase/`) e aplicada no projeto **FF Soccer Project** (`xsbmuzaensxrkeqwzfkp`, São Paulo, organização FF Soccer). O site ainda não usa o banco. Falta: Postgres, login e armazenamento de fotos. Trocar o destino da pré-inscrição, com política que só permite inserir (RLS), e importar o CSV da planilha.
3. **Dados reais:** o site já lê do banco. Falta trocar os dados de exemplo (`exemplo = true`) pelos times, atletas e jogos reais e, no lançamento, apagar os exemplos.
4. **Painel da FF:** aprovar inscrições, montar escalação e minutagem, lançar súmula, subir fotos e publicar avisos.
5. **App nas lojas** (Expo/React Native), usando o mesmo banco.
