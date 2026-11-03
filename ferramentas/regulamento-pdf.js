/* Gera o PDF do regulamento da Copa FF Libertadores 2026 a partir de js/regulamento.js (o mesmo texto da aba Regulamento).
   Uso (precisa do Playwright):  node ferramentas/regulamento-pdf.js [pasta-com-fontes]
   A pasta de fontes é opcional: arquivos .woff2 de Barlow / Barlow Condensed / Big Shoulders Display e um local.css com os @font-face.
   Sai em assets/regulamento-copa-ff-libertadores-2026.pdf. Rode de novo sempre que mudar o texto do regulamento. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const {chromium}=require('playwright');
const raiz=path.join(__dirname,'..');
const ctx={document:{addEventListener(){}},libFormatoHTML:()=>''};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz,'js/regulamento.js'),'utf8')+';this.REG_CAP=REG_CAP;',ctx);
const semEmoji=s=>s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{2B50}\u{2B55}]/gu,'').replace(/<li>\s+/g,'<li>');
const fontes=process.argv[2]?path.resolve(process.argv[2]):null;
const css=fontes&&fs.existsSync(path.join(fontes,'local.css'))?fs.readFileSync(path.join(fontes,'local.css'),'utf8'):'';
const escudo='data:image/webp;base64,'+fs.readFileSync(path.join(raiz,'assets/escudo.webp')).toString('base64');
const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Regulamento oficial · Copa FF Libertadores 2026</title><style>${css}
*{box-sizing:border-box}body{margin:0;font-family:Barlow,'Liberation Sans',Arial,sans-serif;color:#1d1c18;font-size:10.5pt;line-height:1.5}
.capa{display:flex;align-items:center;gap:18px;border-bottom:3px solid #E0A82E;padding-bottom:14px;margin-bottom:18px}
.capa img{width:62px}.capa small{font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9a7417;font-size:9pt}
h1{font-family:'Big Shoulders Display','Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;font-size:24pt;line-height:1;margin:4px 0 0}
h2{font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:14pt;margin:20px 0 8px;padding:6px 10px;background:#f6f1e3;border-left:4px solid #E0A82E;break-after:avoid}
h4{font-family:'Barlow Condensed',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.05em;font-size:11pt;color:#8a6510;margin:14px 0 6px;break-after:avoid}
p{margin:0 0 7px}ul,ol{margin:0 0 9px;padding-left:20px}li{margin:0 0 3px}b{font-weight:600}a{color:inherit;text-decoration:none}
.reggr{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px}.reggr ul{padding-left:18px}
.fim{text-align:center;margin-top:26px;padding-top:12px;border-top:1px solid #ddd;color:#555}.fim b{font-family:'Barlow Condensed',sans-serif;font-size:13pt;letter-spacing:.06em;text-transform:uppercase;color:#1d1c18}
</style></head><body>
<div class="capa"><img src="${escudo}" alt=""><div><small>FF Soccer Academy · Edição Libertadores</small><h1>Regulamento oficial<br>Copa FF Libertadores 2026</h1></div></div>
${ctx.REG_CAP.map((c,i)=>`<h2>${i+1}. ${c[0]}</h2>${semEmoji(c[1])}`).join('')}
<div class="fim"><b>Copa FF Libertadores 2026</b><br>FF Soccer Academy · Mais do que futebol. Uma experiência de competição.</div>
</body></html>`;
(async()=>{
  const dir=fontes||raiz,tmp=path.join(dir,'.regulamento-pdf.html');fs.writeFileSync(tmp,html);
  const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});
  const p=await b.newPage();await p.goto('file://'+tmp);await p.evaluate(()=>document.fonts.ready);
  const saida=path.join(raiz,'assets/regulamento-copa-ff-libertadores-2026.pdf');
  await p.pdf({path:saida,format:'A4',printBackground:true,margin:{top:'16mm',bottom:'18mm',left:'16mm',right:'16mm'},displayHeaderFooter:true,
    headerTemplate:'<span></span>',footerTemplate:'<div style="width:100%;font-size:8px;color:#888;text-align:center;font-family:sans-serif">Regulamento oficial · Copa FF Libertadores 2026 · página <span class="pageNumber"></span> de <span class="totalPages"></span></div>'});
  await b.close();fs.unlinkSync(tmp);console.log('PDF gerado:',saida,Math.round(fs.statSync(saida).size/1024)+' KB');
})();
