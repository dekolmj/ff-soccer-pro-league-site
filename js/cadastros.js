/* Cadastros do painel da equipe FF (#painel): Times, Jogos e súmula, Usuários (atletas e funcionários) e Histórico.
   Cada time e cada jogo é de uma competição (temporada): FF Pro League ou Libertadores FF.
   Usa o mesmo login do painel.js (SB, PN). O banco decide quem pode gravar; aqui só a interface.
   Apagar times e atletas fica só para administradores. Escudos e fotos vão para o armazenamento 'marca'. */

var CD={ok:false,temporadas:[],comp:'pro_league',jogos:[],rodadas:[],vermelhos:[],rodada:'',sumula:null,times:[],atletas:[],unidades:[],aprovadas:[],equipe:[],acesso:{},busca:'',tipo:'',time:'',situ:'',form:null,hist:[]};
var CD_POS=['GOL','LAT','ZAG','VOL','MEI','ATA'],CD_KIT=['P','M','G','GG','XG'];

function cdEl(){return document.getElementById('pnAba');}
function cdAdmin(){return PN.equipe&&PN.equipe.papel==='admin';}
function cdMsg(t){var el=cdEl();if(el)el.innerHTML='<p class="muted" style="padding:20px 0">'+t+'</p>';}

// Carrega times, atletas, unidades e a temporada atual (uma vez; recarrega depois de cada gravação).
function cdCarregar(cb){
  Promise.all([
    SB.from('temporadas').select('id,nome,competicao,desafios_var_por_jogo').order('id'),
    SB.from('times').select('id,nome,cor,escudo_url,tecnico,ordem,exemplo,temporada_id,grupo').order('ordem').order('nome'),
    SB.from('atletas').select('id,nome,apelido,posicao,unidade_id,foto_url,ativo,exemplo,user_id,atletas_privado(email,celular,nascimento),elencos(time_id,numero,nome_camisa,kit,temporada_id)').order('nome'),
    SB.from('unidades').select('id,nome').eq('ativa',true).order('nome'),
    !preOn()?Promise.resolve({data:[]}):SB.from('pre_inscricoes').select('id,protocolo,nome,email,celular,nascimento,unidade,posicao,posicoes,kit,numero,numeros,nome_camisa').eq('status','aprovada').order('nome'),
    SB.rpc('listar_acessos'),
    SB.from('jogos').select('id,temporada_id,rodada,ordem,grupo,data_hora,local,time_casa,time_fora,status,gols_casa,gols_fora,mvp_atleta_id,sumula_fechada,exemplo').order('rodada').order('ordem'),
    SB.from('eventos_jogo').select('jogo_id,atleta_id,time_id').eq('tipo','cartao_vermelho'),
    SB.from('rodadas').select('id,temporada_id,numero,data').order('numero').then(function(x){return x.error?{data:[]}:x;})  // banco ainda sem a tabela rodadas: só as rodadas dos jogos
  ]).then(function(r){
    var erro=r.filter(function(x){return x.error;})[0];
    if(erro){cdMsg('Não foi possível carregar os cadastros. Recarregue a página.');console.warn(erro.error);return;}
    var ac=r[5].data&&r[5].data.ok?r[5].data:{equipe:[],atletas:[]};CD.equipe=ac.equipe;CD.acesso={};ac.atletas.forEach(function(x){CD.acesso[x.id]=x;});
    CD.temporadas=r[0].data;CD.jogos=r[6].data;CD.rodadas=r[8].data;CD.vermelhos=r[7].data;CD.times=r[1].data;CD.unidades=r[3].data;CD.aprovadas=r[4].data;
    CD.atletas=r[2].data.map(function(a){var pv=Array.isArray(a.atletas_privado)?a.atletas_privado[0]:a.atletas_privado;
      a.pv=pv||{};a.els={};(a.elencos||[]).forEach(function(e){a.els[e.temporada_id]=e;});
      a.el=a.els[cdTempId('pro_league')]||(a.elencos||[])[0]||null;return a;});
    CD.ok=true;cb();
  });
}
function cdAba(aba){cdMsg('Carregando…');var ir=function(){if(PN.aba!==aba||!cdEl())return;({times:cdTimes,jogos:cdJogos,usuarios:cdUsuarios,historico:cdHistorico})[aba]();};
  if(aba==='historico'||CD.ok)ir();else cdCarregar(ir);}
function cdRecarregar(){CD.ok=false;cdAba(PN.aba);}

// Competições: a temporada mais recente de cada uma.
var CD_COMP={pro_league:'FF Pro League',libertadores:'Libertadores FF'};
function cdTempId(c){var t=CD.temporadas.filter(function(x){return x.competicao===c;});return t.length?t[t.length-1].id:null;}
function cdCompDe(tempId){var t=CD.temporadas.filter(function(x){return x.id===tempId;})[0];return t?t.competicao:'';}
function cdTimesDa(c){var id=cdTempId(c);return CD.times.filter(function(t){return t.temporada_id===id;});}
function cdCompHTML(){return '<div class="days cdcomp" role="tablist" aria-label="Competição">'+Object.keys(CD_COMP).map(function(c){return '<button type="button" data-comp="'+c+'" class="'+(CD.comp===c?'on':'')+'">'+CD_COMP[c]+'</button>';}).join('')+'</div>';}
function cdCompLigar(fn){document.querySelectorAll('.cdcomp [data-comp]').forEach(function(b){b.addEventListener('click',function(){CD.comp=b.dataset.comp;CD.form=null;CD.rodada='';fn();});});}
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

/* ================= PASSO A PASSO DA COMPETIÇÃO =================
   1 Times → 2 Grupos (só Libertadores) → 3 Rodadas e jogos → 4 Atletas nos times. Aparece no topo de Times e Jogos;
   dá para esconder (fica guardado neste navegador). */
function cdGuiaOn(){try{return localStorage.getItem('ffl_guia')!=='0';}catch(e){return true;}}
function cdGuiaHTML(){
  if(!cdGuiaOn())return '<p class="cdguiaoff"><button type="button" class="more" id="cdGuiaMostra">Mostrar o passo a passo</button></p>';
  var tid=cdTempId(CD.comp),lib=CD.comp==='libertadores',ts=cdTimesDa(CD.comp),n=ts.length;
  var comGrupo=ts.filter(function(t){return t.grupo;}).length,rods=cdRodadas(tid),js=CD.jogos.filter(function(j){return j.temporada_id===tid;});
  var na={};CD.atletas.forEach(function(a){var e=a.els[tid];if(e)na[e.time_id]=(na[e.time_id]||0)+1;});
  var semAt=ts.filter(function(t){return !na[t.id];}).length,qa=Object.keys(na).reduce(function(s,k){return s+na[k];},0);
  var passos=[['Criar os times','painel-times',n?n+(n===1?' time':' times'):'Nenhum time ainda',n>=2]];
  if(lib)passos.push(['Dividir em grupos','painel-times',n?comGrupo+' de '+n+' times com grupo':'Crie os times antes',n>0&&comGrupo===n]);
  passos.push(['Criar as rodadas e os jogos','painel-jogos',rods.length?rods.length+(rods.length===1?' rodada':' rodadas')+' · '+js.length+(js.length===1?' jogo':' jogos'):'Nenhuma rodada ainda',rods.length>0&&js.length>0]);
  passos.push(['Colocar os atletas nos times','painel-times',qa+(qa===1?' atleta':' atletas')+(n&&semAt?' · '+semAt+(semAt===1?' time sem atletas':' times sem atletas'):''),n>0&&!semAt]);
  return '<div class="card cdguia"><div class="between"><b>Passo a passo · '+CD_COMP[CD.comp]+'</b><button type="button" class="more" id="cdGuiaEsconde">Esconder</button></div><ol>'+
    passos.map(function(p,i){return '<li class="'+(p[3]?'ok':'')+'"><a href="#'+p[1]+'"><span class="cdgn">'+(p[3]?'✓':i+1)+'</span><span><b>'+p[0]+'</b><small>'+p[2]+'</small></span></a></li>';}).join('')+'</ol></div>';
}
function cdGuiaLigar(fn){
  var e=document.getElementById('cdGuiaEsconde'),m=document.getElementById('cdGuiaMostra');
  if(e)e.addEventListener('click',function(){try{localStorage.setItem('ffl_guia','0');}catch(x){}fn();});
  if(m)m.addEventListener('click',function(){try{localStorage.removeItem('ffl_guia');}catch(x){}fn();});
}

/* ================= TIMES =================
   Na Libertadores os times aparecem separados por grupo, com a troca de grupo direto no cartão.
   "Elenco" abre os atletas do time: dá para colocar, trocar o número e tirar atletas (o mesmo vale pelo cadastro do atleta, em Usuários). */
