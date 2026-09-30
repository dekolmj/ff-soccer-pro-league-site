/* Login único do site (#entrar) e painel da equipe FF (#painel): Supabase Auth e análise das pré-inscrições em tempo real.
   A biblioteca do Supabase só é baixada quando alguém abre a tela Entrar ou o painel, para o resto do site continuar leve.
   Quem pode ver e alterar é decidido no banco (tabela equipe_ff e regras de acesso), não aqui. */

var SBJS='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
var SB=null,PN={user:null,equipe:null,lista:[],filtro:'em_analise',busca:'',canal:null};
var PN_ST={em_analise:['Em análise','gold'],aprovada:['Aprovada','ok'],lista_espera:['Lista de espera',''],recusada:['Recusada',''],cancelada:['Cancelada','']};

function pnEl(){return document.getElementById('painel');}
function pnSb(cb){
  if(SB)return cb();
  var s=document.createElement('script');s.src=SBJS;
  s.onload=function(){SB=window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY);cb();};
  s.onerror=function(){var el=pnEl()||enEl();if(el)el.innerHTML='<p class="err" style="margin:0">Não foi possível carregar o login. Confira sua internet e recarregue a página.</p>';};
  document.head.appendChild(s);
}
function pnErro(m){
  m=String(m||'');
  if(/Invalid login/i.test(m))return 'E-mail ou senha incorretos.';
  if(/not confirmed/i.test(m))return 'Seu e-mail ainda não foi confirmado. Abra o link que chegou no seu e-mail (confira o spam) ou peça a liberação ao administrador.';
  if(/already registered|already been registered/i.test(m))return 'Este e-mail já tem senha. Use "Entrar".';
  if(/at least 6|Password should/i.test(m))return 'A senha precisa ter pelo menos 6 caracteres.';
  if(/rate limit|too many/i.test(m))return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if(/Signups not allowed/i.test(m))return 'Criação de senha desativada. Fale com o administrador.';
  return 'Não deu certo agora. Tente de novo em instantes.';
}

P.painel=function(){setTimeout(pnIniciar,0);return '<div class="wrap pnwrap" id="painel"><p class="muted" style="padding:40px 0">Carregando o painel…</p></div>';};

// Sem login, o painel manda para a tela Entrar, que é a porta única do site.
function pnIniciar(){
  if(!CONFIG.SUPABASE_URL){pnEl().innerHTML='<p class="muted" style="padding:40px 0">Painel indisponível.</p>';return;}
  pnSb(function(){SB.auth.getSession().then(function(r){var s=r.data&&r.data.session;PN.user=s?s.user:null;if(PN.user)pnCarregar();else location.replace('#entrar');});});
}

function pnSair(){if(PN.canal){SB.removeChannel(PN.canal);PN.canal=null;}SB.auth.signOut().then(function(){PN.user=null;PN.equipe=null;PN.lista=[];acct();location.hash='entrar';toast('Você saiu.');});}

/* ================= TELA ENTRAR (#entrar) =================
   Login único: quem é da equipe FF vai para o painel; as outras contas veem um aviso
   (a área do atleta com login próprio ainda não existe; a demonstração continua na mesma tela). */
var EN={modo:'entrar'};
function enEl(){return document.getElementById('entrarF');}

function entrarIniciar(){
  if(!CONFIG.SUPABASE_URL)return enForm();
  pnSb(function(){SB.auth.getSession().then(function(r){var s=r.data&&r.data.session;if(s)enDestino(s.user);else enForm();});});
}

