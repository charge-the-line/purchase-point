#!/usr/bin/env python3
"""Real-browser check. Needs: pip install playwright (Chromium is pre-installed in the cloud container).
Opens the home screen, the lesson, every drill, exam practice, the five skill stations, the Where to cut drill and the three scenarios on the car
diagram (played to the end with real taps: the tool by its visible name, the zone by its hit rect, a spare battery when the tool
dies, a decision card by its visible text, Fast-forward only when it shows, the instructor sheet with a frozen clock and an inject), Settings, the pocket reference, About, My progress, the tiers, the instructor switch, the Drill Night picker, large text,
Daylight, the deep links and landscape at phone sizes, with slow real taps on buttons found by their visible text. Fails on any JavaScript error, anything off the right edge, a button under
44 px tall or wide, or text under the floor (15 px for a sentence, 13 px for a caption).
With PC_ALL=1 every built activity is also played to the end with real taps at 390 px, proved by the saved record.
Usage: python3 tests/browser_check.py      PC_ALL=1 python3 tests/browser_check.py"""
import os, pathlib, re, sys
from playwright.sync_api import sync_playwright
URL = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
EXE = '/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None
VIS = "const vis=e=>e.checkVisibility?e.checkVisibility({visibilityProperty:true}):e.offsetParent!==null;"
OVER = "(()=>{let m=0;" + VIS + "document.querySelectorAll('body *').forEach(e=>{if(!vis(e))return;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return;m=Math.max(m,r.right-window.innerWidth);});return Math.round(m);})()"
TEXTN = "(()=>{let n=0;" + VIS + "document.querySelectorAll('body *').forEach(e=>{if(e.closest('svg')||!vis(e))return;const t=[...e.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent).join(' ').replace(/\\s+/g,' ').trim();if(t.length<2)return;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return;const fs=parseFloat(getComputedStyle(e).fontSize),w=t.split(' ').filter(x=>/[A-Za-z0-9]/.test(x)).length;if(fs<(w>=6?15:13)-.01)n++;});return n;})()"
SMALL = "(()=>{let n=0;" + VIS + "document.querySelectorAll('button').forEach(e=>{if(!vis(e))return;const r=e.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.top>innerHeight)return;if(r.height<44||r.width<44)n++;});return n+100*" + TEXTN + ";})()"
errs, rows = [], []
def measure(pg): return pg.evaluate(OVER) + 1000 * pg.evaluate(SMALL)
def tap(pg, sel):   # a slow tap, the way a finger does it: press, pause, release
    el = pg.locator(sel).first; el.scroll_into_view_if_needed(); pg.wait_for_timeout(80)
    b = el.bounding_box(); x, y = b['x'] + b['width'] / 2, b['y'] + b['height'] / 2
    pg.mouse.move(x, y); pg.mouse.down(); pg.wait_for_timeout(260); pg.mouse.up()
def tap_text(pg, sel, text):   # a slow tap on the button whose visible text is exactly this
    loc = pg.locator(sel, has_text=re.compile('^' + re.escape(text) + '$')).first; loc.scroll_into_view_if_needed(); pg.wait_for_timeout(60)
    b = loc.bounding_box(); pg.mouse.move(b['x'] + b['width'] / 2, b['y'] + b['height'] / 2); pg.mouse.down(); pg.wait_for_timeout(260); pg.mouse.up()
def lesson_full(pg):   # the lesson to the end: the right answer tapped by its visible text, then Next / Finish
    tap(pg, '#h-learn'); pg.wait_for_timeout(300)
    for _ in range(40):
        if not pg.evaluate("(typeof LS!=='undefined'&&!!(LS&&LS.cfg))"): break
        tap_text(pg, '[data-l="ans"]', pg.evaluate("LS.cfg.slides[LS.i].o.find(o=>o[1]==='good')[0]")); pg.wait_for_timeout(120)
        tap(pg, '#l-next'); pg.wait_for_timeout(200)
    pg.wait_for_timeout(300)
