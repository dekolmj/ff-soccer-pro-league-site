# Site FF Soccer Pro League

Site oficial da FF Soccer Pro League em fase de **pré-lançamento**.

- Todas as páginas (campeonato, TV FF, hall da fama, área do atleta) usam **dados de exemplo**.
- A **pré-inscrição é real**: cada envio é gravado no banco de dados (Supabase) e aparece na hora no **painel da equipe FF** (botão Entrar).

O site é feito só de arquivos simples (HTML, CSS e JavaScript) e não precisa de servidor nem de mensalidade. Ele é publicado de graça pelo **GitHub Pages**.

## O que tem neste repositório

| Arquivo | Para que serve |
|---|---|
| `index.html` | A estrutura da página: cabeçalho, menu, rodapé e aviso de pré-lançamento |
| `css/site.css` | Todo o visual: cores, fontes, tamanhos |
| `js/config.js` | Endereço do banco, versão dos termos, onda de lançamento e unidades FF |
| `js/dados-exemplo.js` | Times, atletas e jogos de exemplo |
| `js/tv-canvas.js` | Animação dos vídeos da TV FF |
| `js/app.js` | As páginas, o menu, a área do atleta e a pré-inscrição |
| `assets/` | Escudo, letreiro, ícone da aba do navegador e imagem de pré-visualização para WhatsApp |
| `docs/arquitetura.md` | Explicação técnica de como o site é organizado |
| `apps-script/Code.gs` | **Desativado.** Código antigo que gravava as pré-inscrições numa planilha do Google |
| `.nojekyll` | Arquivo técnico do GitHub Pages. Não apague |

---

## 1. Publicar o site no GitHub Pages

1. Entre no repositório no GitHub.
2. Clique em **Add file → Upload files** e arraste todos os arquivos e pastas deste projeto. Clique em **Commit changes**.
3. Vá em **Settings → Pages**.
4. Em **Build and deployment**, escolha **Source: Deploy from a branch**, depois **Branch: main** e pasta **/(root)**. Clique em **Save**.
5. Espere 1 ou 2 minutos e atualize a página. O endereço do site aparece no topo, no formato `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Para usar um domínio próprio, como `ffsoccerproleague.com.br`: em **Settings → Pages → Custom domain**, digite o domínio e siga as instruções de DNS que o GitHub mostrar.

---

## 2. Pré-inscrição (planilha desativada)

Desde 30/09/2026 a pré-inscrição **não usa mais a planilha do Google**. Cada envio vai direto para o banco de dados e aparece no **painel da equipe FF**: clique em **Entrar** no site e use seu e-mail e senha.

- As pré-inscrições **FF-2027-0001 a 0005** foram feitas antes do banco e ficaram **só na planilha antiga**.
- O script `apps-script/Code.gs` ficou no repositório só como histórico. Se quiser, desative a implantação no Apps Script (**Implantar → Gerenciar implantações → Arquivar**).

---

## 3. Cuidados com os dados (LGPD)

- **Acesso às inscrições:** só quem é da equipe FF (convidado e com login) vê as pré-inscrições no painel.
- **Registro do aceite:** o banco guarda o texto exato que o atleta aceitou e a versão dos termos.
- **Pedido de exclusão:** se um atleta pedir, peça para apagar a inscrição dele do banco.

---

## 4. Antes do lançamento oficial

- [ ] Trocar os dados de exemplo pelos reais: times, atletas e jogos.
- [ ] Tirar o aviso amarelo de pré-lançamento. No `index.html`, apague o bloco `<div class="prelaunch" ...>`.
- [ ] Liberar o site no Google. Apague a linha `<meta name="robots" content="noindex">`.
- [ ] Revisar os textos da página **League** com o regulamento oficial.
