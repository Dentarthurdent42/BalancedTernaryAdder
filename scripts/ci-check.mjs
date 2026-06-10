// CI check: extract the inline text/babel script from each HTML page, compile
// it with the same Babel the pages load from the CDN, then execute it in a
// sandbox with React/ReactDOM stubbed so the pure arithmetic functions can be
// pulled out and tested directly. This exercises the shipped code, not a copy.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Babel = require('@babel/standalone');

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error('FAIL:', msg); }
}

function extractBabelScript(file) {
  const html = readFileSync(file, 'utf8');
  const m = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`${file}: no text/babel script found`);
  return m[1];
}

// Run a page's script with UI machinery stubbed; `capture` names the
// top-level functions to hand back for testing.
function loadPage(file, capture) {
  const src = extractBabelScript(file)
    + `\n;__capture({ ${capture.join(', ')} });`;
  const { code } = Babel.transform(src, { presets: ['react'], filename: file });
  let captured = null;
  const sandbox = {
    __capture: (fns) => { captured = fns; },
    React: {
      useState: (v) => [v, () => {}],
      useEffect: () => {},
      useRef: (v) => ({ current: v }),
      createElement: () => ({}),
    },
    ReactDOM: { createRoot: () => ({ render: () => {} }) },
    document: { getElementById: () => ({}) },
    performance, console,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setTimeout, clearTimeout, setInterval, clearInterval,
  };
  vm.runInNewContext(code, sandbox, { filename: file });
  if (!captured) throw new Error(`${file}: capture hook never ran`);
  return captured;
}

// ---------- index.html : the adder ----------
{
  const { addTrits, tritsToDecimal, rotToTrit } = loadPage('index.html',
    ['addTrits', 'tritsToDecimal', 'rotToTrit']);

  // rotToTrit cycle: 0°→0, 60°→+1, 120°→−1, repeating both directions
  const cycle = [[0, 0], [60, 1], [120, -1], [180, 0], [240, 1], [300, -1],
                 [-60, -1], [-120, 1], [-180, 0], [720, 0]];
  for (const [deg, t] of cycle) {
    assert(rotToTrit(deg) === t, `rotToTrit(${deg}) = ${rotToTrit(deg)}, want ${t}`);
  }

  // addTrits: exhaustive over all pairs of 4-trit numbers (81 × 81)
  const n = 4;
  const all = [[]];
  for (let i = 0; i < n; i++) {
    const next = [];
    for (const a of all) for (const d of [-1, 0, 1]) next.push([...a, d]);
    all.length = 0; all.push(...next);
  }
  for (const a of all) for (const b of all) {
    const { result, carry } = addTrits(a, b);
    const lhs = tritsToDecimal(result) + carry * 3 ** n;
    const rhs = tritsToDecimal(a) + tritsToDecimal(b);
    assert(lhs === rhs, `addTrits([${a}],[${b}]) → ${lhs}, want ${rhs}`);
    assert([-1, 0, 1].includes(carry), `carry out of range for [${a}]+[${b}]`);
    assert(result.every(t => [-1, 0, 1].includes(t)), `result trit out of range for [${a}]+[${b}]`);
  }
  console.log(`index.html: rotToTrit + addTrits exhaustive (${all.length}²) ok`);
}

// ---------- counter.html : the Geneva counter ----------
{
  const { decompose, rotToTrit } = loadPage('counter.html', ['decompose', 'rotToTrit']);

  const N = 7, MAX = (3 ** N - 1) / 2; // 1093
  for (let V = -MAX; V <= MAX; V++) {
    const { trits, counts } = decompose(V, N);
    let s = 0;
    for (let k = 0; k < N; k++) s += trits[k] * 3 ** k;
    assert(s === V, `decompose(${V}) reconstructs to ${s}`);
    assert(counts[0] === V, `counts[0] for ${V}`);
    assert(trits.every(t => [-1, 0, 1].includes(t)), `trit out of range for ${V}`);
    assert(counts.every(Number.isInteger), `non-integer index count for ${V}`);
    // wheel angle/trit agreement: the bar must read the digit the math says
    for (let k = 0; k < N; k++) {
      assert(rotToTrit(counts[k] * 60) === trits[k],
        `wheel ${k} at V=${V}: angle says ${rotToTrit(counts[k] * 60)}, trit is ${trits[k]}`);
    }
  }
  // carry cadence: stage k indexes once per 3^k counts → 3 times over 3^(k+1)
  for (let k = 1; k < N; k++) {
    let changes = 0;
    for (let V = 0; V < 3 ** (k + 1); V++) {
      if (decompose(V + 1, N).counts[k] !== decompose(V, N).counts[k]) changes++;
    }
    assert(changes === 3,
      `stage ${k} indexed ${changes}× over ${3 ** (k + 1)} counts, want 3`);
  }
  console.log(`counter.html: decompose full ±${MAX} range + carry cadence ok`);
}

if (failures) { console.error(`${failures} assertion(s) failed`); process.exit(1); }
console.log('all checks passed');