def quiz_full(pg):   # a quiz to the end: the right answer by its visible text, then Next / Results
    for _ in range(40):
        if not pg.evaluate("(typeof QZ!=='undefined'&&!!(QZ&&QZ.qs&&QZ.i<QZ.qs.length))"): break
        tap_text(pg, '[data-q="ans"]', pg.evaluate("QZ.qs[QZ.i].a")); pg.wait_for_timeout(100)
        tap(pg, '[data-q="next"]'); pg.wait_for_timeout(120)
    pg.wait_for_timeout(300)
def saved(pg, test): return pg.evaluate("(()=>{const p=JSON.parse(localStorage.getItem('purchase-point')||'{}');return %s;})()" % test)
DRILLS = ('tool', 'hazard', 'first', 'build')
STATIONS = ('stab', 'glass', 'door', 'roof', 'dash')
SCENARIOS = ('tree', 'ditch', 'field')
HITMIN = "(()=>{let m=1e9;document.querySelectorAll('#pp-svg g.zone').forEach(g=>{if(g.getAttribute('display')==='none')return;const r=g.querySelector('.hit').getBoundingClientRect();m=Math.min(m,r.width,r.height);});return Math.floor(m);})()"
NEXTSTEP = "(()=>{if(typeof S==='undefined'||!S||S.mode==='cut')return null;if(S.dec)return {card:S.dec.c.o.find(o=>o[1]==='good')[0]};if(S.hydAt!==null&&S.hydAt!==undefined&&!S.hyd)return ffWhy()===''?{ff:1}:{wait:1};if(S.dead&&!S.hyd)return {tool:S.spares>0?'spare':'hyd',zone:null};if(S.stab==='shifted'&&S.mode==='scenario')return {tool:'crib',zone:recribZone()};const s=S.steps.find(x=>!S.done[x.id]&&(x.ph===undefined||x.ph===S.phN)&&(!x.after||x.after.every(i=>S.done[i])));if(s&&s.kind==='wait')return ffWhy()===''?{ff:1}:{wait:1};return s?{tool:Array.isArray(s.tool)?s.tool[0]:s.tool,zone:s.zone||null}:null;})()"
def tool_tap(pg, tool):   # the tray button, found by the tool's visible name
    name = pg.evaluate(f"TOOLS['{tool}'].n")
    tap(pg, f'#pp-tray button:has(span:text-is("{name}"))')
def station_full(pg, sid, v, w):   # a station to the end with real taps; returns the rows it measured
    out = []
    pg.goto(URL); pg.wait_for_timeout(200); pg.evaluate("window.FORCE_V={%s:'%s'}" % (sid, v)); tap(pg, f'[data-station="{sid}"]'); pg.wait_for_timeout(650)
    out.append((w, f'station {sid} {v}', measure(pg) + (0 if pg.evaluate(HITMIN) >= 44 and pg.evaluate("S&&S.v") == v else 99)))
    for _ in range(40):
        st = pg.evaluate(NEXTSTEP)
        if not st: break
        tool_tap(pg, st['tool']); pg.wait_for_timeout(120)
        if st['zone']: tap(pg, f'#pp-svg g.zone[data-z="{st["zone"]}"]')
        pg.wait_for_timeout(520)
    pg.wait_for_timeout(400)
    out.append((w, f'station {sid} {v} result', measure(pg) + (0 if pg.evaluate("S===null") and saved(pg, f"(p.runs||[]).some(r=>r.kind==='station'&&r.id==='{sid}'&&r.variant==='{v}'&&r.score===100)") else 99)))
    return out