function enForm(msg){
  var el=enEl();if(!el)return;var criar=EN.modo==='criar';
  el.innerHTML='<form id="enF" novalidate style="display:grid;gap:14px"><label class="fld">E-mail<input id="enEmail" type="email" autocomplete="username" placeholder="voce@email.com"></label>'+
  '<label class="fld">'+(criar?'Crie uma senha (mínimo 6 caracteres)':'Senha')+'<input id="enSenha" type="password" autocomplete="'+(criar?'new-password':'current-password')+'" placeholder="••••••••"></label>'+
  (criar?'<label class="fld">Repita a senha<input id="enSenha2" type="password" autocomplete="new-password" placeholder="••••••••"></label>':'')+
  '<div class="err" id="enErr" role="alert"></div>'+(msg?'<div class="notice">'+msg+'</div>':'')+
  '<button class="btn primary" type="submit" style="justify-content:center">'+(criar?'Criar senha':'Entrar')+'</button>'+
  '</form>';
  document.getElementById('enF').addEventListener('submit',function(e){
    e.preventDefault();var em=document.getElementById('enEmail').value.trim(),se=document.getElementById('enSenha').value,er=document.getElementById('enErr');
    if(!/^\S+@\S+\.\S+$/.test(em)||!se){er.textContent='Preencha e-mail e senha.';return;}
    if(criar&&se!==document.getElementById('enSenha2').value){er.textContent='As duas senhas não são iguais.';return;}
    if(!SB){er.textContent='Login indisponível agora. Tente de novo em instantes.';return;}
    var bt=this.querySelector('button');bt.disabled=true;er.textContent='';
    if(criar){
      SB.auth.signUp({email:em,password:se,options:{emailRedirectTo:location.href.split('#')[0]+'#entrar'}}).then(function(r){
        bt.disabled=false;if(r.error){er.textContent=pnErro(r.error.message);return;}
        if(r.data.session)return enDestino(r.data.user);
        EN.modo='entrar';enForm('Senha criada. Falta confirmar o e-mail: abra o link que chegou para você (confira o spam) ou peça a liberação ao administrador. Depois, é só entrar aqui.');
      });
    }else{
      SB.auth.signInWithPassword({email:em,password:se}).then(function(r){
        bt.disabled=false;if(r.error){er.textContent=pnErro(r.error.message);return;}
        enDestino(r.data.user);
      });
    }
  });
}

function enDestino(user){
  PN.user=user;acct();
  SB.from('equipe_ff').select('nome,papel').eq('user_id',user.id).maybeSingle().then(function(r){
    if(r.data){PN.equipe=r.data;toast('Bem-vindo, '+r.data.nome.split(' ')[0]+'!');acct();location.hash='painel';return;}
    var el=enEl();if(!el)return;
    el.innerHTML='<div style="display:grid;gap:12px;text-align:center"><h3>Acesso ainda não liberado</h3><p class="muted" style="margin:0">Você entrou como <b>'+esc(user.email)+'</b>. A área do atleta com login próprio chega em breve; por enquanto, use a demonstração abaixo. Se você é da equipe FF, peça a liberação ao administrador.</p><button class="btn" id="enSair" style="justify-content:center">Sair</button></div>';
    document.getElementById('enSair').addEventListener('click',function(){SB.auth.signOut().then(function(){EN.modo='entrar';acct();enForm();});});
  });
}

function pnCarregar(){
  SB.from('equipe_ff').select('nome,papel').eq('user_id',PN.user.id).maybeSingle().then(function(r){
    PN.equipe=r.data||null;
    if(!PN.equipe){var el=pnEl();if(!el)return;
      el.innerHTML='<div class="login"><div class="card" style="display:grid;gap:12px;text-align:center"><h2>Acesso ainda não liberado</h2><p class="muted" style="margin:0">Você entrou como <b>'+esc(PN.user.email)+'</b>, mas este e-mail ainda não faz parte da equipe FF. Peça a liberação ao administrador.</p><button class="btn" id="pnSair" style="justify-content:center">Sair</button></div></div>';
      document.getElementById('pnSair').addEventListener('click',pnSair);return;}
    SB.from('pre_inscricoes').select('*').order('recebido_em',{ascending:false}).then(function(q){
      if(q.error){pnEl().innerHTML='<p class="err" style="padding:40px 0">Não foi possível carregar as pré-inscrições.</p>';return;}
      PN.lista=q.data||[];pnPainel();pnAoVivo();
    });
  });
}

function pnAoVivo(){
  if(PN.canal)return;
  PN.canal=SB.channel('pre-inscricoes').on('postgres_changes',{event:'*',schema:'public',table:'pre_inscricoes'},function(m){
    var n=m.new||{},o=m.old||{},i=-1;
    PN.lista.forEach(function(x,k){if(x.id===(n.id||o.id))i=k;});
    if(m.eventType==='DELETE'){if(i>=0)PN.lista.splice(i,1);}
    else if(i>=0)PN.lista[i]=n;
    else{PN.lista.unshift(n);toast('Nova pré-inscrição: '+String(n.nome||'').split(' ')[0]);}
    if(pnEl())pnLista();
  }).subscribe();
}

