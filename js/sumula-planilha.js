/* Súmula por planilha (04/11/2026, pedido do Deko).
   Na súmula de cada jogo do painel: "Baixar planilha" gera um .xlsx já com os dois elencos (número e nome);
   a equipe preenche no Excel (ou Google Planilhas) e "Importar planilha" lê o arquivo e preenche a tela da súmula
   (placar, quem jogou, gols, cartões e MVP). Nada é gravado até clicar em "Salvar rascunho" ou "Fechar súmula".
   Sem biblioteca: o .xlsx é montado com pnZip (painel.js) e lido com DecompressionStream. */

var SP_ABAS=['Súmula','Quem jogou','Gols','Cartões'];
var SP_LINHAS=25;  // linhas em branco para gols e cartões

function spNorm(s){return String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function spXe(v){return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function spCol(i){var s='';i++;while(i){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26;}return s;}
function spNomeArq(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();}

// Uma aba do Excel. linhas = [[{v, s}...]], s = estilo (0 normal, 1 cabeçalho dourado, 2 campo para preencher, 3 título, 4 célula com borda, 5 instrução)
function spAba(linhas,larg,listas,congela){
  var cel=function(x,c,r){if(x==null)return '';if(typeof x!=='object')x={v:x};var ref=spCol(c)+r,st=x.s?' s="'+x.s+'"':'';
    if(x.v==null||x.v==='')return x.s?'<c r="'+ref+'"'+st+'/>':'';
    if(typeof x.v==='number')return '<c r="'+ref+'"'+st+'><v>'+x.v+'</v></c>';
    return '<c r="'+ref+'" t="inlineStr"'+st+'><is><t xml:space="preserve">'+spXe(x.v)+'</t></is></c>';};
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<sheetViews><sheetView workbookViewId="0">'+(congela?'<pane ySplit="'+congela+'" topLeftCell="A'+(congela+1)+'" activePane="bottomLeft" state="frozen"/>':'')+'</sheetView></sheetViews>'+
    '<cols>'+larg.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('')+'</cols><sheetData>'+
    linhas.map(function(l,r){return '<row r="'+(r+1)+'">'+(l||[]).map(function(x,c){return cel(x,c,r+1);}).join('')+'</row>';}).join('')+'</sheetData>'+
    (listas&&listas.length?'<dataValidations count="'+listas.length+'">'+listas.map(function(d){
      return '<dataValidation type="list" allowBlank="1" showErrorMessage="'+(typeof d[1]==='string'?'0':'1')+'" sqref="'+d[0]+'"><formula1>'+(typeof d[1]==='string'?spXe(d[1]):'"'+spXe(d[1].map(function(x){return String(x).replace(/[",]/g,' ');}).join(','))+'"')+'</formula1></dataValidation>';}).join('')+'</dataValidations>':'')+
    '</worksheet>';
}

function spEstilos(){
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF555555"/><name val="Calibri"/></font></fonts>'+
    '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF2C14D"/><bgColor indexed="64"/></patternFill></fill>'+
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF6D9"/><bgColor indexed="64"/></patternFill></fill></fills>'+
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'+
    '<border><left style="thin"><color rgb="FFBBBBBB"/></left><right style="thin"><color rgb="FFBBBBBB"/></right><top style="thin"><color rgb="FFBBBBBB"/></top><bottom style="thin"><color rgb="FFBBBBBB"/></bottom><diagonal/></border></borders>'+
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6">'+
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>'+
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>'+
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>'+
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>'+
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'+
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
}

// Monta e baixa o .xlsx da súmula do jogo S.j
function spBaixar(S){
  var j=S.j,lib=cdCompDe(j.temporada_id)==='libertadores',tid=j.temporada_id;
  var nomeT=function(t){var x=cdTime(t);return x?x.nome:t;},C=nomeT(j.time_casa),F=nomeT(j.time_fora);
  var tit=(CD_COMP[cdCompDe(tid)]||'')+' · Rodada '+j.rodada+(j.grupo?' · Grupo '+j.grupo:'')+' · '+cdQuandoJogo(j)+(j.local?' · '+j.local:'');
  var mvpT=S.mvp?S.esc[S.mvp]:'',mvpA=S.mvp?cdAtleta(S.mvp):null;
  var I=function(v){return {v:v,s:5};},H=function(v){return {v:v,s:1};},E=function(v){return {v:v==null?'':v,s:2};},B=function(v){return {v:v,s:4};};
  var aba1=spAba([
    [{v:'SÚMULA · '+C+' x '+F,s:3}],[I(tit)],[],
    [H(''),H(C+' (casa)'),H(F+' (visitante)')],
    [B('Placar'),E(S.gc),E(S.gf)],[],
    [H('MVP do jogo'),H('Time'),H('Nº da camisa')],
    [B('Melhor em campo'),E(mvpT?nomeT(mvpT):''),E(mvpA&&mvpA.els[tid]?mvpA.els[tid].numero:'')],[],
    [I('Como preencher:')],
    [I('1. Placar: os gols de cada time nas células amarelas acima.')],
    [I('2. Aba "Quem jogou": marque X na coluna "Jogou" de cada atleta que entrou em campo.')],
    [I('3. Aba "Gols": uma linha por gol, com o time que marcou, o nº da camisa e o nome do jogador (dá para escolher o nome na lista).')],
    [I('4. Aba "Cartões": uma linha por cartão, com o time, o nº da camisa, o nome do jogador e Amarelo ou Vermelho.')],
    [I('Gol contra: lance direto na tela da súmula, depois de importar.')],
    [I('5. Salve o arquivo e use "Importar planilha" na súmula do painel. Confira a tela e clique em Salvar ou Fechar súmula.')],
    [I('Não mude o nome das abas nem a ordem das colunas.')]
  ],[22,30,30],[['B8',[C,F]]]);
  var ros=[[H('Time'),H('Nº'),H('Nome'),H('Jogou (X)')]];
  [j.time_casa,j.time_fora].forEach(function(t){cdElenco(t,tid).slice().sort(function(a,b){return (a.els[tid].numero||0)-(b.els[tid].numero||0);}).forEach(function(a){
    ros.push([B(nomeT(t)),B(a.els[tid].numero),B(a.nome),E(S.esc[a.id]===t?'X':'')]);});});
  var aba2=spAba(ros,[24,7,40,11],[],1);
  var nCol=function(x){var a=cdAtleta(x.atleta_id);return a&&a.els[tid]?a.els[tid].numero:'';};
  var nomeA=function(id){var a=cdAtleta(id);return a?a.nome:'';};
  var refNomes="'Quem jogou'!$C$2:$C$"+Math.max(2,ros.length);  // lista de nomes = coluna Nome da aba Quem jogou
  var gs=S.gols.filter(function(g){return g.tipo!=='gol_contra';});
  var gl=[[H('Time'),H('Nº da camisa'),H('Nome do jogador')].concat(lib?[]:[H('Nº da assistência')])];
  for(var i=0;i<Math.max(SP_LINHAS,gs.length+5);i++){var g=gs[i];
    gl.push([E(g?nomeT(g.time_id):''),E(g?nCol(g):''),E(g?nomeA(g.atleta_id):'')].concat(lib?[]:[E(g&&g.atleta2_id?nCol({atleta_id:g.atleta2_id}):'')]));}
  var aba3=spAba(gl,[24,14,36].concat(lib?[]:[18]),[['A2:A'+gl.length,[C,F]],['C2:C'+gl.length,refNomes]],1);  // gol sem minuto (04/11/2026, pedido do Deko)
  var ca=[[H('Time'),H('Nº da camisa'),H('Nome do jogador'),H('Cartão')]];
  for(i=0;i<Math.max(SP_LINHAS,S.cartoes.length+5);i++){var c=S.cartoes[i];
    ca.push([E(c?nomeT(c.time_id):''),E(c?nCol(c):''),E(c?nomeA(c.atleta_id):''),E(c?(c.tipo==='cartao_vermelho'?'Vermelho':'Amarelo'):'')]);}
  var aba4=spAba(ca,[24,14,36,13],[['A2:A'+ca.length,[C,F]],['C2:C'+ca.length,refNomes],['D2:D'+ca.length,['Amarelo','Vermelho']]],1);  // cartão sem minuto (05/11/2026, pedido do Deko)
  var abas=[aba1,aba2,aba3,aba4];
  var arq={
    '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
      abas.map(function(_,k){return '<Override PartName="/xl/worksheets/sheet'+(k+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';}).join('')+'</Types>',
    '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+
      SP_ABAS.map(function(n,k){return '<sheet name="'+spXe(n)+'" sheetId="'+(k+1)+'" r:id="rId'+(k+1)+'"/>';}).join('')+'</sheets></workbook>',
    'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
      abas.map(function(_,k){return '<Relationship Id="rId'+(k+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(k+1)+'.xml"/>';}).join('')+
      '<Relationship Id="rId'+(abas.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml':spEstilos()
  };
  abas.forEach(function(x,k){arq['xl/worksheets/sheet'+(k+1)+'.xml']=x;});
  var blob=new Blob([pnZip(arq)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='sumula-rodada-'+j.rodada+'-'+spNomeArq(C)+'-x-'+spNomeArq(F)+'.xlsx';
  document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},4000);
  toast('Planilha da súmula baixada.');
}

// Lê um .xlsx (zip) e devolve {nomeDaAba: [[valores da linha]]}
function spLer(arquivo){
  return arquivo.arrayBuffer().then(function(buf){
    var u=new Uint8Array(buf),dv=new DataView(buf),fim=-1;
    for(var i=u.length-22;i>=Math.max(0,u.length-70000);i--){if(dv.getUint32(i,true)===0x06054b50){fim=i;break;}}
    if(fim<0)throw new Error('zip');
    var n=dv.getUint16(fim+10,true),p=dv.getUint32(fim+16,true),ent=[],dec=new TextDecoder();
    for(var k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)throw new Error('zip');
      var met=dv.getUint16(p+10,true),tam=dv.getUint32(p+20,true),ln=dv.getUint16(p+28,true),lx=dv.getUint16(p+30,true),lc=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
      var nome=dec.decode(u.subarray(p+46,p+46+ln));ent.push({nome:nome,met:met,tam:tam,off:off});p+=46+ln+lx+lc;}
    var abre=function(e){var ini=e.off+30+dv.getUint16(e.off+26,true)+dv.getUint16(e.off+28,true),d=u.slice(ini,ini+e.tam);
      if(e.met===0)return Promise.resolve(dec.decode(d));
      if(e.met!==8||!window.DecompressionStream)return Promise.reject(new Error('metodo'));
      return new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(b){return dec.decode(b);});};
    var txt={};
    return Promise.all(ent.filter(function(e){return /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(e.nome.replace(/^\//,''));})
      .map(function(e){return abre(e).then(function(t){txt[e.nome.replace(/^\//,'')]=t;});})).then(function(){
      var X=function(s){return new DOMParser().parseFromString(s||'<x/>','application/xml');};
      var tag=function(d,nome){return Array.prototype.slice.call(d.getElementsByTagNameNS('*',nome));};
      var ss=tag(X(txt['xl/sharedStrings.xml']),'si').map(function(si){return tag(si,'t').map(function(t){return t.textContent;}).join('');});
      var rels={};tag(X(txt['xl/_rels/workbook.xml.rels']),'Relationship').forEach(function(r){rels[r.getAttribute('Id')]=r.getAttribute('Target');});
      var out={};
      tag(X(txt['xl/workbook.xml']),'sheet').forEach(function(sh){
        var rid=sh.getAttribute('r:id')||sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
        var alvo=(rels[rid]||'').replace(/^\/?xl\//,'').replace(/^\//,''),doc=X(txt['xl/'+alvo]),linhas=[];
        tag(doc,'c').forEach(function(c){var ref=c.getAttribute('r')||'',m=/^([A-Z]+)(\d+)$/.exec(ref);if(!m)return;
          var col=0;for(var q=0;q<m[1].length;q++)col=col*26+(m[1].charCodeAt(q)-64);col--;var r=+m[2]-1,t=c.getAttribute('t'),v;
          if(t==='inlineStr')v=tag(c,'t').map(function(x){return x.textContent;}).join('');
          else{var vv=tag(c,'v')[0];v=vv?vv.textContent:'';if(t==='s')v=ss[+v]||'';}
          (linhas[r]=linhas[r]||[])[col]=v;});
        out[spNorm(sh.getAttribute('name'))]=linhas;});
      return out;});
  });
}

// Preenche a súmula da tela (S) com o que veio da planilha; devolve a lista de avisos
function spAplicar(S,ab){
  var j=S.j,tid=j.temporada_id,lib=cdCompDe(tid)==='libertadores',av=[],susp=cdSuspensos(j);
  var nomeT=function(t){var x=cdTime(t);return x?x.nome:t;};
  var achaT=function(v){var s=spNorm(v).replace(/\((casa|visitante)\)/,'').trim();if(!s)return null;
    if(s===spNorm(nomeT(j.time_casa))||s==='casa'||s==='mandante')return j.time_casa;
    if(s===spNorm(nomeT(j.time_fora))||s==='visitante'||s==='fora')return j.time_fora;return '';};
  var num=function(v){var n=parseInt(String(v==null?'':v).replace(/[^\d]/g,''),10);return isNaN(n)?null:n;};
  var achaA=function(t,n,nome){var ls=cdElenco(t,tid).filter(function(a){return a.els[tid]&&a.els[tid].numero===n;});
    if(ls.length>1&&nome){var x=ls.filter(function(a){return spNorm(a.nome)===spNorm(nome);});if(x.length)ls=x;}
    if(ls.length>1){var e=ls.filter(function(a){return S.esc[a.id]===t;});if(e.length===1)ls=e;}
    return ls;};
  var pega=function(nome){return ab[spNorm(nome)]||null;};
  var a1=pega('Súmula'),a2=pega('Quem jogou'),a3=pega('Gols'),a4=pega('Cartões');
  if(!a1&&!a2&&!a3&&!a4){av.push('Não achei as abas da súmula (Súmula, Quem jogou, Gols, Cartões). Use a planilha baixada aqui no painel.');return av;}
  // Súmula: placar e MVP (procura pelas palavras da coluna A)
  if(a1)a1.forEach(function(l,r){if(!l)return;var rot=spNorm(l[0]);
    if(rot==='placar'){var gc=num(l[1]),gf=num(l[2]);if(gc!=null)S.gc=gc;if(gf!=null)S.gf=gf;}
    if(rot==='melhor em campo'){var t=achaT(l[1]),n=num(l[2]);
      if(n==null&&!l[1]){}else if(!t||n==null)av.push('MVP: preencha o time e o nº da camisa.');
      else{var m=achaA(t,n);if(m.length===1)S.mvp=m[0].id;else av.push('MVP: não achei o nº '+n+' no '+nomeT(t)+'.');}}});
  // Quem jogou
  if(a2){var esc={},marcou=0;
    a2.forEach(function(l,r){if(!l||r===0)return;var t=achaT(l[0]),n=num(l[1]),x=String(l[3]==null?'':l[3]).trim();
      if(!x)return;if(!t){av.push('Quem jogou, linha '+(r+1)+': time "'+(l[0]||'')+'" não é deste jogo.');return;}
      var m=achaA(t,n,l[2]);if(m.length!==1){av.push('Quem jogou, linha '+(r+1)+': não achei o nº '+(n==null?'?':n)+' no '+nomeT(t)+'.');return;}
      if(susp[m[0].id])av.push(m[0].nome+' está suspenso (vermelho na rodada '+susp[m[0].id].rodada+') e foi marcado como "jogou". Confira.');
      esc[m[0].id]=t;marcou++;});
    if(marcou)S.esc=esc;}
  // atleta pelo nome (sem acento e sem diferença de maiúsculas) nos dois elencos; t = time, se já se sabe
  var porNome=function(nome,t){var k=spNorm(nome);if(!k)return [];
    return [j.time_casa,j.time_fora].filter(function(x){return !t||x===t;}).reduce(function(acc,x){return acc.concat(cdElenco(x,tid).filter(function(a){return spNorm(a.nome)===k;}).map(function(a){return {a:a,t:x};}));},[]);};
  var linhaEv=function(aba,l,r){var t=achaT(l[0]),mi=num(l[1]),n=num(l[2]),nome=l[3];
    if(t==null&&nome){var pn=porNome(nome);if(pn.length===1)t=pn[0].t;}
    if(t==null){av.push(aba+', linha '+(r+1)+': falta o time.');return null;}
    if(!t){av.push(aba+', linha '+(r+1)+': time "'+l[0]+'" não é deste jogo.');return null;}
    var m=n==null?porNome(nome,t).map(function(x){return x.a;}):achaA(t,n,nome);
    if(n!=null&&nome&&m.length===1&&spNorm(m[0].nome)!==spNorm(nome)){var pn2=porNome(nome,t);if(pn2.length===1){m=[pn2[0].a];av.push(aba+', linha '+(r+1)+': o nº '+n+' não é de '+nome+'; usei o nome ('+(m[0].els[tid]||{}).numero+' · '+m[0].nome+').');}}
    if(n==null&&!nome)av.push(aba+', linha '+(r+1)+': falta o nº da camisa ou o nome do jogador.');
    else if(m.length===0)av.push(aba+', linha '+(r+1)+': não achei '+(n!=null?'o nº '+n:'"'+nome+'"')+' no '+nomeT(t)+'.');
    else if(m.length>1)av.push(aba+', linha '+(r+1)+': o nº '+n+' tem mais de um atleta no '+nomeT(t)+'. Escolha o atleta na tela.');
    var at=m.length===1?m[0].id:'';
    if(at&&S.esc[at]!==t){S.esc[at]=t;av.push((cdAtleta(at)||{}).nome+' aparece em '+aba.toLowerCase()+' e foi marcado como "jogou".');}
    return {time_id:t,minuto:null,atleta_id:at};};  // lances sem minuto (04 e 05/11/2026)
  if(a3){var gols=S.gols.filter(function(g){return g.tipo==='gol_contra';});  // gol contra é lançado na tela; a planilha não mexe neles
  var g3min=a3[0]&&spNorm(a3[0][1])==='minuto';  // planilha antiga, ainda com a coluna Minuto
  a3.forEach(function(l,r){if(!l||r===0||!l.slice(0,5).some(function(v){return String(v==null?'':v).trim();}))return;
      if(!g3min)l=[l[0],null,l[1],l[2],l[3]];  // Gols: Time | Nº | Nome | (Nº da assistência), sem minuto
      var e=linhaEv('Gols',l,r);if(!e)return;e.tipo='gol';e.atleta2_id='';
      if(!lib&&e.tipo==='gol'&&num(l[4])!=null){var as=achaA(e.time_id,num(l[4]));if(as.length===1&&as[0].id!==e.atleta_id){e.atleta2_id=as[0].id;if(S.esc[as[0].id]!==e.time_id)S.esc[as[0].id]=e.time_id;}
        else av.push('Gols, linha '+(r+1)+': não achei a assistência nº '+num(l[4])+'.');}
      gols.push(e);});S.gols=gols;}
  var a4min=a4&&a4[0]&&spNorm(a4[0][1])==='minuto';  // planilha antiga, ainda com a coluna Minuto
  if(a4){var cs=[];a4.forEach(function(l,r){if(!l||r===0||!l.slice(0,5).some(function(v){return String(v==null?'':v).trim();}))return;
      if(!a4min)l=[l[0],null,l[1],l[2],l[3]];  // Cartões: Time | Nº | Nome | Cartão, sem minuto
      var e=linhaEv('Cartões',l,r);if(!e)return;var tp=spNorm(l[4]);
      if(/verm/.test(tp))e.tipo='cartao_vermelho';else if(/amar/.test(tp))e.tipo='cartao_amarelo';else{e.tipo='cartao_amarelo';av.push('Cartões, linha '+(r+1)+': cartão "'+(l[4]||'')+'" não é Amarelo nem Vermelho; ficou Amarelo. Confira.');}
      cs.push(e);});S.cartoes=cs;}
  var ct=cdContaGols(S);
  if(S.gc!==''&&S.gf!==''&&(String(ct[0])!==String(S.gc)||String(ct[1])!==String(S.gf)))av.push('O placar da planilha ('+S.gc+' x '+S.gf+') não bate com os gols lançados ('+ct[0]+' x '+ct[1]+').');
  return av;
}

// Cartão "Súmula por planilha" na tela da súmula
function spCardHTML(S,ro){
  return '<div class="card spcard"><div class="between" style="flex-wrap:wrap;gap:10px"><div style="flex:1 1 320px"><h3>Súmula por planilha</h3>'+
    '<p class="muted" style="margin:6px 0 0;font-size:14px">Baixe a planilha com os dois elencos, preencha no Excel e importe aqui. A tela é preenchida para você conferir; nada é gravado até clicar em Salvar rascunho ou Fechar súmula.</p></div>'+
    '<div class="cdbts"><button type="button" class="btn sm" id="spBaixa">Baixar planilha</button>'+
    (ro?'':'<label class="btn sm primary" for="spArq" style="cursor:pointer">Importar planilha</label><input type="file" id="spArq" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>')+'</div></div>'+
    (S.spAvisos?'<div class="spavisos'+(S.spAvisos.length?'':' ok')+'">'+(S.spAvisos.length?'<b>Planilha importada. Confira estes pontos:</b><ul>'+S.spAvisos.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'<b>Planilha importada sem problemas.</b> Confira a súmula abaixo e clique em Salvar rascunho ou Fechar súmula.')+'</div>':'')+
  '</div>';
}
function spLigar(S){
  var b=document.getElementById('spBaixa');if(b)b.addEventListener('click',function(){spBaixar(S);});
  var f=document.getElementById('spArq');if(f)f.addEventListener('change',function(){var arq=f.files[0];if(!arq)return;
    spLer(arq).then(function(ab){S.spAvisos=spAplicar(S,ab);cdSumulaTela();toast('Planilha importada. Confira e salve.');})
      .catch(function(e){console.warn(e);toast('Não consegui ler este arquivo. Use a planilha baixada aqui, salva em .xlsx.');f.value='';});});
}
