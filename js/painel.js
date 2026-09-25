/* Painel da equipe FF (#painel): login com e-mail e senha (Supabase Auth) e análise das pré-inscrições em tempo real.
   A biblioteca do Supabase só é baixada quando alguém abre o painel, para o resto do site continuar leve.
   Quem pode ver e alterar é decidido no banco (tabela equipe_ff e regras de acesso), não aqui. */

var SBJS='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
var SB=null,PN={user:null,equipe:null,lista:[],filtro:'em_analise',busca:'',modo:'entrar',canal:null};
var PN_ST={em_analise:['Em análise','gold'],aprovada:['Aprovada','ok'],lista_espera:['Lista de espera',''],recusada:['Recusada',''],cancelada:['Cancelada','']};

function pnEl(){return document.getElementById('painel');}
function pnSb(cb){
  if(SB)return cb();
  var s=document.createElement('script');s.src=SBJS;
  s.onload=function(){SB=window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_KEY);cb();};
  s.onerror=function(){var el=pnEl();if(el)el.innerHTML='<p class="err" style="padding:40px 0">Não foi possível abrir o painel. Confira sua internet e recarregue a página.</p>';};
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

function pnIniciar(){
  if(!CONFIG.SUPABASE_URL){pnEl().innerHTML='<p class="muted" style="padding:40px 0">Painel indisponível.</p>';return;}
  pnSb(function(){SB.auth.getSession().then(function(r){var s=r.data&&r.data.session;PN.user=s?s.user:null;return PN.user?pnCarregar():pnLogin();});});
}

function pnLogin(msg){
  var el=pnEl();if(!el)return;var criar=PN.modo==='criar';
  el.innerHTML='<div class="login"><div style="text-align:center;display:grid;gap:10px;justify-items:center"><img src="'+LOGO+'" width="76" height="76" alt="" style="object-fit:contain"><h1 style="font-size:44px">Painel da FF</h1><p class="muted" style="margin:0">Acesso só para a equipe FF Soccer.</p></div>'+
  '<form class="card" id="pnF" novalidate style="display:grid;gap:14px"><label class="fld">E-mail<input id="pnEmail" type="email" autocomplete="username" placeholder="voce@email.com"></label>'+
  '<label class="fld">'+(criar?'Crie uma senha (mínimo 6 caracteres)':'Senha')+'<input id="pnSenha" type="password" autocomplete="'+(criar?'new-password':'current-password')+'" placeholder="••••••••"></label>'+
  (criar?'<label class="fld">Repita a senha<input id="pnSenha2" type="password" autocomplete="new-password" placeholder="••••••••"></label>':'')+
  '<div class="err" id="pnErr" role="alert"></div>'+(msg?'<div class="notice">'+msg+'</div>':'')+
  '<button class="btn primary" type="submit" style="justify-content:center">'+(criar?'Criar senha':'Entrar')+'</button>'+
  '<a class="more" href="#painel" id="pnModo">'+(criar?'Já tenho senha: entrar':'Primeiro acesso? Criar senha')+'</a></form></div>';
  document.getElementById('pnModo').addEventListener('click',function(e){e.preventDefault();PN.modo=criar?'entrar':'criar';pnLogin();});
  document.getElementById('pnF').addEventListener('submit',function(e){
    e.preventDefault();var em=document.getElementById('pnEmail').value.trim(),se=document.getElementById('pnSenha').value,er=document.getElementById('pnErr');
    if(!/^\S+@\S+\.\S+$/.test(em)||!se){er.textContent='Preencha e-mail e senha.';return;}
    if(criar&&se!==document.getElementById('pnSenha2').value){er.textContent='As duas senhas não são iguais.';return;}
    var bt=this.querySelector('button');bt.disabled=true;er.textContent='';
    if(criar){
      SB.auth.signUp({email:em,password:se,options:{emailRedirectTo:location.href.split('#')[0]+'#painel'}}).then(function(r){
        bt.disabled=false;if(r.error){er.textContent=pnErro(r.error.message);return;}
        if(r.data.session){PN.user=r.data.user;return pnCarregar();}
        PN.modo='entrar';pnLogin('Senha criada. Falta confirmar o e-mail: abra o link que chegou para você (confira o spam) ou peça a liberação ao administrador. Depois, é só entrar aqui.');
      });
    }else{
      SB.auth.signInWithPassword({email:em,password:se}).then(function(r){
        bt.disabled=false;if(r.error){er.textContent=pnErro(r.error.message);return;}
        PN.user=r.data.user;pnCarregar();
      });
    }
  });
}