function pnIdade(d){if(!d)return '';var n=new Date(d+'T12:00:00'),h=new Date(),a=h.getFullYear()-n.getFullYear();if(h<new Date(h.getFullYear(),n.getMonth(),n.getDate()))a--;return a;}
function pnData(iso){if(!iso)return '';var d=new Date(iso);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}

function pnPainel(){
  var el=pnEl();if(!el)return;
  el.innerHTML='<div class="ahead" style="padding-top:30px"><div><div class="eyebrow">Painel da FF · '+esc(PN.equipe.nome)+' · '+(PN.equipe.papel==='admin'?'administrador':'editor')+'</div><h1>Pré-inscrições</h1></div><button class="btn sm" id="pnSair">Sair</button></div>'+
  '<p class="muted" style="margin:-6px 0 16px">Atualiza sozinho: pré-inscrições novas e decisões de outras pessoas da equipe aparecem na hora.</p>'+
  '<div class="days" id="pnFilt" style="flex-wrap:wrap"></div>'+
  '<div class="pnbusca"><label class="fld">Buscar<input id="pnBusca" placeholder="Nome, e-mail ou protocolo" value="'+esc(PN.busca)+'"></label>'+
  '<button class="btn sm" id="pnExcel" title="Baixa a lista que está na tela (filtro e busca) num arquivo do Excel"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3v10M5.5 8.5L10 13l4.5-4.5M4 17h12"/></svg>Baixar Excel</button></div>'+
  '<div id="pnLista" style="display:grid;gap:14px"></div>';
  document.getElementById('pnSair').addEventListener('click',pnSair);
  document.getElementById('pnExcel').addEventListener('click',pnExcel);
  document.getElementById('pnBusca').addEventListener('input',function(){PN.busca=this.value;pnLista();});
  pnLista();
}

// Pré-inscrições que estão na tela: filtro escolhido + busca.
function pnFiltrada(){
  var q=PN.busca.trim().toLowerCase();
  return PN.lista.filter(function(x){return (PN.filtro==='todas'||x.status===PN.filtro)&&(!q||[x.nome,x.email,x.protocolo].join(' ').toLowerCase().indexOf(q)>=0);});
}

