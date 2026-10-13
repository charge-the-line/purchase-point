/* A bot that plays a station or a scenario the way a person does on the call sheet: one command at a time, about 1.2 seconds a tap (global.__T is the clock).
   It follows the step list in order through cmdTap (the control a person uses), taps Got it on a Guided teaching card, answers a tool question with
   the right tool, answers a decision card with the good option unless the test picks another, swaps a spare or calls for Engine 10's set when the
   battery dies, re-cribs after a shift, and taps Fast-forward only when the page offers it. */
function tick(api,dt){global.__T+=dt;api.runTick();}
/* a teaching card (Guided, first use of a command) or a tool question opened by the last tap */
function settle(api,acts,o){let g=0;while(api.S()&&g++<6){const s=api.S();
  if(api.TEACHGO()){api.teachClose();acts.push('gotit');continue;}
  if(s.ask){const q=s.ask;let i=q.o.findIndex(x=>x.k==='good');if(o&&o.tool){const j=o.tool(q);if(j!==undefined&&j!==null)i=j;}api.askPick(i);acts.push('ask:'+q.t+':'+q.o[i].k);tick(api,1);api.askClose();continue;}
  break;}}
function play(api,id,v,o){o=o||{};global.window.FORCE_V=v?{[id]:v}:{};if(api.SCN&&api.SCN[id])api.scnStart(id,v);else api.stationStart(id,v);const S=api.S();if(!S)throw new Error('no run');
  let guard=0;const acts=[];
  while(api.S()&&guard++<300){tick(api,o.dt||1.2);const s=api.S();
    if(s.dec){/* a decision card: the good option unless the test picks another, then Next */const c=s.dec.c;let i=c.o.findIndex(x=>x[1]==='good');if(o.pick){const j=o.pick(s.dec.k,c);if(j!==undefined&&j!==null)i=j;}api.decAct({o:String(i)});acts.push('dec:'+s.dec.k+':'+c.o[i][1]);tick(api,1);api.decAct({dec:'next'});continue;}
    if(o.inject){const w=o.inject(s);if(w){api.instOpen();tick(api,2);const ok=api.inject(w);api.instClose();acts.push((ok?'inject:':'inject-refused:')+w);if(ok)continue;}}
    if(s.stab==='shifted'&&s.mode==='scenario'){api.cmdTap('t:recrib');settle(api,acts,o);acts.push('recrib');continue;}
    if(s.hydAt!==null&&s.hydAt!==undefined&&!s.hyd){if(api.ffWhy()===''){api.ffTap();acts.push('ff:hyd');}continue;}
    if(s.dead&&!s.hyd){api.cmdTap(s.spares>0?'t:spare':'t:hyd');settle(api,acts,o);acts.push('swap');continue;}
    const st=s.steps.find(x=>!s.done[x.id]&&(x.ph===undefined||x.ph===s.phN)&&(!x.after||x.after.every(i=>s.done[i])));if(!st)throw new Error('stuck: '+JSON.stringify(s.steps.filter(x=>!s.done[x.id]).map(x=>x.id)));
    if(st.kind==='wait'){if(api.ffWhy()===''&&!o.noFF){api.ffTap();acts.push('ff:'+st.id);}continue;}
    if(o.before)o.before(s,st);
    if(!api.cmdById(st.id))throw new Error('no command for '+st.id);
    api.cmdTap(st.id);settle(api,acts,o);acts.push(st.id);}
  const runs=api.load().runs||[];return {run:runs[runs.length-1],acts,done:!api.S()};}
module.exports={play,tick,settle};
