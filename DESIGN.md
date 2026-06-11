# A Balanced-Ternary Counter from 6-Slot Geneva Drives

A purely mechanical linkage that counts in **balanced ternary** (each digit
∈ {−1, 0, +1}) by cascading identical **6-slot Geneva drives**. One drive per
digit; carry propagates from one drive to the next with no electronics, no
ratchets, and no per-stage gearing in the primary design.

This is the mechanical counterpart of the adder visualised in
[`index.html`](./index.html) and is animated interactively in
[`counter.html`](./counter.html).

---

## 1. Why a 6-slot Geneva makes a perfect trit

A Geneva drive converts continuous (or hand-cranked) rotation of a **driver**
into intermittent, indexed rotation of a **driven wheel**. A driver carrying a
single pin advances an *n*-slot Geneva wheel by exactly `360°/n` per driver
revolution and **locks it solid** the rest of the time (the driver's circular
cam mates with the wheel's concave flanks). For `n = 6`:

| quantity | value (n = 6) |
| --- | --- |
| index angle per drive event | `360°/6 = 60°` |
| crank pin radius `r` (center distance `c`) | `r = c·sin(180°/n) = c·sin30° = 0.5 c` |
| driver rotation that produces motion `2α`, `α = 90° − 180°/n` | `2 × 60° = 120°` |
| driver rotation spent **locked** (dwell) | `360° − 120° = 240°` |

The dwell is the important part: a counter must **hold each digit rigidly**
between counts, and the Geneva's locking cam does that for free.

### Encoding three values on a six-position wheel

A 6-slot wheel has six detents at 60°. We make it read as a *ternary* digit by
marking it with the same two symmetries used in `index.html`:

- a **hexagonal body** — 6-fold symmetry (looks identical every 60°), and
- a **diameter bar** across the face — 2-fold symmetry (looks identical every 180°).

Their combination is invariant every `gcd`-compatible 180°, so the wheel
presents only **three** distinguishable orientations, each recurring twice per
revolution:

| wheel angle (mod 360°) | bar orientation | trit |
| --- | --- | --- |
| 0°, 180° | reference | **0** |
| 60°, 240° | +60° | **+1** |
| 120°, 300° | −60° (≡ +120°) | **−1** |

So as the wheel indexes 60° per count, the displayed digit cycles
`0 → +1 → −1 → 0 → +1 → −1 …` — a balanced-ternary digit that completes one full
logical cycle every **3 counts** (= 180° of wheel rotation), while the wheel
itself returns home every **6 counts** (360°). This `rotToTrit` mapping is
exactly the one already implemented in `index.html`:

```js
const m = ((Math.round(deg / 60) % 3) + 3) % 3;
const trit = m === 0 ? 0 : m === 1 ? 1 : -1;   // 0 → 0, +1, −1, repeating
```

---

## 2. Carry: one pulse every three counts

Counting **up**, a single trit runs `… −1 → 0 → +1 → (−1, carry +1) → …`. The
carry into the next-higher digit fires on every `+1 → −1` transition — once per
ternary cycle, i.e. once per **3 counts = 180°** of the digit wheel.

We need each digit wheel to deliver exactly **one index pulse to the next wheel
per 180° of its own rotation**. Two equivalent linkages achieve this.

### Primary design — twin-pin Geneva (gear-free, fully self-similar)

Mount **two drive pins 180° apart** on each digit wheel `W_k` (with the matching
pair of locking-cam lobes). The wheel itself becomes the *driver* for the
next-higher wheel `W_{k+1}`. Two diametrically opposed pins index a 6-slot
Geneva **twice per revolution of the carrier**, i.e. once every 180° — exactly
the carry cadence we want.

Per-stage transfer ratio:

```
W_k turns 360°  →  two pin passes  →  W_{k+1} indexes 2 × 60° = 120°
average ω(W_{k+1}) / ω(W_k) = 120° / 360° = 1 / 3      ✓ one base-3 place per stage
```

Every stage is **identical**: a 6-slot Geneva wheel carrying two carry pins,
driving the next identical 6-slot Geneva wheel. A "series of 6-slot Geneva
drives," with no gears between digits.

### Alternative — single-pin Geneva + 2:1 step-up

If you prefer a conventional single-pin Geneva driver, insert a `2:1` step-up
between the digit wheel `W_k` and a single-pin carry shaft `D_k`:

```
ω(D_k) = 2·ω(W_k)            (2:1 step-up gear)
W_k turns 180°  →  D_k turns 360°  →  one pin pass  →  W_{k+1} indexes 60°
```

Same `1/3` per-stage ratio, at the cost of one small gear pair per digit. The
twin-pin design is preferred because it keeps the cascade purely Geneva.

### Clocking (phasing)

The carry must coincide with the digit's `+1 → −1` step (the `120°→180°` and
`300°→360°` detent crossings). This is a one-time **assembly offset**: rotate
each carry driver on its shaft so its pin enters `W_{k+1}`'s slot at those
detents. After clocking, carries and borrows fall in the right place
automatically.

