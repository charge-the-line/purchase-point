#!/usr/bin/env node
/* Purchase Point — test suite.   node tests/run_all.js   (exit code 0 = all passed)
   Sections: syntax facts content home record privacy balance lesson drills quiz voice teach   (E0 and E1; the car diagram adds its sections in E2) */
global.window=global.window||{};
const path=require('path'),fs=require('fs'),vm=require('vm');
const ALL=['syntax','facts','content','home','record','privacy','balance','lesson','drills','quiz','voice','teach'];
let want=process.argv.slice(2);if(!want.length)want=ALL;
let failed=0,n=0;const T0=Date.now();
function report(sec,name,ok,detail=''){n++;if(!ok)failed++;console.log(`${ok?'PASS':'FAIL'}  ${sec.padEnd(9)} ${name}${detail?'  — '+detail:''}`);}
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');const {boot}=require('./pp_mock.js');
const sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8');
const JS=html.split('<script>')[1].split('</script>')[0];
const VER=(html.match(/APP_VERSION='([^']+)'/)||[])[1];

if(want.includes('syntax')){try{new vm.Script(JS);report('syntax','index.html script compiles',true);}catch(e){report('syntax','index.html script compiles',false,e.message);}
  {const cache=(sw.match(/CACHE = '([^']+)'/)||[])[1];
   report('syntax','service-worker cache and the home title line match the app version',cache===`purchase-point-v${VER}`&&html.includes(`>v${VER}<`),`app ${VER}, cache ${cache}`);
   report('syntax','offline helper clears only its own old caches',/k\.startsWith\('purchase-point-v'\)/.test(sw)&&!/upwind|bls-ready|bleed-control|patient-contact|e102/.test(sw));
   report('syntax','offline helper never caches statistics requests',/goatcounter\\\.com|zgo\\\.at/.test(sw));
   const coreNF=sw.includes("netFirst(req, 'preconnect-core.js')")&&/fellBack = Date\.now\(\)/.test(sw),navNF=/req\.mode === 'navigate'\)\s*\{\s*e\.respondWith\(netFirst/.test(sw),wait=/const NET_WAIT = (\d+)/.test(sw)&&+sw.match(/const NET_WAIT = (\d+)/)[1]<=4000,okOnly=/if \(r\.ok\) \{ const copy = r\.clone\(\)/.test(sw),reload=/cache: 'reload'/.test(sw),answers=/'pc-version\?'/.test(sw);
   report('syntax','offline helper: page and core network-first with a short wait, bad answers never saved, installs skip the HTTP cache, answers the version question',coreNF&&navNF&&wait&&okOnly&&reload&&answers);}
  {const cp=path.join(ROOT,'preconnect-core.js');const ct=fs.existsSync(cp)?fs.readFileSync(cp,'utf8'):'';const first=ct.split('\n')[0]||'';const body=ct.slice(first.length+1);
   const wantH=(first.match(/sha256:([0-9a-f]{64})/)||[])[1];const got=require('crypto').createHash('sha256').update(body,'utf8').digest('hex');
   const tagOK=html.indexOf('<script src="preconnect-core.js"></script>')>-1&&html.indexOf('<script src="preconnect-core.js"></script>')<html.indexOf('\n<script>\n');
   report('syntax','shared core loaded first, cached offline, header hash matches body',!!ct&&wantH===got&&sw.includes("'preconnect-core.js'")&&tagOK,wantH===got?'hash ok':`hash expected ${got.slice(0,12)}`);
   const hub=path.join(ROOT,'..','charge-the-line.github.io','preconnect-core.js');if(fs.existsSync(hub))report('syntax','shared core is byte-identical to the hub copy',fs.readFileSync(hub,'utf8')===ct);}
  {const urls=[...new Set([...html.matchAll(/url\((fonts\/[^)]+)\)/g)].map(m=>m[1]))];
   report('syntax','fonts served from this site, cached offline, no request to Google',!/fonts\.googleapis|gstatic\.com/.test(html)&&urls.length>=5&&urls.every(u=>fs.existsSync(path.join(ROOT,u))&&sw.includes(`'${u}'`)),`${urls.length} font files`);}
  {const snip=html.split('<script data-pca>')[1]||'';
   report('syntax','statistics snippet present, module code pp, pointed at preconnect.goatcounter.com',/window\.PCA_MOD="pp"/.test(snip)&&/preconnect\.goatcounter\.com\/count/.test(snip));
   report('syntax','drill night bar and picker markup present, settings sheet present with every switch',/<div id="pc-drill" class="pc-drillbar hidden" data-hub="\.\.\/"><\/div>/.test(html)&&/id="pc-drillov"/.test(html)&&['text','contrast','motion','sound','haptics','stats'].every(k=>html.includes(`data-set="${k}"`))&&/data-val="day"/.test(html));
   const man=fs.readFileSync(path.join(ROOT,'manifest.json'),'utf8');
   report('syntax','manifest and icons exist; the manifest names Purchase Point',['icon-192.png','icon-512.png'].every(f=>fs.existsSync(path.join(ROOT,f))&&sw.includes(`'${f}'`))&&JSON.parse(man).name==='Purchase Point');}
  {const cm=fs.readFileSync(path.join(ROOT,'CLAUDE.md'),'utf8'),rd=fs.readFileSync(path.join(ROOT,'README.txt'),'utf8');const cv=(cm.match(/\*\*Current version: ([\d.]+)/)||[])[1];
   report('syntax','the briefing names the shipped version and the README lists the core and the fonts',cv===VER&&/preconnect-core\.js/.test(rd)&&/fonts\//.test(rd)&&fs.existsSync(path.join(ROOT,'CHANGELOG.md'))&&fs.readFileSync(path.join(ROOT,'CHANGELOG.md'),'utf8').includes('## '+VER),`briefing ${cv}, app ${VER}`);
   report('syntax','never a root README.md (README.txt only)',!fs.existsSync(path.join(ROOT,'README.md')));}
  {const css=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');const low=[...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m=>+m[1]).filter(v=>v<13);
   report('syntax','no font size under 13 px in this page\'s CSS',low.length===0,low.join(', '));}
  {const {api}=boot();report('syntax','boots in the harness; settings and core helpers are reachable',typeof api.settings().sound==='string'&&typeof api.pcSpacing==='function'&&api.APP_VERSION===VER);}}

if(want.includes('facts')){const {api}=boot();const F=api.FACTS;const kinds=['common','maker','dept','sop','modeled'];
  const ids=Object.keys(F);
  report('facts','every fact names its kind, its text and its source',ids.length>=10&&ids.every(k=>kinds.includes(F[k].kind)&&F[k].txt&&F[k].src),ids.join(', '));
  const bad=ids.filter(k=>!F[k].checked&&/\d/.test(F[k].txt));
  report('facts','a fact nobody has checked carries no number (department numbers wait for Max)',bad.length===0,bad.join(', ')||'none');
  {// where text renders as HTML (the lesson's points and the pocket reference), every sop fact carries the chip right after it; quiz text is escaped and keeps the words
   const blk=(a,z)=>JS.slice(JS.indexOf(a),JS.indexOf(z,JS.indexOf(a)));const html2=blk('const LESSON=[','const Q=')+blk("$('h-ref')","$('h-about')");const sop=ids.filter(k=>F[k].kind==='sop');const miss=[];
   sop.forEach(k=>{const re=new RegExp('FACTS\\.'+k+'\\.txt','g');let m,seen=0;while((m=re.exec(html2))){seen++;if(!/\{sop\}/.test(html2.slice(m.index,m.index+40)))miss.push(k+'@'+m.index);}if(!seen)miss.push(k+' never shown');});
   report('facts','every sop fact is shown, and wherever it renders as HTML the per-department-SOP chip follows it',miss.length===0,miss.join(', ')||sop.join(', '));}
  // no number with a unit is written anywhere in the script but the facts table
  const fb=JS.slice(JS.indexOf('const FACTS={'),JS.indexOf('};',JS.indexOf('const FACTS={'))+2);const outside=JS.replace(fb,'');
  const hits=(outside.match(/\b\d+(\.\d+)?\s?(inch|inches|in\b|ft|feet|foot|psi|mph|tons?|minutes|gallons|yards|meters)/g)||[]);
  report('facts','no measurement is written outside the facts table (everything else reads from it)',hits.length===0,hits.join(' | ')||'none');
  report('facts','the 5-10-20 rule is presented as a common rule, never a standard',F.airbag.kind==='common'&&F.airbag.side===5&&F.airbag.driver===10&&F.airbag.pass===20&&/common rule/i.test(api.LESSON.find(s=>/peel and peek/i.test(s.t)).pts.join(' '))&&!/5-10-20[^.]{0,40}(standard|requirement)/i.test(html));
  // Max's three safety points, October 12, 2026
  const L=api.LESSON,txt=s=>s.pts.join(' ')+' '+s.q+' '+s.o.map(o=>o[0]).join(' ')+' '+s.why;const bank=k=>{const s=new Set();for(let i=0;i<40;i++)api.DRILLS[k].bank().forEach(q=>s.add(q.q+' '+q.a+' '+q.why));return [...s].join(' ');};
  const reserve=/reserve charge/i,circles=/inner (and an outer )?circle|outer circle/i,fire=/charged (hand)?line or (an )?extinguisher/i;
  report('facts','safety point 1: cutting the 12-volt does not instantly disarm the airbags, taught in the power slide, the Hazard ID drill, the What\'s first drill, the exam and the reference',/does not instantly disarm the airbags/.test(F.reserve.txt)&&/varies by maker/.test(F.reserve.txt)&&/[Pp]eel and peek still applies after power-down/.test(F.reserve.txt)&&reserve.test(txt(L.find(s=>/^Power/.test(s.t))))&&reserve.test(bank('hazard'))&&reserve.test(bank('first'))&&api.EXAM.some(q=>reserve.test(q.a+q.why))&&/FACTS\.reserve\.txt/.test(JS.slice(JS.indexOf("$('h-ref')"),JS.indexOf("$('h-about')"))));
  report('facts','safety point 2: the inner and outer circle in lesson slide 1 and the What\'s first drill (and the exam)',circles.test(txt(L[0]))&&/outer circle/i.test(txt(L[0]))&&/thrown from the car/.test(txt(L[0]))&&circles.test(bank('first'))&&/[Ee]jected patients/.test(bank('first'))&&api.EXAM.some(q=>/outer circle/i.test(q.q)));
  report('facts','safety point 3: fire protection before cutting, a charged line or an extinguisher per department SOP, in the lesson, the What\'s first drill, the exam and the reference',F.fireProt.kind==='sop'&&fire.test(F.fireProt.txt)&&/before the first cut/.test(F.fireProt.txt)&&L.some(s=>/Fire protection/.test(s.t)&&fire.test(txt(s))&&s.pts.some(p=>/\{sop\}/.test(p)))&&/charged line or extinguisher/i.test(bank('first'))&&api.EXAM.some(q=>fire.test(q.a))&&/FACTS\.fireProt\.txt/.test(JS.slice(JS.indexOf("$('h-ref')"),JS.indexOf("$('h-about')"))));
  report('facts','Max\'s tool answers: battery cutter, spreader and ram on Engine 10-2, the hydraulic set on Engine 10, lifting airbags, spares staged; the dead-battery answers are a spare or the hydraulic set; lift an inch, crib an inch in the stabilization slide and the tool drill',/battery-powered cutter, spreader and ram on Engine 10-2/.test(F.tools.txt)&&/hydraulic set on Engine 10/.test(F.tools.txt)&&/lifting airbags/.test(F.tools.txt)&&F.tools.checked&&/spare/.test(F.spares.txt)&&/staged spare/.test(txt(L.find(s=>/tools/i.test(s.t))))&&/hydraulic set/.test(L.find(s=>/tools/i.test(s.t)).o.find(o=>o[1]==='good')[0])&&/lift an inch, crib an inch/i.test(txt(L.find(s=>/Stabilize/.test(s.t))))&&/lift an inch, crib an inch/i.test(bank('tool'))&&/Engine 10's hydraulic set/.test(bank('tool')));}

if(want.includes('content')){
  const about=(()=>{const {els}=boot();els['h-about'].onclick();return els['info-b'].innerHTML;})();const {api}=boot();
  report('content','About lists every department detail still to confirm (struts on Engine 10-2 among them) and says no phone numbers are built in',api.TO_CONFIRM.length>=8&&api.TO_CONFIRM.every(t=>about.includes(t.replace(/&/g,'&amp;').replace(/'/g,'&#39;')))&&/Engine 10-2 carries struts/.test(about)&&/No phone numbers/.test(about));
  report('content','no phone numbers ship',!/\(\d{3}\)\s?\d{3}-\d{4}|\b\d{3}[-.]\d{3}[-.]\d{4}\b/.test(html));
  report('content','NFPA section numbers are not shown in the app; NFPA 2500 is named',!/\b\d{1,2}\.\d+\.\d+\b/.test(html.replace(/\d+\.\d+\.\d+\b(?=')/g,'').replace(/v\d+\.\d+\.\d+/g,'').replace(/APP_VERSION='[^']+'/,''))&&/NFPA 2500/.test(html));
  report('content','no tool or vehicle brand is named',!/Holmatro|Hurst|Genesis|Amkus|Lukas|Weber|Paratech|Res-?Q-?Jack|Milwaukee|DeWalt|Sawzall|Tesla|Ford|Chevrolet|Toyota|Honda|Halligan/i.test(html));
  report('content','practice-not-certification and not-affiliated notices',/does not issue certification/.test(html)&&/practice, not certification/i.test(html)&&/not affiliated with or endorsed by the NFPA, NHTSA, any vehicle maker or any tool maker/i.test(html));
  report('content','every overlay has a way back',/id="set-close"/.test(html)&&/id="info-close"/.test(html)&&/id="dp-close"/.test(html)&&/id="done-menu"/.test(html));
  report('content','wake lock helper present and off at home',/function keepAwake/.test(html)&&/function showHome\(\)\{keepAwake\(false\)/.test(html));
  {const W={s:0,r:0};global.__nav={wakeLock:{request:()=>{W.s++;return {then:f=>{f({release:()=>{W.r++;},addEventListener(){}});return {catch(){}};}};}}};const {api}=boot();api.drillStart('tool');const Z=api.QZ();Z.qs.forEach(q=>{api.quizAct({q:'ans',i:String(q.ord.indexOf(q.a))});api.quizAct({q:'next'});});global.__nav=undefined;
   report('content','the wake lock is taken when a drill starts and released at its result',W.s===1&&W.r===1,`requests ${W.s}, releases ${W.r}`);}}

if(want.includes('home')){const {api,els}=boot();
  {const home=html.slice(html.indexOf('id="home"'),html.indexOf('id="drillpick"'));const at=re=>{const m=re.exec(home);return m?m.index:-1;};
   const order=[/◂ PRECONNECT/,/PURCHASE POINT<\/div><h1/,/id="rdy"/,/What this is/,/id="h-learn"/,/id="h-drills"/,/class="sec">Difficulty</,/class="tiers"/,/id="b-inst"/,/class="sec">Skill stations</,/class="sec">Scenarios</,/class="sec">Test yourself</].map(at);
   report('home','the home opens in the standard order: header links, title with version, readiness, What this is, the lesson, the tool grid, Difficulty, Drill night, then stations, scenarios and the exam',order.every(x=>x>=0)&&order.every((x,i)=>i===0||x>order[i-1]),order.join(' < '));
   const grid=(home.match(/<div class="row"[^>]*>([\s\S]*?)<\/div>/)||[])[1]||'';report('home','the tool grid is four buttons: Quick drills, My progress, Pocket reference, About',(grid.match(/<button/g)||[]).length===4&&/Quick drills/.test(grid)&&/My progress/.test(grid)&&/Pocket reference/.test(grid)&&/About/.test(grid));}
  const R=api.readiness();report('home','readiness counts nineteen activities (the lesson, five drills, five stations, seven scenarios, the exam) and starts at zero',R.total===19&&R.done===0&&els['rdy-t'].textContent==='0 of 19 activities'&&els['rdy-n'].textContent==='0%'&&/Start with the lesson/.test(els['rdy-s'].textContent)&&api.PLAN.drills.length===5&&api.PLAN.stations.length===5&&api.PLAN.scn.length===7);
  const cnt=(h,re)=>(h.match(re)||[]).length;
  report('home','the five stations and seven scenarios are listed, marked Soon and disabled until the car diagram is built; nothing clickable does not exist',cnt(els.stations.innerHTML,/<button/g)===5&&cnt(els.stations.innerHTML,/ disabled>/g)===5&&cnt(els.stations.innerHTML,/>Soon</g)===5&&cnt(els.scenarios.innerHTML,/<button/g)===7&&cnt(els.scenarios.innerHTML,/ disabled>/g)===7&&cnt(els.scenarios.innerHTML,/>Soon</g)===7);
  report('home','the drill picker lists five drills: four live, Where to cut Soon and disabled until the diagram; the exam card is live',cnt(els.drills.innerHTML,/<button/g)===5&&/data-drill="cut" disabled/.test(els.drills.innerHTML)&&['tool','hazard','first','build'].every(k=>new RegExp(`data-drill="${k}">`).test(els.drills.innerHTML))&&/data-exam="exam">/.test(els.tests.innerHTML)&&!/disabled/.test(els.tests.innerHTML));
  report('home','the car-versus-tree scenario says it is Patient Contact\'s driver',/The same driver as Patient Contact/.test(els.scenarios.innerHTML));
  report('home','three tiers, Guided by default, the help line comes from the core with this module\'s clause',api.TIER()===0&&/zone on the car is labeled/.test(els.tierhelp.textContent)&&(api.setTier(2),api.showHome(),/Cold-weather battery drain/.test(els.tierhelp.textContent)));
  {const a=boot();a.els['h-ref'].onclick();const ref=a.els['info-b'].innerHTML;report('home','pocket reference: the order (circles, fire protection, stabilize, power, glass, peel), airbags with the reserve charge and the common rule, lifting, EVs, our tools, the SOP items with chips',/The order/.test(ref)&&/outer circle/.test(ref)&&/charged handline or an extinguisher/.test(ref)&&/reserve charge/.test(ref)&&/A common rule/.test(ref)&&/lift an inch, crib an inch/.test(ref)&&/ready mode/.test(ref)&&/Engine 10-2/.test(ref)&&(ref.match(/class="pc-tag"/g)||[]).length>=5);}
  {const a=boot();a.els['b-inst'].onclick();const on=a.api.INST()&&JSON.parse(a.store['purchase-point']).inst===true&&a.els['b-inst'].textContent==='Instructor mode: on';const b=boot({'purchase-point':JSON.stringify({inst:true,runs:[]})});report('home','instructor switch saves and is remembered at boot',on&&b.api.INST()===true&&b.els['b-inst'].classList.contains('on'));}
  {const c=boot({'preconnect-drill':JSON.stringify({on:true,inst:'Max',roster:['Jo'],who:'Jo',start:new Date().toISOString()})});report('home','drill night: the switch reads on (Drill Night) without being set, and the bar binds',c.api.instOn()===true&&c.els['b-inst'].textContent==='Instructor mode: on (Drill Night)'&&!c.els['pc-drill'].classList.contains('hidden'));}}

if(want.includes('record')){const {api,store}=boot();api.record('drill','hazard',88);api.record('exam','exam',72);api.record('lesson','lesson',100);const R=JSON.parse(store['purchase-point']).runs;
  report('record','runs save under the purchase-point key in the shared shape (kind, id, score, d, tier) with the link to the activity for the hub\'s Continue',R.length===3&&R[0].kind==='drill'&&R[0].id==='hazard'&&R[0].score===88&&R[0].tier===0&&/^\d{4}-\d\d-\d\dT/.test(R[1].d)&&R[0].href==='purchase-point/?drill=hazard'&&R[1].href==='purchase-point/?exam=1'&&R[2].href==='purchase-point/?lesson=1');
  const b=boot({'preconnect-drill':JSON.stringify({on:true,inst:'Max',roster:['Jo'],who:'Jo',start:'2026-10-12T18:00:00.000Z'})});b.api.record('drill','first',90);const r=JSON.parse(b.store['purchase-point']).runs[0];
  report('record','on a drill night every run is stamped with who, the instructor and the night',r.who[0]==='Jo'&&r.inst==='Max'&&r.night==='2026-10-12T18:00:00.000Z');
  const c=boot({'purchase-point':JSON.stringify({runs:[{kind:'drill',id:'tool',score:88,d:new Date().toISOString(),tier:0},{kind:'exam',id:'exam',score:93,d:new Date().toISOString(),tier:0}]})});report('record','readiness and the chips read saved best scores',c.api.readiness().done===2&&/id="chip-tool">88</.test(c.els.drills.innerHTML)&&/id="chip-exam">93</.test(c.els.tests.innerHTML));
  const d=boot({'purchase-point':JSON.stringify({runs:[{kind:'drill',id:'tool',score:88,d:'2026-10-12T10:00:00.000Z',tier:0},{kind:'exam',id:'exam',score:80,d:'2026-10-12T11:00:00.000Z',tier:0}],name:'Jo',dept:'MTFD'})});d.els['h-prog'].onclick();d.els['p-name'].value='Jo';d.els['p-dept'].value='MTFD';d.els['p-csv'].onclick();
  report('record','progress screen lists every activity (soon for the unbuilt ones) and the CSV names each run',/Tool for the job/.test(d.els['info-b'].innerHTML)&&/>soon</.test(d.els['info-b'].innerHTML)&&/SKILL STATIONS/.test(d.els['info-b'].innerHTML)&&/"Jo","MTFD","Drill","Tool for the job"/.test(global.__csv)&&/"Exam","Exam practice"/.test(global.__csv)&&/purchase-point-practice-record\.csv/.test(html));
  {const fx=path.join(__dirname,'fixtures');const files=fs.readdirSync(fx).filter(f=>f.endsWith('.json'));let ok=true;const notes=[];
   for(const f of files){try{const e=boot({'purchase-point':fs.readFileSync(path.join(fx,f),'utf8')});e.api.homeRender();e.els['h-prog'].onclick();e.els['p-csv'].onclick();e.api.record('drill','tool',70);const runs=e.api.load().runs;if(!runs.some(r=>r.id==='tool'&&r.score===70))throw new Error('new run lost');notes.push(f+': '+runs.length);}catch(err){ok=false;notes.push(f+': '+err.message);}}
   report('record','saved-data fixtures (a newer file with unknown ids and a null run, and a wrong-shape file) load, render, export and keep new runs',ok&&files.length>=2,notes.join('; '));}}

if(want.includes('privacy')){const snip=html.split('<script data-pca>')[1].split('</script>')[0];const W={addEventListener(){}},sent=[];global.window=W;global.localStorage={getItem:()=>null};global.document={createElement:()=>({setAttribute(){}}),head:{appendChild(){}}};
  new Function(snip)();W.goatcounter={count:o=>sent.push(o.path)};W.PCA.ev('pp/finish/drill-tool/Max Tester said "hi" <b>');W.PCA.flush();
  report('privacy','event paths are cleaned to safe characters and carry the pp module code',/^[a-z0-9\/\-]+$/.test(sent[0]||'x ')&&W.PCA.mod==='pp',sent[0]);
  report('privacy','scores are reported only as coarse bands',W.PCA.bkt(97)==='score-90-100'&&W.PCA.bkt(83)==='score-80s'&&W.PCA.bkt(12)==='score-under-60');
  const W2={addEventListener(){}},sent2=[];global.window=W2;global.localStorage={getItem:k=>k==='preconnect-stats'?'off':null};new Function(snip)();W2.goatcounter={count:o=>sent2.push(o.path)};W2.PCA.ev('pp/start/lesson');W2.PCA.flush();
  report('privacy','the Privacy page opt-out stops every event',W2.PCA.off===true&&sent2.length===0);
  report('privacy','no name, organization or typed text is ever put into an event by the app',![...JS.matchAll(/pca\(([^;]*)/g)].some(m=>/\b(name|dept|org|who|inst|value)\b/.test(m[1].replace(/D\.name/g,''))));global.window={};}

if(want.includes('balance')){const {api}=boot();let lo=0,sh=0,tot=0;const chk=(arr,gi)=>{const L=arr.map(x=>x.length);tot++;if(L[gi]===Math.max(...L))lo++;else if(L[gi]===Math.min(...L))sh++;};
  api.LESSON.forEach(s=>chk(s.o.map(x=>x[0]),s.o.findIndex(x=>x[1]==='good')));const seen=new Set();for(let i=0;i<40;i++)for(const k in api.DRILLS)api.DRILLS[k].bank().forEach(q=>{if(!seen.has(q.q)){seen.add(q.q);chk([q.a,...q.d],0);}});api.EXAM.forEach(q=>chk([q.a,...q.d],0));
  report('balance','the right answer is not usually the longest (every lesson check, drill question and exam question)',lo/tot<=.45,`${lo} of ${tot}`);report('balance','the right answer is not usually the shortest',sh/tot<=.45,`${sh} of ${tot}`);}

if(want.includes('lesson')){for(const mode of ['right','wrong']){const {api,els,store}=boot();api.lessonStart();let g=0;while(api.LS()&&g++<80){const L=api.LS(),s=api.LESSON[L.i];if(mode==='wrong'&&L.first[L.i]===undefined)api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]!=='good'))});api.lessonAct({l:'ans',k:String(s.o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});}
   const r=JSON.parse(store['purchase-point']).runs[0];report('lesson',`all ${api.LESSON.length} slides; first-try ${mode} scores ${mode==='right'?100:0}, is recorded and Next opens the first live drill`,String(els['done-s'].textContent)===(mode==='right'?'100':'0')&&r&&r.kind==='lesson'&&r.score===(mode==='right'?100:0)&&!els.doneov.classList.contains('hidden')&&!els['done-next'].classList.contains('hidden'),'score '+els['done-s'].textContent);}
  {const {api,els}=boot();api.lessonStart();api.lessonAct({l:'next'});const stuck=api.LS().i===0;api.lessonAct({l:'ans',k:String(api.LESSON[0].o.findIndex(x=>x[1]==='good'))});api.lessonAct({l:'next'});report('lesson','the check must be answered before Next works',stuck&&api.LS().i===1);
   api.lessonAct({l:'quit'});report('lesson','Stop and go back closes the lesson and returns home',api.LS()===null&&els.lessonov.classList.contains('hidden'));}
  {const {api,els}=boot();api.lessonStart();const h=els['lesson-box'].innerHTML;let chips=0;for(let i=0;i<14;i++){api.LS().i=i;api.pcLessonAct(api.LS(),{l:'prev'});}
   report('lesson','fourteen slides, each with at least three points, a question, three options with exactly one good, and a why; {sop} points render the shared chip, never the raw token',api.LESSON.length===14&&api.LESSON.every(s=>s.pts.length>=3&&s.q&&s.o.length===3&&s.o.filter(x=>x[1]==='good').length===1&&s.why)&&/class="pc-tag"/.test(api.pt('x {sop}'))&&!/\{sop\}/.test(api.pt('a {sop} b'))&&!/\{sop\}/.test(h));}}

if(want.includes('drills')){const {api}=boot();const ids=['tool','hazard','first','build'];
  report('drills','four drills on the quiz engine; each run gives eight distinct questions with three distinct options, the answer among them, and a why',ids.every(k=>api.DRILLS[k])&&ids.every(k=>{for(let i=0;i<10;i++){const b=api.DRILLS[k].bank();if(b.length!==8||new Set(b.map(q=>q.q)).size!==8||!b.every(q=>q.d.length===2&&new Set([q.a,...q.d]).size===3&&q.why&&q.q))return false;}return true;}));
  report('drills','each bank holds at least twelve questions, so a run is a draw, not the whole bank',ids.every(k=>{const s=new Set();for(let i=0;i<60;i++)api.DRILLS[k].bank().forEach(q=>s.add(q.q));return s.size>=12;}));
  report('drills','Where to cut is planned on the car diagram, not the quiz engine (no core change)',!api.DRILLS.cut&&api.PLAN.drills[0][0]==='cut');
  report('drills','exam bank: 36 questions, distinct, three distinct options each, a why each; a run asks 15',api.EXAM.length===36&&new Set(api.EXAM.map(q=>q.q)).size===36&&api.EXAM.every(q=>q.d.length===2&&new Set([q.a,...q.d]).size===3&&q.why));
  // independent check of the construction keys: the test's own table, never the app's
  const POST={'The A-post is…':'At the edge of the windshield','The B-post is…':'Between the front and rear doors','The D-post is…':'The rearmost post of a wagon or SUV','Which post sits between the front and rear doors?':'The B-post'};
  const all=[];for(let i=0;i<40;i++)api.DRILLS.build.bank().forEach(q=>all.push(q));api.EXAM.forEach(q=>all.push(q));let nk=0,okk=true;all.forEach(q=>{if(POST[q.q]){nk++;if(POST[q.q]!==q.a)okk=false;}});
  report('drills','post names checked against the test\'s own table (A at the windshield, B between the doors, D at the back of a wagon)',okk&&nk>=4,`${nk} checked`);
  const air=api.EXAM.find(q=>/passenger frontal bag/.test(q.q));report('drills','the airbag-distance question reads from the facts table and its key is the passenger value',!!air&&air.a==='About '+api.FACTS.airbag.pass+' inches'&&api.FACTS.airbag.pass>api.FACTS.airbag.driver&&api.FACTS.airbag.driver>api.FACTS.airbag.side);}

if(want.includes('quiz')){{const {api,els,store}=boot();api.drillStart('hazard');const Z=api.QZ();const n=Z.qs.length;for(let i=0;i<n;i++){const q=Z.qs[i];api.quizAct({q:'ans',i:String(q.ord.indexOf(q.a))});api.quizAct({q:'next'});}
   const r=JSON.parse(store['purchase-point']).runs[0];report('quiz','a drill played right scores 100, shows the result and is recorded',Z.score===100&&r.kind==='drill'&&r.id==='hazard'&&r.score===100&&/100/.test(els['qz-body'].innerHTML));}
  {const {api,store}=boot();api.drillStart('first');const Z=api.QZ();Z.qs.forEach(q=>{api.quizAct({q:'ans',i:String((q.ord.indexOf(q.a)+1)%3)});api.quizAct({q:'next'});});report('quiz','a drill played wrong scores 0',Z.score===0&&JSON.parse(store['purchase-point']).runs[0].score===0);}
  {const {api,store}=boot();api.examStart();const Z=api.QZ();const n=Z.qs.length;Z.qs.forEach(q=>{api.quizAct({q:'ans',i:String(q.ord.indexOf(q.a))});api.quizAct({q:'next'});});const r=JSON.parse(store['purchase-point']).runs[0];
   report('quiz','exam practice asks 15 distinct questions from the bank, scores 100 played right, and records kind exam',n===15&&new Set(Z.qs.map(q=>q.q)).size===15&&Z.score===100&&r.kind==='exam'&&r.id==='exam');
   api.quizAct({q:'again'});report('quiz','Again on the exam result starts a fresh exam',api.QZ()!==Z&&api.QZ().kind==='exam'&&api.QZ().i===0);}
  {const {api,els}=boot();api.drillStart('tool');const Z=api.QZ();const first=Z.qs[0].ord.slice();api.quizAct({q:'ans',i:'0'});api.quizAct({q:'ans',i:'1'});report('quiz','options are shuffled once and a second tap on the same question is ignored',Z.qs[0].ord.join()===first.join()&&Z.right<=1&&Z.i===0);
   api.quizAct({q:'quit'});report('quiz','Stop and go back closes the drill and goes home',api.QZ()===null&&els.quizov.classList.contains('hidden'));}
  {global.__loc={search:'?drill=hazard'};const a=boot();global.__loc={search:'?drill=cut'};const b=boot();global.__loc={search:'?exam=1'};const c=boot();global.__loc={search:'?lesson=1'};const d=boot();global.__loc={search:'?drill=nope'};const e=boot();global.__loc=undefined;
   report('quiz','deep links: ?drill=hazard opens the drill, ?exam=1 the exam, ?lesson=1 the lesson; an unknown or unbuilt id (?drill=cut) is ignored',a.api.QZ()&&a.api.QZ().id==='hazard'&&!a.els.quizov.classList.contains('hidden')&&!b.api.QZ()&&c.api.QZ()&&c.api.QZ().kind==='exam'&&!!d.api.LS()&&!e.api.QZ()&&!e.api.LS());}
  {const c=boot({'purchase-point':JSON.stringify({runs:[{kind:'drill',id:'tool',score:90,d:new Date(Date.now()-10*864e5).toISOString(),tier:0},{kind:'lesson',id:'lesson',score:40,d:new Date(Date.now()-2*864e5).toISOString(),tier:0}]})});report('quiz','chips turn to Due and Again from the spacing rule, and the readiness line counts them',/id="chip-tool">Due</.test(c.els.drills.innerHTML)&&c.els['chip-lesson'].textContent==='Again'&&/2 due for review/.test(c.els['rdy-s'].textContent));}
  {const snip=[];const {api}=boot();const W=global.window;W.PCA={begin:(m,a)=>snip.push('begin:'+m+'/'+a),end:d=>snip.push('end:'+d),abandon:()=>snip.push('abandon'),bkt:n=>'score-'+n,err(){}};api.drillStart('build');api.quizAct({q:'quit'});api.lessonStart();api.lessonAct({l:'quit'});api.examStart();api.quizAct({q:'quit'});delete W.PCA;
   report('quiz','statistics: a drill, the lesson and the exam send begin and abandon with the pp code and never a name',snip.join()==='begin:pp/drill-build,abandon,begin:pp/lesson,abandon,begin:pp/exam,abandon',snip.join());}}

if(want.includes('voice')){
  const lab=id=>((html.match(new RegExp('<button[^>]*id="'+id+'"[^>]*>([^<]*)</button>'))||[])[1]||'').trim();
  report('voice','Again · Home · Next on every result, and the result row links back to Preconnect and to Feedback for this module',lab('done-again')==='Again'&&lab('done-menu')==='Home'&&lab('done-next')==='Next'&&/id="done-row">[\s\S]*?<p class="pc-links"><a href="\.\.\/">◂ Preconnect<\/a><a href="\.\.\/feedback\.html\?from=pp">Feedback<\/a><\/p>/.test(html));
  {const {api,els}=boot();const live=api.ACTS.filter(([k,x])=>api.built(k,x));const chain=live.map(([k,x])=>api.nextOf(k,x)?1:0).join('');
   api.showDone('x',90,'',null,api.nextOf('lesson','lesson'));global.__T=(global.__T||0)+5000;els['done-next'].onclick();const opened=api.QZ()&&api.QZ().id;
   api.showDone('x',90,'',null,api.nextOf('exam','exam'));const last=[els['done-next'].classList.contains('hidden'),els['done-row'].classList.contains('two'),els['done-menu'].classList.contains('go')];
   report('voice','Next opens the next built activity in the home list\'s order (the lesson leads to Tool for the job, past the unbuilt Where to cut); the exam, last, has no Next and Home becomes primary',/^1+0$/.test(chain)&&opened==='tool'&&last.every(Boolean),`${chain} opened ${opened}`);}
  {const {api,els}=boot();api.drillStart('build');let g=0;while(api.QZ()&&api.QZ().i<api.QZ().qs.length&&g++<20){const q=api.QZ().qs[api.QZ().i];api.quizAct({q:'ans',i:String(q.ord.indexOf(q.a))});api.quizAct({q:'next'});}const f=els['qz-foot'].innerHTML;api.quizAct({q:'nextact'});const nx=api.QZ()&&api.QZ().kind;
   report('voice','the last drill\'s result offers Again · Home · Next with the links, and Next opens the exam',/>Again</.test(f)&&/>Home</.test(f)&&/data-q="nextact" class="go">Next</.test(f)&&/feedback\.html\?from=pp/.test(f)&&nx==='exam',`next→${nx}`);}
  {const {api,els}=boot();els['h-about'].onclick();const h=els['info-b'].innerHTML;report('voice','About ends with the shared version line and the links, and names the five sibling modules',new RegExp('Version '+VER.replace(/\./g,'\\.')+' · Practice, not certification').test(h)&&/feedback\.html\?from=pp/.test(h)&&/◂ Preconnect/.test(h)&&['Charge the Line','Patient Contact','Bleed Control','BLS Ready','Upwind'].every(m=>h.includes(m)));}
  {const {api,els,store}=boot({preconnect:JSON.stringify({name:'Jo Lee',org:'Station 4'})});els['h-prog'].onclick();const pre=(els['info-b'].innerHTML.match(/id="p-name"[^>]*value="([^"]*)"/)||[])[1];els['p-name'].value='Pat Q';els['p-dept'].value='Station 9';els['p-name'].onchange();const hub=JSON.parse(store.preconnect);const own=api.load();
   report('voice','one name store: My progress reads the hub profile and writes it back',pre==='Jo Lee'&&hub.name==='Pat Q'&&hub.org==='Station 9'&&own.name==='Pat Q');}
  report('voice','tier help comes from the core; the result row cools for a moment (rule 4)',/pcTierHelp\(TIER,\[/.test(JS)&&/pcCool\('#done-row button',700\)/.test(JS)&&/DONEGUARD/.test(JS));}

if(want.includes('teach')){// rule 14: no button refuses a wrong action. There are no scenario buttons yet; the scan keeps it that way from E2 on.
  const left=[...JS.matchAll(/(?:now|radio|say)\(([^;]{0,160}?)\);return;/g)].map(m=>m[1]);
  report('teach','no button refuses a wrong action (rule 14 scan)',left.length===0,left.slice(0,3).join(' | ')||'none');}

console.log(`\n${n-failed}/${n} checks passed · ${Math.round((Date.now()-T0)/1000)} s`);process.exit(failed?1:0);
