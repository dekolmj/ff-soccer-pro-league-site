/* Cadastros do painel da equipe FF (#painel): Times, Atletas e Histórico.
   Usa o mesmo login do painel.js (SB, PN). O banco decide quem pode gravar; aqui só a interface.
   Apagar times e atletas fica só para administradores. Escudos e fotos vão para o armazenamento 'marca'. */

var CD={ok:false,temporada:null,times:[],atletas:[],unidades:[],aprovadas:[],busca:'',time:'',form:null,hist:[]};
var CD_POS=['GOL','LAT','ZAG','VOL','MEI','ATA'],CD_KIT=['P','M','G','GG','XG'];

function cdEl(){return document.getElementById('pnAba');}
function cdAdmin(){return PN.equipe&&PN.equipe.papel==='admin';}
function cdMsg(t){var el=cdEl();if(el)el.innerHTML='<p class="muted" style="padding:20px 0">'+t+'</p>';}

// Carrega times, atletas, unidades e a temporada atual (uma vez; recarrega depois de cada gravação).
function cdCarregar(cb){
  Promise.all([
    SB.from('temporadas').select('id,nome').order('id',{ascending:false}).limit(1),
    SB.from('times').select('id,nome,cor,escudo_url,tecnico,ordem,exemplo,temporada_id').order('ordem').order('nome'),
    SB.from('atletas').select('id,nome,apelido,posicao,unidade_id,foto_url,ativo,exemplo,user_id,atletas_privado(email,celular,nascimento),elencos(time_id,numero,nome_camisa,kit,temporada_id)').order('nome'),
    SB.from('unidades').select('id,nome').eq('ativa',true).order('nome'),
    !preOn()?Promise.resolve({data:[]}):SB.from('pre_inscricoes').select('id,protocolo,nome,email,celular,nascimento,unidade,posicao,posicoes,kit,numero,numeros,nome_camisa').eq('status','aprovada').order('nome')
  ]).then(function(r){
    var erro=r.filter(function(x){return x.error;})[0];
    if(erro){cdMsg('Não foi possível carregar os cadastros. Recarregue a página.');console.warn(erro.error);return;}
    CD.temporada=(r[0].data[0]||{}).id||null;CD.times=r[1].data;CD.unidades=r[3].data;CD.aprovadas=r[4].data;
    CD.atletas=r[2].data.map(function(a){var pv=Array.isArray(a.atletas_privado)?a.atletas_privado[0]:a.atletas_privado,el=(a.elencos||[]).slice().sort(function(x,y){return y.temporada_id-x.temporada_id;})[0];
      a.pv=pv||{};a.el=el||null;return a;});
    CD.ok=true;cb();
  });
}
function cdAba(aba){cdMsg('Carregando…');var ir=function(){if(PN.aba!==aba||!cdEl())return;({times:cdTimes,atletas:cdAtletas,historico:cdHistorico})[aba]();};
  if(aba==='historico'||CD.ok)ir();else cdCarregar(ir);}
function cdRecarregar(){CD.ok=false;cdAba(PN.aba);}

function cdTime(id){return CD.times.filter(function(t){return t.id===id;})[0];}
function cdEscudo(t,tam){tam=tam||40;
  return t&&t.escudo_url?'<img src="'+esc(t.escudo_url)+'" alt="" width="'+tam+'" height="'+tam+'" style="object-fit:contain;flex:none">'
    :'<span class="cdbola" style="width:'+tam+'px;height:'+tam+'px;background:'+esc(t?t.cor:'#333')+'">'+esc(t?t.nome[0]:'?')+'</span>';}
function cdSlug(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'time';}

// Envia escudo/foto para o armazenamento público 'marca' e devolve o endereço.
function cdEnviar(arquivo,pasta,cb){
  if(!arquivo)return cb(null);
  if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(arquivo.type))return cb(null,'Use uma imagem PNG, JPG, WEBP ou SVG.');
  if(arquivo.size>2*1024*1024)return cb(null,'A imagem precisa ter até 2 MB.');
  var ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg'}[arquivo.type];
  var cam=pasta+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)+'.'+ext;
  SB.storage.from('marca').upload(cam,arquivo,{contentType:arquivo.type,upsert:false}).then(function(r){
    if(r.error)return cb(null,'Não foi possível enviar a imagem.');
    cb(SB.storage.from('marca').getPublicUrl(cam).data.publicUrl);
  });
}