function pnLista(){
  var f=document.getElementById('pnFilt'),box=document.getElementById('pnLista');if(!f||!box)return;
  var cont={todas:PN.lista.length};PN.lista.forEach(function(x){cont[x.status]=(cont[x.status]||0)+1;});
  f.innerHTML=[['em_analise','Em análise'],['aprovada','Aprovadas'],['lista_espera','Lista de espera'],['recusada','Recusadas'],['todas','Todas']].map(function(b){
    return '<button data-f="'+b[0]+'" class="'+(PN.filtro===b[0]?'on':'')+'">'+b[1]+' · '+(cont[b[0]]||0)+'</button>';}).join('');
  f.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){PN.filtro=b.dataset.f;pnLista();});});
  var ls=pnFiltrada();
  var ex=document.getElementById('pnExcel');if(ex)ex.disabled=!ls.length;
  if(!ls.length){box.innerHTML='<div class="card"><p class="muted" style="margin:0">'+(PN.lista.length?'Nenhuma pré-inscrição neste filtro.':'Ainda não chegou nenhuma pré-inscrição pelo banco. As próximas enviadas pelo site aparecem aqui na hora.')+'</p></div>';return;}
  var th=['Protocolo','Recebida','Nome','E-mail','Celular','Nascimento','Unidade','Posições','Kit','Camisa','Status',''];
  var SV={ok:'<path d="M4 10.5l4 4 8-9"/>',espera:'<path d="M7 4v12M13 4v12"/>',no:'<path d="M5 5l10 10M15 5L5 15"/>',volta:'<path d="M4 10a6 6 0 1 0 2-4.5M4 3v4h4"/>'};
  var ico=function(k){return '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+SV[k]+'</svg>';};
  var bt=function(id,s,ic,nome,cl){return '<button class="pnic '+cl+'" data-id="'+id+'" data-s="'+s+'" title="'+nome+'" aria-label="'+nome+'">'+ic+'<span>'+nome+'</span></button>';};
  box.innerHTML='<div class="card pntbl" style="padding:0"><table class="tbl"><thead><tr>'+th.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+
  ls.map(function(x){
    var st=PN_ST[x.status]||[x.status,''];
    var pos=(x.posicoes&&x.posicoes.length?x.posicoes:[x.posicao]),nums=(x.numeros&&x.numeros.length?x.numeros:[x.numero]);
    var acoes=x.status==='em_analise'
      ?bt(x.id,'aprovada',ico('ok'),'Aprovar','ok')+bt(x.id,'lista_espera',ico('espera'),'Lista de espera','')+bt(x.id,'recusada',ico('no'),'Recusar','no')
      :bt(x.id,'em_analise',ico('volta'),'Voltar para análise','');
    return '<tr><td data-l="Protocolo" class="pr">'+esc(x.protocolo)+'</td><td data-l="Recebida">'+pnData(x.recebido_em).replace(/\/\d{4}/,'').replace(' ','<br>')+'</td>'+
      '<td data-l="Nome" class="nm">'+esc(x.nome)+'</td>'+
      '<td data-l="E-mail" class="em">'+esc(x.email)+(x.duplicado?'<div><span class="chip">repetido</span></div>':'')+'</td><td data-l="Celular">'+esc(x.celular)+'</td>'+
      '<td data-l="Nascimento">'+esc(String(x.nascimento||'').split('-').reverse().join('/'))+'<div class="lbl">'+pnIdade(x.nascimento)+' anos</div></td>'+
      '<td data-l="Unidade" class="wr">'+esc(x.unidade)+'</td>'+
      '<td data-l="Posições" class="ls">'+pos.map(function(v,i){return '<div><span class="lbl">'+(i+1)+'ª</span> '+esc(v)+'</div>';}).join('')+'</td>'+
      '<td data-l="Kit">'+esc(x.kit)+'</td>'+
      '<td data-l="Camisa" class="ls"><div>'+esc(x.nome_camisa)+'</div><div class="lbl">Nº '+esc(nums.join(' · '))+'</div></td>'+
      '<td data-l="Status"><span class="chip '+st[1]+'">'+st[0]+'</span>'+(x.analisado_em?'<div class="lbl" style="margin-top:4px">'+pnData(x.analisado_em).replace(/\/\d{4}/,'')+'</div>':'')+'</td>'+
      '<td class="ac"><div class="pnacoes">'+acoes+'</div></td></tr>';
  }).join('')+'</tbody></table></div>';
  box.querySelectorAll('button[data-s]').forEach(function(b){b.addEventListener('click',function(){pnDecidir(b.dataset.id,b.dataset.s,b);});});
}

function pnDecidir(id,s,bt){
  bt.disabled=true;
  var mud=s==='em_analise'?{status:s,analisado_por:null,analisado_em:null}:{status:s,analisado_por:PN.user.id,analisado_em:new Date().toISOString()};
  SB.from('pre_inscricoes').update(mud).eq('id',id).select().then(function(r){
    if(r.error||!r.data||!r.data.length){bt.disabled=false;toast('Não foi possível salvar. Tente de novo.');return;}
    PN.lista.forEach(function(x,k){if(x.id===id)PN.lista[k]=r.data[0];});
    toast({aprovada:'Pré-inscrição aprovada.',recusada:'Pré-inscrição recusada.',lista_espera:'Movida para a lista de espera.',em_analise:'Voltou para análise.'}[s]);
    pnLista();
  });
}

/* ====== BAIXAR EXCEL ======
   Monta um .xlsx de verdade no navegador (sem biblioteca): uma planilha com a lista que está na tela,
   empacotada num zip simples (sem compressão), que o Excel, o Google Planilhas e o Numbers abrem. */
