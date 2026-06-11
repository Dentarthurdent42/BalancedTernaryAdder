# BalancedTernaryAdder

Mechanical-flavoured visualisations of **balanced ternary** — the base-3 number
system where every digit (a *trit*) is one of `{−1, 0, +1}`. Numbers are
represented and manipulated on hexagonal dials that behave like **6-slot Geneva
drives**: a hex body (6-fold symmetric) plus a diameter bar (2-fold symmetric)
leaves exactly three readable orientations, so one wheel = one trit.

Everything is a self-contained, dependency-free HTML page — open it in a
browser, no build step.

## Pages

### `index.html` — the adder
Set two 9-trit numbers by swiping (or scroll-wheeling) the hex dials and read
off their balanced-ternary sum, computed digit-by-digit with carries. Each
addend ranges −9841 … +9841; the sum row shows the per-place result plus the
overflow trit.

→ [open `index.html`](./index.html)

### `counter.html` — the Geneva counter
An interactive simulation of a purely mechanical balanced-ternary **counter**
built from a cascade of identical 6-slot Geneva drives. An input crank indexes
the units wheel 60° per count; twin-pin couplers carry once every three counts,
rippling left through the higher digits. 7 wheels, range −1093 … +1093. Step
±1 / ±9, run, reset.

→ [open `counter.html`](./counter.html)

### `counter3d.html` — the 3D interactive simulation
The same counter as a real-time **kinematic simulation** in 3D (three.js). The
whole machine is driven by a single degree of freedom — the input crank — and
every digit wheel's angle is solved from the external 6-slot Geneva transfer of
the wheel before it. The trit values and the carries are *emergent*, not
scripted: scrub the crank and watch carries ripple left, with authentic Geneva
dwell-and-index motion. Orbit/zoom the camera, and pick the number of trits
(2–7) live.

→ [open `counter3d.html`](./counter3d.html)

### `DESIGN.md` — the mechanism
The engineering write-up behind the counter: why a 6-slot Geneva makes a perfect
trit, the external-Geneva geometry for `n = 6` (`r = 0.5c`, 120° of action /
240° of dwell), the twin-pin carry linkage and its `1/3` per-stage ratio, the
single-pin + 2:1 step-up alternative, the cascade formula
`angle_k = 60°·V / 3^k`, range, counting direction, readout, and a bill of
materials.

→ [read `DESIGN.md`](./DESIGN.md)

## Balanced ternary in one minute

| trit | dial angle | meaning |
| --- | --- | --- |
| `+` | 60° (≡ 240°) | +1 |
| `0` | 0° (≡ 180°) | 0 |
| `−` | 120° (≡ 300°) | −1 |

A value is `Σ tritₖ · 3ᵏ`. With `M` trits the range is the symmetric
`[ −(3ᴹ−1)/2 , +(3ᴹ−1)/2 ]`. Negation is just flipping every `+` to `−` — no
separate sign bit — which is what makes the system elegant in both the adder and
the counter.

## Development & CI

The pages embed their logic as inline `text/babel` (React + Babel from a CDN),
so there's nothing to build. CI ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml))
guards correctness:

```bash
npm ci      # installs the pinned @babel/standalone used by the pages
npm test    # node scripts/ci-check.mjs
```

`scripts/ci-check.mjs` extracts the inline script from each page, **compiles it
with the same Babel version the pages load** (catching any JSX/syntax error),
then exercises the real arithmetic functions:

- `index.html` — `rotToTrit` and `addTrits` exhaustively over all 81×81 pairs of
  4-trit numbers (sums reconstruct; trits and carries stay in `{−1,0,+1}`).
- `counter.html` — `decompose` across the full ±1093 range (values reconstruct,
  wheel angle agrees with its trit) and the carry cadence (one index per
  `3ᵏ` counts).