function cdCampo(rot,html,cl){return '<label class="fld'+(cl?' '+cl:'')+'">'+rot+html+'</label>';}
function cdOpcoes(lista,val){return lista.map(function(o){return '<option value="'+esc(o[0])+'"'+(String(o[0])===String(val==null?'':val)?' selected':'')+'>'+esc(o[1])+'</option>';}).join('');}

/* ================= TIMES ================= */
function cdTimes(){
  var el=cdEl(),f=CD.form&&CD.form.tipo==='time'?CD.form:null;
  var n={};CD.atletas.forEach(function(a){if(a.el)n[a.el.time_id]=(n[a.el.time_id]||0)+1;});
  el.innerHTML='<div class="pnbusca"><p class="muted" style="margin:0;flex:1 1 300px">'+CD.times.length+' times cadastrados. O site mostra os times nesta ordem.</p>'+
    '<button class="btn primary sm" id="cdNovoTime">+ Novo time</button></div>'+
    (f?cdTimeForm(f):'')+
    '<div class="cdgrid">'+CD.times.map(function(t){
      return '<div class="card cdtime"><div class="row">'+cdEscudo(t,48)+'<div style="min-width:0"><b>'+esc(t.nome)+'</b>'+
        '<div class="lbl">'+(n[t.id]||0)+' atletas'+(t.tecnico?' · Técnico: '+esc(t.tecnico):'')+'</div>'+
        (t.exemplo?'<span class="chip">exemplo</span>':'')+'</div></div>'+
        '<button class="btn sm" data-editar="'+esc(t.id)+'">Editar</button></div>';}).join('')+
    (CD.times.length?'':'<div class="card"><p class="muted" style="margin:0">Nenhum time ainda. Comece em "+ Novo time".</p></div>')+'</div>';
  document.getElementById('cdNovoTime').addEventListener('click',function(){CD.form={tipo:'time',novo:true,cor:'#F2C14D',ordem:CD.times.length+1};cdTimes();cdFoco();});
  el.querySelectorAll('[data-editar]').forEach(function(b){b.addEventListener('click',function(){var t=cdTime(b.dataset.editar);
    CD.form={tipo:'time',id:t.id,nome:t.nome,cor:t.cor,tecnico:t.tecnico||'',ordem:t.ordem,escudo_url:t.escudo_url};cdTimes();cdFoco();});});
  if(f)cdTimeLigar(f,n[f.id]||0);
}
function cdFoco(){var fm=document.getElementById('cdForm');if(fm){fm.scrollIntoView({block:'start',behavior:'smooth'});var i=fm.querySelector('input');if(i)i.focus({preventScroll:true});}}