def scenario_full(pg, sid, v, w, tier=0):   # a scenario to the end with real taps: the cards answered by their visible text, Fast-forward tapped only when it shows
    out = []
    pg.goto(URL); pg.wait_for_timeout(200); tap(pg, f'[data-tier="{tier}"]'); pg.evaluate("window.FORCE_V={%s:'%s'}" % (sid, v)); tap(pg, f'[data-scenario="{sid}"]'); pg.wait_for_timeout(650)
    out.append((w, f'scenario {sid} {v}{" chaos" if tier == 2 else ""} (first card)', measure(pg) + (0 if pg.is_visible('#decov') and pg.evaluate("S&&S.v") == v else 99)))
    first = True
    for _ in range(70):
        st = pg.evaluate(NEXTSTEP)
        if not st: break
        if 'card' in st:
            tap_text(pg, '#dec-box button', st['card']); pg.wait_for_timeout(500); tap_text(pg, '#dec-box button', 'Next'); pg.wait_for_timeout(520)
            if first: out.append((w, f'scenario {sid} {v} (run screen)', measure(pg) + (0 if pg.evaluate(HITMIN) >= 44 and pg.is_visible('#pp-pt') else 99))); first = False
            continue
        if 'ff' in st: tap_text(pg, '#pp-ff', 'Fast-forward ▸▸'); pg.wait_for_timeout(520); continue
        if 'wait' in st: pg.wait_for_timeout(500); continue
        tool_tap(pg, st['tool']); pg.wait_for_timeout(120)
        if st['zone']: tap(pg, f'#pp-svg g.zone[data-z="{st["zone"]}"]')
        pg.wait_for_timeout(520)
    pg.wait_for_timeout(400)
    out.append((w, f'scenario {sid} {v} result', measure(pg) + (0 if pg.evaluate("S===null") and saved(pg, f"(p.runs||[]).some(r=>r.kind==='scenario'&&r.id==='{sid}'&&r.variant==='{v}'&&r.score===100)") else 99)))
    return out
