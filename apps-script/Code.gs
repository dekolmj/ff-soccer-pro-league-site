/**
 * FF Soccer Pro League · Recebimento das pré-inscrições
 *
 * Este script recebe o formulário de pré-inscrição do site e grava cada envio
 * como uma linha na planilha em que ele está instalado.
 * Como instalar: veja o README.md, seção "Conectar a pré-inscrição".
 */

// Nome da aba onde as pré-inscrições ficam guardadas.
const NOME_DA_ABA = 'Pré-inscrições';

// E-mail que recebe um aviso a cada nova pré-inscrição. Deixe '' para não avisar.
const EMAIL_DE_AVISO = '';

// Prefixo do número de protocolo mostrado ao atleta.
const PREFIXO_PROTOCOLO = 'FF-2027-';

const COLUNAS = [
  'Recebido em', 'Protocolo', 'Status', 'Nome completo', 'E-mail', 'Celular',
  'Data de nascimento', 'Unidade FF', 'Posição', 'Tamanho do kit',
  'Número da camisa', 'Nome na camisa', 'Autorização LGPD (texto aceito)',
  'Condições (texto aceito)', 'Versão dos termos', 'Página de origem', 'Observação'
];

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Campo invisível para robôs: se vier preenchido, ignora sem avisar.
    if (d.hp) return resposta({ ok: true, protocolo: '-' });

    const erro = validar(d);
    if (erro) return resposta({ ok: false, erro: erro });

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const aba = obterAba();
      const email = String(d.email).trim().toLowerCase();
      const duplicado = jaExiste(aba, email);
      const protocolo = PREFIXO_PROTOCOLO + String(aba.getLastRow()).padStart(4, '0');

      aba.appendRow([
        new Date(), protocolo, 'Em análise',
        limpar(d.nome), email, limpar(d.celular), limpar(d.nascimento),
        limpar(d.unidade), limpar(d.posicao), limpar(d.kit),
        Number(d.numero), limpar(String(d.nome_camisa).toUpperCase()),
        limpar(d.aceite_lgpd), limpar(d.aceite_termos), limpar(d.versao_termos),
        limpar(d.origem), duplicado ? 'E-mail já tinha pré-inscrição anterior' : ''
      ]);

      if (EMAIL_DE_AVISO) {
        MailApp.sendEmail(
          EMAIL_DE_AVISO,
          'Nova pré-inscrição ' + protocolo + ' · ' + d.nome,
          'Nome: ' + d.nome + '\nE-mail: ' + email + '\nCelular: ' + d.celular +
          '\nUnidade: ' + d.unidade + '\nPosição: ' + d.posicao +
          '\nCamisa: ' + d.nome_camisa + ' Nº ' + d.numero + ' · tamanho ' + d.kit +
          (duplicado ? '\n\nAtenção: este e-mail já tinha uma pré-inscrição.' : '')
        );
      }
      return resposta({ ok: true, protocolo: protocolo, duplicado: duplicado });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return resposta({ ok: false, erro: 'Erro ao registrar: ' + err });
  }
}

// Abrir a URL do App da Web no navegador mostra esta mensagem (serve para testar).
function doGet() {
  return resposta({ ok: true, servico: 'Pré-inscrição FF Soccer Pro League funcionando' });
}

function validar(d) {
  const obrig = ['nome', 'email', 'celular', 'nascimento', 'unidade', 'posicao', 'kit', 'numero', 'nome_camisa'];
  for (const k of obrig) {
    if (d[k] === undefined || String(d[k]).trim() === '') return 'Campo obrigatório ausente: ' + k;
  }
  if (!/^\S+@\S+\.\S+$/.test(String(d.email))) return 'E-mail inválido';
  const n = Number(d.numero);
  if (!(n >= 1 && n <= 99)) return 'Número da camisa fora de 1 a 99';
  if (String(d.nome_camisa).length > 12) return 'Nome na camisa com mais de 12 letras';
  if (!d.aceite_lgpd || !d.aceite_termos) return 'Aceites obrigatórios ausentes';
  return '';
}

function obterAba() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(NOME_DA_ABA);
  if (!aba) aba = planilha.insertSheet(NOME_DA_ABA);
  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
    aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return aba;
}

function jaExiste(aba, email) {
  const total = aba.getLastRow() - 1;
  if (total < 1) return false;
  const emails = aba.getRange(2, 5, total, 1).getValues();
  return emails.some(function (l) { return String(l[0]).toLowerCase() === email; });
}

// Evita que um texto começando com = + - @ vire fórmula na planilha.
function limpar(v) {
  const t = String(v === undefined || v === null ? '' : v).trim().slice(0, 500);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