function cdTimeForm(f){
  return '<form class="card cdform" id="cdForm" novalidate><h3>'+(f.novo?'Novo time':'Editar '+esc(f.nome))+'</h3><div class="cdcampos">'+
    cdCampo('Nome do time *','<input id="tNome" maxlength="40" value="'+esc(f.nome||'')+'">')+
    cdCampo('Técnico','<input id="tTec" maxlength="60" value="'+esc(f.tecnico||'')+'">')+
    cdCampo('Cor','<input id="tCor" type="color" value="'+esc(f.cor||'#F2C14D')+'">')+
    cdCampo('Ordem no site','<input id="tOrdem" type="number" min="0" max="99" value="'+esc(f.ordem==null?'':f.ordem)+'">')+
    cdCampo('Escudo (PNG, JPG, WEBP ou SVG, até 2 MB)','<div class="cdimg">'+(f.escudo_url?'<img src="'+esc(f.escudo_url)+'" alt="" width="48" height="48">':'')+'<input id="tEsc" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></div>','full')+
    '</div><div class="err" id="cdErr" role="alert"></div><div class="cdbts">'+
    '<button class="btn primary" type="submit">Salvar</button><button class="btn" type="button" id="cdCancela">Cancelar</button>'+
    (!f.novo&&cdAdmin()?'<button class="btn cdapaga" type="button" id="cdApaga">Apagar time</button>':'')+'</div></form>';
}
function cdTimeLigar(f,qtd){
  var fm=document.getElementById('cdForm'),er=document.getElementById('cdErr');
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdTimes();});
  var ap=document.getElementById('cdApaga');
  if(ap)ap.addEventListener('click',function(){
    if(!confirm('Apagar o time '+f.nome+'?'+(qtd?' Os '+qtd+' atletas dele ficam sem time.':'')+' Isso não pode ser desfeito.'))return;
    ap.disabled=true;SB.from('times').delete().eq('id',f.id).then(function(r){
      if(r.error){ap.disabled=false;er.textContent=/foreign key|violates/i.test(r.error.message)?'Este time já tem jogos cadastrados. Apague os jogos dele antes.':'Não foi possível apagar. Tente de novo.';return;}
      CD.form=null;toast('Time apagado.');cdRecarregar();});
  });
  fm.addEventListener('submit',function(e){e.preventDefault();
    var nome=document.getElementById('tNome').value.trim(),dados={nome:nome,tecnico:document.getElementById('tTec').value.trim()||null,
      cor:document.getElementById('tCor').value.toUpperCase(),ordem:parseInt(document.getElementById('tOrdem').value,10)||0};
    if(!nome){er.textContent='Preencha o nome do time.';return;}
    if(CD.times.some(function(t){return t.id!==f.id&&t.nome.toLowerCase()===nome.toLowerCase();})){er.textContent='Já existe um time com este nome.';return;}
    if(f.novo&&!CD.temporada){er.textContent='Nenhuma temporada cadastrada no banco.';return;}
    var bt=fm.querySelector('[type=submit]');bt.disabled=true;er.textContent='';
    cdEnviar(document.getElementById('tEsc').files[0],'escudos',function(url,erro){
      if(erro){bt.disabled=false;er.textContent=erro;return;}
      if(url)dados.escudo_url=url;
      var q;
      if(f.novo){var id=cdSlug(nome),base=id,k=2;while(cdTime(id))id=base+'-'+(k++);
        dados.id=id;dados.temporada_id=CD.temporada;q=SB.from('times').insert(dados);}
      else q=SB.from('times').update(dados).eq('id',f.id);
      q.then(function(r){bt.disabled=false;
        if(r.error){er.textContent='Não foi possível salvar. Tente de novo.';console.warn(r.error);return;}
        CD.form=null;toast(f.novo?'Time cadastrado.':'Time atualizado.');cdRecarregar();});
    });
  });
}

/* ================= ATLETAS ================= */
function cdAtletaPorEmail(em){em=String(em||'').toLowerCase();return CD.atletas.filter(function(a){return (a.pv.email||'').toLowerCase()===em;})[0];}
function cdPendentes(){return CD.aprovadas.filter(function(x){return !cdAtletaPorEmail(x.email);});}

function cdAtletas(){
  var el=cdEl(),f=CD.form&&CD.form.tipo!=='time'?CD.form:null,pend=cdPendentes();
  el.innerHTML='<div class="pnbusca"><label class="fld">Buscar<input id="cdBusca" placeholder="Nome ou e-mail" value="'+esc(CD.busca)+'"></label>'+
    '<label class="fld" style="flex:0 1 220px">Time<select id="cdTimeF">'+cdOpcoes([['','Todos'],['-','Sem time']].concat(CD.times.map(function(t){return [t.id,t.nome];})),CD.time)+'</select></label>'+
    '<button class="btn primary sm" id="cdNovoAt">+ Novo atleta</button>'+
    (preOn()?'<button class="btn sm" id="cdImporta"'+(pend.length?'':' disabled')+'>Cadastrar aprovados · '+pend.length+'</button>':'')+'</div>'+
    (f&&f.tipo==='importar'?cdImportaHTML(pend):'')+(f&&f.tipo==='atleta'?cdAtletaForm(f):'')+
    '<div id="cdLista"></div>';
  document.getElementById('cdBusca').addEventListener('input',function(){CD.busca=this.value;cdAtletasLista();});
  document.getElementById('cdTimeF').addEventListener('change',function(){CD.time=this.value;cdAtletasLista();});
  document.getElementById('cdNovoAt').addEventListener('click',function(){CD.form={tipo:'atleta',novo:true,el:{}};cdAtletas();cdFoco();});
  if(preOn())document.getElementById('cdImporta').addEventListener('click',function(){CD.form={tipo:'importar'};cdAtletas();
    var b=document.getElementById('cdImp');if(b)b.scrollIntoView({block:'start',behavior:'smooth'});});
  if(f&&f.tipo==='importar')cdImportaLigar(pend);
  if(f&&f.tipo==='atleta')cdAtletaLigar(f);
  cdAtletasLista();
}