function pnSair(){if(PN.canal){SB.removeChannel(PN.canal);PN.canal=null;}SB.auth.signOut().then(function(){PN.user=null;PN.equipe=null;PN.lista=[];PN.modo='entrar';pnLogin();});}

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
  '<label class="fld" style="margin:14px 0 18px;max-width:420px">Buscar<input id="pnBusca" placeholder="Nome, e-mail ou protocolo" value="'+esc(PN.busca)+'"></label>'+
  '<div id="pnLista" style="display:grid;gap:14px"></div>';
  document.getElementById('pnSair').addEventListener('click',pnSair);
  document.getElementById('pnBusca').addEventListener('input',function(){PN.busca=this.value;pnLista();});
  pnLista();
}

function pnLista(){
  var f=document.getElementById('pnFilt'),box=document.getElementById('pnLista');if(!f||!box)return;
  var cont={todas:PN.lista.length};PN.lista.forEach(function(x){cont[x.status]=(cont[x.status]||0)+1;});
  f.innerHTML=[['em_analise','Em análise'],['aprovada','Aprovadas'],['lista_espera','Lista de espera'],['recusada','Recusadas'],['todas','Todas']].map(function(b){
    return '<button data-f="'+b[0]+'" class="'+(PN.filtro===b[0]?'on':'')+'">'+b[1]+' · '+(cont[b[0]]||0)+'</button>';}).join('');
  f.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){PN.filtro=b.dataset.f;pnLista();});});
  var q=PN.busca.trim().toLowerCase();
  var ls=PN.lista.filter(function(x){return (PN.filtro==='todas'||x.status===PN.filtro)&&(!q||[x.nome,x.email,x.protocolo].join(' ').toLowerCase().indexOf(q)>=0);});
  if(!ls.length){box.innerHTML='<div class="card"><p class="muted" style="margin:0">'+(PN.lista.length?'Nenhuma pré-inscrição neste filtro.':'Ainda não chegou nenhuma pré-inscrição pelo banco. As próximas enviadas pelo site aparecem aqui na hora.')+'</p></div>';return;}
  var th=['Protocolo','Recebida','Nome','E-mail','Celular','Nascimento','Unidade','Posição','Kit','Camisa','Status',''];
  box.innerHTML='<div class="card pntbl" style="padding:0"><div class="tblw"><table class="tbl"><thead><tr>'+th.map(function(h,i){return '<th'+(i===th.length-1?' class="ac"':'')+'>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+
  ls.map(function(x){
    var st=PN_ST[x.status]||[x.status,''];
    var acoes=x.status==='em_analise'
      ?'<button class="btn primary sm" data-id="'+x.id+'" data-s="aprovada">✓ Aprovar</button><button class="btn sm" data-id="'+x.id+'" data-s="lista_espera">Espera</button><button class="btn sm" data-id="'+x.id+'" data-s="recusada">✕ Recusar</button>'
      :'<button class="btn sm" data-id="'+x.id+'" data-s="em_analise">↺ Reabrir</button>';
    return '<tr><td>'+esc(x.protocolo)+'</td><td>'+pnData(x.recebido_em).replace(/\/\d{4}/,'')+'</td><td class="nm">'+esc(x.nome)+'</td>'+
      '<td class="em">'+esc(x.email)+(x.duplicado?'<div><span class="chip">repetido</span></div>':'')+'</td><td>'+esc(x.celular)+'</td>'+
      '<td>'+esc(String(x.nascimento||'').split('-').reverse().join('/'))+' <span class="lbl">('+pnIdade(x.nascimento)+')</span></td>'+
      '<td>'+esc(x.unidade)+'</td><td>'+esc(x.posicao)+'</td><td>'+esc(x.kit)+'</td><td>'+esc(x.nome_camisa)+' · Nº '+esc(x.numero)+'</td>'+
      '<td><span class="chip '+st[1]+'">'+st[0]+'</span>'+(x.analisado_em?'<div class="lbl" style="margin-top:4px">'+pnData(x.analisado_em).replace(/\/\d{4}/,'')+'</div>':'')+'</td>'+
      '<td class="ac"><div class="row" style="gap:6px">'+acoes+'</div></td></tr>';
  }).join('')+'</tbody></table></div></div>';
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

window.addEventListener('hashchange',function(){if(PN.canal&&location.hash!=='#painel'){SB.removeChannel(PN.canal);PN.canal=null;}});
