/* A bot that plays a skill station the way a person does: tool first, then the zone, about 1.2 seconds a tap (global.__T is the clock).
   It follows the station's own step list in order, swaps a spare or calls for Engine 10's set when the battery dies, and uses only carPick/carTap. */
function tick(api,dt){global.__T+=dt;api.runTick();}
function play(api,id,v,o){o=o||{};global.window.FORCE_V=v?{[id]:v}:{};api.stationStart(id,v);const S=api.S();if(!S)throw new Error('no run');
  let guard=0;const acts=[];
  while(api.S()&&guard++<300){tick(api,o.dt||1.2);const s=api.S();
    if(s.dead&&!s.hyd){api.carPick(s.spares>0?'spare':'hyd');acts.push('swap');continue;}
    const st=s.steps.find(x=>!s.done[x.id]&&(!x.after||x.after.every(i=>s.done[i])));if(!st)throw new Error('stuck: '+JSON.stringify(s.steps.filter(x=>!s.done[x.id]).map(x=>x.id)));
    const tool=Array.isArray(st.tool)?st.tool[0]:st.tool;if(o.before)o.before(s,st);
    if(api.TOOLS[tool].solo){api.carPick(tool);acts.push(tool);continue;}
    api.carPick(tool);tick(api,.6);api.carTap(st.zone);acts.push(tool+':'+st.zone);}
  const runs=api.load().runs||[];return {run:runs[runs.length-1],acts,done:!api.S()};}
module.exports={play,tick};