function cdAtletasLista(){
  var box=document.getElementById('cdLista');if(!box)return;var q=CD.busca.trim().toLowerCase();
  var ls=CD.atletas.filter(function(a){
    if(CD.time==='-'?a.el:CD.time&&(!a.el||a.el.time_id!==CD.time))return false;
    return !q||(a.nome+' '+(a.pv.email||'')).toLowerCase().indexOf(q)>=0;});
  if(!ls.length){box.innerHTML='<div class="card"><p class="muted" style="margin:0">'+(CD.atletas.length?'Nenhum atleta neste filtro.':'Nenhum atleta cadastrado ainda.')+'</p></div>';return;}
  box.innerHTML='<div class="card pntbl" style="padding:0"><table class="tbl"><thead><tr><th>Atleta</th><th>Posição</th><th>Time</th><th>Camisa</th><th>E-mail</th><th>Celular</th><th>Acesso</th><th></th></tr></thead><tbody>'+
    ls.map(function(a){var t=a.el&&cdTime(a.el.time_id);
      return '<tr><td data-l="Atleta" class="nm"><div class="row" style="gap:10px">'+(a.foto_url?'<img class="cdfoto" src="'+esc(a.foto_url)+'" alt="">':'<span class="cdfoto"></span>')+
        '<div>'+esc(a.nome)+(a.ativo?'':' <span class="chip">inativo</span>')+(a.exemplo?' <span class="chip">exemplo</span>':'')+'</div></div></td>'+
        '<td data-l="Posição">'+esc(POSN[a.posicao]||a.posicao)+'</td>'+
        '<td data-l="Time">'+(t?'<div class="row" style="gap:6px">'+cdEscudo(t,22)+esc(t.nome)+'</div>':'<span class="muted">Sem time</span>')+'</td>'+
        '<td data-l="Camisa">'+(a.el?'<b>'+a.el.numero+'</b> · '+esc(a.el.nome_camisa)+'<div class="lbl">Kit '+esc(a.el.kit)+'</div>':'')+'</td>'+
        '<td data-l="E-mail" class="em">'+esc(a.pv.email||'')+'</td><td data-l="Celular">'+esc(a.pv.celular||'')+'</td>'+
        '<td data-l="Acesso">'+(a.user_id?'<span class="chip ok">Conta ativa</span>':'<span class="chip">Sem conta</span>')+'</td>'+
        '<td class="ac"><div class="pnacoes"><button class="btn sm" data-at="'+a.id+'">Editar</button></div></td></tr>';}).join('')+'</tbody></table></div>';
  box.querySelectorAll('[data-at]').forEach(function(b){b.addEventListener('click',function(){
    var a=CD.atletas.filter(function(x){return x.id===b.dataset.at;})[0];
    CD.form={tipo:'atleta',id:a.id,nome:a.nome,apelido:a.apelido,posicao:a.posicao,unidade_id:a.unidade_id,foto_url:a.foto_url,
      email:a.pv.email,celular:a.pv.celular,nascimento:a.pv.nascimento,el:a.el||{},conta:!!a.user_id};
    cdAtletas();cdFoco();});});
}

