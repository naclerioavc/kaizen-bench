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
  drill-downs, copy-to-table. Pretty and well laid out.
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
- ✅ Feedback rings (cycles with no wave-breaker; crosspoints/buffers excluded)
- ✅ Checks: duplicate IP-IDs, value contention, **unconnected signals** (named, not wired
  either end), feedback rings — all candidate-framed

Devices / network (`.smft` + `.dip` + `.smw` + `.ir`):
- ✅ **Network devices** — one merged list: union of the device tree and the processor IP
  table (`.dip`) keyed by IP-ID, columns IP-ID / IP / model / name / manufacturer / type.
  (Replaces the old separate "Ethernet devices" + "IP-ID table" — they were two IP-ID lists.)
- ✅ Cresnet (Cresnet ID), RF/other — both enriched with manufacturer/type
- ✅ IR devices: device, model, manufacturer, **IR port**, driver file, and location — joined
  from `Db.DrF`→`Dv` (not just `.ir` filenames). Falls back to filenames if only `.ir` present.
- ✅ Per-row `Db` enrichment (manufacturer/type by model) merged into every device row
- ✅ Device summary (bill of materials): every model + manufacturer + type + **count**
- ✅ Touchpanels & UIs: model, type, IP-ID, **resolved IP** (from the IP table), project file
- ✅ Serial ports: COM #, what it controls, the card it's on, protocol, baud, data/parity/stop, handshaking
- ✅ Relay / IR / I-O ports that are wired, with what each controls
- ✅ Third-party IPs hidden in module params (with purpose + address, creds stripped)
- ⬜ "Controlled from" (folder) for network/Cresnet devices via `Dv.Ad`→`SmH` join (have it for serial/relay/IR)
- ⬜ Ethernet config records (`Et`: IP/mask) surfaced where useful

Log Analyzer (`.err` / Info-Tool dump / PLOG `.