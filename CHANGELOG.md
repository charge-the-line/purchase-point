# Purchase Point — changelog

Vehicle extrication at the Operations level, modeled on the vehicle chapter of NFPA 2500 in our own words. Plain-language history, newest first. Practice, not certification; on a call, the maker's rescue guide and your department's procedures come first.

## 0.2.0 — October 12, 2026 · E2: the car diagram, the Where to cut drill and the five skill stations

- The workbench: one car drawing per run (a side view on its wheels; an end view for a car on its side or its roof), tool first, then the zone. Three bars: stability (stable, rocking, shifted), space (inches gained against the room needed, modeled) and the tool battery. A "what just happened" line that stays. Guided names the next step and marks the hidden hazards; Recall marks nothing; Chaos doubles the cold-weather battery drain, stages no spare, starts on a car the first crew never cribbed, and hides an extra hazard.
- Hidden hazards under the trim: the curtain airbag inflator and tube, the seat-belt pretensioner, boron steel. Peel and peek shows them; a cut without a peel still happens, costs 5 for cutting blind, and an inflator is a never (30). Boron steel stalls the cutter and moves the cut.
- The power-order trap: the 12-volt cut before the windows are down or the locks tried costs 10, and the window becomes a punch, the locks a pry. The reserve-charge line follows every power-down.
- Battery tools with staged spares: a tool dies mid-job, the heavy tools will not run until a spare is swapped in or Engine 10's hydraulic set is called; twenty real seconds with a dead tool costs 5.
- Stability: a heavy tool on a car that is rocking shifts it (10); twenty seconds shifted with nobody cribbing costs 5; the EMS provider sent into a rocking car costs 5.
- Five stations, three layouts each: Stabilize it (wheels, side, roof), Glass (tempered and laminated, laminated side glass, power already off), Make the door (latch side, hinge side, the battery dies), Take the roof (full removal, roof flap, boron steel in the B-post), Dash roll (relief cut and roll, boron steel in the A-post, the battery dies). Lift an inch, crib an inch, measured on every push.
- Where to cut: twelve prompts on the diagram, eight a run, the first tap counts.
- Tap guards on the tray and the zones (rule 4); the person's clocks stop while the screen is off (rule 15); every zone has a 44 px hit rect, a role, a name and a keyboard stop.
- Tests: `car`, `stations` and `cut` sections (45 clean bot runs, every trap, the freeze, the guard, the hit rects) and the browser check plays every station and the drill with real taps; `PC_ALL=1` plays every built activity.
- Deep links: `?station=<id>&v=<layout>`, `?drill=cut`.

## 0.1.0 — October 12, 2026 — the shell, the lesson, four drills and exam practice
- The home list in the standard Preconnect order with all 19 activities; the five skill stations, seven scenarios and the Where to cut drill show Soon until the car-diagram engine is built.
- A 14-slide lesson with a check on each: the inner and outer circle, traffic, fire protection before the first cut, wires, airbags and peel-and-peek, pretensioners and gas struts, power in order (cutting the 12-volt does not instantly disarm the airbags), electric and hybrid vehicles, how cars are built, stabilization (lift an inch, crib an inch), glass, the tools (battery cutter, spreader and ram; spares; Engine 10's hydraulic set), the door and the roof, and the car coming off the patient.
- Quick drills: Tool for the job, Hazard ID, What's first, Vehicle construction. Exam practice: 15 questions from a bank of 36.
- Settings, Drill Night, the instructor switch, the pocket reference, About with the details still to confirm with the department, My progress and the practice-record CSV.