function cdTimes(){
  var el=cdEl(),f=CD.form&&(CD.form.tipo==='time'||CD.form.tipo==='elenco')?CD.form:null;
  var n={},tid=cdTempId(CD.comp),lib=CD.comp==='libertadores',ts=cdTimesDa(CD.comp);CD.atletas.forEach(function(a){var e=a.els[tid];if(e)n[e.time_id]=(n[e.time_id]||0)+1;});
  var cartao=function(t){
      return '<div class="card cdtime"><div class="row">'+cdEscudo(t,48)+'<div style="min-width:0"><b>'+esc(t.nome)+'</b>'+
        '<div class="lbl">'+(n[t.id]||0)+((n[t.id]||0)===1?' atleta':' atletas')+(t.tecnico?' · Técnico: '+esc(t.tecnico):'')+'</div>'+
        (t.exemplo?'<span class="chip">exemplo</span>':'')+'</div></div>'+
        '<div class="cdtbts">'+(lib?'<select class="cdgsel" data-grupo="'+esc(t.id)+'" aria-label="Grupo do '+esc(t.nome)+'"><option value="">Sem grupo</option>'+cdOpcoes(CD_GRUPOS.map(function(g){return [g,'Grupo '+g];}),t.grupo)+'</select>':'')+
        '<button class="btn sm" data-elenco="'+esc(t.id)+'">Elenco</button><button class="btn sm" data-editar="'+esc(t.id)+'">Editar</button></div></div>';};
  var lista;
  if(lib&&ts.length){var gs=[];ts.forEach(function(t){var g=t.grupo||'';if(gs.indexOf(g)<0)gs.push(g);});gs.sort(function(a,b){return !a?1:!b?-1:a.localeCompare(b);});
    lista=gs.map(function(g){var tg=ts.filter(function(t){return (t.grupo||'')===g;});
      return '<h3 class="cdgtit">'+(g?'Grupo '+esc(g):'Sem grupo')+' <span class="lbl">'+tg.length+(tg.length===1?' time':' times')+'</span></h3><div class="cdgrid">'+tg.map(cartao).join('')+'</div>';}).join('');}
  else lista='<div class="cdgrid">'+ts.map(cartao).join('')+(ts.length?'':'<div class="card"><p class="muted" style="margin:0">Nenhum time na '+CD_COMP[CD.comp]+' ainda. Comece em "+ Novo time".</p></div>')+'</div>';
  el.innerHTML=cdCompHTML()+cdGuiaHTML()+'<div class="pnbusca"><p class="muted" style="margin:0;flex:1 1 300px">'+ts.length+' times na '+CD_COMP[CD.comp]+'. O site mostra os times nesta ordem.'+
    (lib?' Escolha o grupo de cada time no próprio cartão.':'')+'</p>'+
    '<button class="btn primary sm" id="cdNovoTime">+ Novo time</button></div>'+
    (f?(f.tipo==='elenco'?cdElencoHTML(f):cdTimeForm(f)):'')+lista;
  cdCompLigar(cdTimes);cdGuiaLigar(cdTimes);
  document.getElementById('cdNovoTime').addEventListener('click',function(){CD.form={tipo:'time',novo:true,cor:'#F2C14D',ordem:ts.length+1};cdTimes();cdFoco();});
  el.querySelectorAll('[data-editar]').forEach(function(b){b.addEventListener('click',function(){var t=cdTime(b.dataset.editar);
    CD.form={tipo:'time',id:t.id,nome:t.nome,cor:t.cor,tecnico:t.tecnico||'',ordem:t.ordem,escudo_url:t.escudo_url,grupo:t.grupo};cdTimes();cdFoco();});});
  el.querySelectorAll('[data-elenco]').forEach(function(b){b.addEventListener('click',function(){CD.form={tipo:'elenco',id:b.dataset.elenco};cdTimes();cdFoco();});});
  el.querySelectorAll('[data-grupo]').forEach(function(s){s.addEventListener('change',function(){var t=cdTime(s.dataset.grupo),g=s.value||null;s.disabled=true;
    SB.from('times').update({grupo:g}).eq('id',t.id).then(function(r){
      if(r.error){s.disabled=false;s.value=t.grupo||'';toast('Não foi possível trocar o grupo. Tente de novo.');return;}
      t.grupo=g;toast(t.nome+(g?' no Grupo '+g+'.':' ficou sem grupo.'));cdTimes();});});});
  if(f&&f.tipo==='time')cdTimeLigar(f,n[f.id]||0);
  if(f&&f.tipo==='elenco')cdElencoLigar(f);
}
var CD_GRUPOS='ABCDEFGH'.split('');
function cdFoco(){var fm=document.getElementById('cdForm');if(fm){fm.scrollIntoView({block:'start',behavior:'smooth'});var i=fm.querySelector('input');if(i)i.focus({preventScroll:true});}}

// ---------- Elenco de um time ----------
function cdElencoHTML(f){
  var t=cdTime(f.id),tid=cdTempId(CD.comp),el=cdElenco(f.id,tid),ed=f.atleta?cdAtleta(f.atleta):null,e0=ed&&ed.els[tid]&&ed.els[tid].time_id===f.id?ed.els[tid]:null;
  var ops=CD.atletas.filter(function(a){return a.ativo!==false;}).map(function(a){var e=a.els[tid],ot=e&&e.time_id!==f.id?cdTime(e.time_id):null;
    return [a.id,a.nome+(e&&e.time_id===f.id?' · já no time, nº '+e.numero:ot?' · hoje no '+ot.nome:'')];});
  return '<div class="card cdform" id="cdForm"><div class="between" style="flex-wrap:wrap;gap:8px"><h3>Elenco · '+esc(t.nome)+'</h3><span class="lbl">'+CD_COMP[CD.comp]+' · '+el.length+(el.length===1?' atleta':' atletas')+'</span></div>'+
    (el.length?'<div class="tblw"><table class="tbl cdeltab"><thead><tr><th>Nº</th><th class="l">Atleta</th><th class="l">Camisa</th><th>Kit</th><th>Posição</th><th></th></tr></thead><tbody>'+
      el.map(function(a){var e=a.els[tid];return '<tr><td data-l="Nº"><b>'+e.numero+'</b></td><td data-l="Atleta" class="l">'+esc(a.nome)+'</td><td data-l="Camisa" class="l">'+esc(e.nome_camisa)+'</td><td data-l="Kit">'+esc(e.kit)+'</td><td data-l="Posição">'+esc(a.posicao||'')+'</td>'+
        '<td><div class="pnacoes"><button class="btn sm" data-eledita="'+a.id+'">Editar</button><button class="btn sm" data-eltira="'+a.id+'">Tirar do time</button></div></td></tr>';}).join('')+'</tbody></table></div>'
      :'<p class="muted" style="margin:6px 0 0">Nenhum atleta neste time ainda.</p>')+
    '<form id="cdElF" novalidate style="margin-top:16px"><h4 style="margin:0 0 8px">'+(e0?'Editar '+esc(ed.nome):'Colocar atleta no time')+'</h4><div class="cdcampos">'+
      cdCampo('Atleta *','<select id="eAt"'+(e0?' disabled':'')+'><option value="">Escolha</option>'+cdOpcoes(ops,f.atleta)+'</select>','full')+
      cdCampo('Número *','<input id="eNum" type="number" min="1" max="99" value="'+esc(e0?e0.numero:'')+'">')+
      cdCampo('Nome na camisa *','<input id="eCam" maxlength="12" value="'+esc(e0?e0.nome_camisa:'')+'">')+
      cdCampo('Kit *','<select id="eKit">'+cdOpcoes(CD_KIT.map(function(k){return [k,k];}),e0?e0.kit:'M')+'</select>')+
    '</div><p class="muted" style="margin:8px 0 0;font-size:14px">Atleta ainda não cadastrado? Crie em <a class="more" href="#painel-usuarios">Usuários</a> e volte aqui.</p>'+
    '<div class="err" id="cdErr" role="alert"></div><div class="cdbts"><button class="btn primary" type="submit">'+(e0?'Salvar':'Colocar no time')+'</button>'+
    (e0?'<button class="btn" type="button" id="cdElNovo">Cancelar edição</button>':'')+'<button class="btn" type="button" id="cdCancela">Fechar elenco</button></div></form></div>';
}
function cdElencoLigar(f){
  var tid=cdTempId(CD.comp),er=document.getElementById('cdErr'),fm=document.getElementById('cdElF'),at=document.getElementById('eAt');
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdTimes();});
  var nv=document.getElementById('cdElNovo');if(nv)nv.addEventListener('click',function(){CD.form={tipo:'elenco',id:f.id};cdTimes();});
  // ao escolher o atleta, sugere nome na camisa e kit do cadastro dele
  at.addEventListener('change',function(){var a=cdAtleta(at.value);if(!a)return;var e=a.els[tid]||a.el||(a.elencos||[])[0];
    var cam=document.getElementById('eCam');if(!cam.value)cam.value=(e&&e.nome_camisa)||String(a.apelido||a.nome.split(' ')[0]).toUpperCase().slice(0,12);
    if(e&&e.kit)document.getElementById('eKit').value=e.kit;});
  document.querySelectorAll('[data-eledita]').forEach(function(b){b.addEventListener('click',function(){CD.form={tipo:'elenco',id:f.id,atleta:b.dataset.eledita};cdTimes();
    var fe=document.getElementById('cdElF');if(fe)fe.scrollIntoView({block:'center',behavior:'smooth'});});});
  document.querySelectorAll('[data-eltira]').forEach(function(b){b.addEventListener('click',function(){var a=cdAtleta(b.dataset.eltira);
    if(!confirm('Tirar '+a.nome+' do '+cdTime(f.id).nome+'? O cadastro do atleta continua; ele só fica sem time nesta competição.'))return;
    b.disabled=true;SB.from('elencos').delete().eq('atleta_id',a.id).eq('temporada_id',tid).then(function(r){
      if(r.error){b.disabled=false;er.textContent='Não foi possível tirar do time. Tente de novo.';return;}
      toast(a.nome.split(' ')[0]+' saiu do time.');cdRecarregar();});});});
  fm.addEventListener('submit',function(e){e.preventDefault();
    var a=cdAtleta(f.atleta||at.value),num=parseInt(document.getElementById('eNum').value,10),cam=document.getElementById('eCam').value.trim().toUpperCase(),kit=document.getElementById('eKit').value;
    if(!a){er.textContent='Escolha o atleta.';return;}
    if(!(num>=1&&num<=99)){er.textContent='Número de 1 a 99.';return;}
    if(!cam){er.textContent='Preencha o nome na camisa.';return;}
    var dono=cdElenco(f.id,tid).filter(function(x){return x.id!==a.id&&x.els[tid].numero===num;})[0];
    if(dono){er.textContent='O número '+num+' já é de '+dono.nome+' neste time.';return;}
    var ant=a.els[tid],ot=ant&&ant.time_id!==f.id?cdTime(ant.time_id):null;
    if(ot&&!confirm(a.nome+' está no '+ot.nome+'. Passar para o '+cdTime(f.id).nome+'?'))return;
    var bt=fm.querySelector('[type=submit]');bt.disabled=true;er.textContent='';
    SB.from('elencos').upsert({temporada_id:tid,time_id:f.id,atleta_id:a.id,numero:num,nome_camisa:cam,kit:kit},{onConflict:'temporada_id,atleta_id'}).then(function(r){bt.disabled=false;
      if(r.error){er.textContent=/numero|duplicate|unique/i.test(r.error.message)?'Este número já está em uso neste time.':'Não foi possível salvar. Tente de novo.';console.warn(r.error);return;}
      CD.form={tipo:'elenco',id:f.id};toast(a.nome.split(' ')[0]+(ant&&!ot?' atualizado.':' entrou no time.'));cdRecarregar();});
  });
}

