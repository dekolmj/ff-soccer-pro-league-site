/* Login único do site (#entrar) e painel da equipe FF (#painel): Supabase Auth, perfis e as abas de cadastro (cadastros.js).
   A biblioteca do Supabase só é baixada quando alguém abre a tela Entrar ou o painel, para o resto do site continuar leve.
   Quem pode ver e alterar é decidido no banco (tabela equipe_ff e regras de acesso), não aqui. */

var SBJS='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
var SB=null,PN={user:null,equipe:null,aba:'times'};

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

function pnSair(){SB.auth.signOut().then(function(){PN.user=null;PN.equipe=null;CD.ok=false;pnGuardaPerfil(null);acct();location.hash='entrar';toast('Você saiu.');});}

// Perfil de quem está logado (equipe ou atleta), decidido no banco por meu_perfil(). O site guarda só o tipo, para o botão do topo.
function pnPerfil(cb){SB.rpc('meu_perfil').then(function(r){
  if(r.error)  // banco ainda sem meu_perfil(): vale o jeito antigo (só equipe)
    return SB.from('equipe_ff').select('nome,papel').eq('user_id',PN.user.id).maybeSingle().then(function(q){var p=q.data?{tipo:'equipe',nome:q.data.nome,papel:q.data.papel}:null;pnGuardaPerfil(p&&p.tipo);cb(p);});
  var p=(r.data&&r.data.tipo)?r.data:null;pnGuardaPerfil(p&&p.tipo);cb(p);});}
function pnGuardaPerfil(t){try{if(t)localStorage.setItem('ffl_perfil',t);else localStorage.removeItem('ffl_perfil');}catch(e){}}
function pnSelo(p){return p.tipo==='equipe'?'<span class="chip gold">Equipe FF · '+(p.papel==='admin'?'Administrador':'Editor')+'</span>'
  :'<span class="chip ok">Atleta'+(p.time?' · '+esc(p.time):'')+'</span>';}

