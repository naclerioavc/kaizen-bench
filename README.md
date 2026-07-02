# SIMPL Bench

Free, 100% client-side **Crestron SIMPL Windows** diagnostics. Drop a `.smw` program or a processor error log in your browser, get answers. Nothing is uploaded — every byte stays on your machine.

Built and maintained by [Kaizen Logic](https://kaizenlogic.com) — remote, white-label AV control programming.

Scope is deliberately Crestron SIMPL: `.smw` programs and Crestron processor logs (`.err`, console dumps, Info-Tool / PLOG `.zip`). Logs from non-Crestron gear are detected and politely declined rather than mis-parsed.

## What's in it

One UI shell ("chassis"), decoupled parser engines per platform. Crestron is the first engine.

| Module | Input | What it answers |
|---|---|---|
| **Version Diff** (hero) | two `.smw` or `.zip` | What changed between two builds — signals added / removed / renamed, signal **type changes** (D↔A↔S), and per-module instance changes. The one thing Git can't do for an `.smw`. |
| **Program Census** | `.smw` or `.zip` | How big is this, and what's carrying the weight — signal counts, most-instantiated modules, heaviest-wired symbols, plus derived ratios (no invented size "grades"). |
| **Log Analyzer** | `.err` / Info-Tool dump / `.zip` | Recurring-error tally, signal-solve-timeout vs program-restart correlation, processor load and per-process CPU reported exactly as logged, device socket drops. |

Info-Tool hands you a `.zip` — drop it straight in. It's unpacked in your browser (native decompression, no library, works offline); nothing is uploaded.

### Version Diff — scope

Tuned to the questions integrators actually ask, not a full structural diff.

**Detects** (exact, read from the file): signals added / removed, signal **type changes** (a join that kept its name but went digital↔analog↔serial), and per-module instance counts.

**Infers** (labeled as such): renames — a removed signal and an added signal that share one identical, *unique* wiring fingerprint are reported as a rename candidate. Strong inference, not a fact; confirm anything that matters live.

**Does not detect:** rewiring of existing signals, constant/parameter edits, or device / IP-table changes — the last of those lands with the dedicated **Device Map** module (where the device-object grammar is parsed properly rather than guessed).

### Honesty / no magic numbers

Every figure in Census and Log is a direct count, a stated ratio, or a value reported exactly as the dump recorded it. The Log Analyzer makes **no assumption about which processor** produced the file — load average is shown raw (and divided per core only if the dump itself states a core count). Anything interpretive is hedged and labeled. The tool narrows the search; the live box confirms.

## Run it

It's a single self-contained HTML file. No build step, no server, no dependencies.

```
open index.html      # or just double-click it
```

Deployed at **kaizenlogic.com
