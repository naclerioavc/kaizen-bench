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
- ✅ **Per-unit parse memoization.** `systemSummary`/`systemGraph` cache each unit's derived data on the
  unit (`u._sum`/`u._eisc`), and the audit caches the active unit's parsed model (`u._model`) — so a
  unit-pill click costs ONE parse of the newly-visited program instead of re-parsing the whole job
  (was ~30 full-text scans per click on an 11-processor drop via `dropLine→dropFacts→systemSummary/Graph`).
  **Invalidation is explicit and single-pointed:** `setUnitBuild` deletes all three memos when it swaps
  build content; nothing else mutates a unit's files. Graded: zero re-parses on repeat calls, memo
  dropped on build switch, param-Kind signal set now lives on `state.prog` (was module-level and went
  stale across processor switches — a wrong "signal (wired)" label, i.e. a lie).
- ✅ Swept against real CP4 (4-Series, 24MB), PRO3 Slave (3-Series), RMC4 Bistro (4-Series) and a
  real `.err`: all audit + drills (trace, device-signals, instance, reverse/forward trace) render
  with zero errors, zero bad tokens.
- ✅ Graceful on bad input: empty → hero; a loaded file with no parseable signals/devices (garbage
  or compiled-only archive) → a clear "loaded, but no readable SIMPL data" message naming the file;
  non-SIMPL logs decline cleanly.
- ✅ **Big-archive intake (memory ceiling fixed).** Program intake is **manifest-first**: `zipDir(file)`
  reads only the central directory via `File.slice` (ZIP64-aware), then inflates **only work files**
  (primary build per folder + sibling `.dip/.smft` + IR + D3 docs/program) on demand — compiled
  `.zip/.lpz/.sig`/images/non-primary builds are never inflated. The whole archive never enters RAM.
  Proven on the real **4 GB ZIP64** backup: 11 live processors loaded in ~0.5 s reading **0.27 % of the
  file** (peak slice ~7 MB), vs the old "inflate everything" path that would OOM the tab (~10 GB).
  **Now covers ALL THREE intakes** (was Audit-only — an audit caught the gap): Version Diff slots hold
  `{file, manifest}` (a `File` handle + `manifestFromEntries(zipDir(file))`, never the buffer; deep-diff
  streams the one file via `arcExtract`→`zipReadEntry`), and the Log Analyzer's zip path walks the central
  directory and inflates candidates one at a time (binary extensions + >512 MB entries skipped, each entry
  fault-isolated so one corrupt file doesn't kill the drop). The legacy buffer readers (`zipManifest`/
  `unzip`/`extractOne`) now **throw on ZIP64 markers** instead of returning an empty — silently-wrong —
  result (a ZIP64 Version Diff used to report "no changes"!). All EOCD scans validate the comment length,
  so a `PK\x05\x06` inside an archive comment can't spoof the directory. All graded (248→257).
- ✅ **Archived folders** (`~Older` / old / archive / backup paths) are flagged, kept inspectable +
  tagged in the Processors table, but excluded from the live System Map (drop-line notes "+N archived").

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

