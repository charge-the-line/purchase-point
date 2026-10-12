#!/usr/bin/env python3
"""Real-browser check. Needs: pip install playwright (Chromium is pre-installed in the cloud container).
Opens the home screen, the lesson, every drill, exam practice, Settings, the pocket reference, About, My progress, the tiers,
the instructor switch, the Drill Night picker, large text, Daylight, the deep links and landscape at phone sizes, with slow
real taps on buttons found by their visible text. Fails on any JavaScript error, anything off the right edge, a button under
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
        tap(pg, '#h-drills'); pg.wait_for_timeout(150); rows.append((w, 'drill picker', measure(pg) + (0 if pg.is_disabled('[data-drill="cut"]') else 99))); tap(pg, '#dp-close')
        for did in DRILLS:
            pg.goto(URL); pg.wait_for_timeout(150); tap(pg, '#h-drills'); pg.wait_for_timeout(150); tap(pg, f'[data-drill="{did}"]'); pg.wait_for_timeout(150)
            tap_text(pg, '[data-q="ans"]', pg.evaluate("QZ.qs[QZ.i].a")); pg.wait_for_timeout(120)
            rows.append((w, 'drill ' + did, measure(pg) + (0 if pg.evaluate('QZ.right') == 1 else 99)))
        pg.goto(URL); pg.wait_for_timeout(150); tap(pg, '[data-exam="exam"]'); pg.wait_for_timeout(150); rows.append((w, 'exam', measure(pg) + (0 if pg.evaluate("QZ.kind==='exam'&&QZ.qs.length===15") else 99)))
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
        pg.goto(URL); pg.wait_for_timeout(300); rows.append((390, 'ALL home after the built activities', measure(pg) + (0 if pg.text_content('#rdy-t') == '6 of 19 activities' else 99)))
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