def cut_full(pg, w):   # the Where to cut drill: the right zone tapped each time, then Next / Results
    pg.goto(URL); pg.wait_for_timeout(200); tap(pg, '#h-drills'); pg.wait_for_timeout(150); tap(pg, '[data-drill="cut"]'); pg.wait_for_timeout(650)
    first = measure(pg) + (0 if pg.evaluate(HITMIN) >= 44 and pg.evaluate("S&&S.mode==='cut'") else 99)
    for _ in range(10):
        if not pg.evaluate("!!(S&&S.mode==='cut')"): break
        tap(pg, '#pp-svg g.zone[data-z="%s"]' % pg.evaluate("CUTQ[S.qs[S.i]][1]")); pg.wait_for_timeout(520)
        tap_text(pg, '#pp-next', 'Next' if pg.evaluate("S.i+1<S.qs.length") else 'Results'); pg.wait_for_timeout(520)
    pg.wait_for_timeout(300)
    return [(w, 'drill cut', first), (w, 'drill cut (full)', measure(pg) + (0 if saved(pg, "(p.runs||[]).some(r=>r.kind==='drill'&&r.id==='cut'&&r.score===100)") else 99))]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE) if EXE else p.chromium.launch()
    for w in (320, 390):
        pg = b.new_page(viewport={'width': w, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'home', measure(pg)))
        tap(pg, '#h-learn'); pg.wait_for_timeout(200); rows.append((w, 'lesson', measure(pg)))
        tap_text(pg, '[data-l="ans"]', pg.evaluate("LESSON[LS.i].o.find(o=>o[1]==='good')[0]")); pg.wait_for_timeout(120)
        tap(pg, '#l-next'); pg.wait_for_timeout(150); rows.append((w, 'lesson slide 2', measure(pg) + (0 if pg.evaluate('LS.i') == 1 else 99)))
        pg.evaluate("LS.i=2;pcLessonRender(LS)"); pg.wait_for_timeout(100); rows.append((w, 'lesson slide 3 (SOP chip)', measure(pg) + (0 if pg.locator('#lesson-box .pc-tag').count() >= 1 else 99))); tap(pg, '[data-l="quit"]')
        tap(pg, '#h-drills'); pg.wait_for_timeout(150); rows.append((w, 'drill picker', measure(pg) + (0 if pg.is_enabled('[data-drill="cut"]') else 99))); tap(pg, '#dp-close')
        for did in DRILLS:
            pg.goto(URL); pg.wait_for_timeout(150); tap(pg, '#h-drills'); pg.wait_for_timeout(150); tap(pg, f'[data-drill="{did}"]'); pg.wait_for_timeout(150)
            tap_text(pg, '[data-q="ans"]', pg.evaluate("QZ.qs[QZ.i].a")); pg.wait_for_timeout(120)
            rows.append((w, 'drill ' + did, measure(pg) + (0 if pg.evaluate('QZ.right') == 1 else 99)))
        pg.evaluate("localStorage.removeItem('purchase-point')")
        pg.goto(URL); pg.wait_for_timeout(150); tap(pg, '[data-exam="exam"]'); pg.wait_for_timeout(150); rows.append((w, 'exam', measure(pg) + (0 if pg.evaluate("QZ.kind==='exam'&&QZ.qs.length===15") else 99)))
        for sid, v in ((('stab', 'B'), ('glass', 'B'), ('door', 'C')) if w == 320 else (('stab', 'A'), ('stab', 'C'), ('glass', 'A'), ('door', 'A'), ('roof', 'C'), ('dash', 'A'))):   # every station, both views, the dead battery, boron steel
            rows.extend(station_full(pg, sid, v, w))
        if w == 390: rows.extend(cut_full(pg, w))
        for sid, v in ((('tree', 'C'), ('field', 'B')) if w == 320 else (('tree', 'A'), ('ditch', 'A'), ('field', 'C'))):   # the crash and the rapid roof flap, soft ground, the shared patient, the ditch's wait and Fast-forward, the pickup's dash lift
            rows.extend(scenario_full(pg, sid, v, w))
        pg.evaluate("localStorage.removeItem('purchase-point')")
        if w == 390:   # the instructor's sheet on a scenario: the floating button, the frozen clock, a crash inject answered on the card, Freeze and discuss
            pg.goto(URL); pg.wait_for_timeout(200); tap(pg, '#b-inst'); pg.evaluate("window.FORCE_V={tree:'A'}"); tap(pg, '[data-scenario="tree"]'); pg.wait_for_timeout(650)
            tap_text(pg, '#dec-box button', pg.evaluate("S.dec.c.o.find(o=>o[1]==='good')[0]")); pg.wait_for_timeout(500); tap_text(pg, '#dec-box button', 'Next'); pg.wait_for_timeout(520)
            rows.append((w, 'instructor button on a scenario', measure(pg) + (0 if pg.is_visible('#inst-fab') else 99)))
            tap_text(pg, '#inst-fab', 'Instructor'); pg.wait_for_timeout(300); c0 = pg.text_content('#pp-clock'); pg.wait_for_timeout(1500)
            rows.append((w, 'instructor sheet (clock frozen)', measure(pg) + (0 if pg.is_visible('#instov') and pg.text_content('#pp-clock') == c0 and pg.evaluate("S.frozenAt!==null") else 99)))
            tap_text(pg, '#inst-list button', 'A fuel leak'); pg.wait_for_timeout(300); tap_text(pg, '#inst-hold', 'Freeze and discuss'); pg.wait_for_timeout(300)
            rows.append((w, 'freeze and discuss (fuel inject queued)', measure(pg) + (0 if not pg.is_visible('#instov') and pg.evaluate("S.frozenAt!==null&&S.dec&&S.dec.k==='fuel'") and 'Frozen' in pg.text_content('#inst-fab') else 99)))
            tap_text(pg, '#inst-fab', 'Frozen — tap to resume'); pg.wait_for_timeout(300); rows.append((w, 'resume after the freeze', 0 if pg.evaluate("S.frozenAt===null") else 99))
            tap_text(pg, '#dec-box button', pg.evaluate("S.dec.c.o.find(o=>o[1]==='good')[0]")); pg.wait_for_timeout(500); rows.append((w, 'fuel card answered', measure(pg) + (0 if pg.evaluate("S.dec.ans!==null&&S.score===100") else 99))); tap_text(pg, '#dec-box button', 'Next'); pg.wait_for_timeout(400)
            tap_text(pg, '#pp-quit', 'Stop and go back'); pg.wait_for_timeout(200); tap(pg, '#b-inst'); pg.evaluate("localStorage.removeItem('purchase-point')")
            pg.goto(URL + '?scn=ditch&v=B'); pg.wait_for_timeout(400); rows.append((w, 'link ?scn=ditch&v=B', measure(pg) + (0 if pg.is_visible('#decov') and pg.evaluate("S&&S.id==='ditch'&&S.v==='B'") else 99)))
            pg.goto(URL); pg.wait_for_timeout(200); tap(pg, '[data-tier="2"]'); rows.extend(scenario_full(pg, 'tree', 'B', w, 2)); pg.evaluate("localStorage.removeItem('purchase-point')")
        pg.evaluate("localStorage.removeItem('purchase-point')")
        pg.goto(URL + '?station=roof&v=B'); pg.wait_for_timeout(400); rows.append((w, 'link ?station=roof&v=B', measure(pg) + (0 if pg.is_visible('#runov') and pg.evaluate("S&&S.id==='roof'&&S.v==='B'") else 99)))
        tap_text(pg, '#pp-quit', 'Stop and go back'); pg.wait_for_timeout(200); rows.append((w, 'stop and go back', 0 if pg.is_visible('#home') and not pg.is_visible('#runov') else 99))
        pg.goto(URL); pg.wait_for_timeout(200); tap(pg, '[data-tier="2"]'); pg.evaluate("window.FORCE_V={door:'A'}"); tap(pg, '[data-station="door"]'); pg.wait_for_timeout(650)
        tool_tap(pg, 'cover'); pg.wait_for_timeout(520); tool_tap(pg, 'line'); pg.wait_for_timeout(520)
        tool_tap(pg, 'bar'); pg.wait_for_timeout(120); tap(pg, '#pp-svg g.zone[data-z="latch"]'); pg.wait_for_timeout(520)
        tool_tap(pg, 'spreader'); pg.wait_for_timeout(120); tap(pg, '#pp-svg g.zone[data-z="latch"]'); pg.wait_for_timeout(520)
        rows.append((w, 'chaos door: a spreader on a rocking car shifts it', measure(pg) + (0 if pg.evaluate("S&&S.stab==='shifted'&&S.score===90") and 'Shifted' in pg.text_content('#pp-stab') else 99)))
        tool_tap(pg, 'crib'); pg.wait_for_timeout(120); tap(pg, '#pp-svg g.zone[data-z="cribC"]'); pg.wait_for_timeout(520); rows.append((w, 'chaos door: cribbing makes it stable', 0 if pg.evaluate("S&&S.stab==='stable'") else 99))
        tap_text(pg, '#pp-quit', 'Stop and go back'); pg.wait_for_timeout(200)
        if w == 390:   # one drill and the exam to the end with real taps
            pg.goto(URL); pg.wait_for_timeout(150); tap(pg, '#h-drills'); pg.wait_for_timeout(150); tap(pg, '[data-drill="hazard"]'); quiz_full(pg)
            rows.append((w, 'drill hazard (full)', measure(pg) + (0 if pg.evaluate('QZ.score') == 100 and saved(pg, "(p.runs||[]).some(r=>r.id==='hazard'&&r.score===100)") else 99)))
            tap(pg, '[data-q="nextact"]'); pg.wait_for_timeout(200); rows.append((w, 'drill Next opens the next drill', 0 if pg.evaluate("QZ&&QZ.id==='first'") else 99)); pg.evaluate("localStorage.removeItem('purchase-point')")
        pg.goto(URL); pg.wait_for_timeout(150); tap(pg, '#h-set'); pg.wait_for_timeout(150); rows.append((w, 'settings', measure(pg))); tap(pg, '#set-close')
        tap(pg, '#h-ref'); pg.wait_for_timeout(150); rows.append((w, 'reference', measure(pg))); tap(pg, '#info-close')
        tap(pg, '#h-about'); pg.wait_for_timeout(150); rows.append((w, 'about', measure(pg))); tap(pg, '#info-close')
        tap(pg, '#h-prog'); pg.wait_for_timeout(150); rows.append((w, 'progress', measure(pg))); tap(pg, '#info-close')
        tap(pg, '[data-tier="2"]'); pg.wait_for_timeout(100); rows.append((w, 'chaos tier', measure(pg) + (0 if 'Chaos' in pg.text_content('#tierhelp') else 99)))
        tap(pg, '#b-inst'); pg.wait_for_timeout(100); rows.append((w, 'instructor switch', 0 if 'on' in pg.text_content('#b-inst') else 99)); tap(pg, '#b-inst')
        pg.evaluate("localStorage.setItem('preconnect-drill',JSON.stringify({on:true,inst:'Max',roster:['Jo','Sam'],who:'',start:new Date().toISOString()}))"); pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'drill night picker', measure(pg)))
        tap(pg, '.pc-drill-name'); pg.wait_for_timeout(200); rows.append((w, 'drill night', measure(pg) + (0 if 'Drill Night' in pg.text_content('#b-inst') else 99)))
        pg.evaluate("localStorage.removeItem('preconnect-drill')")
        pg.evaluate("localStorage.setItem('preconnect-settings',JSON.stringify({text:'large'}))"); pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'large text', measure(pg)))
        pg.evaluate("localStorage.setItem('preconnect-settings',JSON.stringify({contrast:'day'}))"); pg.goto(URL); pg.wait_for_timeout(300); rows.append((w, 'daylight', measure(pg)))
        pg.evaluate("localStorage.removeItem('preconnect-settings')")
        pg.goto(URL + '?drill=first'); pg.wait_for_timeout(300); rows.append((w, 'daily link ?drill=first', measure(pg) + (0 if pg.is_visible('#quizov') else 99)))
        pg.goto(URL + '?exam=1'); pg.wait_for_timeout(300); rows.append((w, 'link ?exam=1', measure(pg) + (0 if pg.is_visible('#quizov') and pg.evaluate("QZ.kind==='exam'") else 99)))
        pg.goto(URL + '?lesson=1'); pg.wait_for_timeout(300); rows.append((w, 'link ?lesson=1', measure(pg) + (0 if pg.is_visible('#lessonov') else 99)))
        pg.close()
    pg = b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=2, is_mobile=True, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(300); rows.append((844, 'landscape', measure(pg)))
    tap(pg, '#h-set'); pg.wait_for_timeout(150); rows.append((844, 'settings land', measure(pg))); tap(pg, '#set-close')
    tap(pg, '#h-learn'); pg.wait_for_timeout(200); rows.append((844, 'lesson land', measure(pg))); pg.close()
    if os.environ.get('PC_ALL'):   # every built activity to the end with real taps at 390 px
        pg = b.new_page(viewport={'width': 390, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(200); lesson_full(pg)
        rows.append((390, 'ALL lesson (full)', measure(pg) + (0 if saved(pg, "(p.runs||[]).some(r=>r.kind==='lesson'&&r.score===100)") else 99)))
        for did in DRILLS:
            pg.goto(URL); pg.wait_for_timeout(200); tap(pg, '#h-drills'); pg.wait_for_timeout(200); tap(pg, f'[data-drill="{did}"]'); pg.wait_for_timeout(200); quiz_full(pg)
            rows.append((390, f'ALL drill {did} (full)', measure(pg) + (0 if saved(pg, f"(p.runs||[]).some(r=>r.kind==='drill'&&r.id==='{did}'&&r.score===100)") else 99)))
        pg.goto(URL); pg.wait_for_timeout(200); tap(pg, '[data-exam="exam"]'); pg.wait_for_timeout(200); quiz_full(pg)
        rows.append((390, 'ALL exam (full)', measure(pg) + (0 if saved(pg, "(p.runs||[]).some(r=>r.kind==='exam'&&r.score===100)") else 99)))
        for sid in STATIONS:
            for v in ('A', 'B', 'C'):
                rows.extend(station_full(pg, sid, v, 390))
        rows.extend(cut_full(pg, 390))
        for sid in SCENARIOS:
            for v in ('A', 'B', 'C'):
                rows.extend(scenario_full(pg, sid, v, 390))
        pg.goto(URL); pg.wait_for_timeout(300); rows.append((390, 'ALL home after the built activities', measure(pg) + (0 if pg.text_content('#rdy-t') == '15 of 19 activities' else 99)))
        pg.close()
    b.close()
bad = 0
for w, name, v in rows:
    over, small = v % 1000, v // 1000
    ok = over <= 0 and small == 0
    bad += 0 if ok else 1
    print(f"{'PASS' if ok else 'FAIL'}  {w}px  {name:<36} overflow {over}px · buttons under 44px: {small%100} · text under floor: {small//100}")
print('JavaScript errors:', errs or 'none')
sys.exit(1 if bad or errs else 0)