function cdTimeForm(f){
  return '<form class="card cdform" id="cdForm" novalidate><h3>'+(f.novo?'Novo time · '+CD_COMP[CD.comp]:'Editar '+esc(f.nome))+'</h3><div class="cdcampos">'+
    cdCampo('Nome do time *','<input id="tNome" maxlength="40" value="'+esc(f.nome||'')+'">')+
    cdCampo('Técnico','<input id="tTec" maxlength="60" value="'+esc(f.tecnico||'')+'">')+
    cdCampo('Cor','<input id="tCor" type="color" value="'+esc(f.cor||'#F2C14D')+'">')+
    cdCampo('Ordem no site','<input id="tOrdem" type="number" min="0" max="99" value="'+esc(f.ordem==null?'':f.ordem)+'">')+
    (CD.comp==='libertadores'?cdCampo('Grupo','<select id="tGrupo"><option value="">Sem grupo</option>'+cdOpcoes(CD_GRUPOS.map(function(g){return [g,'Grupo '+g];}),f.grupo)+'</select>'):'')+
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
    var gr=document.getElementById('tGrupo');if(gr)dados.grupo=gr.value||null;
    if(!nome){er.textContent='Preencha o nome do time.';return;}
    if(cdTimesDa(CD.comp).some(function(t){return t.id!==f.id&&t.nome.toLowerCase()===nome.toLowerCase();})){er.textContent='Já existe um time com este nome nesta competição.';return;}
    if(f.novo&&!cdTempId(CD.comp)){er.textContent='Competição não encontrada no banco.';return;}
    var bt=fm.querySelector('[type=submit]');bt.disabled=true;er.textContent='';
    cdEnviar(document.getElementById('tEsc').files[0],'escudos',function(url,erro){
      if(erro){bt.disabled=false;er.textContent=erro;return;}
      if(url)dados.escudo_url=url;
      var q;
      if(f.novo){var id=cdSlug(nome),base=id,k=2;while(cdTime(id))id=base+'-'+(k++);
        dados.id=id;dados.temporada_id=cdTempId(CD.comp);q=SB.from('times').insert(dados);}
      else q=SB.from('times').update(dados).eq('id',f.id);
      q.then(function(r){bt.disabled=false;
        if(r.error){er.textContent='Não foi possível salvar. Tente de novo.';console.warn(r.error);return;}
        CD.form=null;toast(f.novo?'Time cadastrado.':'Time atualizado.');cdRecarregar();});
    });
  });
}

/* ================= USUÁRIOS (atletas e funcionários da FF) =================
   Uma lista só, com filtro por tipo. "+ Criar usuário" abre o cadastro e pergunta se é atleta ou funcionário.
   Atleta: o cadastro completo (dados, contato e time). Funcionário: nome, e-mail, telefone, cargo e perfil de acesso
   (só administrador cria ou altera funcionário). O envio do convite por e-mail ainda não está ligado ("em breve"). */
var CD_SITU={ativa:['Conta ativa','ok'],convite:['Convite pendente','gold'],sem_acesso:['Sem acesso','']};
function cdQuando(iso){return iso?pnData(iso):'—';}
function cdEmBreve(txt){return '<button class="btn sm cdbreve" type="button" disabled title="O envio por e-mail chega numa próxima etapa">'+txt+'<span>em breve</span></button>';}
function cdAtletaPorEmail(em){em=String(em||'').toLowerCase();return CD.atletas.filter(function(a){return (a.pv.email||'').toLowerCase()===em;})[0];}
function cdPendentes(){return CD.aprovadas.filter(function(x){return !cdAtletaPorEmail(x.email);});}

// Lista única: atletas + funcionários, cada um com tipo, função, contato e situação do acesso.
function cdLinhas(){
  var at=CD.atletas.map(function(a){var ac=CD.acesso[a.id]||{};
    var tms=Object.keys(a.els).map(function(k){var e=a.els[k],tt=cdTime(e.time_id);return tt?(cdCompDe(+k)==='libertadores'?'Lib: ':'')+tt.nome+' · nº '+e.numero:'';}).filter(Boolean);
    return {tipo:'atleta',id:a.id,nome:a.nome,foto:a.foto_url,email:a.pv.email||'',tel:a.pv.celular||'',
      funcao:POSN[a.posicao]||a.posicao,detalhe:tms.length?tms.join(' | '):'Sem time',times:Object.keys(a.els).map(function(k){return a.els[k].time_id;}),
      situacao:a.user_id?'ativa':'sem_acesso',ultimo:ac.ultimo_acesso,exemplo:a.exemplo,inativo:!a.ativo,a:a};});
  var fu=CD.equipe.map(function(x){
    return {tipo:'func',id:x.email,nome:x.nome,email:x.email,tel:x.telefone||'',funcao:x.cargo||'Funcionário',
      detalhe:x.papel==='admin'?'Administrador':'Editor',situacao:x.situacao,ultimo:x.situacao==='convite'?null:x.ultimo_acesso,
      convidado:x.convidado_em,eu:x.eu,x:x};});
  return fu.concat(at);
}

function cdUsuarios(){
  var el=cdEl(),f=CD.form&&CD.form.tipo!=='time'?CD.form:null,pend=cdPendentes();
  el.innerHTML='<div class="pnbusca"><label class="fld">Buscar<input id="cdBusca" placeholder="Nome, e-mail ou cargo" value="'+esc(CD.busca)+'"></label>'+
    '<label class="fld" style="flex:0 1 190px">Tipo<select id="cdTipoF">'+cdOpcoes([['','Todos'],['atleta','Atletas'],['func','Funcionários FF']],CD.tipo)+'</select></label>'+
    '<label class="fld" style="flex:0 1 190px">Time<select id="cdTimeF">'+cdOpcoes([['','Todos'],['-','Sem time']].concat(CD.times.map(function(t){return [t.id,t.nome+(cdCompDe(t.temporada_id)==='libertadores'?' (Libertadores)':'')];})),CD.time)+'</select></label>'+
    '<label class="fld" style="flex:0 1 190px">Acesso<select id="cdSituF">'+cdOpcoes([['','Todos'],['ativa','Conta ativa'],['convite','Convite pendente'],['sem_acesso','Sem acesso']],CD.situ)+'</select></label>'+
    '<button class="btn primary sm" id="cdNovo">+ Criar usuário</button>'+
    (preOn()?'<button class="btn sm" id="cdImporta"'+(pend.length?'':' disabled')+'>Cadastrar aprovados · '+pend.length+'</button>':'')+'</div>'+
    '<div class="cdresumo" id="cdResumo"></div>'+
    (f&&f.tipo==='importar'?cdImportaHTML(pend):'')+(f&&f.tipo==='atleta'?cdAtletaForm(f):'')+(f&&f.tipo==='func'?cdFuncForm(f):'')+
    '<div id="cdLista"></div>';
  document.getElementById('cdBusca').addEventListener('input',function(){CD.busca=this.value;cdUsuariosLista();});
  [['cdTipoF','tipo'],['cdTimeF','time'],['cdSituF','situ']].forEach(function(p){document.getElementById(p[0]).addEventListener('change',function(){CD[p[1]]=this.value;cdUsuariosLista();});});
  document.getElementById('cdNovo').addEventListener('click',function(){CD.form={tipo:'atleta',novo:true,els:{}};cdUsuarios();cdFoco();});
  if(preOn())document.getElementById('cdImporta').addEventListener('click',function(){CD.form={tipo:'importar'};cdUsuarios();
    var b=document.getElementById('cdImp');if(b)b.scrollIntoView({block:'start',behavior:'smooth'});});
  if(f&&f.tipo==='importar')cdImportaLigar(pend);
  if(f&&f.tipo==='atleta')cdAtletaLigar(f);
  if(f&&f.tipo==='func')cdFuncLigar(f);
  if(f&&f.novo)cdTipoLigar();
  cdUsuariosLista();
}