function pnExcel(){
  var ls=pnFiltrada();if(!ls.length)return;
  var dia=function(d){return d?String(d).split('-').reverse().join('/'):'';};
  var cab=['Protocolo','Recebida em','Status','Nome','E-mail','E-mail repetido','Celular','Nascimento','Idade','Unidade','Posição 1','Posição 2','Posição 3','Kit','Nome na camisa','Número 1','Número 2','Número 3','Analisada em'];
  var larg=[15,17,15,30,32,10,17,12,7,16,13,13,13,6,15,10,10,10,17];
  var linhas=ls.map(function(x){
    var pos=(x.posicoes&&x.posicoes.length?x.posicoes:[x.posicao]),nums=(x.numeros&&x.numeros.length?x.numeros:[x.numero]);
    return [x.protocolo,pnData(x.recebido_em),(PN_ST[x.status]||[x.status])[0],x.nome,x.email,x.duplicado?'Sim':'',x.celular,dia(x.nascimento),pnIdade(x.nascimento),x.unidade,
      pos[0],pos[1],pos[2],x.kit,x.nome_camisa,nums[0],nums[1],nums[2],pnData(x.analisado_em)];
  });
  var xe=function(v){return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  var col=function(i){var s='';i++;while(i){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26;}return s;};
  var cel=function(v,c,r,cab){var ref=col(c)+r,st=cab?' s="1"':'';
    if(v==null||v==='')return '';
    if(typeof v==='number'&&isFinite(v))return '<c r="'+ref+'"'+st+'><v>'+v+'</v></c>';
    return '<c r="'+ref+'" t="inlineStr"'+st+'><is><t xml:space="preserve">'+xe(v)+'</t></is></c>';};
  var fim=col(cab.length-1)+(linhas.length+1);
  var planilha='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'+
    '<cols>'+larg.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('')+'</cols><sheetData>'+
    [cab].concat(linhas).map(function(l,r){return '<row r="'+(r+1)+'">'+l.map(function(v,c){return cel(v,c,r+1,r===0);}).join('')+'</row>';}).join('')+
    '</sheetData><autoFilter ref="A1:'+fim+'"/></worksheet>';
  var arq={
    '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Pré-inscrições" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">\'Pré-inscrições\'!$A$1:$'+col(cab.length-1)+'$'+(linhas.length+1)+'</definedName></definedNames></workbook>',
    'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2C14D"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    'xl/worksheets/sheet1.xml':planilha
  };
  var nomeF={em_analise:'em-analise',aprovada:'aprovadas',lista_espera:'lista-de-espera',recusada:'recusadas',todas:'todas'}[PN.filtro]||'lista';
  var h=new Date(),hoje=h.getFullYear()+'-'+String(h.getMonth()+1).padStart(2,'0')+'-'+String(h.getDate()).padStart(2,'0');
  var blob=new Blob([pnZip(arq)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pre-inscricoes-'+nomeF+'-'+hoje+'.xlsx';
  document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},4000);
  toast(ls.length+(ls.length===1?' pré-inscrição baixada.':' pré-inscrições baixadas.'));
}

// Zip sem compressão (método "stored"): suficiente para o .xlsx e sem biblioteca.
function pnZip(arq){
  var T=pnZip.t;if(!T){T=pnZip.t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0;}}
  var crc=function(b){var c=-1;for(var i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return (c^-1)>>>0;};
  var enc=new TextEncoder(),d=new Date();
  var hora=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),data=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  var partes=[],central=[],pos=0;
  var cab=function(tam){var b=new Uint8Array(tam);return {b:b,v:new DataView(b.buffer)};};
  Object.keys(arq).forEach(function(nome){
    var nm=enc.encode(nome),dd=enc.encode(arq[nome]),c=crc(dd);
    var l=cab(30);l.v.setUint32(0,0x04034b50,true);l.v.setUint16(4,20,true);l.v.setUint16(6,0x0800,true);l.v.setUint16(10,hora,true);l.v.setUint16(12,data,true);
    l.v.setUint32(14,c,true);l.v.setUint32(18,dd.length,true);l.v.setUint32(22,dd.length,true);l.v.setUint16(26,nm.length,true);
    var g=cab(46);g.v.setUint32(0,0x02014b50,true);g.v.setUint16(4,20,true);g.v.setUint16(6,20,true);g.v.setUint16(8,0x0800,true);g.v.setUint16(12,hora,true);g.v.setUint16(14,data,true);
    g.v.setUint32(16,c,true);g.v.setUint32(20,dd.length,true);g.v.setUint32(24,dd.length,true);g.v.setUint16(28,nm.length,true);g.v.setUint32(42,pos,true);
    partes.push(l.b,nm,dd);central.push(g.b,nm);pos+=30+nm.length+dd.length;
  });
  var tamC=central.reduce(function(s,b){return s+b.length;},0),n=Object.keys(arq).length;
  var e=cab(22);e.v.setUint32(0,0x06054b50,true);e.v.setUint16(8,n,true);e.v.setUint16(10,n,true);e.v.setUint32(12,tamC,true);e.v.setUint32(16,pos,true);
  return new Blob(partes.concat(central,[e.b]));
}

window.addEventListener('hashchange',function(){if(PN.canal&&location.hash!=='#painel'){SB.removeChannel(PN.canal);PN.canal=null;}});
