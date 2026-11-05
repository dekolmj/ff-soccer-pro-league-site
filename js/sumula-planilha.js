/* Súmula por planilha (04/11/2026, pedido do Deko).
   Na súmula de cada jogo do painel: "Baixar planilha" gera um .xlsx já com os dois elencos (número e nome);
   a equipe preenche no Excel (ou Google Planilhas) e "Importar planilha" lê o arquivo e preenche a tela da súmula
   (placar, quem jogou, gols, cartões e MVP). Nada é gravado até clicar em "Salvar rascunho" ou "Fechar súmula".
   Sem biblioteca: o .xlsx é montado com pnZip (painel.js) e lido com DecompressionStream.
   Desde 05/11/2026 (modelo aprovado pelo Deko): uma folha só, com o escudo, os dois times lado a lado (Nº, Nome, J, CA, CV, MVP)
   e o quadro de gols de cada time (15 linhas: nome, nº da camisa e GC), sem minuto; "Imprimir súmula" abre a mesma folha em branco
   para preencher à mão. A importação ainda aceita a planilha antiga de 4 abas (Súmula, Quem jogou, Gols, Cartões). */

var SP_GOLS=15;  // linhas do quadro de gols de cada time (Fut7: pode sair muito gol)
var SP_JOG=15;   // linhas mínimas da lista de jogadores de cada time

