# Version Diff — how to read it

**What it does:** compares two `.smw` programs and tells you what changed at the structure level. This is the thing you can't do with Git — an `.smw` is one big file, so a text diff is useless noise.

## Inputs

- **A — Baseline:** the older build (e.g. last known-good, or the version on the rack now).
- **B — Current:** the newer build (your working copy, or what you're about to upload).

Both files are read in your browser. Nothing is uploaded. `.smw` files are opened read-only.

Use **Swap A / B** if you loaded them in the wrong order. Everything is symmetric except the labels.

## What each section means

**Headline stats** — total signals and total module instances in B, with the delta from A. Quick "did this grow or shrink" read.

**Signals added / removed** — signals present in one build and not the other, matched by name. Each row shows the signal's type: `D` digital, `A` analog, `S` serial.

**Likely renamed** — *inferred, not certain.* When a removed signal and an added signal share one identical, unique wiring fingerprint (the exact set of module pins they connect to), they're almost certainly the same signal that got renamed. This collapses what would otherwise look like a big add + remove list into the handful of real changes. Treat surprising ones as candidates and confirm in SIMPL.

**Module instance changes** — for each module type, how many instances existed in A vs B, and the delta. Catches "I added three more room modules" or "I deleted the old paging block."

## What it does NOT do

- It does not see runtime values, constants, or the inside of compiled `.umc / .clz` modules.
- It does not tell you whether a change is *correct* — only that it happened.
- Device / IP-table diffing isn't here yet; that arrives with the Device Map module.

The tool narrows the search. The live box confirms it.
