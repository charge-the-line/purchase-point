# Purchase Point — testing guide

Read the shared rules in CLAUDE.md first (two clocks, test like a finger, never rebuild buttons on a timer, answer-length balance, prove a test can fail).

## Every change
1. `node tests/run_all.js` — all green. Run it several times before a release:
   `for i in 1 2 3 4 5; do node tests/run_all.js | tail -1; done` (drill banks and the exam are shuffled; an intermittent failure is a real bug in one draw).
2. `python3 tests/browser_check.py` — the real-browser check at 320 and 390 px with slow taps (press, wait 0.26 s, release) on buttons found by their visible text. Fails on anything off the right edge, a button under 44 px tall or wide, text under the floor (15 px for a sentence, 13 px for a caption), or a JavaScript error.
3. Before a release: `PC_ALL=1 python3 tests/browser_check.py` — every built activity played to the end with real taps at 390 px, proved by the saved record.
4. Bump `APP_VERSION` in index.html and `CACHE` in sw.js together, the version on the home title line, and "Current version" in CLAUDE.md (the `syntax` section checks all four).

## Sections (node tests/run_all.js)
- `syntax`: the script compiles; version, cache and title in step; the offline helper clears only `purchase-point-v` caches and never caches statistics; the page and the shared core load network-first; the core is first, hash-checked and identical to the hub's copy; fonts self-hosted and cached; the statistics snippet with module code `pp`; the Drill Night and settings markup; manifest and icons; the briefing's version and the README; no font under 13 px in the page's CSS.
- `facts`: every `FACTS` entry has a kind, a source and either a checked stamp or no number at all; no number with a unit is written in the script outside `FACTS`; the three safety points Max added are taught where he asked (the reserve charge in the power slide, the Hazard ID drill and the exam; the two circles in slide 1 and the What's first drill; fire protection in slide 3 and the What's first drill).
- `content`: About lists everything in `TO_CONFIRM`; no phone numbers; no NFPA section numbers; no tool brand; the practice-not-certification and not-affiliated notices; every overlay has a way back; the wake lock helper.
- `home`: the standard order; 19 activities, 0 done; the stations, scenarios and Where to cut show Soon and are disabled; tiers and help; the pocket reference; the instructor switch saves and reads "on (Drill Night)".
- `record`: the run shape with `href`; the Drill Night stamp; readiness and chips; progress and the CSV; the saved-data fixtures load.
- `privacy`: event paths cleaned, scores as bands, the opt-out, no name in any event.
- `balance`: the right answer is the longest no more than 45 % of the time, and the shortest no more than 45 % (every lesson check, every drill question over 40 draws, every exam question). Run it after writing any question.
- `lesson`: 14 slides, right first time 100 and wrong first time 0, both recorded; the check must be answered before Next; Stop and go back.
- `drills`: four banks of 13, eight distinct questions a run with three options, the answer among them, and a why.
- `quiz`: a drill and the exam played right (100) and wrong (0); options shuffled once; a second tap ignored; Quit; the deep links `?drill=`, `?exam=1`, `?lesson=1`; Due and Again chips; statistics begin and abandon with code `pp`.
- `voice`: Again · Home · Next on every result and the right Next; the links; tier help from the core; About ends with the shared version line; one name store.
- `teach`: no button refuses a wrong action (rule 14).