function spNorm(s){return String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
function spXe(v){return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function spCol(i){var s='';i++;while(i){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26;}return s;}
function spNomeArq(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();}

// Estilos da folha (índice = s da célula)
// 1 título · 2 subtítulo · 3 time (esq.) · 4 time (dir.) · 5 placar (preencher) · 6 "X" do placar · 7 texto · 8 faixa preta
// 9 cabeçalho cinza · 10 nº (negrito, borda) · 11 nome (borda) · 12 marcação (preencher, centro) · 13 legenda · 14 título GOLS · 15 nº de ordem do gol · 16 nome (preencher)
function spEstilos(){
  var xf=function(f,fi,b,al){return '<xf numFmtId="0" fontId="'+f+'" fillId="'+fi+'" borderId="'+b+'" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">'+(al||'<alignment vertical="center"/>')+'</xf>';};
  var C='<alignment horizontal="center" vertical="center" wrapText="1"/>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<fonts count="8"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font><font><b/><sz val="16"/><name val="Arial"/></font>'+
    '<font><sz val="9"/><color rgb="FF444444"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>'+
    '<font><b/><sz val="14"/><name val="Arial"/></font><font><b/><sz val="16"/><color rgb="FF1A4FD0"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FF1A4FD0"/><name val="Arial"/></font></fonts>'+
    '<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+
    '<fill><patternFill patternType="solid"><fgColor rgb="FF111111"/><bgColor indexed="64"/></patternFill></fill>'+
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE9E9E9"/><bgColor indexed="64"/></patternFill></fill>'+
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFF6D9"/><bgColor indexed="64"/></patternFill></fill></fills>'+
    '<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border>'+
    '<border><left style="thin"><color rgb="FF111111"/></left><right style="thin"><color rgb="FF111111"/></right><top style="thin"><color rgb="FF111111"/></top><bottom style="thin"><color rgb="FF111111"/></bottom><diagonal/></border>'+
    '<border><left style="medium"><color rgb="FF111111"/></left><right style="medium"><color rgb="FF111111"/></right><top style="medium"><color rgb="FF111111"/></top><bottom style="medium"><color rgb="FF111111"/></bottom><diagonal/></border></borders>'+
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="17">'+
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+
    xf(2,0,0)+xf(3,0,0)+xf(5,0,0)+xf(5,0,0,'<alignment horizontal="right" vertical="center"/>')+xf(6,4,2,C)+xf(5,0,0,C)+xf(0,0,0)+
    xf(4,2,1,C)+xf(1,3,1,C)+xf(1,0,1,C)+xf(0,0,1)+xf(7,4,1,C)+xf(3,0,0,'<alignment vertical="top" wrapText="1"/>')+xf(5,0,0)+xf(3,0,1,C)+
    xf(7,4,1,'<alignment vertical="center"/>')+
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
}

// A folha da súmula. linhas = [[{v,s}]], alt = {linha: altura}, mesc = ['A1:B1'], listas = [[faixa, fórmula]]
function spFolha(linhas,larg,alt,mesc,listas,logo){
  var cel=function(x,c,r){if(x==null)return '';if(typeof x!=='object')x={v:x};var ref=spCol(c)+r,st=x.s?' s="'+x.s+'"':'';
    if(x.v==null||x.v==='')return x.s?'<c r="'+ref+'"'+st+'/>':'';
    if(typeof x.v==='number')return '<c r="'+ref+'"'+st+'><v>'+x.v+'</v></c>';
    return '<c r="'+ref+'" t="inlineStr"'+st+'><is><t xml:space="preserve">'+spXe(x.v)+'</t></is></c>';};
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>'+
    '<cols>'+larg.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('')+'</cols><sheetData>'+
    linhas.map(function(l,r){return '<row r="'+(r+1)+'"'+(alt[r+1]?' ht="'+alt[r+1]+'" customHeight="1"':'')+'>'+(l||[]).map(function(x,c){return cel(x,c,r+1);}).join('')+'</row>';}).join('')+'</sheetData>'+
    (mesc.length?'<mergeCells count="'+mesc.length+'">'+mesc.map(function(m){return '<mergeCell ref="'+m+'"/>';}).join('')+'</mergeCells>':'')+
    (listas.length?'<dataValidations count="'+listas.length+'">'+listas.map(function(d){
      return '<dataValidation type="list" allowBlank="1" showErrorMessage="0" sqref="'+d[0]+'"><formula1>'+spXe(d[1])+'</formula1></dataValidation>';}).join('')+'</dataValidations>':'')+
    '<printOptions horizontalCentered="1"/><pageMargins left="0.4" right="0.4" top="0.45" bottom="0.45" header="0.2" footer="0.2"/>'+
    '<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="1"/>'+(logo?'<drawing r:id="rId1"/>':'')+'</worksheet>';
}

// Dados da folha (os mesmos para a planilha e para a impressão)
function spDados(S){
  var j=S.j,tid=j.temporada_id,nomeT=function(t){var x=cdTime(t);return x?x.nome:t;};
  var el=function(t){return cdElenco(t,tid).slice().sort(function(a,b){return (a.els[tid].numero||0)-(b.els[tid].numero||0)||a.nome.localeCompare(b.nome);});};
  var b=cdBr(j.data_hora);
  return {C:nomeT(j.time_casa),F:nomeT(j.time_fora),elC:el(j.time_casa),elF:el(j.time_fora),
    sub:(CD_COMP[cdCompDe(tid)]||'')+(j.grupo?' · Fase de grupos · Grupo '+j.grupo:'')+' · Rodada '+j.rodada,
    data:b?b.data.split('-').reverse().join('/')+' · '+b.hora.replace(':','h'):'',local:j.local?'Unidade '+j.local:''};
}

// Monta e baixa o .xlsx da súmula do jogo S.j: uma folha só, no modelo aprovado pelo Deko em 05/11/2026
function spBaixar(S){
  var j=S.j,tid=j.temporada_id,D=spDados(S),n=Math.max(SP_JOG,D.elC.length,D.elF.length);
  var V=function(v,s){return {v:v==null?'':v,s:s};},L=[],alt={},mesc=[],listas=[];
  var lin=function(a){L.push(a);return L.length;};
  var r=lin([null,V('FF SOCCER PRO LEAGUE · SÚMULA DO JOGO',1)]);mesc.push('B'+r+':M'+r);alt[r]=24;
  r=lin([null,V(D.sub,2)]);mesc.push('B'+r+':M'+r);alt[r]=16;
  r=lin([]);alt[r]=14;
  r=lin([V(D.C,3),null,null,null,null,V(S.gc,5),V('X',6),V(S.gf,5),V(D.F,4)]);mesc.push('A'+r+':E'+r,'I'+r+':M'+r);alt[r]=30;var rPl=r;
  r=lin([V('Data: '+D.data+'      Local: '+D.local+'      Árbitro: ______________________',7)]);mesc.push('A'+r+':M'+r);alt[r]=20;
  r=lin([]);alt[r]=8;
  r=lin([V(D.C,8),V('',8),V('',8),V('',8),V('',8),V('',8),null,V(D.F,8),V('',8),V('',8),V('',8),V('',8),V('',8)]);mesc.push('A'+r+':F'+r,'H'+r+':M'+r);alt[r]=20;
  var cab=['Nº','Nome','J','CA','CV','MVP'].map(function(x){return V(x,9);});r=lin(cab.concat([null],cab));
  var marca=function(a,t,k){if(!a)return '';
    if(k==='J')return S.esc[a.id]===t?'X':'';
    if(k==='MVP')return S.mvp===a.id?'X':'';
    var tp=k==='CA'?'cartao_amarelo':'cartao_vermelho';return S.cartoes.some(function(c){return c.atleta_id===a.id&&c.tipo===tp;})?'X':'';};
  var bloco=function(a,t){return [V(a?a.els[tid].numero:'',10),V(a?a.nome:'',11)].concat(['J','CA','CV','MVP'].map(function(k){return V(marca(a,t,k),12);}));};
  var r0=L.length+1;
  for(var i=0;i<n;i++){r=lin(bloco(D.elC[i],j.time_casa).concat([null],bloco(D.elF[i],j.time_fora)));alt[r]=17;}
  var rN=L.length;
  r=lin([]);alt[r]=10;
  r=lin([V('GOLS · uma linha por gol, na ordem em que saíram: nome e nº da camisa de quem marcou',14)]);mesc.push('A'+r+':M'+r);alt[r]=20;
  r=lin([V('Gols do '+D.C,8),V('',8),V('',8),V('',8),V('',8),V('',8),null,V('Gols do '+D.F,8),V('',8),V('',8),V('',8),V('',8),V('',8)]);mesc.push('A'+r+':F'+r,'H'+r+':M'+r);alt[r]=20;
  var cg=[V('#',9),V('Nome do jogador',9),V('Nº camisa',9),V('',9),V('GC',9),V('',9)];r=lin(cg.concat([null],cg));mesc.push('C'+r+':D'+r,'E'+r+':F'+r,'J'+r+':K'+r,'L'+r+':M'+r);
  // gols de cada quadro = os que contam para aquele time (gol contra: jogador do adversário, com X em GC)
  var conta=function(t){return S.gols.filter(function(g){return g.atleta_id&&(g.tipo==='gol'?g.time_id===t:g.time_id!==t);});};
  var gC=conta(j.time_casa),gF=conta(j.time_fora),ng=Math.max(SP_GOLS,gC.length,gF.length);
  var gl=function(g,k){var a=g?cdAtleta(g.atleta_id):null;return [V((k+1)+'º',15),V(a?a.nome:'',16),V(a&&a.els[tid]?a.els[tid].numero:'',12),V('',12),V(g&&g.tipo==='gol_contra'?'X':'',12),V('',12)];};
  var rg0=L.length+1;
  for(i=0;i<ng;i++){r=lin(gl(gC[i],i).concat([null],gl(gF[i],i)));alt[r]=17;mesc.push('C'+r+':D'+r,'E'+r+':F'+r,'J'+r+':K'+r,'L'+r+':M'+r);}
  var rgN=L.length;
  // lista de nomes no quadro de gols = nomes da lista do time (o do adversário também serve para gol contra; dá para digitar outro)
  listas.push(['B'+rg0+':B'+rgN,'$B$'+r0+':$B$'+rN],['I'+rg0+':I'+rgN,'$I$'+r0+':$I$'+rN]);
  r=lin([]);alt[r]=8;
  r=lin([V('Como preencher: J = jogou (X em quem entrou em campo) · CA = cartão amarelo · CV = cartão vermelho · MVP = X em um só jogador do jogo (o melhor em campo). '+
    'Nos Gols, cada gol é uma linha: anote o nome e o nº da camisa de quem fez. Jogador que fez 2 gols aparece em 2 linhas. Cada quadro tem os gols que contam para aquele time. '+
    'GC = gol contra: anote no quadro do time que ganhou o gol o nome e o nº do adversário que fez contra, e marque X em GC. Depois, salve e use "Importar planilha" na súmula do painel.',13)]);
  mesc.push('A'+r+':M'+r);alt[r]=52;
  var folha=function(logo){return spFolha(L,[8,28,6,4,5,6,3,8,28,6,4,5,6],alt,mesc,listas,logo);};
  var monta=function(png){
    var arq={
      '[Content_Types].xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>'+
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+
        (png?'<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>':'')+'</Types>',
      '_rels/.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Súmula" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels':'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml':spEstilos(),
      'xl/worksheets/sheet1.xml':folha(!!png)
    };
    if(png){  // escudo no canto de cima, à esquerda (cerca de 48 x 55 px)
      arq['xl/worksheets/_rels/sheet1.xml.rels']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>';
      arq['xl/drawings/_rels/drawing1.xml.rels']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/escudo.png"/></Relationships>';
      arq['xl/drawings/drawing1.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
        '<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>19050</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>19050</xdr:rowOff></xdr:from><xdr:ext cx="457200" cy="519430"/>'+
        '<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Escudo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>'+
        '<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="457200" cy="519430"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>';
      arq['xl/media/escudo.png']=png;
    }
    var blob=new Blob([pnZip(arq)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='sumula-rodada-'+j.rodada+'-'+spNomeArq(D.C)+'-x-'+spNomeArq(D.F)+'.xlsx';
    document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},4000);
    toast('Planilha da súmula baixada.');};
  // o escudo vem do próprio site; se não carregar, a planilha sai sem ele
  fetch('assets/escudo-sumula.png').then(function(x){if(!x.ok)throw 0;return x.arrayBuffer();}).then(function(b){monta(new Uint8Array(b));}).catch(function(){monta(null);});
}

// Folha para imprimir e preencher à mão no campo (mesmo modelo, em branco), numa janela nova
function spImprimir(S){
  var D=spDados(S),tid=S.j.temporada_id,n=Math.max(SP_JOG,D.elC.length,D.elF.length),i,h=function(s){return esc(s==null?'':String(s));};
  var lista=function(nome,el){var s='<div><div class="tt">'+h(nome)+'</div><table><tr><th>Nº</th><th>Nome</th><th class="c">J</th><th class="c">CA</th><th class="c">CV</th><th class="c">MVP</th></tr>';
    for(i=0;i<n;i++){var a=el[i];s+='<tr><td class="n">'+(a?h(a.els[tid].numero):'')+'</td><td>'+(a?h(a.nome):'')+'</td><td class="c"></td><td class="c"></td><td class="c"></td><td class="c"></td></tr>';}
    return s+'</table></div>';};
  var gols=function(nome){var s='<div><table><tr><th colspan="4" class="pr">Gols do '+h(nome)+'</th></tr><tr><th style="width:26px">#</th><th>Nome do jogador</th><th style="width:70px">Nº camisa</th><th class="c">GC</th></tr>';
    for(i=0;i<SP_GOLS;i++)s+='<tr><td class="o">'+(i+1)+'º</td><td></td><td></td><td class="c"></td></tr>';return s+'</table></div>';};
  var logo=new URL('assets/escudo-sumula.png',location.href).href;
  var html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Súmula · '+h(D.C)+' x '+h(D.F)+'</title><style>'+
    '@page{size:A4;margin:9mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
    '.topo{display:flex;align-items:center;gap:12px;margin-bottom:8px}.topo img{width:54px;height:54px;object-fit:contain}h1{font-size:18px;margin:0}.sub{font-size:11px;color:#444;margin-top:2px}'+
    '.cab{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border:2px solid #111;padding:6px 10px;gap:10px}.cab .t{font-size:16px;font-weight:bold}.cab .r{text-align:right}'+
    '.plac{display:flex;align-items:center;gap:8px;font-weight:bold}.plac span{width:40px;height:32px;border:2px solid #111;display:inline-block}'+
    '.info{border:2px solid #111;border-top:0;padding:5px 10px;font-size:11px;display:flex;justify-content:space-between;gap:10px}'+
    '.cols{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}table{width:100%;border-collapse:collapse;font-size:10.5px}'+
    'th,td{border:1px solid #111;padding:0 4px;height:18px}th{background:#e9e9e9;font-size:10px}td.n{width:24px;text-align:center;font-weight:bold}td.c,th.c{width:27px;text-align:center}'+
    '.tt,th.pr{font-weight:bold;font-size:12px;text-align:center;background:#111;color:#fff;padding:4px}h2{font-size:13px;margin:10px 0 4px}h2 small{font-weight:normal;font-size:10px}'+
    'td.o{width:26px;text-align:center;color:#555}.leg{font-size:10px;color:#333;margin-top:8px;line-height:1.45;border-top:1px dashed #999;padding-top:5px}'+
    '</style></head><body><div class="topo"><img src="'+h(logo)+'" alt=""><div><h1>FF SOCCER PRO LEAGUE · SÚMULA DO JOGO</h1><div class="sub">'+h(D.sub)+'</div></div></div>'+
    '<div class="cab"><div class="t">'+h(D.C)+'</div><div class="plac"><span></span> X <span></span></div><div class="t r">'+h(D.F)+'</div></div>'+
    '<div class="info"><span><b>Data:</b> '+h(D.data)+'</span><span><b>Local:</b> '+h(D.local)+'</span><span><b>Árbitro:</b> ______________________</span></div>'+
    '<div class="cols">'+lista(D.C,D.elC)+lista(D.F,D.elF)+'</div>'+
    '<h2>GOLS <small>(uma linha por gol, na ordem em que saíram · nome e nº da camisa de quem marcou)</small></h2><div class="cols" style="margin-top:0">'+gols(D.C)+gols(D.F)+'</div>'+
    '<div class="leg"><b>Como preencher:</b> <b>J</b> = jogou (X em quem entrou em campo) · <b>CA</b> = cartão amarelo · <b>CV</b> = cartão vermelho · <b>MVP</b> = X em um só jogador do jogo (o melhor em campo). '+
    'Nos <b>Gols</b>, cada gol é uma linha: anote o nome e o nº da camisa de quem fez. Jogador que fez 2 gols aparece em 2 linhas. Cada quadro tem os gols que <b>contam para</b> aquele time. '+
    '<b>GC</b> = gol contra: anote no quadro do time que ganhou o gol o nome e o nº do adversário que fez contra, e marque X em GC.</div>'+
    '<script>var im=document.images[0];function vai(){setTimeout(function(){window.print();},150);}if(im.complete)vai();else{im.onload=vai;im.onerror=vai;}<\/script></body></html>';
  var w=window.open('','_blank');
  if(!w){toast('O navegador bloqueou a janela. Libere pop-ups para este site e tente de novo.');return;}
  w.document.write('<p style="font-family:Arial;padding:20px">Preparando a súmula…</p>');
  // o escudo vai embutido na página (a janela nova não depende de baixar nada)
  var escreve=function(src){w.document.open();w.document.write(html.replace(h(logo),src));w.document.close();};
  fetch('assets/escudo-sumula.png').then(function(x){if(!x.ok)throw 0;return x.blob();}).then(function(bl){
    var fr=new FileReader();fr.onload=function(){escreve(fr.result);};fr.onerror=function(){escreve(h(logo));};fr.readAsDataURL(bl);})
    .catch(function(){escreve(h(logo));});
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
  // atleta pelo nome (sem acento e sem diferença de maiúsculas) nos dois elencos; t = time, se já se sabe
  var porNome=function(nome,t){var k=spNorm(nome);if(!k)return [];
    return [j.time_casa,j.time_fora].filter(function(x){return !t||x===t;}).reduce(function(acc,x){return acc.concat(cdElenco(x,tid).filter(function(a){return spNorm(a.nome)===k;}).map(function(a){return {a:a,t:x};}));},[]);};
  // Folha única (modelo de 05/11/2026): lista dos dois times com J, CA, CV e MVP e o quadro de gols de cada time
  var folha=pega('Súmula'),hdr=-1;
  if(folha)folha.some(function(l,r){if(l&&spNorm(l[0])==='nº'&&spNorm(l[2])==='j'){hdr=r;return true;}return false;});
  if(hdr>=0)return spAplicarFolha(S,folha,hdr,{av:av,susp:susp,nomeT:nomeT,num:num,achaA:achaA,porNome:porNome});
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

// Lê a folha única: placar (linha com o "X" na coluna G), lista dos jogadores e quadro de gols
function spAplicarFolha(S,F,hdr,h){
  var j=S.j,tid=j.temporada_id,av=h.av,nomeT=h.nomeT,num=h.num;
  var cel=function(l,i){return String(l&&l[i]!=null?l[i]:'').trim();},marc=function(l,i){return cel(l,i)!=='';};
  // acha o atleta do time t pelo nº e/ou pelo nome (o nome desempata nº repetido e corrige nº errado)
  var acha=function(t,n,nome,rot){var m=n!=null?h.achaA(t,n,nome):[];
    if(nome&&(m.length!==1||spNorm(m[0].nome)!==spNorm(nome))){
      var pn=h.porNome(nome,t).map(function(x){return x.a;});
      if(!pn.length){var k=spNorm(nome);pn=cdElenco(t,tid).filter(function(a){var x=spNorm(a.nome);return x.indexOf(k)===0||(' '+x+' ').indexOf(' '+k+' ')>=0;});
        if(pn.length>1&&m.length===1&&pn.indexOf(m[0])>=0)pn=[m[0]];}
      if(pn.length===1){if(m.length===1&&m[0]!==pn[0]&&n!=null)av.push(rot+': o nº '+n+' não é de '+nome+'; usei o nome ('+(pn[0].els[tid]||{}).numero+' · '+pn[0].nome+').');m=pn;}
      else if(m.length!==1&&pn.length>1){m=pn;}}
    if(m.length===1)return m[0].id;
    if(m.length>1)av.push(rot+': '+(n!=null?'o nº '+n:'"'+nome+'"')+' tem mais de um atleta no '+nomeT(t)+'. Escolha o atleta na tela.');
    else av.push(rot+': não achei '+(n!=null?'o nº '+n+(nome?' ('+nome+')':''):'"'+nome+'"')+' no '+nomeT(t)+'.');
    return '';};
  var times=[[j.time_casa,0],[j.time_fora,7]],esc={},cart=[],mvps=[],gols=[],achou=false,r,l;
  // placar
  for(r=0;r<hdr;r++){l=F[r];if(l&&spNorm(l[6])==='x'){var gc=num(l[5]),gf=num(l[7]);if(gc!=null){S.gc=gc;achou=true;}if(gf!=null){S.gf=gf;achou=true;}break;}}
  // lista dos jogadores
  var fim=F.length;
  for(r=hdr+1;r<F.length;r++){l=F[r]||[];if(/^(gols|#)/.test(spNorm(l[0]))){fim=r;break;}
    times.forEach(function(tc){var t=tc[0],o=tc[1],n=num(l[o]),nome=cel(l,o+1),J=marc(l,o+2),CA=marc(l,o+3),CV=marc(l,o+4),MV=marc(l,o+5);
      if(!J&&!CA&&!CV&&!MV)return;achou=true;
      var rot='Linha '+(r+1)+' ('+nomeT(t)+')';
      if(n==null&&!nome){av.push(rot+': tem marcação, mas falta o nº e o nome.');return;}
      var at=acha(t,n,nome,rot);if(!at)return;var a=cdAtleta(at);
      if(h.susp[at])av.push(a.nome+' está suspenso (vermelho na rodada '+h.susp[at].rodada+') e foi marcado como "jogou". Confira.');
      if(!J)av.push(a.nome+' tem '+(CA||CV?'cartão':'MVP')+' marcado e foi marcado como "jogou".');
      esc[at]=t;
      if(CA)cart.push({tipo:'cartao_amarelo',time_id:t,minuto:null,atleta_id:at});
      if(CV)cart.push({tipo:'cartao_vermelho',time_id:t,minuto:null,atleta_id:at});
      if(MV)mvps.push(at);});}
  // quadro de gols: começa depois do cabeçalho "#"; cada quadro tem os gols que contam para aquele time
  var gh=-1;for(r=fim;r<F.length;r++){if(F[r]&&spNorm(F[r][0])==='#'){gh=r;break;}}
  if(gh>=0)for(r=gh+1;r<F.length;r++){l=F[r]||[];if(/^como/.test(spNorm(l[0])))break;
    times.forEach(function(tc,k){var t=tc[0],o=tc[1],adv=times[1-k][0],nome=cel(l,o+1),n=num(l[o+2]),GC=marc(l,o+4);
      if(!nome&&n==null)return;achou=true;
      var dono=GC?adv:t,rot='Gols do '+nomeT(t)+', linha '+(r+1)+(GC?' (gol contra)':'');
      var at=acha(dono,n,nome,rot);if(!at)return;
      if(esc[at]!==dono){esc[at]=dono;av.push(cdAtleta(at).nome+' aparece nos gols e foi marcado como "jogou".');}
      gols.push({tipo:GC?'gol_contra':'gol',time_id:dono,minuto:null,atleta_id:at,atleta2_id:''});});}
  if(!achou){av.push('A planilha está em branco: nada foi mudado na súmula.');return av;}
  S.esc=esc;S.cartoes=cart;S.gols=gols;
  if(mvps.length===1)S.mvp=mvps[0];
  else if(mvps.length>1){S.mvp='';av.push('MVP marcado em '+mvps.length+' jogadores. Marque só um: escolha o MVP na tela.');}
  var ct=cdContaGols(S);
  if(S.gc!==''&&S.gf!==''&&(String(ct[0])!==String(S.gc)||String(ct[1])!==String(S.gf)))av.push('O placar da planilha ('+S.gc+' x '+S.gf+') não bate com os gols lançados ('+ct[0]+' x '+ct[1]+').');
  return av;
}

// Cartão "Súmula por planilha" na tela da súmula
function spCardHTML(S,ro){
  return '<div class="card spcard"><div class="between" style="flex-wrap:wrap;gap:10px"><div style="flex:1 1 320px"><h3>Súmula por planilha</h3>'+
    '<p class="muted" style="margin:6px 0 0;font-size:14px">Imprima a súmula em branco para preencher à mão no campo, ou baixe a planilha (já com os dois elencos), preencha no Excel e importe aqui. A tela é preenchida para você conferir; nada é gravado até clicar em Salvar rascunho ou Fechar súmula.</p></div>'+
    '<div class="cdbts"><button type="button" class="btn sm" id="spImprime">Imprimir súmula</button><button type="button" class="btn sm" id="spBaixa">Baixar planilha</button>'+
    (ro?'':'<label class="btn sm primary" for="spArq" style="cursor:pointer">Importar planilha</label><input type="file" id="spArq" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>')+'</div></div>'+
    (S.spAvisos?'<div class="spavisos'+(S.spAvisos.length?'':' ok')+'">'+(S.spAvisos.length?'<b>Planilha importada. Confira estes pontos:</b><ul>'+S.spAvisos.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'<b>Planilha importada sem problemas.</b> Confira a súmula abaixo e clique em Salvar rascunho ou Fechar súmula.')+'</div>':'')+
  '</div>';
}
function spLigar(S){
  var b=document.getElementById('spBaixa');if(b)b.addEventListener('click',function(){spBaixar(S);});
  var im=document.getElementById('spImprime');if(im)im.addEventListener('click',function(){spImprimir(S);});
  var f=document.getElementById('spArq');if(f)f.addEventListener('change',function(){var arq=f.files[0];if(!arq)return;
    spLer(arq).then(function(ab){S.spAvisos=spAplicar(S,ab);cdSumulaTela();toast('Planilha importada. Confira e salve.');})
      .catch(function(e){console.warn(e);toast('Não consegui ler este arquivo. Use a planilha baixada aqui, salva em .xlsx.');f.value='';});});
}