function cdAtletaForm(f){var e=f.el||{};
  return '<form class="card cdform" id="cdForm" novalidate><h3>'+(f.novo?'Novo atleta':'Editar '+esc(f.nome))+'</h3>'+
    (f.origem?'<p class="muted" style="margin:-4px 0 12px;font-size:14px">Dados da pré-inscrição '+esc(f.origem)+'. Confira e escolha o time.</p>':'')+
    '<div class="lbl cdsec">Dados do atleta</div><div class="cdcampos">'+
    cdCampo('Nome completo *','<input id="aNome" maxlength="120" value="'+esc(f.nome||'')+'">','full')+
    cdCampo('Posição *','<select id="aPos"><option value="">Escolha</option>'+cdOpcoes(CD_POS.map(function(p){return [p,POSN[p]];}),f.posicao)+'</select>')+
    cdCampo('Unidade FF','<select id="aUni"><option value="">Nenhuma</option>'+cdOpcoes(CD.unidades.map(function(u){return [u.id,u.nome];}),f.unidade_id)+'</select>')+
    cdCampo('Apelido','<input id="aApe" maxlength="40" value="'+esc(f.apelido||'')+'">')+
    cdCampo('Foto (até 2 MB)','<div class="cdimg">'+(f.foto_url?'<img src="'+esc(f.foto_url)+'" alt="" width="48" height="48">':'')+'<input id="aFoto" type="file" accept="image/png,image/jpeg,image/webp"></div>')+
    '</div><div class="lbl cdsec">Contato (não aparece no site) · o e-mail é o login do atleta</div><div class="cdcampos">'+
    cdCampo('E-mail *','<input id="aEmail" type="email" maxlength="120" value="'+esc(f.email||'')+'"'+(f.conta?' title="Este atleta já tem conta: mudar o e-mail não muda o login dele."':'')+'>')+
    cdCampo('Celular *','<input id="aCel" maxlength="30" value="'+esc(f.celular||'')+'">')+
    cdCampo('Nascimento *','<input id="aNasc" type="date" value="'+esc(f.nascimento||'')+'">')+
    '</div><div class="lbl cdsec">Time na temporada</div><div class="cdcampos">'+
    cdCampo('Time','<select id="aTime"><option value="">Sem time</option>'+cdOpcoes(CD.times.map(function(t){return [t.id,t.nome];}),e.time_id)+'</select>')+
    cdCampo('Número (1 a 99)','<input id="aNum" type="number" min="1" max="99" value="'+esc(e.numero||'')+'">')+
    cdCampo('Nome na camisa','<input id="aCam" maxlength="12" style="text-transform:uppercase" value="'+esc(e.nome_camisa||'')+'">')+
    cdCampo('Kit','<select id="aKit"><option value="">Escolha</option>'+cdOpcoes(CD_KIT.map(function(k){return [k,k];}),e.kit)+'</select>')+
    '</div><div class="err" id="cdErr" role="alert"></div><div class="cdbts">'+
    '<button class="btn primary" type="submit">Salvar</button><button class="btn" type="button" id="cdCancela">Cancelar</button>'+
    (!f.novo&&cdAdmin()?'<button class="btn cdapaga" type="button" id="cdApaga">Apagar atleta</button>':'')+'</div></form>';
}
function cdAtletaLigar(f){
  var fm=document.getElementById('cdForm'),er=document.getElementById('cdErr'),v=function(id){return document.getElementById(id).value.trim();};
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdAtletas();});
  var ap=document.getElementById('cdApaga');
  if(ap)ap.addEventListener('click',function(){
    if(!confirm('Apagar o atleta '+f.nome+'? Isso não pode ser desfeito.'))return;
    ap.disabled=true;SB.rpc('excluir_atleta',{atleta:f.id}).then(function(r){
      if(r.error||!r.data||!r.data.ok){ap.disabled=false;er.textContent=(r.data&&r.data.erro)||'Não foi possível apagar. Tente de novo.';return;}
      CD.form=null;toast(r.data.inativado?'O atleta já jogou: ficou inativo e saiu do time.':'Atleta apagado.');cdRecarregar();});
  });
  fm.addEventListener('submit',function(e){e.preventDefault();
    var d={id:f.id||null,nome:v('aNome'),apelido:v('aApe'),posicao:v('aPos'),unidade_id:v('aUni'),foto_url:f.foto_url||'',
      email:v('aEmail').toLowerCase(),celular:v('aCel'),nascimento:v('aNasc'),time_id:v('aTime'),numero:v('aNum'),nome_camisa:v('aCam').toUpperCase(),kit:v('aKit')};
    var falta=!d.nome?'o nome':!d.posicao?'a posição':!/^\S+@\S+\.\S+$/.test(d.email)?'um e-mail válido':!d.celular?'o celular':!d.nascimento?'a data de nascimento':
      d.time_id&&!(+d.numero>=1&&+d.numero<=99)?'o número da camisa (1 a 99)':d.time_id&&!d.nome_camisa?'o nome na camisa':d.time_id&&!d.kit?'o tamanho do kit':'';
    if(falta){er.textContent='Preencha '+falta+'.';return;}
    var bt=fm.querySelector('[type=submit]');bt.disabled=true;er.textContent='';
    cdEnviar(document.getElementById('aFoto').files[0],'atletas',function(url,erro){
      if(erro){bt.disabled=false;er.textContent=erro;return;}
      if(url)d.foto_url=url;
      SB.rpc('salvar_atleta',{dados:d}).then(function(r){bt.disabled=false;
        if(r.error||!r.data||!r.data.ok){er.textContent=(r.data&&r.data.erro)||'Não foi possível salvar. Tente de novo.';if(r.error)console.warn(r.error);return;}
        CD.form=null;toast(f.novo?'Atleta cadastrado.':'Atleta atualizado.');cdRecarregar();});
    });
  });
}

