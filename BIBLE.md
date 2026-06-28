# SIMPL Bench — Project Bible (technical spec)

Source of truth for what this tool is, the rules it follows, what it does today, and the
technical roadmap. **No customer data and no business/strategy content in this repo** — both
have leaked before and had to be purged. Keep this file purely technical.

---

## 1. What it is — and the one-sentence philosophy

A free, 100% client-side tool that makes everything inside a Crestron SIMPL program **fast
to view, grab, sort, and document — without opening SIMPL Windows or digging through compile
logs.** A viewer/extractor, not a guessing analyzer. Show all *useful* data, organized into
clean collapsible sections (rather have it and not need it) — but internal file-plumbing
records are not data and stay out. Everything runs in the browser; nothing is uploaded;
files are read-only.

## 2. Hard rules (non-negotiable)

- **Nothing private in the repo** — no customer data, no business/strategy, no competitor or
  product names; not in files, commit messages, or this bible.
- **Read-only** on all SIMPL-produced files.
- **Don't guess unverified data.** Confirm a field's meaning against a real file or leave it
  out (the `SgTp` lesson).
- **Grade, don't negotiate.** Correctness is proven by `test/grade.js` against ground truth.
  A data point isn't "done" until the grader checks it.
- **Honest labeling.** Facts read straight from the file; anything inferred says so.
- **UI/UX is paramount** — collapsible sections, sticky headers, sortable columns, filters,
  drill-downs, copy-to-table. Pretty and well laid out. Lead with what matters: an at-a-glance
  summary (signals/devices/intersystem-links/action-items) and an accented action bar that jumps
  to the Checks card, so problems are seen first. Clean empty-state hero before a program loads.
- **Completeness rule (every relevant field gets a column).** If a record carries useful data
  for a row — a port, an IP, an address, a driver file, a parent card, a location — surface it
  as its own column. Don't make the user open SIMPL to learn something the file already states.
  Wide tables scroll horizontally; never truncate a value to where it's unreadable even on hover.
  This rule is **enforced by the grader**: the fixtures carry every field, and `test/grade.js`
  asserts each card renders them. A missing column is a failing test, not a code-review catch.

## 3. Methodologies

WMA (write minimal architecture) · KISS · single self-contained `index.html`, no build step ·
ship one useful thing well, verify it in a real DOM + the grader, then move on. Build entity
tables on a **consistent, selectable-ready pattern** (like the Signals table) so row-selection
for export/monitor can be added later uniformly.

**Resolve to the specific instance, never the class.** This is the core reference methodology,
not a per-feature ask. If a thing lands on a device, name the *exact* device instance and its
identity — "DM-NVX-36x Zone 41, IP-ID B2", not "an NVX." Walk the device tree (`Dv.PrH`) to the
real host; pull its IP-ID/IP/port; give a drill-down to the individual port and the exact signal
it drives. A tech should be able to read a row and walk to the rack. "Port 1 of some device" is a
bug, not a row. Apply this to every card, every time.

## 4. Data the tool extracts & displays  (✅ done · ⬜ pending)

Program (`.smw` / `.umc` / `.chd`):
- ✅ Program info (header): program name, dealer/programmer, client, file, SIMPL compiler &
  database versions
- ✅ Signal counts + Digital/Analog/Serial split (`SgTp`: digital=absent/1, analog=2, serial=4)
- ✅ Custom / SIMPL+ module inventory (`.usp/.ush/.umc/.clz`)
- ✅ Module inventory → drill to instances → **click an instance to see its inputs/outputs**
  (each signal clickable to its tracer). Navigate the program without opening SIMPL.
- ✅ Real folder paths: SIMPL stores folders as generic `SUBSYSTEM` symbols; the programmer's
  label is in `Cmn1` — folderPath now resolves it (was printing "SUBSYSTEM" N levels deep).
- ✅ Signals table: every signal, # sources, # loads — searchable over the full set, sortable,
  click to trace drivers (from) and loads (to)
- ✅ Feedback loops (cycles with no wave-breaker; crosspoints/buffers excluded)
- ✅ Full folder-path breadcrumbs on every "where it comes from" column/drill (signal tracer,
  third-party IPs, module drivers, ports) so a clue is locatable without opening SIMPL
- ✅ No doubt-inducing subtext: the tool obviously reads the dropped files; we don't hedge facts
- ✅ Checks: duplicate IP-IDs, value contention, **unconnected signals** (named, not wired
  either end), feedback rings — all candidate-framed