function cdUsuariosLista(){
  var box=document.getElementById('cdLista');if(!box)return;var q=CD.busca.trim().toLowerCase(),todas=cdLinhas();
  var ls=todas.filter(function(u){
    if(CD.tipo&&u.tipo!==CD.tipo)return false;
    if(CD.time&&(u.tipo!=='atleta'||(CD.time==='-'?u.times.length:u.times.indexOf(CD.time)<0)))return false;
    if(CD.situ&&u.situacao!==CD.situ)return false;
    return !q||[u.nome,u.email,u.funcao,u.detalhe].join(' ').toLowerCase().indexOf(q)>=0;});
  var n=function(t){return todas.filter(function(u){return u.tipo===t;}).length;};
  document.getElementById('cdResumo').innerHTML='<span class="chip">Atletas · '+n('atleta')+'</span><span class="chip">Funcionários FF · '+n('func')+'</span>'+
    '<span class="chip ok">Conta ativa · '+todas.filter(function(u){return u.situacao==='ativa';}).length+'</span>'+(ls.length!==todas.length?'<span class="chip gold">Mostrando '+ls.length+'</span>':'');
  if(!ls.length){box.innerHTML='<div class="card"><p class="muted" style="margin:0">'+(todas.length?'Nenhum usuário neste filtro.':'Nenhum usuário cadastrado ainda.')+'</p></div>';return;}
  box.innerHTML='<div class="card pntbl" style="padding:0"><table class="tbl"><thead><tr><th>Usuário</th><th>Tipo</th><th>Função</th><th>E-mail</th><th>Telefone</th><th>Acesso</th><th>Último acesso</th><th></th></tr></thead><tbody>'+
    ls.map(function(u){var s=CD_SITU[u.situacao]||[u.situacao,''],pode=u.tipo==='atleta'||cdAdmin();
      return '<tr><td data-l="Usuário" class="nm"><div class="row" style="gap:10px">'+(u.foto?'<img class="cdfoto" src="'+esc(u.foto)+'" alt="">':'<span class="cdfoto"></span>')+
        '<div>'+esc(u.nome)+(u.eu?' <span class="chip">você</span>':'')+(u.inativo?' <span class="chip">inativo</span>':'')+(u.exemplo?' <span class="chip">exemplo</span>':'')+'</div></div></td>'+
        '<td data-l="Tipo">'+(u.tipo==='atleta'?'Atleta':'<span style="color:var(--gold)">Funcionário FF</span>')+'</td>'+
        '<td data-l="Função" class="wr">'+esc(u.funcao)+'<div class="lbl">'+esc(u.detalhe)+'</div></td>'+
        '<td data-l="E-mail" class="em">'+esc(u.email)+'</td><td data-l="Telefone">'+esc(u.tel)+'</td>'+
        '<td data-l="Acesso"><span class="chip '+s[1]+'">'+s[0]+'</span></td>'+
        '<td data-l="Último acesso">'+(u.situacao==='convite'?cdQuando(u.convidado).split(' ')[0]+'<div class="lbl">convidado</div>':cdQuando(u.ultimo))+'</td>'+
        '<td class="ac"><div class="pnacoes">'+(u.situacao!=='ativa'?cdEmBreve('Convite'):'')+
        (pode?'<button class="btn sm" data-ed="'+esc(u.tipo+'|'+u.id)+'">Editar</button>':'')+'</div></td></tr>';}).join('')+'</tbody></table></div>';
  box.querySelectorAll('[data-ed]').forEach(function(b){b.addEventListener('click',function(){
    var p=b.dataset.ed.split('|'),tipo=p[0],id=p.slice(1).join('|');
    if(tipo==='atleta'){var a=CD.atletas.filter(function(x){return x.id===id;})[0];
      CD.form={tipo:'atleta',id:a.id,nome:a.nome,apelido:a.apelido,posicao:a.posicao,unidade_id:a.unidade_id,foto_url:a.foto_url,
        email:a.pv.email,celular:a.pv.celular,nascimento:a.pv.nascimento,els:a.els,conta:!!a.user_id};}
    else{var x=CD.equipe.filter(function(e){return e.email===id;})[0];
      CD.form={tipo:'func',email:x.email,nome:x.nome,telefone:x.telefone,cargo:x.cargo,papel:x.papel,eu:x.eu};}
    cdUsuarios();cdFoco();});});
}

// No "Criar usuário", o topo do formulário escolhe o tipo: Atleta ou Funcionário FF.
function cdTipoHTML(t){
  return '<div class="cdtipo" role="radiogroup" aria-label="Tipo de usuário"><span class="lbl">Tipo de usuário</span>'+
    '<button type="button" data-tipo="atleta" class="'+(t==='atleta'?'on':'')+'">Atleta</button>'+
    '<button type="button" data-tipo="func" class="'+(t==='func'?'on':'')+'"'+(cdAdmin()?'':' disabled title="Só administradores criam funcionários"')+'>Funcionário FF</button></div>';
}
function cdTipoLigar(){document.querySelectorAll('.cdtipo [data-tipo]').forEach(function(b){b.addEventListener('click',function(){
  if(CD.form.tipo===b.dataset.tipo)return;CD.form=b.dataset.tipo==='atleta'?{tipo:'atleta',novo:true,els:{}}:{tipo:'func',novo:true,papel:'editor'};cdUsuarios();});});}

function cdFuncForm(f){
  return '<form class="card cdform" id="cdForm" novalidate>'+(f.novo?'<h3>Criar usuário</h3>'+cdTipoHTML('func'):'<h3>Editar '+esc(f.nome)+'</h3>')+
    '<div class="lbl cdsec">Dados do funcionário</div><div class="cdcampos">'+
    cdCampo('Nome completo *','<input id="fNome" maxlength="80" value="'+esc(f.nome||'')+'">','full')+
    cdCampo('E-mail * (é o login)','<input id="fEmail" type="email" maxlength="120" value="'+esc(f.email||'')+'"'+(f.novo?'':' readonly title="O e-mail é o login e não muda por aqui."')+'>')+
    cdCampo('Telefone','<input id="fTel" maxlength="30" value="'+esc(f.telefone||'')+'">')+
    cdCampo('Cargo','<input id="fCargo" maxlength="60" placeholder="Ex.: Coordenador, Mesário, Comunicação" value="'+esc(f.cargo||'')+'">')+
    cdCampo('Perfil de acesso *','<select id="fPapel"'+(f.eu?' disabled title="Você não pode mudar o seu próprio perfil."':'')+'>'+cdOpcoes([['editor','Editor · cadastra e edita'],['admin','Administrador · pode tudo']],f.papel||'editor')+'</select>')+
    '</div><div class="notice" style="margin-top:14px">'+(f.novo?'O funcionário fica com o convite pendente. Quando o envio por e-mail estiver ligado, ele recebe o link para criar a senha; até lá, a conta é criada pela equipe técnica e já entra com este perfil.'
      :'Mudanças de perfil valem a partir do próximo acesso da pessoa.')+'</div>'+
    '<div class="err" id="cdErr" role="alert"></div><div class="cdbts"><button class="btn primary" type="submit">Salvar</button><button class="btn" type="button" id="cdCancela">Cancelar</button></div></form>';
}
function cdFuncLigar(f){
  var fm=document.getElementById('cdForm'),er=document.getElementById('cdErr'),v=function(id){return document.getElementById(id).value.trim();};
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdUsuarios();});
  fm.addEventListener('submit',function(e){e.preventDefault();
    var d={nome:v('fNome'),email:v('fEmail').toLowerCase(),telefone:v('fTel'),cargo:v('fCargo'),papel:f.eu?'admin':v('fPapel')};
    if(!d.nome||!/^\S+@\S+\.\S+$/.test(d.email)){er.textContent='Preencha o nome e um e-mail válido.';return;}
    if(f.novo&&CD.equipe.some(function(x){return x.email===d.email;})){er.textContent='Já existe um funcionário com este e-mail.';return;}
    var bt=fm.querySelector('[type=submit]');bt.disabled=true;er.textContent='';
    SB.rpc('salvar_funcionario',{dados:d}).then(function(r){bt.disabled=false;
      if(r.error||!r.data||!r.data.ok){er.textContent=(r.data&&r.data.erro)||'Não foi possível salvar. Tente de novo.';return;}
      CD.form=null;toast(f.novo?'Funcionário criado: '+d.nome.split(' ')[0]+'.':'Funcionário atualizado.');cdRecarregar();});
  });
}

/* ================= FORMULÁRIO DO ATLETA ================= */
function cdAtletaForm(f){var e=f.el||{};
  return '<form class="card cdform" id="cdForm" novalidate>'+(f.novo&&!f.origem?'<h3>Criar usuário</h3>'+cdTipoHTML('atleta'):'<h3>'+(f.novo?'Novo atleta':'Editar '+esc(f.nome))+'</h3>')+
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
    '</div>'+Object.keys(CD_COMP).map(function(c){var tid=cdTempId(c),e=(f.els||{})[tid]||{};if(!tid)return '';
      return '<div class="lbl cdsec">Time na '+CD_COMP[c]+'</div><div class="cdcampos">'+
      cdCampo('Time','<select id="aTime_'+c+'"><option value="">Sem time</option>'+cdOpcoes(cdTimesDa(c).map(function(t){return [t.id,t.nome+(t.grupo?' · Grupo '+t.grupo:'')];}),e.time_id)+'</select>')+
      cdCampo('Número (1 a 99)','<input id="aNum_'+c+'" type="number" min="1" max="99" value="'+esc(e.numero||'')+'">')+
      cdCampo('Nome na camisa','<input id="aCam_'+c+'" maxlength="12" style="text-transform:uppercase" value="'+esc(e.nome_camisa||'')+'">')+
      cdCampo('Kit','<select id="aKit_'+c+'"><option value="">Escolha</option>'+cdOpcoes(CD_KIT.map(function(k){return [k,k];}),e.kit)+'</select>')+'</div>';}).join('')+
    '</div><div class="err" id="cdErr" role="alert"></div><div class="cdbts">'+
    '<button class="btn primary" type="submit">Salvar</button><button class="btn" type="button" id="cdCancela">Cancelar</button>'+
    (!f.novo&&cdAdmin()?'<button class="btn cdapaga" type="button" id="cdApaga">Apagar atleta</button>':'')+'</div></form>';
}
function cdAtletaLigar(f){
  var fm=document.getElementById('cdForm'),er=document.getElementById('cdErr'),v=function(id){return document.getElementById(id).value.trim();};
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdUsuarios();});
  var ap=document.getElementById('cdApaga');
  if(ap)ap.addEventListener('click',function(){
    if(!confirm('Apagar o atleta '+f.nome+'? Isso não pode ser desfeito.'))return;
    ap.disabled=true;SB.rpc('excluir_atleta',{atleta:f.id}).then(function(r){
      if(r.error||!r.data||!r.data.ok){ap.disabled=false;er.textContent=(r.data&&r.data.erro)||'Não foi possível apagar. Tente de novo.';return;}
      CD.form=null;toast(r.data.inativado?'O atleta já jogou: ficou inativo e saiu do time.':'Atleta apagado.');cdRecarregar();});
  });
  fm.addEventListener('submit',function(e){e.preventDefault();
    var d={id:f.id||null,nome:v('aNome'),apelido:v('aApe'),posicao:v('aPos'),unidade_id:v('aUni'),foto_url:f.foto_url||'',
      email:v('aEmail').toLowerCase(),celular:v('aCel'),nascimento:v('aNasc'),elencos:[]};
    var falta=!d.nome?'o nome':!d.posicao?'a posição':!/^\S+@\S+\.\S+$/.test(d.email)?'um e-mail válido':!d.celular?'o celular':!d.nascimento?'a data de nascimento':'';
    Object.keys(CD_COMP).forEach(function(c){var t=document.getElementById('aTime_'+c);if(!t||!t.value||falta)return;
      var x={time_id:t.value,numero:v('aNum_'+c),nome_camisa:v('aCam_'+c).toUpperCase(),kit:v('aKit_'+c)};
      falta=!(+x.numero>=1&&+x.numero<=99)?'o número da camisa na '+CD_COMP[c]+' (1 a 99)':!x.nome_camisa?'o nome na camisa na '+CD_COMP[c]:!x.kit?'o tamanho do kit na '+CD_COMP[c]:'';
      d.elencos.push(x);});
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
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdUsuarios();});
  document.querySelectorAll('[data-pi]').forEach(function(b){b.addEventListener('click',function(){
    var x=pend.filter(function(p){return p.id===b.dataset.pi;})[0],pos=(x.posicoes&&x.posicoes[0])||String(x.posicao||'').split(' · ')[0];
    var cod=CD_POS.filter(function(p){return POSN[p]===pos;})[0]||'',uni=CD.unidades.filter(function(u){return u.nome===x.unidade;})[0];
    CD.form={tipo:'atleta',novo:true,origem:x.protocolo,nome:x.nome,email:x.email,celular:x.celular,nascimento:x.nascimento,posicao:cod,unidade_id:uni?uni.id:'',
      els:(function(){var o={};o[cdTempId('pro_league')]={numero:(x.numeros&&x.numeros[0])||x.numero,nome_camisa:x.nome_camisa,kit:x.kit};return o;})()};
    cdUsuarios();cdFoco();});});
}

