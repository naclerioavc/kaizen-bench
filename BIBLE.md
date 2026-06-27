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
- ✅ Module inventory → drill to instances + folder path + wiring
- ✅ Signals table: every signal, # sources, # loads — searchable over the full set, sortable,
  click to trace drivers (from) and loads (to)
- ✅ Feedback rings (cycles with no wave-breaker; crosspoints/buffers excluded)

Devices / network (`.smft` + `.dip` + `.smw` + `.ir`):
- ✅ Ethernet (IP-ID, model, name, IP/hostname), Cresnet (Cresnet ID), RF/other, IR (`.ir` files)
- ✅ Touchpanels & UIs (model, type, IP-ID, project file) from `VTP`+`Db`
- ✅ Serial ports: COM #, what it controls, the card it's on, protocol, baud, data/parity/stop, handshaking
- ✅ Relay / IR / I-O ports that are wired, with what each controls
- ✅ Full IP-ID table (`.dip`); third-party IPs hidden in module params (with purpose + address, creds stripped)
- ⬜ Device manufacturer/type enrichment (`Db`) merged into device rows
- ⬜ Ethernet config records (`Et`: IP/mask) merged where useful

Log Analyzer (`.err` / Info-Tool dump / PLOG `.zip`):
- ✅ System (model, firmware, serial, hostname), Network (ip/subnet/gateway/dhcp/link),
  Hardware (processor + slots), programs + uptimes, triage, recurring w/ rate, solve timeouts,
  processor load + hogs, device drops, log-suspension, gzip rotations, multi-boot merge
- ✅ Non-SIMPL logs detected and declined cleanly
- ⬜ More Info-Tool sections: netstat, Cresnet report, DHCP leases, autodiscovery

Diff (two `.smw`/`.umc`): ✅ signals add/remove/rename, type changes, module deltas, copy-as-text

## 5. Roadmap (⬜ not started unless noted)

- ⬜ **Wiring map** — render the signal↔symbol graph the Signals tracer already computes.
- ⬜ **Debug / issue-finder** on the wiring graph (honest, candidate-framed; live box confirms).
- ⬜ **Multi-program / multi-processor systems** — load several programs together, link them
  across EISC bridges / shared IP-IDs, trace across the whole system.
- ⬜ **As-built / printable report**; per-card CSV export; row-selection for export.
- ⬜ Companion app for live, on-device data (kept out of this repo).

## 6. Correctness — the grading harness

`test/grade.js` (`npm test`) loads the shipped `index.html` in a DOM and asserts the extraction
functions against synthetic fixtures with known ground truth. Run the same checks ad-hoc on
real programs; they must pass exactly. The harness has already caught real parser bugs.

## 7. File formats & coverage

Program: `.smw`, `.umc`, `.chd` (same `ObjTp=` grammar), `.smft` (device XML), `.dip` (IP table),
program `.zip` (all + `.ir`). Logs: `.err`, Info-Tool `.log`, PLOG `.zip` (incl. gz rotations).
Verified across CP4, RMC4 (4-Series) and PRO3 (3-Series) via the grader.