## D3 Pro lighting drop type (`loadwiring.htm`)
Crestron **D3 Pro** compiles a lighting project and auto-writes plain HTML as-built reports into the
project's `Documentation/` folder. The compiled D3 `.smw` has a different internal structure than a
hand-built AV `.smw` (`Mdl=` device records don't surface the same way), so for D3 lighting we read
the **generated HTML, not the compiled program.**
- **`loadwiring.htm`** is parsed (`parseD3Loadwiring`) into instance-resolved load records. Structure:
  per-enclosure sections (`td.pagetitle` = "Room/Enclosure N(...) - [ slot ], Total Load : Nw"),
  each containing modules (`td.modulename` = "Module N: CLX-type" then "Net-Device ID XX"), each
  containing circuit rows (`tr.circuit`): `td.ckt_loc` holds "Level/Room/Load ( watt W )" and a
  sibling cell holds the output channel. Real loads = channels matching `^(DIM|SW|FAN)\d+`; skip
  the feed/`LINE` and neutral `N IN`/`N OUT` rows. A trailing " O" glyph (crestron-transport icon
  font) is stripped from load names. Header gives Project / Creator / Date.
- **What it unlocks:** the #1 lighting service question, instance-resolved — "this load is dead,
  which channel + feed?" → channel · module · net-ID · feed · enclosure, per row. Plus a
  **shared-module / shared-feed grouping** (loads grouped by control module): if several
  complained-about loads share one module or feed, suspect that module or its breaker/feed
  (electrical) before the program — surfaced as a likely root cause, labeled inference.
- Intake: dropped directly (`.htm`/`.html`) or found inside a program `.zip` (`Documentation/`).
  Detected by content (`Load Wiring` / `class="ckt_loc"`), so a non-D3 `.htm` is declined.
- Scene model FYI (do not false-alarm): D3 Pro 3.06 stores scenes in `Presets`/`PresetSteps`, not
  the legacy `Scenes` table (empty by design).

## Archive ↔ archive comparison (whole-project diff)
Compare two full project backups (e.g., your copy vs a backup from another integrator months
later). Drop two `.zip` archives into the Version Diff slots.
- **Manifest first, cheap:** `zipManifest(buf)` reads the zip **central directory only** (per-file
  name + CRC-32 + uncompressed size) — **no decompression**, so a 500 MB archive is read in a
  fraction of a second. The top-level folder is stripped from each path so two archives with
  different root names line up.
- **Diff = name + CRC:** files added / removed / changed (CRC differs). Validated on two real
  500 MB backups of one project: 2,262 vs 1,782 files → it pinpointed the 2 changed `.smw`
  programs out of thousands of files.
- **Deep diff on demand:** click a changed `.smw`/`.umc`/`.chd` → `extractOne(buf,name)` inflates
  just that one file from each archive → the existing `computeDiff` renders the full program diff
  (added/removed/renamed/type/param). A "Back to file changes" button returns to the manifest.
- KISS: cheap manifest up front, heavy work only on the one file the user asks for. Graded with a
  synthetic STORED-zip fixture (manifest + add/remove/change detection).

## Log: feedback / command storm detection
A "storm" = a single second with a large batch of Error/Fatal entries (threshold ≥20), clustered
as ONE finding rather than N separate rows. Computed by bucketing logical log entries by their
timestamp-second (the multi-line rejoin already merges wrapped lines). Tracks how many of the burst
are SIMPL+ string **overflow** errors (`/overflow/i`); `overflowDriven` when overflows are ≥half the
burst. The classic cause is every zone recomputing feedback on one global event (All On / All Off)
→ momentary CPU saturation → panels freeze. Rendered as a red-bordered panel above the recurring
table, **framed as correlation, not proof** (line it up with the user action that triggered it).
Graded against a synthetic 25-overflow same-tick fixture (clusters to one storm, overflow-driven;
a lone routine error is not a storm).

### Archive diff intelligence (rebuilt from real-data audit)
A raw manifest diff of two real 500 MB backups was **693 changed/added/removed files** — overwhelming
and ~97% meaningless. The intelligent diff classifies every file (`fileClass`) into **work** vs
**derived noise** and leads with the work:
- **Work (surfaced):** programs (`.smw/.umc/.chd`, deep-diffable), lighting (`loadwiring.htm`,
  deep-diffable into load add/remove/re-channel/wattage), touchpanels (`.vtp/.vtz/...`),
  config/IP (`.dip/.smft`), IR drivers, SIMPL+ source (`.usp/.ush`).
- **Noise (collapsed behind a toggle):** compiled/library (`.dll/.inf/.lpz/.bin/...`), generated
  SIMPL+ output (anything under `SPlsWork/`), autosave/backup dirs, regenerated docs
  (`Documentation/*.htm/.egr`), images. On the real pair: **693 → 18 work files, 675 collapsed.**
- **Subsystem grouping:** by top folder (`01-CP4 - AV`, `02-CP4 - Security`, `D3`, `UI`).
- **Wrapper-root normalization:** strip a single top folder ONLY if every entry shares it (real
  backups wrap in a dated dir; a bare-zipped project does not) — so paths align either way.
- **Move detection:** an added file whose CRC matches a removed one is shown as *moved*, not both.
- Plain-language verdict up top; deep-diff (programs + lighting) on demand with a back button.

## D3 full loadout (loadwiring + load schedule + engraving)
The D3 `Documentation/` folder is scanned for all three generated reports (any combination):
- **`loadwiring.htm`** → instance-resolved loads (channel/module/net-ID/feed/enclosure) + shared-feed grouping.
- **`loadschedulept.htm`** → `parseD3LoadSchedule`: the flat full-electrical table (Area/Room/Load,
  Controlled Ckt No., Status, Fixture, Load Type, Fixture/Total Watts, Qty, Dim/Backup/Arc-Fault,
  Enclosure/Slot/Module/Output) — generic header-zip so it survives column changes.
- **`Engraving Report.htm`** → `parseD3Engraving`: keypad **station map** (room, name, model/BOM,
  Net-Device ID). The button **labels are images** (`<img>` per station), not text — so when the
  source is a `.zip`, the matching `Documentation/*.jpg` is extracted and shown inline (click a
  keypad row → engraving picture). That answers "what does this button say?" on a phone call.
- **Honest boundary — "what a button DOES / scene levels":** D3 does NOT emit a button→scene→level
  report, and the engraving HTML has no function text. That mapping lives inside the D3 lighting
  `.smw` as raw named signals/symbols (Preset/Scene/Level/Button names) — the `.smw` parses fine with
  the standard parser, so those signals are searchable/traceable in the Audit, but a clean
  "button → scene → loads at levels" extraction would require reverse-engineering D3's signal/scene
  naming convention (a research project, not a parse) and is deliberately NOT guessed.

## File-set anatomy — every file and how Bench uses it (do not rediscover)
The single durable reference for a Crestron/SIMPL job. Verified against real multi-processor + D3
jobs. Capability only — no customer data.

### Per-processor program files (one coherent unit per processor folder)
- **`.smw`** — the program. Record blocks `[ ... ]` keyed by `ObjTp`:
  - `Sg` (signal): `Nm`, `SgTp` (digital = absent/0/1, analog = 2, serial = 4).
  - `Sm` (symbol/module instance): pins `I#`/`O#` (in/out signal handles), `C#` (child handles),
    `P#` (params), `Nm`, `DvH` (the device this symbol drives), `H` (handle).
  - `Dv` (device): `Nm`, `Ad` (IP-ID / Cresnet ID), `PrH` (parent → bus/tree), `SmH`.
  - `Db` (database/model): `Mnf`, `Mdl`, `Tpe`, `DvH`. `Cm` (serial comspec). `Et` (Ethernet:
    `DvH`,`IPA`,`IPM` → static IP + mask). `VTP` (touchpanel project). `Hd` (header: `PgmNm`,
    `DlrNm`,`CltNm`,`PrNm`,`CmVr`,`DbVr`,`DvcDbVr`). Folder labels live in `Cmn1`.
  - **S-number** = a symbol's child position = its SIMPL Program-View address.
  - **EISC / intersystem links** are **`Sm` symbols** named `…Ethernet Intersystem Communications`
    (or `EISC`), **NOT `Dv` records**. Resolve: `Sm.DvH → Dv` gives the **target name** (`Dv.Nm`,
    e.g. `02_Security`, `[RSD Lighting Loads].rsd`) and **IP-ID** (`Dv.Ad`); `Ad → .dip` gives the
    **target IP**. `dvNetRoles`/`parseEt` only scan `Dv`/`Et`, so they MISS these — use `eiscLinks()`.
  - **EISC bridges are keyed by IP-ID, NOT by the loopback octet.** A `127.0.0.x` target IP means the
    bridge lands on **another program on the same physical processor** (CIP loopback); a real IP means a
    **separate box**. The loopback octet is **not** a slot number — VALIDATED on real jobs: every intra-box
    bridge uses `127.0.0.2` regardless of which program, and both ends of one bridge carry the **same IP-ID**.
    So the cross-processor map matches two programs that **share an EISC IP-ID** (loopback ⇒ same box, real IP ⇒
    separate box). Self-IPs are recoverable by reciprocity (each side's dip maps the shared IP-ID to the other's
    real IP). Proven on an 11-processor job: a hub (`01_Main`) with 11 EISC links paired all 11 by IP-ID, zero
    false edges, even when 6 of the programs had no `.dip`. (Earlier "127.0.0.N = slot N" was WRONG — do not use it.)
- **`.smft`** — device/network hardware tree. Attributes are ONLY `Model`,`Name`,`DeviceId`,`Type`
  (Network),`Id` (Network). Devices nest inside `<Network>`; gateways nest sub-devices. **No
  per-device slot/rack attribute exists** (the "SlotNN" you see is the processor *program* slot =
  the folder/program name, not a device locator).
- **`.dip`** — IP table: `id#=<IP-ID hex>` / `addr#=<IP>` pairs. The IP for any `Ad`.
- **`.ir`** — IR driver files (one per IR device).
- **`.umc` / `.chd`** — also parse with the `.smw` parser.

### D3 Pro lighting project (its own folder: `D3/<project>/`)
D3 is SIMPL under the hood + generated docs. Parse the generated text, not the binary `.d3p`.
- **`data/*.dat`** — tab-delimited, 4 header lines (File Version / Modified Date / Modified Time /
  blank) then a column-header row then rows (CRLF). Schemas:
  - `areas.dat`: `AreaID  AreaName`
  - `rooms.dat`: `RoomID  AreaID  RoomName`
  - `loads.dat`: `LoadID  LoadName  RoomID  DIM_setting  Ramp_time  Upper_limit  Lower_limit  TotalWattage`
  - `scenes.dat`: `SceneID  RoomID  SceneName`
- **`Documentation/`** — `loadwiring.htm` (load → control module/output/feed/enclosure),
  `loadschedulept.htm` (wattage/circuit), `Engraving Report.htm` (per-station keypad button labels
  + station images).
- **`Programs/<project>.smw`** — the BIG (~8 MB) program with the scene logic (NOT the small
  `AUTOSAVE_Config.smw`, which is config only): scene blocks `[_Global_Lighting_Scene][<SceneName>]`
  expose `Load_NN_In_Scene` (which loads are in the scene; `NN` = `LoadID`), `Recall`, `at_scene_fb`.
  Per-load preset **levels** are stored in `Double-Precision Analog Variable Preset` module instances.
  Button → scene link: the engraving label usually equals the scene name.

### Whole-job archive layout (a client backup zip)
- Multiple **processor folders** (e.g. `01-CP4 - AV/`, `02-CP4 - Security/`), each with its own
  `.smw`+`.smft`+`.dip` — parse each as a SEPARATE unit; never merge namespaces (IP-IDs/S-numbers
  collide across processors). `chooseAllPrograms()` is the single intake source.
- `**/SPlsWork/**` = compiled output / module libraries = noise (skip for program selection).
- `**/AUTOSAVE/**` = editor snapshots (dedupe; don't count as separate projects).
- Multiple D3 project folders may be dated versions of one residence — list distinct non-AUTOSAVE roots.
- The **System overview** rolls these up: per-processor counts + the cross-processor EISC map.

## Theming & easter-egg principles (don't relearn this)
Hard-won from refining the theme set + Plumber/Pipe Dream. Follow these; a new theme/game is then quick.
- **Name themes by color-mood** (Nightman/Dayman/Synthwave/Matrix) or a clearly-evocative-but-
  trademark-safe word. Object/character names ("Cookie") invite "that doesn't look like X" — avoid.
- **Readability first (we design UIs for a living).** Never one flat color across header+body+footer.
  A light theme needs dark text. Pick a readable base, then let **iconic ACCENT colors pop**. Avoid
  low-contrast pairs (red text on sky-blue vibrates — use dark navy for labels instead).
- **No cheap CSS textures** (noise/sprinkles look bad and caused a real repaint bug). Convey a vibe
  with **palette + region color-blocking** instead — e.g. Mario = sky-blue body + white "cloud"
  cards + brick/coin/pipe accents + a **green "ground" footer**. Reads as a level, stays legible.
- **Lock the brand** (logo wordmark + signal mark) theme-independent. Pin accent chrome (BETA pill,
  footer underline) to a fixed brand color so only body-text legibility adapts per theme.
- **Theme picker** lives in the nav, **names only** (swatch dots were noise, removed).
- **Repaint gotcha:** the theme menu is inside `<nav>`; the nav's delegated click handler must ignore
  buttons without `data-tab`, or selecting a theme calls `show(undefined)` and hides every tab (THE
  real "content disappears on theme switch" bug — not sticky headers).
- **Easter egg engine facts (2026-07-01 hardening):** physics runs on a **fixed 60Hz timestep**
  (accumulator in `loop()`) so game speed — and therefore leaderboard times, which are wall-clock —
  no longer scales with monitor refresh rate; leaderboard JSON is **shape-validated** on read (a
  corrupt localStorage entry used to throw at 60fps on the finish screen); smash ignores key
  auto-repeat (`!e.repeat`) and post-timeout hits; `open()` is re-entrancy-guarded and focuses the
  close button (Enter on the still-focused launcher used to silently reset the run); Esc closes the
  game WITHOUT also closing a modal beneath it; the climb barrels roll their ladder-drop dice **once
  per encounter**, not per frame (0.28^5 had made "roll past" effectively impossible); finish screens
  read a cached score list, not localStorage per frame. All graded headless (mock 2D ctx + manual
  rAF pump at 120Hz and 30Hz).
- **Easter egg rules:** original shapes + original name only (IP-safe — no Nintendo assets/names);
  isolated full-screen overlay; **canvas `getContext` only on open** so it never runs during grading
  or touches the tool; **local-only leaderboard** (a static app can't do a global one — top-5 times
  with initials in `localStorage`). Each easter egg is now its **own game mode**, not just a palette reskin: Plumber=`PIPE DREAM` (speedrun platformer), Monkey=`WIRE MONKEY` (`mode:"climb"` — original DK-style: zig-zag ladders, an ape tossing barrels, reach the top; player sprite unchanged), Office Fighter=`OFFICE FIGHTER` (`mode:"smash"`). The launcher button is themed (Mario `?`-block / DK barrel / fight ★). Theme menu names are trademark-safe (Synthwave→`Purple Stuff`, Matrix→`Anomaly`); `data-theme` ids are unchanged so CSS/localStorage keys stay stable. Verified headless (mock 2D ctx + manual rAF pump): 1,500 climb frames, 0 runtime errors. Older note below kept for the reskin philosophy: A new franchise = palette + sprite-color reskin of the same code:
  Sonic → blue base, gold rings, green/checker; Donkey Kong → jungle browns/greens, red-tie accent.

## D3 scene LEVELS are runtime, not static (don't chase them in the files)
Verified on a real D3 program: the per-load dim **levels** are NOT in the `.smw`. The
`Double-Precision Analog Variable Preset` modules (577 of them) carry only I/O **signal handles**
(no `P#` params, no stored values) — they capture/replay levels at **runtime on the processor**.
So from static files the ceiling is **scene → loads** (membership, shipped via `parseD3Scenes` +
`loads.dat`). The actual level each load goes to needs the **live system** (desktop-agent territory).
Don't build a "levels" view from the files — it would be fabrication.

## D3 keypad ENGRAVING LABELS — they're in the .egr files (binary Access), found
The literal button text (e.g. "LIGHTS OFF", "PENDANTS", "CANS") is NOT in sysdata.xml (its `<Label>`
is unrelated — scheduler names) and NOT as text in Engraving Report.htm (that's a picture). It lives
in **`Engraving/<Room>,<Station>.egr`** files — **binary MS Access "Standard Jet DB"** databases,
one per keypad station (filename = station). Inside, the real labels appear as a contiguous cluster
of printable strings in the data section, AFTER all the Access schema vocabulary (MSysObjects,
ODBCTimeout, Scripts, Reports, lf* font fields, "Crestron Sans Pro", PanelButtonNumber, TextLine1/2,
ButtonNameInReport, etc.). To extract: pull printable strings, drop the known Access-schema/ font
words, and the human words that remain are the engravings. Tables of interest: RequestedButton /
PanelInfo with `PanelButtonNumber`/`PhysicalButtonNumber` + `TextLine1`/`TextLine2`.
Status: labels are extractable (validated: Dining Hall → LIGHTS OFF / PENDANTS / CANS / KITCHEN /
SHADES). The careful part is pairing each label to its exact button # across varied keypad models
(button counts skip numbers, group titles vs button text). Build a dedicated .egr parser, validate
across many stations — a WRONG label is a fail, so don't guess the pairing. The engraving IMAGE is
already shown per keypad as the interim (labels readable in-tool, no D3 needed).

## Continuing this project (onboarding for a fresh session)
This repo IS the handoff. To pick up: `git clone`, then read this BIBLE + `index.html` + `test/grade.js`.
- Grader is the contract: `node test/grade.js` (currently 238/0). Nothing ships ungraded.
- Validate every new parser against the user's REAL files locally before shipping; commit only
  synthetic fixtures (no customer data — privacy-grep first).
- Don't make the user open Crestron software for anything but a change or live test; if data looks
  missing, it's in a file not yet fully read (it always was — sysdata.xml, .egr).
- Build with `git clone` into a scratch dir, edit, `node test/grade.js`, privacy-grep, commit, push
  with a fresh fine-grained token (never store the token in a file).
(Business model, real-client validation notes, and credentials live in LOCAL docs only — never here.)

## NEXT — lead build items (start here in a fresh session)
**Design north star: zero learning curve.** The user should not have to think, learn the system, or
read a manual. Drop files → the tool surfaces what matters and points them at it. Dummy-proof beats
feature-rich. Everything below is buildable NOW because the deterministic model is done + validated
(no guesses) — these are render/UX layers on top of `systemSummary`, `eiscLinks`, `chooseAllPrograms`.

**✅ All three lead items shipped (graded). This cycle's work:**

1. **✅ Visual System Map** — `systemGraph()` renders the whole-job topology in pure SVG: a node per live
   processor, EISC bridges matched by **shared IP-ID** (loopback = same box, real IP = separate box),
   D3 lighting as first-class nodes, clickable to each processor's audit. Hub-spoke layout, IP-ID hover
   labels. The headline demo — no Crestron tool shows this.
2. **✅ Per-processor build switcher** — multi-build folders get a `Build [vN ▾]` override; inflates the
   chosen build on demand (lazy, via `zipReadEntry`). Auto-picks **newest-saved** (zip mtime) as an
   honest *default*, amber-flagged: files can't prove what's *deployed* — a console confirms the
   **processor/system** (model/hostname/fw) but **not the exact build** (no progcomments/compile in real
   dumps). User overrides.
3. **✅ "What's in this drop" line** — one deterministic sentence + jump chips, now with full connection
   detail (each EISC bridge's IP-ID(s) + IP / loopback), per the completeness rule.

**Also shipped this cycle:** streaming big-archive intake (see Robustness) · D3 backup **collapse** (dated
backups of one project, grouped by connected-processor, keep newest) · **archived-folder** exclusion from
the map · **Triage grounding**: `exportFactsForLLM` now feeds program + whole-system + a **console/log
digest** (drops, solve-timeouts→loops, storms, recurring, model/hostname/fw, match verdict), degrading
cleanly across all four data combos (program / log / both / neither) with honest caveats; Triage tab shows
a live grounding-status line + 3-step instructions.

## Triage rebuilt from field feedback (2026-07-01)
Real site walk (6/30) proved the old Triage output — wide "go-list" tables (Issue | Instance |
Domain | Confidence) + "story" + "still ambiguous" — was an encyclopedia nobody used onsite. The tech cleared
the work with a flat Notepad++ list in the reporter's re-walk order. Root cause: the OUTPUT CONTRACT, not the
engine. Rebuilt (3 commits, grader 215→238):

- **Output = editable, in-order, grounded punch list.** Model returns JSON `[{issue,fact,flag}]` — issues
  VERBATIM in the reporter's ORIGINAL order, ≤1 grounded fact/line, a flag only on non-programming exceptions
  (ELEC/FW/NET). Rendered by `trRenderChecklist` (drag-reorder / edit / add / delete / check / Copy / CSV /
  Print). Verbosity is structurally impossible — the model fills fields, it can't write an essay.
- **Steer loop** (`trSteer`): chat box under the list. A change request → full updated JSON re-rendered in
  place (keeps checks/edits); a question → 1–3 sentence answer, list untouched. `trBuildRequest` now takes a
  multi-turn message array; history carries the facts across turns.
- **Native file reading** (`trAttachClass` + `trProviderCaps` + `trB64`): PDFs/images go to the model as
  document/image blocks — Anthropic pdf+image, OpenAI image-only, local none; unsupported = clear "switch to
  Anthropic or paste", never silent. Archives/logs still route to Audit/Log Analyzer (deterministic grounding —
  never feed a compiled binary to the LLM). xlsx/docx bounce ("save as PDF / paste rows").
- Also fixed a "no-lies" bug: census help said `127.0.0.N = slot N`; now the IP-ID key.

**Five non-negotiable lessons (regressing any is a bug):**
1. KISS beats feature-rich — the flat checklist did the work; the AI codex didn't.
2. Order is sacred — never regroup by room/floor/owner; the reporter's order is the re-walk order.
3. Output must be editable + steerable, not a one-shot export — the user drives.
4. Input sanity — binaries read as text = garbage that makes the model fixate; route archives/logs to the engine.
5. Keep the AI narrow — structure + ground, never analyze/reorder/essay. Engine is the moat, AI is a sidecar.

Remaining = a LIVE test only (needs the user's Anthropic key): drop the real notes + a PDF, confirm order kept,
PDF ingested, right lines grounded. The real field job (notes, retro, reference CSVs, logs) is staged in a
LOCAL validation folder — never committed.

**NEXT candidates (pick by real-world value):**
- ✅ **True build confirmation — DONE** (bullet was stale): a **full PLOG archive** DOES name the deployed
  build per slot — `Loading Program /simpl/appNN/<name>.bin` lines (a single `.err` doesn't).
  `parseDeployedBuilds()` reads them (latest load per slot wins), `deployedBuildFor()` matches a build's
  `.smw` name → the build switcher's amber flag turns green (`✓ DEPLOYED`) and the map badges it.
- **Map UX polish** — group/badge cross-processor vs loopback clusters on very large jobs; optional
  dimmed "show archived" toggle.
- ✅ **As-Built + System Map — DONE**: the per-processor As-Built PDF now opens with a print-only
  **"System context"** page after the cover — the whole-job map with **this processor highlighted**
  (`sm-cur` bold outline), the processor roll-up table (current row flagged "this report"), and the
  full EISC bridge table (IP-ID / target IP, loopback labeled). Built lazily at **print time** via
  `sysContextHTML()` through `systemSummary`. Skipped for single-program drops and for the whole-system
  view (whose print already carries the map). Graded.
- ✅ **Triage product fit — DONE** (see "Triage rebuilt from field feedback" above): narrowed to an
  editable, grounded, steerable punch list; deterministic engine stays the moat.