/* ================= HISTÓRICO ================= */
var CD_TAB={times:'Time',atletas:'Atleta',elencos:'Elenco',jogos:'Jogo',rodadas:'Rodada'};
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

/* ================= JOGOS E SÚMULA =================
   Jogos cadastrados um a um, por competição. A súmula é preenchida depois do jogo: placar, quem jogou,
   gols (com assistência), cartões, VAR e MVP. "Fechar súmula" confere o placar com os gols e encerra o jogo.
   Cartão vermelho suspende o atleta no jogo seguinte do time (aviso na súmula desse jogo). */
var CD_DIAS=['dom','seg','ter','qua','qui','sex','sáb'];
function cdP2(n){return String(n).padStart(2,'0');}
// data_hora vem em UTC; o painel trabalha sempre no horário de Brasília (UTC-3).
function cdBr(iso){if(!iso)return null;var d=new Date(Date.parse(iso)-3*3600e3);
  return {data:d.getUTCFullYear()+'-'+cdP2(d.getUTCMonth()+1)+'-'+cdP2(d.getUTCDate()),hora:cdP2(d.getUTCHours())+':'+cdP2(d.getUTCMinutes()),dia:CD_DIAS[d.getUTCDay()]};}
function cdQuandoJogo(j){var b=cdBr(j.data_hora);if(!b)return 'Sem data';return b.dia+' '+b.data.split('-').reverse().slice(0,2).join('/')+' · '+b.hora.replace(':','h').replace(/h00$/,'h');}
function cdSitJogo(j){
  if(j.sumula_fechada)return ['Encerrado','ok'];
  if(j.status==='ao_vivo')return ['Ao vivo','gold'];
  if(j.status==='adiado')return ['Adiado',''];
  if(j.status==='cancelado')return ['Cancelado','no'];
  if(j.data_hora&&Date.parse(j.data_hora)<Date.now())return ['Súmula pendente','gold'];
  return ['Agendado',''];}
function cdOrdemJogos(ls){return ls.slice().sort(function(a,b){var x=a.data_hora?Date.parse(a.data_hora):9e15,y=b.data_hora?Date.parse(b.data_hora):9e15;return x-y||a.rodada-b.rodada||a.ordem-b.ordem;});}
// Suspensos num jogo: quem levou vermelho no jogo anterior do mesmo time (súmula fechada), na mesma competição.
function cdSuspensos(j){var out={};
  [j.time_casa,j.time_fora].forEach(function(t){
    var ls=cdOrdemJogos(CD.jogos.filter(function(x){return x.temporada_id===j.temporada_id&&(x.time_casa===t||x.time_fora===t)&&x.status!=='cancelado';}));
    var i=ls.map(function(x){return x.id;}).indexOf(j.id);if(i<1)return;var ant=ls[i-1];if(!ant.sumula_fechada)return;
    CD.vermelhos.forEach(function(v){if(v.jogo_id===ant.id&&v.time_id===t)out[v.atleta_id]=ant;});});
  return out;}
function cdElenco(timeId,tempId){return CD.atletas.filter(function(a){var e=a.els[tempId];return e&&e.time_id===timeId;})
  .sort(function(a,b){return a.els[tempId].numero-b.els[tempId].numero;});}
function cdAtleta(id){return CD.atletas.filter(function(a){return a.id===id;})[0];}

// Rodadas da competição: as criadas no painel (tabela rodadas) mais as que só existem pelos jogos.
function cdRodadas(tid){var out={};
  CD.rodadas.forEach(function(r){if(r.temporada_id===tid)out[r.numero]={id:r.id,numero:r.numero,data:r.data};});
  CD.jogos.forEach(function(j){if(j.temporada_id===tid&&!out[j.rodada])out[j.rodada]={id:null,numero:j.rodada,data:null};});
  return Object.keys(out).map(function(k){return out[k];}).sort(function(a,b){return a.numero-b.numero;});}
function cdDataBr(d){if(!d)return '';var x=new Date(d+'T12:00:00');return CD_DIAS[x.getDay()]+' '+d.split('-').reverse().slice(0,2).join('/');}

function cdJogos(){
  if(CD.sumula)return cdSumula();
  var el=cdEl(),tid=cdTempId(CD.comp),f=CD.form&&(CD.form.tipo==='jogo'||CD.form.tipo==='rodada')?CD.form:null;
  var js=CD.jogos.filter(function(j){return j.temporada_id===tid;}),rods=cdRodadas(tid);
  var pend=js.filter(function(j){return cdSitJogo(j)[0]==='Súmula pendente';}).length;
  el.innerHTML=cdCompHTML()+cdGuiaHTML()+'<div class="pnbusca"><label class="fld" style="flex:0 1 200px">Rodada<select id="cdRod">'+
    cdOpcoes([['','Todas']].concat(rods.map(function(r){return [r.numero,'Rodada '+r.numero];})),CD.rodada)+'</select></label>'+
    '<p class="muted" style="margin:0;flex:1 1 260px">'+rods.length+(rods.length===1?' rodada':' rodadas')+' · '+js.length+(js.length===1?' jogo':' jogos')+' na '+CD_COMP[CD.comp]+(pend?' · <b style="color:var(--gold)">'+pend+' com súmula pendente</b>':'')+'</p>'+
    '<button class="btn primary sm" id="cdNovaRod">+ Nova rodada</button></div>'+(f?(f.tipo==='rodada'?cdRodadaForm(f):cdJogoForm(f)):'')+'<div id="cdJogosLista" style="display:grid;gap:14px"></div>';
  cdCompLigar(cdJogos);cdGuiaLigar(cdJogos);
  document.getElementById('cdRod').addEventListener('change',function(){CD.rodada=this.value;cdJogos();});
  document.getElementById('cdNovaRod').addEventListener('click',function(){var ult=rods.length?rods[rods.length-1]:null;
    CD.form={tipo:'rodada',novo:true,numero:ult?ult.numero+1:1,data:ult&&ult.data?cdMaisDias(ult.data,7):''};cdJogos();cdFoco();});
  if(f&&f.tipo==='jogo')cdJogoLigar(f);
  if(f&&f.tipo==='rodada')cdRodadaLigar(f);
  var box=document.getElementById('cdJogosLista'),mostra=rods.filter(function(r){return !CD.rodada||String(r.numero)===String(CD.rodada);});
  box.innerHTML=mostra.length?mostra.map(function(r){var lj=js.filter(function(j){return j.rodada===r.numero;}).sort(function(a,b){return a.ordem-b.ordem;});
    return '<div class="card cdrod"><div class="cdrodcab"><div><h3>Rodada '+r.numero+'</h3><span class="lbl">'+(r.data?cdDataBr(r.data)+' · ':'')+lj.length+(lj.length===1?' jogo':' jogos')+'</span></div>'+
      '<div class="pnacoes"><button class="btn primary sm" data-novojogo="'+r.numero+'">+ Jogo</button><button class="btn sm" data-rodada="'+r.numero+'">Editar rodada</button></div></div>'+
      (lj.length?lj.map(cdJogoLinha).join(''):'<p class="muted" style="margin:6px 0 0">Nenhum jogo nesta rodada ainda. Use "+ Jogo".</p>')+'</div>';}).join('')
    :'<div class="card"><p class="muted" style="margin:0">Nenhuma rodada na '+CD_COMP[CD.comp]+' ainda. Comece em "+ Nova rodada" e depois coloque os jogos dentro dela.</p></div>';
  box.querySelectorAll('[data-sumula]').forEach(function(b){b.addEventListener('click',function(){location.hash='painel-sumula-'+b.dataset.sumula;});});
  box.querySelectorAll('[data-novojogo]').forEach(function(b){b.addEventListener('click',function(){var r=rods.filter(function(x){return String(x.numero)===b.dataset.novojogo;})[0];
    CD.form={tipo:'jogo',novo:true,rodada:r.numero,data:r.data||'',status:'agendado'};cdJogos();cdFoco();});});
  box.querySelectorAll('[data-rodada]').forEach(function(b){b.addEventListener('click',function(){var r=rods.filter(function(x){return String(x.numero)===b.dataset.rodada;})[0];
    CD.form={tipo:'rodada',id:r.id,numero:r.numero,antigo:r.numero,data:r.data||'',jogos:js.filter(function(j){return j.rodada===r.numero;}).length};cdJogos();cdFoco();});});
  box.querySelectorAll('[data-jogo]').forEach(function(b){b.addEventListener('click',function(){var j=CD.jogos.filter(function(x){return x.id===b.dataset.jogo;})[0],d=cdBr(j.data_hora)||{};
    CD.form={tipo:'jogo',id:j.id,rodada:j.rodada,grupo:j.grupo,data:d.data||'',hora:d.hora||'',local:j.local,time_casa:j.time_casa,time_fora:j.time_fora,status:j.status,fechada:j.sumula_fechada};cdJogos();cdFoco();});});
}
function cdMaisDias(d,n){var x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.getFullYear()+'-'+cdP2(x.getMonth()+1)+'-'+cdP2(x.getDate());}

