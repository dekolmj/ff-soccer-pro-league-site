# Site FF Soccer Pro League

Site oficial da FF Soccer Pro League em fase de **pré-lançamento**.

- Todas as páginas (campeonato, TV FF, hall da fama, área do atleta) usam **dados de exemplo**.
- A **pré-inscrição é real**: cada envio vira uma linha numa planilha do Google da FF.

O site é um único arquivo (`index.html`) e não precisa de servidor nem de mensalidade. Ele é publicado de graça pelo **GitHub Pages**.

## O que tem neste repositório

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site inteiro |
| `assets/` | Ícone da aba do navegador e imagem de pré-visualização para WhatsApp |
| `apps-script/Code.gs` | Código que recebe as pré-inscrições na planilha do Google |
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

## 2. Conectar a pré-inscrição à planilha

Faça isto uma vez, logado na **conta Google da FF**, para os dados ficarem com a FF.

1. Crie uma planilha nova em [sheets.google.com](https://sheets.google.com), com o nome **Pré-inscrições FF Soccer Pro League**.
2. Na planilha, clique em **Extensões → Apps Script**.
3. Apague o que estiver no editor, cole todo o conteúdo do arquivo `apps-script/Code.gs` e clique em **Salvar** (ícone de disquete).
4. *Opcional:* para receber um e-mail a cada inscrição, preencha a linha `const EMAIL_DE_AVISO = '';` com o e-mail entre as aspas.
5. Clique em **Implantar → Nova implantação**.
   - Na engrenagem, escolha o tipo **App da Web**.
   - Em **Executar como**, deixe **Eu**.
   - Em **Quem pode acessar**, escolha **Qualquer pessoa**.
   - Clique em **Implantar** e autorize o acesso quando o Google pedir.
6. Copie a **URL do App da Web**. Ela termina em `/exec`.
7. Para testar, cole essa URL no navegador. Deve aparecer `"Pré-inscrição FF Soccer Pro League funcionando"`.
8. Abra o `index.html`, procure a linha `var CONFIG={FORM_ENDPOINT:''` e cole a URL entre as aspas. Deve ficar assim:
   `var CONFIG={FORM_ENDPOINT:'https://script.google.com/macros/s/.../exec',VERSAO_TERMOS:'2026-09'};`
9. Salve o arquivo e suba de novo no GitHub (**Add file → Upload files**, substituindo o `index.html`).

Pronto. Cada pré-inscrição aparece como uma nova linha na aba **Pré-inscrições**, com protocolo e status "Em análise". A equipe FF pode mudar o status direto na planilha.

Enquanto a URL estiver vazia, o formulário mostra "As pré-inscrições abrem em breve" e não envia nada.

> Se um dia você alterar o `Code.gs`, faça **Implantar → Gerenciar implantações → editar → Nova versão**. Assim a URL continua a mesma.

---

## 3. Cuidados com os dados (LGPD)

- **Acesso à planilha:** compartilhe só com quem da FF precisa analisar as inscrições.
- **Registro do aceite:** a planilha guarda o texto exato que o atleta aceitou e a versão dos termos.
- **Pedido de exclusão:** se um atleta pedir, apague a linha dele.

---

## 4. Antes do lançamento oficial

- [ ] Trocar os dados de exemplo pelos reais: times, atletas e jogos.
- [ ] Tirar o aviso amarelo de pré-lançamento. No `index.html`, apague o bloco `<div class="prelaunch" ...>`.
- [ ] Liberar o site no Google. Apague a linha `<meta name="robots" content="noindex">`.
- [ ] Revisar os textos da página **League** com o regulamento oficial.