---

## 3. The cascade

```mermaid
flowchart RL
  IN([hand crank · 1 rev = 1 count]) -->|single pin · 60°/count| W0["W0 · trit 3⁰"]
  W0 -->|twin pin · ÷3| W1["W1 · trit 3¹"]
  W1 -->|twin pin · ÷3| W2["W2 · trit 3²"]
  W2 -->|twin pin · ÷3| W3["W3 · trit 3³"]
  W3 -->|twin pin · ÷3| W4["W4 · trit 3⁴ …"]
```

Because every stage divides angular rate by 3, the absolute rotation of digit
`k` is a clean closed form of the count `V`:

```
angle_k(V) = (60° · V) / 3^k          (detents land exactly on multiples of 60°)
```

- `W_0` advances 60° per count.
- `W_1` advances 60° per 3 counts.
- `W_k` advances 60° per `3^k` counts.

**Counting down** is the same mechanism run backwards: reverse the input crank
and carries become borrows. The Geneva engagement is kinematically reversible,
and the locking cam still holds every idle digit.

---

## 4. Range and readout

With `M` digit wheels the counter spans the symmetric range

```
[ −(3^M − 1)/2 ,  +(3^M − 1)/2 ]
```

| M wheels | range |
| --- | --- |
| 3 | −13 … +13 |
| 5 | −121 … +121 |
| 7 | −1093 … +1093 |
| 9 | −9841 … +9841  (the addend width used in `index.html`) |

**Reading the value:** read each wheel's diameter bar against its `0 / + / −`
index marks (the three states of §1), most-significant wheel first, and sum
`Σ tritₖ · 3ᵏ`. The interactive page shows this conversion live. Overflow past
the top wheel is simply the carry pin of the most-significant digit finding no
wheel to drive — optionally a bell/flag, mirroring the overflow toast in the
adder.

---

## 5. Build notes (bill of materials per digit)

- **1 ×** 6-slot Geneva wheel (the digit), hexagonal face, diameter bar
  engraved, `0/+/−` index marks at the rim.
- **2 ×** carry pins + **2 ×** locking-cam lobes on the wheel hub (primary
  design), *or* **1 ×** pin + a `2:1` gear pair (alternative).
- **1 ×** shaft + bearings; concave locking flanks cut between the six slots so
  the upstream cam keeps the wheel rigid during dwell.
- Input stage: a single-pin driver crank (one revolution = one count).

Geometry follows the standard external-Geneva relations with `n = 6`
(`r = 0.5 c`, 120° of action, 240° of dwell) tabulated in §1; pick the center
distance `c` to suit your wheel diameter and the rest is fixed.

---

## 6. Relationship to the adder

`index.html` lets you *set* two 9-trit numbers on hex dials and reads off their
balanced-ternary sum. This counter uses the **same dial as a moving part**: the
hex + diameter-bar trit, the 60°-per-step indexing, and the
`0 → +1 → −1` cycle are identical. The adder shows the number system; the
counter shows the *machine* — how Geneva intermittent motion plus a
once-per-three-counts carry turns a stack of identical wheels into a
self-incrementing balanced-ternary register.
```