// ---------- Rodada ----------
function cdRodadaForm(f){
  return '<form class="card cdform" id="cdForm" novalidate><h3>'+(f.novo?'Nova rodada · '+CD_COMP[CD.comp]:'Editar rodada '+f.antigo)+'</h3><div class="cdcampos">'+
    cdCampo('Número da rodada *','<input id="rNum" type="number" min="1" max="99" value="'+esc(f.numero||'')+'"'+(f.jogos?' disabled':'')+'>')+
    cdCampo('Data','<input id="rData" type="date" value="'+esc(f.data||'')+'">')+
    '</div><p class="muted" style="margin:10px 0 0;font-size:14px">'+(f.jogos?'Esta rodada já tem jogos: o número não muda. A data nova vale para os próximos jogos criados nela; a data de cada jogo muda em "Editar" do jogo.':'Depois de criar a rodada, coloque os jogos nela com "+ Jogo". Os jogos já vêm com a data da rodada.')+'</p>'+
    '<div class="err" id="cdErr" role="alert"></div><div class="cdbts"><button class="btn primary" type="submit">'+(f.novo?'Criar rodada':'Salvar')+'</button><button class="btn" type="button" id="cdCancela">Cancelar</button>'+
    (!f.novo&&f.id&&!f.jogos?'<button class="btn cdapaga" type="button" id="cdApaga">Apagar rodada</button>':'')+'</div></form>';}
function cdRodadaLigar(f){
  var fm=document.getElementById('cdForm'),er=document.getElementById('cdErr'),tid=cdTempId(CD.comp);
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdJogos();});
  var ap=document.getElementById('cdApaga');
  if(ap)ap.addEventListener('click',function(){if(!confirm('Apagar a rodada '+f.antigo+'?'))return;
    ap.disabled=true;SB.from('rodadas').delete().eq('id',f.id).then(function(r){
      if(r.error){ap.disabled=false;er.textContent=/jogos/.test(r.error.message)?'Esta rodada já tem jogos. Tire os jogos dela antes.':'Não foi possível apagar. Tente de novo.';return;}
      CD.form=null;CD.rodada='';toast('Rodada apagada.');cdRecarregar();});});
  fm.addEventListener('submit',function(e){e.preventDefault();
    var num=f.jogos?f.antigo:parseInt(document.getElementById('rNum').value,10),data=document.getElementById('rData').value||null;
    if(!(num>=1&&num<=99)){er.textContent='Número da rodada de 1 a 99.';return;}
    if(num!==f.antigo&&cdRodadas(tid).some(function(r){return r.numero===num;})){er.textContent='Já existe a rodada '+num+' nesta competição.';return;}
    var bt=fm.querySelector('[type=submit]');bt.disabled=true;er.textContent='';
    var q=f.id?SB.from('rodadas').update({numero:num,data:data}).eq('id',f.id):SB.from('rodadas').insert({temporada_id:tid,numero:num,data:data});
    q.then(function(r){bt.disabled=false;
      if(r.error){er.textContent=/duplicate|unique/i.test(r.error.message)?'Já existe a rodada '+num+' nesta competição.':'Não foi possível salvar. Tente de novo.';console.warn(r.error);return;}
      CD.form=null;toast(f.novo?'Rodada '+num+' criada. Agora coloque os jogos nela.':'Rodada atualizada.');cdRecarregar();});
  });
}
function cdJogoLinha(j){var c=cdTime(j.time_casa),f=cdTime(j.time_fora),s=cdSitJogo(j),pl=j.gols_casa!=null&&j.gols_fora!=null;
  return '<div class="cdjogo"><div class="cdjq"><b>'+esc(cdQuandoJogo(j))+'</b><span class="lbl">'+esc(j.local||'Local a definir')+(j.grupo?' · Grupo '+esc(j.grupo):'')+'</span></div>'+
    '<div class="cdjt"><span class="cdjn r">'+esc(c?c.nome:j.time_casa)+'</span>'+cdEscudo(c,26)+'<span class="cdjp">'+(pl?j.gols_casa+' <i>x</i> '+j.gols_fora:'<i>x</i>')+'</span>'+cdEscudo(f,26)+'<span class="cdjn">'+esc(f?f.nome:j.time_fora)+'</span></div>'+
    '<div class="cdjs"><span class="chip '+s[1]+'">'+s[0]+'</span>'+(j.exemplo?' <span class="chip">exemplo</span>':'')+'</div>'+
    '<div class="pnacoes"><button class="btn sm'+(s[0]==='Súmula pendente'?' primary':'')+'" data-sumula="'+j.id+'">Súmula</button><button class="btn sm" data-jogo="'+j.id+'">Editar</button></div></div>';}

// Na Libertadores, escolher o grupo deixa só os times daquele grupo nas listas de times.
function cdOpTimes(g,keep){return cdTimesDa(CD.comp).filter(function(t){return !g||t.grupo===g||keep.indexOf(t.id)>=0;}).map(function(t){return [t.id,t.nome+(t.grupo?' · Grupo '+t.grupo:'')];});}
function cdJogoForm(f){var op=cdOpTimes(f.grupo,[f.time_casa,f.time_fora]),rods=cdRodadas(cdTempId(CD.comp));
  if(!rods.some(function(r){return String(r.numero)===String(f.rodada);})&&f.rodada)rods.push({numero:+f.rodada,data:null});
  return '<form class="card cdform" id="cdForm" novalidate><h3>'+(f.novo?'Novo jogo · '+CD_COMP[CD.comp]:'Editar jogo')+'</h3><div class="cdcampos">'+
    cdCampo('Rodada *','<select id="jRod">'+cdOpcoes(rods.map(function(r){return [r.numero,'Rodada '+r.numero+(r.data?' · '+cdDataBr(r.data):'')];}),f.rodada)+'</select>')+
    (CD.comp==='libertadores'?cdCampo('Grupo','<select id="jGrupo"'+(f.fechada?' disabled':'')+'><option value="">Sem grupo (mata-mata)</option>'+cdOpcoes(CD_GRUPOS.map(function(g){return [g,'Grupo '+g];}),f.grupo)+'</select>'):'')+
    cdCampo('Data','<input id="jData" type="date" value="'+esc(f.data||'')+'">')+
    cdCampo('Horário (Brasília)','<input id="jHora" type="time" value="'+esc(f.hora||'')+'">')+
    cdCampo('Local / campo','<input id="jLocal" maxlength="60" placeholder="Ex.: Campo 1" value="'+esc(f.local||'')+'">')+
    cdCampo('Time da casa *','<select id="jCasa"'+(f.fechada?' disabled':'')+'><option value="">Escolha</option>'+cdOpcoes(op,f.time_casa)+'</select>')+
    cdCampo('Time visitante *','<select id="jFora"'+(f.fechada?' disabled':'')+'><option value="">Escolha</option>'+cdOpcoes(op,f.time_fora)+'</select>')+
    (f.status==='encerrado'||f.status==='ao_vivo'?'':cdCampo('Situação','<select id="jSt">'+cdOpcoes([['agendado','Agendado'],['adiado','Adiado'],['cancelado','Cancelado']],f.status)+'</select>'))+
    '</div>'+(f.fechada?'<p class="muted" style="margin:10px 0 0;font-size:14px">A súmula deste jogo está fechada: os times não mudam. Para trocar, um administrador reabre a súmula.</p>':'')+
    '<div class="err" id="cdErr" role="alert"></div><div class="cdbts"><button class="btn primary" type="submit">Salvar</button><button class="btn" type="button" id="cdCancela">Cancelar</button>'+
    (!f.novo&&cdAdmin()?'<button class="btn cdapaga" type="button" id="cdApaga">Apagar jogo</button>':'')+'</div></form>';}
function cdJogoLigar(f){
  var fm=document.getElementById('cdForm'),er=document.getElementById('cdErr'),v=function(id){var x=document.getElementById(id);return x?x.value.trim():'';};
  document.getElementById('cdCancela').addEventListener('click',function(){CD.form=null;cdJogos();});
  var gr=document.getElementById('jGrupo');
  if(gr)gr.addEventListener('change',function(){['jCasa','jFora'].forEach(function(id){var s=document.getElementById(id),v0=s.value;
    s.innerHTML='<option value="">Escolha</option>'+cdOpcoes(cdOpTimes(gr.value,[]),v0);if(s.value!==v0)s.value='';});});
  // trocar a rodada de um jogo novo traz a data dela
  var rs=document.getElementById('jRod');
  if(f.novo)rs.addEventListener('change',function(){var r=cdRodadas(cdTempId(CD.comp)).filter(function(x){return String(x.numero)===rs.value;})[0];if(r&&r.data)document.getElementById('jData').value=r.data;});
  var ap=document.getElementById('cdApaga');
  if(ap)ap.addEventListener('click',function(){
    if(!confirm('Apagar este jogo? A súmula dele (escalação, gols, cartões e VAR) também é apagada. Isso não pode ser desfeito.'))return;
    ap.disabled=true;SB.from('jogos').delete().eq('id',f.id).then(function(r){
      if(r.error){ap.disabled=false;er.textContent='Não foi possível apagar. Tente de novo.';return;}
      CD.form=null;toast('Jogo apagado.');cdRecarregar();});});
  fm.addEventListener('submit',function(e){e.preventDefault();
    var data=v('jData'),hora=v('jHora');
    if(hora&&!data){er.textContent='Preencha a data junto com o horário.';return;}
    var d={id:f.id||null,temporada_id:cdTempId(CD.comp),rodada:v('jRod'),grupo:v('jGrupo'),local:v('jLocal'),
      time_casa:f.fechada?f.time_casa:v('jCasa'),time_fora:f.fechada?f.time_fora:v('jFora'),status:v('jSt')||f.status,
      data_hora:data?data+'T'+(hora||'00:00')+':00-03:00':''};
    if(!(+d.rodada>=1)){er.textContent='Preencha a rodada.';return;}
    if(!d.time_casa||!d.time_fora){er.textContent='Escolha os dois times.';return;}
    if(d.time_casa===d.time_fora){er.textContent='Escolha dois times diferentes.';return;}
    var bt=fm.querySelector('[type=submit]');bt.disabled=true;er.textContent='';
    SB.rpc('salvar_jogo',{dados:d}).then(function(r){bt.disabled=false;
      if(r.error||!r.data||!r.data.ok){er.textContent=(r.data&&r.data.erro)||(r.error&&/mesma competição/.test(r.error.message)?'Os dois times precisam ser desta competição.':'Não foi possível salvar. Tente de novo.');return;}
      // jogo novo: o formulário continua aberto, com a mesma rodada, data, horário e local, para lançar o próximo
      CD.form=f.novo?{tipo:'jogo',novo:true,rodada:d.rodada,grupo:d.grupo,data:data,hora:hora,local:d.local,status:'agendado'}:null;
      toast(f.novo?'Jogo cadastrado. Já pode lançar o próximo desta rodada.':'Jogo atualizado.');cdRecarregar();});
  });
}