// Aprovados nas pré-inscrições que ainda não viraram atleta: um clique abre o cadastro já preenchido.
function cdImportaHTML(pend){
  return '<div class="card cdform" id="cdImp"><h3>Cadastrar aprovados</h3><p class="muted" style="margin:-4px 0 12px;font-size:14px">Pré-inscrições aprovadas que ainda não estão no cadastro de atletas.</p>'+
    (pend.length?'<div class="cdimp">'+pend.map(function(x){var nums=(x.numeros&&x.numeros.length?x.numeros:[x.numero]);
      return '<div class="cdimpl"><div><b>'+esc(x.nome)+'</b><div class="lbl">'+esc(x.protocolo)+' · '+esc((x.posicoes&&x.posicoes[0])||x.posicao)+' · Nº '+esc(nums.join(' / '))+'</div></div>'+
        '<button class="btn sm primary" data-pi="'+x.id+'">Cadastrar</button></div>';}).join('')+'</div>'
      :'<p class="muted" style="margin:0">Todos os aprovados já estão cadastrados.</p>')+
    '<div class="cdbts"><button class="btn" type="button" id="cdCancela">Fechar</button></div></div>';
}
function cdImportaLigar(pend){
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdAtletas();});
  document.querySelectorAll('[data-pi]').forEach(function(b){b.addEventListener('click',function(){
    var x=pend.filter(function(p){return p.id===b.dataset.pi;})[0],pos=(x.posicoes&&x.posicoes[0])||String(x.posicao||'').split(' · ')[0];
    var cod=CD_POS.filter(function(p){return POSN[p]===pos;})[0]||'',uni=CD.unidades.filter(function(u){return u.nome===x.unidade;})[0];
    CD.form={tipo:'atleta',novo:true,origem:x.protocolo,nome:x.nome,email:x.email,celular:x.celular,nascimento:x.nascimento,posicao:cod,unidade_id:uni?uni.id:'',
      el:{numero:(x.numeros&&x.numeros[0])||x.numero,nome_camisa:x.nome_camisa,kit:x.kit}};
    cdAtletas();cdFoco();});});
}

/* ================= HISTÓRICO ================= */
var CD_TAB={times:'Time',atletas:'Atleta',elencos:'Elenco'};
function cdHistorico(){
  SB.from('historico').select('quando,quem,tabela,acao,resumo').order('quando',{ascending:false}).limit(200).then(function(r){
    var el=cdEl();if(!el||PN.aba!=='historico')return;
    if(r.error){cdMsg('Não foi possível carregar o histórico.');return;}
    var ls=r.data||[];
    el.innerHTML='<p class="muted" style="margin:0 0 16px">As últimas 200 alterações em times, atletas e elencos feitas pelo painel.</p>'+
      (ls.length?'<div class="card pntbl" style="padding:0"><table class="tbl"><thead><tr><th>Quando</th><th>Quem</th><th>O que</th><th>Registro</th></tr></thead><tbody>'+
      ls.map(function(h){return '<tr><td data-l="Quando">'+pnData(h.quando)+'</td><td data-l="Quem" class="nm">'+esc(h.quem||'—')+'</td>'+
        '<td data-l="O que">'+esc(h.acao)+' · '+esc(CD_TAB[h.tabela]||h.tabela)+'</td><td data-l="Registro" class="wr">'+esc(h.resumo||'')+'</td></tr>';}).join('')+
      '</tbody></table></div>':'<div class="card"><p class="muted" style="margin:0">Nenhuma alteração registrada ainda.</p></div>');
  });
}