/* ================= TELA ENTRAR (#entrar) =================
   Login único: a equipe FF vai para o painel, o atleta vê a própria conta e as outras contas veem um aviso.
   "Primeiro acesso": o atleta cadastrado pela equipe cria a própria senha (só e-mails cadastrados). */
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
  '<p class="muted" style="margin:0;text-align:center;font-size:14px">'+(criar?'<a class="more" href="#entrar" id="enModo">Já tenho senha · Entrar</a>':'Atleta cadastrado na FF? <a class="more" href="#entrar" id="enModo">Primeiro acesso</a>')+'</p>'+
  '</form>';
  if(criar)el.querySelector('form').insertAdjacentHTML('afterbegin','<div><h3 style="margin:0 0 4px">Primeiro acesso do atleta</h3><p class="muted" style="margin:0;font-size:14px">Use o e-mail que você informou à FF e crie a sua senha. Depois, confirme pelo link que vai chegar no seu e-mail.</p></div>');
  document.getElementById('enModo').addEventListener('click',function(e){e.preventDefault();EN.modo=criar?'entrar':'criar';enForm();});
  document.getElementById('enF').addEventListener('submit',function(e){
    e.preventDefault();var em=document.getElementById('enEmail').value.trim(),se=document.getElementById('enSenha').value,er=document.getElementById('enErr');
    if(!/^\S+@\S+\.\S+$/.test(em)||!se){er.textContent='Preencha e-mail e senha.';return;}
    if(criar&&se!==document.getElementById('enSenha2').value){er.textContent='As duas senhas não são iguais.';return;}
    if(!SB){er.textContent='Login indisponível agora. Tente de novo em instantes.';return;}
    var bt=this.querySelector('button');bt.disabled=true;er.textContent='';
    if(criar){
      if(se.length<6){bt.disabled=false;er.textContent='A senha precisa ter pelo menos 6 caracteres.';return;}
      SB.rpc('primeiro_acesso_liberado',{email:em}).then(function(l){
        if(l.error||l.data!==true){bt.disabled=false;er.textContent=l.error?pnErro(l.error.message):'Este e-mail não está cadastrado como atleta, ou já tem senha. Confira o e-mail ou fale com a FF.';return;}
        SB.auth.signUp({email:em,password:se,options:{emailRedirectTo:location.href.split('#')[0]+'#entrar'}}).then(function(r){
          bt.disabled=false;if(r.error){er.textContent=pnErro(r.error.message);return;}
          if(r.data.session)return enDestino(r.data.user);
          EN.modo='entrar';enForm('Senha criada. Falta confirmar o e-mail: abra o link que chegou para você (confira o spam). Depois, é só entrar aqui.');
        });
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
  pnPerfil(function(p){
    acct();
    if(p&&p.tipo==='equipe'){PN.equipe=p;toast('Bem-vindo, '+p.nome.split(' ')[0]+'!');location.hash='painel';return;}
    var el=enEl();if(!el)return;
    var sair='<button class="btn" id="enSair" style="justify-content:center">Sair</button>';
    if(p&&p.tipo==='atleta'){
      // A área do atleta com os dados reais abre na onda 4, quando o atleta já estiver num time do site.
      var id=p.time_id&&p.numero?p.time_id+'-'+p.numero:'',abre=ONDA>=4&&id&&PM[id];
      el.innerHTML='<div style="display:grid;gap:12px;text-align:center;justify-items:center">'+pnSelo(p)+'<h3 style="margin:0">Olá, '+esc(p.nome.split(' ')[0])+'!</h3>'+
        '<p class="muted" style="margin:0">Sua conta de atleta está ativa'+(p.time?' no <b>'+esc(p.time)+'</b>'+(p.numero?', camisa '+p.numero:''):'')+'. '+
        (abre?'':'A sua área de atleta abre aqui quando a temporada começar.')+'</p>'+
        (abre?'<button class="btn primary" id="enArea" style="justify-content:center;width:100%">Abrir minha área</button>':'')+sair+'</div>';
      if(abre)document.getElementById('enArea').addEventListener('click',function(){login(id);});
    }else{
      el.innerHTML='<div style="display:grid;gap:12px;text-align:center"><h3>Acesso ainda não liberado</h3><p class="muted" style="margin:0">Você entrou como <b>'+esc(user.email)+'</b>, mas este e-mail ainda não está ligado a um atleta nem à equipe FF. Fale com a FF para liberar o seu acesso.</p>'+sair+'</div>';
    }
    document.getElementById('enSair').addEventListener('click',function(){SB.auth.signOut().then(function(){EN.modo='entrar';pnGuardaPerfil(null);acct();enForm();});});
  });
}

function pnCarregar(){
  pnPerfil(function(p){
    PN.equipe=p&&p.tipo==='equipe'?p:null;
    if(p&&p.tipo==='atleta'){location.replace('#entrar');return;}
    if(!PN.equipe){var el=pnEl();if(!el)return;
      el.innerHTML='<div class="login"><div class="card" style="display:grid;gap:12px;text-align:center"><h2>Acesso ainda não liberado</h2><p class="muted" style="margin:0">Você entrou como <b>'+esc(PN.user.email)+'</b>, mas este e-mail ainda não faz parte da equipe FF. Peça a liberação ao administrador.</p><button class="btn" id="pnSair" style="justify-content:center">Sair</button></div></div>';
      document.getElementById('pnSair').addEventListener('click',pnSair);return;}
    pnPainel();
  });
}

function pnData(iso){if(!iso)return '';var d=new Date(iso);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}

function pnPainel(){
  var el=pnEl();if(!el)return;
  var abas=[['times','Times'],['atletas','Atletas'],['historico','Histórico']];
  el.innerHTML='<div class="ahead" style="padding-top:30px"><div><div class="eyebrow">Painel da FF · '+esc(PN.equipe.nome)+'</div><h1>'+abas.filter(function(a){return a[0]===PN.aba;})[0][1]+'</h1></div>'+
  '<div class="pnquem">'+pnSelo(PN.equipe)+'<button class="btn sm" id="pnSair">Sair</button></div></div>'+
  '<nav class="ctabs pnabas" aria-label="Seções do painel">'+abas.map(function(a){return '<a href="#painel" data-aba="'+a[0]+'" class="'+(PN.aba===a[0]?'on':'')+'">'+a[1]+'</a>';}).join('')+'</nav>'+
  '<div id="pnAba"></div>';
  document.getElementById('pnSair').addEventListener('click',pnSair);
  el.querySelectorAll('[data-aba]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();PN.aba=a.dataset.aba;CD.form=null;pnPainel();});});
  cdAba(PN.aba);
}