// ---------- Súmula ----------
// Volta da súmula para a lista de jogos: pelo histórico, se veio de lá; senão troca o endereço (o "voltar" não reabre a súmula).
function cdVoltaJogos(){if(NAV.ant==='#painel-jogos')history.back();else location.replace('#painel-jogos');}
function cdSumula(){
  var S=CD.sumula,j=CD.jogos.filter(function(x){return x.id===S.id;})[0];
  if(!j){CD.sumula=null;trocaEndereco('painel-jogos');return cdJogos();}
  CD.comp=cdCompDe(j.temporada_id)||CD.comp;
  if(S.j)return cdSumulaTela();
  cdMsg('Carregando a súmula…');
  Promise.all([
    SB.from('escalacoes').select('atleta_id,time_id').eq('jogo_id',j.id),
    SB.from('eventos_jogo').select('tipo,minuto,time_id,atleta_id,atleta2_id').eq('jogo_id',j.id).order('minuto'),
    SB.from('desafios_var').select('time_id,minuto,motivo,resultado').eq('jogo_id',j.id).order('minuto')
  ]).then(function(r){
    if(CD.sumula!==S)return;
    if(r.some(function(x){return x.error;})){cdMsg('Não foi possível carregar a súmula.');return;}
    S.j=j;S.esc={};r[0].data.forEach(function(x){S.esc[x.atleta_id]=x.time_id;});
    var ev=r[1].data.map(function(x){return {tipo:x.tipo,minuto:x.minuto,time_id:x.time_id,atleta_id:x.atleta_id||'',atleta2_id:x.atleta2_id||''};});
    S.gols=ev.filter(function(x){return x.tipo==='gol'||x.tipo==='gol_contra';});
    S.cartoes=ev.filter(function(x){return x.tipo==='cartao_amarelo'||x.tipo==='cartao_vermelho';});
    S.var=r[2].data.map(function(x){return {time_id:x.time_id,minuto:x.minuto,motivo:x.motivo,resultado:x.resultado};});
    S.mvp=j.mvp_atleta_id||'';S.gc=j.gols_casa==null?'':j.gols_casa;S.gf=j.gols_fora==null?'':j.gols_fora;S.aberta=false;
    cdSumulaTela();});
}
function cdContaGols(S){var j=S.j,c=0,f=0;S.gols.forEach(function(g){var casa=g.time_id===j.time_casa;
  if(g.tipo==='gol'){if(casa)c++;else f++;}else{if(casa)f++;else c++;}});return [c,f];}