Devices / network (`.smft` + `.dip` + `.smw` + `.ir`):
- ✅ **Network devices** — one merged list: union of the device tree and the processor IP
  table (`.dip`) keyed by IP-ID, columns IP-ID / IP / model-device / name / **role-type** /
  manufacturer. Role flags what a device actually is — e.g. an **EISC** intersystem link to
  another program (from `Dv.Nm`), which a bare IP/model never tells you. (Replaces the old
  separate "Ethernet devices" + "IP-ID table" — they were two redundant IP-ID lists.)
- ✅ Cresnet / RF / other — manufacturer/type, plus **which gateway each sits behind** (a
Log analyzer (`.err` / Info-Tool / PLOG `.zip`):
- ✅ Triage, recurring errors by rate, solve timeouts, device drops (+ periodic cadence), CPU,
  failed-login surges, program↔log correlation (names dropping devices, ties timeouts to loops)
- ✅ Correct multi-line + repeat parsing: rejoin Crestron's wrapped messages (same
  sev+source+timestamp) and apply `(written N times)` multipliers (one real `.err` had 11,752
  collapsed repeats we'd been ignoring)
- ✅ Double-CR fix: lines ending `\r\r\n` were dropped (stripped only one `\r`); one real `.err`
  lost ~2/3 of errors (3,930 → 11,587), incl. the Fatal "missing program files"
- ✅ System strip (model/firmware/boot count from "System startup …") + Critical panel
  (missing program files at boot, device claimed by two programs)

Physical coordinates (the "go find it" rule):
- ✅ Signal tracer shows each driver/load's exact landing point — host device · IP-ID · the
  device/card ID · pin — alongside the program folder path. Built from a symbol→`Dv` reverse
  map. Not "lands on an NVX" but "DM-NVX Zone 5 (IP-ID B2) · IR Ports ID 06 · pin 1".

---

## File-format facts (hard-won — verified against real programs; do not relitigate)

These are confirmed against real `.smw`/`.err` files. If something here is wrong, prove it against
a real file and update this section — don't re-derive from scratch.

**Records** (`ObjTp=`): `Sg` signal · `Sm` symbol/module · `Dv` device · `Db` device-DB entry ·
`Cm` comm spec (serial) · `Et` ethernet config · `VTP` touchpanel project · `Hd` header.

**Signals** (`Sg`): `SgTp` → digital = absent/`0`/`1`, analog = `2`, serial = `4`. Names starting
with `/` (e.g. `//__reserved__`) are reserved/disabled — filter them from user views.

**Symbols** (`Sm`): `I1,I2…` input pins → signal handle; `O1,O2…` output pins → signal handle;
`C1,C2…` children (tree); `P1,P2…` parameters. **A `P#` is one of three things** — classify by
value: a **signal name** (matches a real signal → it's wired through a parameter pin), a **value**
(`0d`,`9600`,`75%`,`0x…` → real config), or a **pin/function name** (identifier like `Power_ON`,
`Up` → the module's own label for a pin). On IR/command drivers (`Nm="Crestron DB IR-controlled
device"`, `SmC=107`) the `P#` are the function names and the `I#` are the trigger signals — they
correlate, **but the I↔P index offset is NOT consistent across drivers**, so we do NOT positionally
correlate them (that would be guessing). We label each param's Kind instead.

**Folders**: SIMPL stores folders as generic symbols `Nm=SUBSYSTEM`; the programmer's real label
is in `Cmn1` (strip trailing `\`). `folderPath` walks `parentOf` (from `C#` children) using the
resolved label.

**Device tree** (`Dv`): `PrH` = parent handle (the physical tree: processor → card → port/device).
`Ad` = address (IP-ID **or** Cresnet ID **or** port number) — **NOT unique across buses**, so any
`Ad`-keyed lookup must be bus-scoped (walk `PrH` for an `Ethernet`/`Cresnet`/`RF` ancestor). `SmH` =
the symbol that carries the device's signals (reverse-map `SmH→Dv` to get a signal's physical
coordinate). `DvC` present = a real device; pure containers (slots/cards/`P4Ethernet`) have none.

**Device enrichment**: `Db.DvH→Dv` gives manufacturer/model/type; `Db.DrF` = the `.ir` driver file
(IR devices). `Et.DvH→Dv` gives static IP/mask **and** a descriptive `Nm` that catches intersystem
links the `.smft` doesn't model as EISCs (e.g. a `To/From <other-processor>: [subsystem]` link). `.smft` nests devices
under their gateway → that's the "behind which gateway" relationship.

**Error logs** (`.err`): line format `Level: Source # timestamp # message`. Three real gotchas:
(1) some lines end `\r\r\n` — strip **all** trailing `\r`, or `.*$` fails and the line is dropped
(cost us ~2/3 of one log's errors). (2) `(written N times)` is a repeat count, inline or on a
trailing line — multiply, don't count as 1. (3) Crestron wraps one long message across several
re-prefixed lines sharing the same severity+source+timestamp — rejoin them. `System startup
<model> Cntrl Eng [v…]` = model + firmware + a boot event.

## SIMPL Windows capability parity
- ✅ **Cross-reference / signal trace** — SIMPL's core navigation feature. Single-hop: the signal
  tracer (drivers/loads + physical coordinate + folder). Multi-hop: **reverse trace ("what triggers
  this")** and **forward trace ("what this affects")** walk the logic graph hop-by-hop (cycle-safe,
  capped), each node clickable to re-root. Traces a preset recall back to the literal touchpanel
  button that fires it — the static proof for "is the program doing X or is it the user?"
- ⬜ Future parity to consider: printable cross-reference report; "go to" jump; unconnected-signal
  filter (have the check); compile-notice summary.

## Robustness (trust is the moat)
- ✅ Swept against real CP4 (4-Series, 24MB), PRO3 Slave (3-Series), RMC4 Bistro (4-Series) and a
  real `.err`: all audit + drills (trace, device-signals, instance, reverse/forward trace) render
  with zero errors, zero bad tokens.
- ✅ Graceful on bad input: empty → hero; a loaded file with no parseable signals/devices (garbage
  or compiled-only archive) → a clear "loaded, but no readable SIMPL data" message naming the file;
  non-SIMPL logs decline cleanly.

## As-Built Report (the shareable deliverable)
- ✅ "As-Built Report (PDF)" button: prints a clean white document with a **cover page** (program,
  client, dealer, file, compiler/database/device-DB versions, counts, generated date) followed by
  the device schedule, port connections, IP-ID table, third-party IPs and checks — the thing a
  tech hands to a client or colleague. Cover is screen-hidden; print-only, its own first page.

## Feedback-loop honesty (domain fact)
Crestron propagates an **analog/serial** signal only when its **value changes**, so an
analog/serial-only feedback loop **self-limits** — once the value is stable, it stops; it does not
oscillate. The real oscillation risk is a loop carrying a **digital** signal (rapid toggling / wave
storms). So `structAnalysis` classifies each unbroken loop by signal type: `oscCandidates` =
loops with a digital signal; `analogLoops` = analog/serial-only (self-limiting). Analog loops aren't
harmless though — they can cause analog-specific symptoms (jumpy slider, a slider that won't move,
two sources fighting a value), so we surface them, just not as oscillation candidates.

## Log ↔ program system-match guard (don't cross-reference unrelated files)
The log analyzer correlates the loaded program (names dropping devices, ties wave-solve
timeouts to the program's feedback loops, surfaces "issues from the log" on the Audit). If the
log and program are from **different processors / projects / file sets**, those correlations are
confidently wrong — a land mine. `systemMatch(prog,a,text)` gates it:
- **Evidence:** processor model (program `.smft` root `Model="…"` vs log boot model /
  Info-Tool Discovered `ModelName`), and IP-ID overlap (program `.dip` + device-tree `Ad` vs the
  log's dropped/discovered IP-IDs).
- **mismatch** if models differ (normalized; one containing the other counts as same family), OR
  both sides have IP-IDs (prog ≥4, log ≥2) and they share **none**. On mismatch: cross-referencing
  is turned **off** (`logXref=null`, no device-name/S-number enrichment), a red banner names both
  sides, and the Audit shows a "different system" note instead of false correlations.
- **match** if models agree or any IP-ID overlaps. **unknown** otherwise → correlations shown but
  caveated (best-effort). Conservative thresholds avoid false alarms on small/partial logs.
- Graded: same-system not flagged; wrong model → mismatch(model); same model + zero IP-ID overlap
  → mismatch(ipid).