function cdSumulaTela(){
  var S=CD.sumula,j=S.j,el=cdEl(),c=cdTime(j.time_casa),f=cdTime(j.time_fora),susp=cdSuspensos(j),ro=j.sumula_fechada&&!S.aberta,dis=ro?' disabled':'';
  var lim=(CD.temporadas.filter(function(t){return t.id===j.temporada_id;})[0]||{}).desafios_var_por_jogo;if(lim==null)lim=2;
  var nomeT=function(t){var x=cdTime(t);return x?x.nome:t;};
  var escDe=function(t){return Object.keys(S.esc).filter(function(id){return S.esc[id]===t;}).map(cdAtleta).filter(Boolean)
    .sort(function(a,b){return (a.els[j.temporada_id]||{}).numero-(b.els[j.temporada_id]||{}).numero;});};
  var opAt=function(t,val,menos){var ls=escDe(t).filter(function(a){return a.id!==menos;});
    return '<option value="">Escolha</option>'+ls.map(function(a){return '<option value="'+a.id+'"'+(a.id===val?' selected':'')+'>'+(a.els[j.temporada_id]||{}).numero+' · '+esc(a.nome)+'</option>';}).join('');};
  var opTime='<option value="'+esc(j.time_casa)+'">'+esc(nomeT(j.time_casa))+'</option><option value="'+esc(j.time_fora)+'">'+esc(nomeT(j.time_fora))+'</option>';
  var selT=function(k,val){return '<select data-k="'+k+'"'+dis+'>'+opTime.replace('value="'+esc(val)+'"','value="'+esc(val)+'" selected')+'</select>';};
  // limpa atletas que deixaram de estar marcados como "jogou"
  S.gols.concat(S.cartoes).forEach(function(x){if(x.atleta_id&&S.esc[x.atleta_id]!==x.time_id)x.atleta_id='';if(x.atleta2_id&&S.esc[x.atleta2_id]!==x.time_id)x.atleta2_id='';});
  if(S.mvp&&!S.esc[S.mvp])S.mvp='';
  var ct=cdContaGols(S),bate=String(ct[0])===String(S.gc)&&String(ct[1])===String(S.gf);
  var lado=function(t,nome){var ls=cdElenco(t,j.temporada_id),n=escDe(t).length;
    return '<div class="card cdlado"><div class="between"><h3>'+esc(nome)+'</h3><span class="lbl">'+n+' marcados</span></div>'+
      (ro?'':'<div class="cdbts" style="margin:8px 0 10px"><button type="button" class="btn sm" data-todos="'+esc(t)+'">Marcar todos</button><button type="button" class="btn sm" data-limpa="'+esc(t)+'">Limpar</button></div>')+
      (ls.length?'<div class="cdesc">'+ls.map(function(a){var e=a.els[j.temporada_id],su=susp[a.id];
        return '<label class="cdesca'+(su?' susp':'')+'"><input type="checkbox" data-esc="'+a.id+'" data-time="'+esc(t)+'"'+(S.esc[a.id]===t?' checked':'')+(ro||su?' disabled':'')+'>'+
          '<b>'+e.numero+'</b><span>'+esc(a.nome)+'<small>'+esc(POSN[a.posicao]||'')+(su?' · <em>Suspenso: vermelho na rodada '+su.rodada+'</em>':'')+'</small></span></label>';}).join('')+'</div>'
        :'<p class="muted" style="margin:0">Este time não tem atletas no elenco desta competição. Cadastre em Usuários.</p>')+'</div>';};
  // cada campo da linha tem o seu nome em cima (ex.: "Autor do gol" e "Assistência"), para não confundir os dois atletas
  var rot=function(txt,html,cl){return '<label class="cdevc '+cl+'"><small>'+txt+'</small>'+html+'</label>';};
  var linha=function(lista,i,x,tipos){var t=x.time_id||j.time_casa,gol=lista==='gols';x.time_id=t;
    return '<div class="cdev">'+rot('Tipo','<select data-k="'+lista+'.'+i+'.tipo"'+dis+'>'+cdOpcoes(tipos,x.tipo)+'</select>','ctipo')+rot(gol?(x.tipo==='gol_contra'?'Time de quem fez contra':'Time que marcou'):'Time',selT(lista+'.'+i+'.time_id',t),'ctime')+
      rot('Minuto','<input type="number" min="0" max="130" placeholder="Min." data-k="'+lista+'.'+i+'.minuto" value="'+esc(x.minuto==null?'':x.minuto)+'"'+dis+'>','cmin')+
      rot(gol?(x.tipo==='gol_contra'?'Quem fez contra':'Autor do gol'):'Atleta','<select data-k="'+lista+'.'+i+'.atleta_id"'+dis+'>'+opAt(t,x.atleta_id)+'</select>','cat')+
      (gol?(x.tipo==='gol'?rot('Assistência','<select data-k="gols.'+i+'.atleta2_id"'+dis+'><option value="">Sem assistência</option>'+opAt(t,x.atleta2_id,x.atleta_id).replace('<option value="">Escolha</option>','')+'</select>','cat'):'<span class="lbl">conta para o adversário</span>'):'')+
      (ro?'':'<button type="button" class="pnic no" data-tira="'+lista+'.'+i+'" title="Tirar" aria-label="Tirar">✕</button>')+'</div>';};
  var cnt=function(t){return S.var.filter(function(x){return x.time_id===t;}).length;};
  el.innerHTML='<div class="cdsum"><button class="btn sm" id="cdVolta" type="button">← Voltar aos jogos</button>'+
    '<div class="card cdsumtopo"><div class="eyebrow">'+CD_COMP[cdCompDe(j.temporada_id)]+' · Rodada '+j.rodada+(j.grupo?' · Grupo '+esc(j.grupo):'')+' · '+esc(cdQuandoJogo(j))+(j.local?' · '+esc(j.local):'')+'</div>'+
      '<div class="cdplacar">'+cdEscudo(c,40)+'<b>'+esc(nomeT(j.time_casa))+'</b><input type="number" min="0" max="99" id="sGc" value="'+esc(S.gc)+'"'+dis+' aria-label="Gols da casa"><i>x</i>'+
      '<input type="number" min="0" max="99" id="sGf" value="'+esc(S.gf)+'"'+dis+' aria-label="Gols do visitante"><b>'+esc(nomeT(j.time_fora))+'</b>'+cdEscudo(f,40)+'</div>'+
      '<div class="cdsumst">'+(j.sumula_fechada?'<span class="chip ok">Súmula fechada</span>':'<span class="chip gold">Súmula em aberto</span>')+
      '<span class="lbl" id="sConf">Gols lançados: '+ct[0]+' x '+ct[1]+(S.gc===''||S.gf===''?'':bate?' · confere com o placar ✓':' · não confere com o placar')+'</span></div></div>'+
    '<h3 class="cdsec2">Quem jogou</h3><div class="cdsumcols">'+lado(j.time_casa,nomeT(j.time_casa))+lado(j.time_fora,nomeT(j.time_fora))+'</div>'+
    '<div class="card"><div class="between"><h3>Gols</h3>'+(ro?'':'<button type="button" class="btn sm" data-add="gols">+ Gol</button>')+'</div>'+
      (S.gols.length?S.gols.map(function(x,i){return linha('gols',i,x,[['gol','Gol'],['gol_contra','Gol contra']]);}).join(''):'<p class="muted" style="margin:8px 0 0">Nenhum gol lançado.</p>')+'</div>'+
    '<div class="card"><div class="between"><h3>Cartões</h3>'+(ro?'':'<button type="button" class="btn sm" data-add="cartoes">+ Cartão</button>')+'</div>'+
      (S.cartoes.length?S.cartoes.map(function(x,i){return linha('cartoes',i,x,[['cartao_amarelo','Amarelo'],['cartao_vermelho','Vermelho']]);}).join(''):'<p class="muted" style="margin:8px 0 0">Nenhum cartão.</p>')+
      '<p class="muted" style="margin:10px 0 0;font-size:13px">Cartão vermelho suspende o atleta no jogo seguinte do time.</p></div>'+
    '<div class="card"><div class="between"><h3>VAR <span class="lbl">até '+lim+' por time · '+esc(nomeT(j.time_casa))+' '+cnt(j.time_casa)+' · '+esc(nomeT(j.time_fora))+' '+cnt(j.time_fora)+'</span></h3>'+(ro?'':'<button type="button" class="btn sm" data-add="var">+ Pedido de VAR</button>')+'</div>'+
      (S.var.length?S.var.map(function(x,i){x.time_id=x.time_id||j.time_casa;x.resultado=x.resultado||'pendente';
        return '<div class="cdev">'+rot('Time que pediu',selT('var.'+i+'.time_id',x.time_id),'ctime')+rot('Minuto','<input type="number" min="0" max="130" placeholder="Min." data-k="var.'+i+'.minuto" value="'+esc(x.minuto==null?'':x.minuto)+'"'+dis+'>','cmin')+
          '<label class="cdevc cdmot"><small>Motivo</small><input maxlength="200" placeholder="Ex.: pênalti não marcado" data-k="var.'+i+'.motivo" value="'+esc(x.motivo||'')+'"'+dis+'></label>'+
          rot('Decisão','<select data-k="var.'+i+'.resultado"'+dis+'>'+cdOpcoes([['pendente','Pendente'],['mantida','Mantida'],['revertida','Revertida']],x.resultado)+'</select>','ctipo')+
          (ro?'':'<button type="button" class="pnic no" data-tira="var.'+i+'" title="Tirar" aria-label="Tirar">✕</button>')+'</div>';}).join(''):'<p class="muted" style="margin:8px 0 0">Nenhum pedido de VAR.</p>')+'</div>'+
    '<div class="card"><h3>MVP do jogo</h3><label class="fld" style="max-width:420px;margin-top:8px">Melhor em campo<select id="sMvp"'+dis+'><option value="">Escolha</option>'+
      [j.time_casa,j.time_fora].map(function(t){return '<optgroup label="'+esc(nomeT(t))+'">'+escDe(t).map(function(a){return '<option value="'+a.id+'"'+(a.id===S.mvp?' selected':'')+'>'+(a.els[j.temporada_id]||{}).numero+' · '+esc(a.nome)+'</option>';}).join('')+'</optgroup>';}).join('')+'</select></label></div>'+
    '<div class="err" id="cdErr" role="alert"></div><div class="cdbts">'+
      (ro?(cdAdmin()?'<button type="button" class="btn" id="sReabre">Reabrir súmula</button>':'<p class="muted" style="margin:0">Súmula fechada. Só um administrador pode reabrir.</p>')
        :'<button type="button" class="btn" id="sRasc">Salvar rascunho</button><button type="button" class="btn primary" id="sFecha">Fechar súmula</button>')+'</div></div>';
  cdSumulaLigar();
}
function cdSumulaLigar(){
  var S=CD.sumula,el=cdEl(),j=S.j;
  document.getElementById('cdVolta').addEventListener('click',cdVoltaJogos);
  var re=document.getElementById('sReabre');if(re)re.addEventListener('click',function(){S.aberta=true;cdSumulaTela();});
  var conf=function(){var ct=cdContaGols(S),ok=String(ct[0])===String(S.gc)&&String(ct[1])===String(S.gf);
    document.getElementById('sConf').textContent='Gols lançados: '+ct[0]+' x '+ct[1]+(S.gc===''||S.gf===''?'':ok?' · confere com o placar ✓':' · não confere com o placar');};
  ['sGc','sGf'].forEach(function(id){document.getElementById(id).addEventListener('input',function(){S[id==='sGc'?'gc':'gf']=this.value;conf();});});
  document.getElementById('sMvp').addEventListener('change',function(){S.mvp=this.value;});
  el.querySelectorAll('[data-esc]').forEach(function(cb){cb.addEventListener('change',function(){if(cb.checked)S.esc[cb.dataset.esc]=cb.dataset.time;else delete S.esc[cb.dataset.esc];cdSumulaTela();});});
  el.querySelectorAll('[data-todos]').forEach(function(b){b.addEventListener('click',function(){var su=cdSuspensos(j);
    cdElenco(b.dataset.todos,j.temporada_id).forEach(function(a){if(!su[a.id])S.esc[a.id]=b.dataset.todos;});cdSumulaTela();});});
  el.querySelectorAll('[data-limpa]').forEach(function(b){b.addEventListener('click',function(){Object.keys(S.esc).forEach(function(id){if(S.esc[id]===b.dataset.limpa)delete S.esc[id];});cdSumulaTela();});});
  el.querySelectorAll('[data-add]').forEach(function(b){b.addEventListener('click',function(){var l=b.dataset.add;
    S[l].push(l==='gols'?{tipo:'gol',time_id:j.time_casa,minuto:'',atleta_id:'',atleta2_id:''}:l==='cartoes'?{tipo:'cartao_amarelo',time_id:j.time_casa,minuto:'',atleta_id:''}:{time_id:j.time_casa,minuto:'',motivo:'',resultado:'pendente'});cdSumulaTela();});});
  el.querySelectorAll('[data-tira]').forEach(function(b){b.addEventListener('click',function(){var p=b.dataset.tira.split('.');S[p[0]].splice(+p[1],1);cdSumulaTela();});});
  el.querySelectorAll('[data-k]').forEach(function(x){var p=x.dataset.k.split('.'),set=function(){S[p[0]][+p[1]][p[2]]=x.value;};
    if(x.tagName==='SELECT')x.addEventListener('change',function(){set();if(p[2]==='time_id'){S[p[0]][+p[1]].atleta_id='';S[p[0]][+p[1]].atleta2_id='';}cdSumulaTela();});
    else x.addEventListener('input',function(){set();if(p[0]==='gols')conf();});});
  var salvar=function(fechar,bt){var er=document.getElementById('cdErr'),msg='';
    var ev=S.gols.concat(S.cartoes);
    ev.forEach(function(x,i){if(!msg&&(!x.atleta_id||x.minuto===''||x.minuto==null))msg='Complete todos os gols e cartões: jogador e minuto.';});
    S.var.forEach(function(x){if(!msg&&!String(x.motivo||'').trim())msg='Escreva o motivo de cada pedido de VAR.';});
    if(!msg&&fechar){var ct=cdContaGols(S);
      if(S.gc===''||S.gf==='')msg='Preencha o placar para fechar a súmula.';
      else if(!Object.keys(S.esc).some(function(id){return S.esc[id]===j.time_casa;})||!Object.keys(S.esc).some(function(id){return S.esc[id]===j.time_fora;}))msg='Marque quem jogou nos dois times para fechar a súmula.';
      else if(String(ct[0])!==String(S.gc)||String(ct[1])!==String(S.gf))msg='O placar ('+S.gc+' x '+S.gf+') não bate com os gols lançados ('+ct[0]+' x '+ct[1]+').';}
    if(msg){er.textContent=msg;return;}
    if(fechar&&!confirm('Fechar a súmula? O jogo fica encerrado e entra na tabela e nas estatísticas do site.'))return;
    bt.disabled=true;er.textContent='';
    var d={gols_casa:S.gc,gols_fora:S.gf,mvp:S.mvp,fechar:fechar,
      escalacao:Object.keys(S.esc).map(function(id){return {atleta_id:id,time_id:S.esc[id]};}),
      eventos:ev.map(function(x){return {tipo:x.tipo,minuto:x.minuto,time_id:x.time_id,atleta_id:x.atleta_id,atleta2_id:x.tipo==='gol'?x.atleta2_id:''};}),
      var:S.var.map(function(x){return {time_id:x.time_id,minuto:x.minuto,motivo:x.motivo,resultado:x.resultado};})};
    SB.rpc('salvar_sumula',{jogo:j.id,dados:d}).then(function(r){bt.disabled=false;
      if(r.error||!r.data||!r.data.ok){er.textContent=(r.data&&r.data.erro)||'Não foi possível salvar a súmula. Tente de novo.';if(r.error)console.warn(r.error);return;}
      toast(fechar?'Súmula fechada. O jogo está encerrado.':'Rascunho da súmula salvo.');
      if(fechar){CD.ok=false;cdVoltaJogos();}else{CD.sumula={id:j.id};cdRecarregar();}});};
  var rb=document.getElementById('sRasc');if(rb)rb.addEventListener('click',function(){salvar(false,rb);});
  var fb=document.getElementById('sFecha');if(fb)fb.addEventListener('click',function(){salvar(true,fb);});
}
