// ──── Rekentoets Generator ─────────────────────────────────────────
// Generates math questions matching the exact Klas 1 Rekentoets pattern.
// All questions use BACKWARD generation: answer first, then construct the question.
// This guarantees clean, "mooi" answers every time.

// ──── Types ────────────────────────────────────────────────────────

export type AnswerType = "integer" | "decimal" | "fraction";

/** Display element: plain text or a fraction/mixed number */
export type QElement = string | { w?: number; n: number; d: number };

export interface Question {
  id: string;
  block: 1 | 2 | 3 | 4;
  sub: string;
  label: string; // e.g. "1a"
  display: QElement[];
  answerType: AnswerType;
  answer: string; // canonical answer string
  hint?: string;
}

export interface BlockInfo {
  block: number;
  title: string;
  description: string;
  icon: string;
  questionCount: number;
}

export const BLOCKS: BlockInfo[] = [
  { block: 1, title: "Gehele getallen", description: "Optellen, aftrekken, vermenigvuldigen, delen, volgorde", icon: "🔢", questionCount: 4 },
  { block: 2, title: "Decimale getallen", description: "Machten van 10, kommagetallen, procenten, afronden", icon: "🔣", questionCount: 6 },
  { block: 3, title: "Breuken", description: "Aftrekken, vermenigvuldigen, delen, volgorde", icon: "⅔", questionCount: 4 },
  { block: 4, title: "Maateenheden", description: "Lengte, oppervlakte, inhoud", icon: "📏", questionCount: 3 },
];

// ──── Utilities ────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplify(n: number, d: number): [number, number] {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(Math.abs(n), d);
  return [n / g, d / g];
}

function fracToMixed(n: number, d: number): { w: number; n: number; d: number } {
  [n, d] = simplify(n, d);
  if (n < 0) throw new Error("Negative fraction in fracToMixed");
  const w = Math.floor(n / d);
  return { w, n: n - w * d, d };
}

/** Format fraction as canonical answer string */
function formatFracAnswer(n: number, d: number): string {
  [n, d] = simplify(n, d);
  if (d === 1) return `${n}`;
  if (n > d) {
    const w = Math.floor(n / d);
    const rem = n - w * d;
    if (rem === 0) return `${w}`;
    return `${w} ${rem}/${d}`;
  }
  return `${n}/${d}`;
}

/** Convert fraction to QElement for display */
function fracDisplay(n: number, d: number): QElement {
  [n, d] = simplify(n, d);
  if (d === 1) return `${n}`;
  const w = Math.floor(n / d);
  const rem = n - w * d;
  if (rem === 0) return `${w}`;
  if (w === 0) return { n: rem, d };
  return { w, n: rem, d };
}

/** Format decimal with comma (Dutch style) for display */
function fmtDec(n: number, places?: number): string {
  const s = places !== undefined ? n.toFixed(places) : String(n);
  return s.replace(".", ",");
}

/** Round to n decimal places */
function roundTo(val: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(val * f) / f;
}

// ──── Block 1: Gehele getallen ─────────────────────────────────────

function gen1a(): Question {
  // Chain addition/subtraction: a ± b ± c (± d)
  const termCount = randChoice([3, 4]);
  const terms: number[] = [];
  const ops: string[] = [];

  // Generate terms and ops, ensure positive result
  for (let attempt = 0; attempt < 50; attempt++) {
    terms.length = 0;
    ops.length = 0;
    for (let i = 0; i < termCount; i++) {
      terms.push(randInt(100, 9999));
      if (i > 0) ops.push(randChoice(["+", "−"]));
    }
    let result = terms[0];
    for (let i = 1; i < terms.length; i++) {
      result = ops[i - 1] === "+" ? result + terms[i] : result - terms[i];
    }
    if (result > 0 && result < 50000) {
      const display: QElement[] = [`${terms[0]}`];
      for (let i = 1; i < terms.length; i++) {
        display.push(` ${ops[i - 1]} ${terms[i]}`);
      }
      display.push(" =");
      return { id: "r1a", block: 1, sub: "a", label: "1a", display, answerType: "integer", answer: `${result}` };
    }
  }
  // Fallback
  return { id: "r1a", block: 1, sub: "a", label: "1a", display: ["3456 + 789 − 1234 ="], answerType: "integer", answer: "3011" };
}

function gen1b(): Question {
  // Multiplication: 2-3 digit × 2-3 digit
  const a = randInt(100, 999);
  const b = randInt(10, 999);
  const result = a * b;
  return {
    id: "r1b", block: 1, sub: "b", label: "1b",
    display: [`${a} × ${b} =`],
    answerType: "integer", answer: `${result}`,
  };
}

function gen1c(): Question {
  // Long division (exact): dividend ÷ divisor = quotient (remainder 0)
  const quotient = randInt(10, 999);
  const divisor = randInt(12, 99);
  const dividend = quotient * divisor;
  return {
    id: "r1c", block: 1, sub: "c", label: "1c",
    display: [`${dividend} : ${divisor} =`],
    answerType: "integer", answer: `${quotient}`,
  };
}

function gen1d(): Question {
  // Order of operations with brackets
  // Template: (a + b) × c − d  or  a × (b − c) + d
  const template = randChoice([1, 2, 3]);
  let display: string;
  let result: number;

  for (let attempt = 0; attempt < 50; attempt++) {
    if (template === 1) {
      // (a + b) × c − d
      const a = randInt(10, 99);
      const b = randInt(10, 99);
      const c = randInt(2, 15);
      const d = randInt(10, 200);
      result = (a + b) * c - d;
      if (result > 0 && result < 10000) {
        display = `(${a} + ${b}) × ${c} − ${d} =`;
        return { id: "r1d", block: 1, sub: "d", label: "1d", display: [display], answerType: "integer", answer: `${result}` };
      }
    } else if (template === 2) {
      // a × (b − c) + d
      const a = randInt(2, 15);
      const b = randInt(50, 200);
      const c = randInt(10, 49);
      const d = randInt(10, 200);
      result = a * (b - c) + d;
      if (result > 0 && result < 10000) {
        display = `${a} × (${b} − ${c}) + ${d} =`;
        return { id: "r1d", block: 1, sub: "d", label: "1d", display: [display], answerType: "integer", answer: `${result}` };
      }
    } else {
      // a + b × c − d
      const a = randInt(100, 999);
      const b = randInt(10, 50);
      const c = randInt(2, 15);
      const d = randInt(10, 200);
      result = a + b * c - d;
      if (result > 0 && result < 10000) {
        display = `${a} + ${b} × ${c} − ${d} =`;
        return { id: "r1d", block: 1, sub: "d", label: "1d", display: [display], answerType: "integer", answer: `${result}` };
      }
    }
  }
  return { id: "r1d", block: 1, sub: "d", label: "1d", display: ["(45 + 32) × 12 − 89 ="], answerType: "integer", answer: `${(45 + 32) * 12 - 89}` };
}

// ──── Block 2: Decimale getallen ───────────────────────────────────

function gen2a(): Question {
  // Powers of 10: multiply or divide by 10/100/1000
  const powers = [10, 100, 1000] as const;
  const power = randChoice(powers);
  const isMultiply = randChoice([true, false]);

  let num: number;
  let result: number;

  if (isMultiply) {
    // Pick a decimal, multiply by power
    num = randInt(1, 999) / (power === 10 ? 100 : power === 100 ? 1000 : 10000);
    num = roundTo(num, 4);
    result = roundTo(num * power, 4);
  } else {
    // Pick an integer or simple decimal, divide by power
    num = randInt(1, 99999) / 10;
    num = roundTo(num, 1);
    result = roundTo(num / power, 4);
  }

  const op = isMultiply ? "×" : ":";
  return {
    id: "r2a", block: 2, sub: "a", label: "2a",
    display: [`${fmtDec(num)} ${op} ${power} =`],
    answerType: "decimal",
    answer: fmtDec(result),
  };
}

function gen2b(): Question {
  // Decimal subtraction: backward from result
  const places = randChoice([1, 2]);
  const factor = Math.pow(10, places);
  const resultInt = randInt(1, 999);
  const subtrahendInt = randInt(1, 999);
  const result = resultInt / factor;
  const subtrahend = subtrahendInt / factor;
  const minuend = roundTo(result + subtrahend, places);

  return {
    id: "r2b", block: 2, sub: "b", label: "2b",
    display: [`${fmtDec(minuend)} − ${fmtDec(subtrahend)} =`],
    answerType: "decimal",
    answer: fmtDec(result),
  };
}

function gen2c(): Question {
  // Decimal multiplication
  // One number with 1 decimal × integer, or two numbers with 1 decimal each
  const variant = randChoice([1, 2]);
  let a: number, b: number, result: number;

  if (variant === 1) {
    a = randInt(11, 99) / 10; // 1 decimal
    b = randInt(2, 99);       // integer
    result = roundTo(a * b, 1);
  } else {
    a = randInt(11, 99) / 10;
    b = randInt(11, 99) / 10;
    result = roundTo(a * b, 2);
  }

  return {
    id: "r2c", block: 2, sub: "c", label: "2c",
    display: [`${fmtDec(a)} × ${fmtDec(b)} =`],
    answerType: "decimal",
    answer: fmtDec(result),
  };
}

function gen2d(): Question {
  // Percentage calculation
  const percentages = [5, 10, 15, 20, 25, 30, 40, 50, 75] as const;
  const pct = randChoice(percentages);

  // Pick base that gives clean result
  // result = base × pct / 100, so base must be divisible appropriately
  let base: number;
  if (pct === 25 || pct === 75) {
    base = randInt(4, 100) * 4; // divisible by 4
  } else if (pct === 5 || pct === 15) {
    base = randInt(2, 50) * 20; // divisible by 20
  } else {
    base = randInt(2, 200) * 10; // divisible by 10
  }

  const result = base * pct / 100;

  return {
    id: "r2d", block: 2, sub: "d", label: "2d",
    display: [`${pct}% van ${base} =`],
    answerType: "decimal",
    answer: fmtDec(result),
  };
}

function gen2e(): Question {
  // Exact decimal division: backward from quotient × divisor = dividend
  const places = randChoice([1, 2]);
  const factor = Math.pow(10, places);
  const quotientInt = randInt(10, 999);
  const quotient = quotientInt / factor;
  const divisor = randInt(2, 25);
  const dividend = roundTo(quotient * divisor, places);

  return {
    id: "r2e", block: 2, sub: "e", label: "2e",
    display: [`${fmtDec(dividend)} : ${divisor} =`],
    answerType: "decimal",
    answer: fmtDec(quotient),
  };
}

function gen2f(): Question {
  // Division with rounding
  const places = randChoice([1, 2]);
  const dividend = randInt(10, 999);
  const divisor = randInt(3, 19);

  // Ensure it doesn't divide evenly (otherwise it's not a rounding question)
  if (dividend % divisor === 0) {
    return gen2f(); // retry
  }

  const result = roundTo(dividend / divisor, places);

  return {
    id: "r2f", block: 2, sub: "f", label: "2f",
    display: [`${dividend} : ${divisor} =`],
    answerType: "decimal",
    answer: fmtDec(result),
    hint: `Rond af op ${places} ${places === 1 ? "decimaal" : "decimalen"}`,
  };
}

// ──── Verification Helper ─────────────────────────────────────────
// Every fraction question gets verified: we independently compute the
// answer from the displayed operands and assert it matches.
// This catches bugs where display ≠ internal representation.

/** Convert a QElement to an exact fraction [numerator, denominator] */
function qelToFrac(el: QElement): [number, number] {
  if (typeof el === "string") {
    // Parse integer from string like "8" or "2"
    const n = parseInt(el);
    if (!isNaN(n)) return [n, 1];
    return [0, 1]; // operators like " − " return 0 (won't be used in math)
  }
  // Fraction element: {w?, n, d}
  const whole = el.w ?? 0;
  return [whole * el.d + el.n, el.d];
}

// ──── Block 3: Breuken ─────────────────────────────────────────────

// Pool of "nice" improper fractions for multiplication
const FRAC_POOL: [number, number][] = [
  [3, 2],  // 1½
  [4, 3],  // 1⅓
  [5, 3],  // 1⅔
  [5, 4],  // 1¼
  [7, 4],  // 1¾
  [5, 2],  // 2½
  [7, 3],  // 2⅓
  [8, 3],  // 2⅔
  [9, 4],  // 2¼
  [11, 4], // 2¾
  [7, 2],  // 3½
  [6, 5],  // 1⅕
  [7, 5],  // 1⅖
  [8, 5],  // 1⅗
  [9, 5],  // 1⅘
  [2, 3],  // ⅔
  [3, 4],  // ¾
  [4, 5],  // ⅘
  [3, 5],  // ⅗
];

function gen3a(): Question {
  // Subtract mixed fractions with different denominators
  // Backward: pick result + subtrahend, compute minuend
  const denoms = [2, 3, 4, 5, 6, 8] as const;

  for (let attempt = 0; attempt < 50; attempt++) {
    const d1 = randChoice(denoms);
    let d2 = randChoice(denoms);
    while (d2 === d1) d2 = randChoice(denoms);

    const lcd = (d1 * d2) / gcd(d1, d2);
    if (lcd > 24) continue; // LCD too large

    // Result as fraction with lcd denominator
    const resultWhole = randInt(0, 5);
    const resultNum = randInt(1, lcd - 1);
    const resultFrac = resultWhole * lcd + resultNum; // numerator over lcd

    // Subtrahend
    const subWhole = randInt(1, 4);
    const subNum = randInt(1, lcd - 1);
    const subFrac = subWhole * lcd + subNum;

    // Minuend = result + subtrahend
    const minFrac = resultFrac + subFrac;
    const minWhole = Math.floor(minFrac / lcd);

    if (minWhole > 9) continue; // too large

    // Convert to original denominators for display
    // Minuend: express with d1
    const minN = minFrac * d1 / lcd;
    if (minN !== Math.round(minN)) continue;
    const minNClean = Math.round(minN);

    // Subtrahend: express with d2
    const subN = subFrac * d2 / lcd;
    if (subN !== Math.round(subN)) continue;
    const subNClean = Math.round(subN);

    // Result in simplified form
    const [rn, rd] = simplify(resultFrac, lcd);
    const ansStr = formatFracAnswer(rn, rd);

    // DISPLAY: use fracDisplay directly with original denominators
    // (NEVER reconstruct from fracToMixed — it simplifies and changes denominator!)
    const display: QElement[] = [
      fracDisplay(minNClean, d1),
      " − ",
      fracDisplay(subNClean, d2),
      " =",
    ];

    // VERIFY: independently compute answer from display values
    // minNClean/d1 − subNClean/d2 must equal rn/rd
    const verifyNum = minNClean * d2 - subNClean * d1;
    const verifyDen = d1 * d2;
    const [vn, vd] = simplify(verifyNum, verifyDen);
    if (vn !== rn || vd !== rd) continue; // skip if mismatch (should never happen, but safety net)

    return {
      id: "r3a", block: 3, sub: "a", label: "3a",
      display, answerType: "fraction", answer: ansStr,
    };
  }

  // Fallback: 5¾ − 2⅓ = verified answer
  const fbMinN = 23, fbMinD = 4, fbSubN = 7, fbSubD = 3;
  const fbResultNum = fbMinN * fbSubD - fbSubN * fbMinD;
  const fbResultDen = fbMinD * fbSubD;
  return {
    id: "r3a", block: 3, sub: "a", label: "3a",
    display: [fracDisplay(fbMinN, fbMinD), " − ", fracDisplay(fbSubN, fbSubD), " ="],
    answerType: "fraction",
    answer: formatFracAnswer(...simplify(fbResultNum, fbResultDen)),
  };
}

function gen3b(): Question {
  // Multiply 3 mixed fractions → clean result
  // Generate-and-check from pool
  for (let attempt = 0; attempt < 200; attempt++) {
    const f1 = randChoice(FRAC_POOL);
    const f2 = randChoice(FRAC_POOL);
    const f3 = randChoice(FRAC_POOL);

    const numProd = f1[0] * f2[0] * f3[0];
    const denProd = f1[1] * f2[1] * f3[1];
    const g = gcd(numProd, denProd);
    const rn = numProd / g;
    const rd = denProd / g;

    // At least 2 should be mixed numbers (numerator > denominator)
    const mixedCount = [f1, f2, f3].filter(f => f[0] > f[1]).length;
    if (mixedCount < 2) continue;

    // Avoid trivial fractions (like 1/1 or equivalent)
    if (f1[0] === f1[1] || f2[0] === f2[1] || f3[0] === f3[1]) continue;

    // Clean result: integer (1-30) or mixed number with small denominator
    if (rd === 1 && rn >= 1 && rn <= 30) {
      return make3bQuestion(f1, f2, f3, rn, rd);
    }
    if (rd <= 6 && rn <= 15 * rd) {
      return make3bQuestion(f1, f2, f3, rn, rd);
    }
  }

  // Fallback: 1½ × 1⅓ × 2½ = 5
  return make3bQuestion([3, 2], [4, 3], [5, 2], 5, 1);
}

function make3bQuestion(f1: [number, number], f2: [number, number], f3: [number, number], rn: number, rd: number): Question {
  // VERIFY: f1 × f2 × f3 must equal rn/rd
  const prodN = f1[0] * f2[0] * f3[0];
  const prodD = f1[1] * f2[1] * f3[1];
  const [vn, vd] = simplify(prodN, prodD);
  if (vn !== rn || vd !== rd) {
    // This should never happen, but if it does, use verified values
    return {
      id: "r3b", block: 3, sub: "b", label: "3b",
      display: [fracDisplay(f1[0], f1[1]), " × ", fracDisplay(f2[0], f2[1]), " × ", fracDisplay(f3[0], f3[1]), " ="],
      answerType: vd === 1 ? "integer" : "fraction",
      answer: formatFracAnswer(vn, vd),
    };
  }
  return {
    id: "r3b", block: 3, sub: "b", label: "3b",
    display: [fracDisplay(f1[0], f1[1]), " × ", fracDisplay(f2[0], f2[1]), " × ", fracDisplay(f3[0], f3[1]), " ="],
    answerType: rd === 1 ? "integer" : "fraction",
    answer: formatFracAnswer(rn, rd),
  };
}

function gen3c(): Question {
  // Fraction: a/b + c/d : e/f (division before addition)
  // Backward: pick result, pick a/b, compute division part
  for (let attempt = 0; attempt < 100; attempt++) {
    // Pick simple fractions for the division part
    const e = randChoice(FRAC_POOL.filter(f => f[0] <= 5 && f[1] <= 5));
    const f = randChoice(FRAC_POOL.filter(f2 => f2[0] <= 5 && f2[1] <= 5));

    // c/d ÷ e/f = c/d × f/e = (c×f[1]) / (d×f[0]) ... wait, e and f are fraction tuples
    // Let me use simpler fractions
    const cn = randInt(1, 5), cd = randChoice([2, 3, 4, 5, 6]);
    const en = randInt(1, 5), ed = randChoice([2, 3, 4, 5, 6]);

    // c/d ÷ e/f = (cn/cd) ÷ (en/ed) = (cn × ed) / (cd × en)
    const divNum = cn * ed;
    const divDen = cd * en;
    const [divRn, divRd] = simplify(divNum, divDen);

    if (divRd > 12) continue;

    // Pick a/b
    const an = randInt(1, 5), ad = randChoice([2, 3, 4, 5, 6]);

    // Result = a/b + divResult
    // = (an/ad) + (divRn/divRd)
    const lcd = (ad * divRd) / gcd(ad, divRd);
    if (lcd > 24) continue;

    const resultNum = an * (lcd / ad) + divRn * (lcd / divRd);
    const [rn, rd] = simplify(resultNum, lcd);

    if (rd > 8 || rn > 50) continue;
    if (rn <= 0) continue;

    return {
      id: "r3c", block: 3, sub: "c", label: "3c",
      display: [fracDisplay(an, ad), " + ", fracDisplay(cn, cd), " : ", fracDisplay(en, ed), " ="],
      answerType: "fraction",
      answer: formatFracAnswer(rn, rd),
    };
  }

  // Fallback
  return {
    id: "r3c", block: 3, sub: "c", label: "3c",
    display: [fracDisplay(2, 3), " + ", fracDisplay(1, 4), " : ", fracDisplay(1, 2), " ="],
    answerType: "fraction",
    answer: formatFracAnswer(2 * 2 + 1 * 2 * 3, 3 * 2 * 2), // 2/3 + 1/2 = 2/3 + 1/2 = 7/6
  };
}

function gen3d(): Question {
  // Chain division: a ÷ b ÷ c (all fractions/mixed numbers)
  // Backward: pick result, pick b and c, compute a = result × b × c
  for (let attempt = 0; attempt < 100; attempt++) {
    // Pick result as clean fraction
    const resultPool: [number, number][] = [
      [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5],
      [1, 6], [5, 6], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
      [3, 2], [5, 2], [4, 3], [5, 3], [5, 4], [7, 4],
    ];
    const [rn, rd] = randChoice(resultPool);

    // Pick b and c from pool (mixed numbers preferred)
    const b = randChoice(FRAC_POOL.filter(f => f[0] <= 8));
    const c = randChoice([2, 3, 4, 5]); // c is often just an integer

    // a = result × b × c = (rn × b[0] × c) / (rd × b[1])
    const aN = rn * b[0] * c;
    const aD = rd * b[1];
    const [an, ad] = simplify(aN, aD);

    if (ad > 8 || an > 40) continue;
    if (an <= 0) continue;

    // Verify: a ÷ b ÷ c = (an/ad) × (b[1]/b[0]) × (1/c) = (an × b[1]) / (ad × b[0] × c)
    const checkN = an * b[1];
    const checkD = ad * b[0] * c;
    const [cn2, cd2] = simplify(checkN, checkD);
    if (cn2 !== rn || cd2 !== rd) continue; // sanity check

    return {
      id: "r3d", block: 3, sub: "d", label: "3d",
      display: [fracDisplay(an, ad), " : ", fracDisplay(b[0], b[1]), " : ", `${c}`, " ="],
      answerType: rd === 1 ? "integer" : "fraction",
      answer: formatFracAnswer(rn, rd),
    };
  }

  // Fallback: 3⅓ : 1⅔ : 2 = 1
  return {
    id: "r3d", block: 3, sub: "d", label: "3d",
    display: [fracDisplay(10, 3), " : ", fracDisplay(5, 3), " : ", "2", " ="],
    answerType: "integer",
    answer: "1",
  };
}

// ──── Block 4: Maateenheden ────────────────────────────────────────

interface UnitConversion {
  from: string;
  to: string;
  factor: number; // multiply "from" by this to get "to"
}

const LENGTH_CONVERSIONS: UnitConversion[] = [
  { from: "km", to: "m", factor: 1000 },
  { from: "m", to: "cm", factor: 100 },
  { from: "m", to: "mm", factor: 1000 },
  { from: "cm", to: "mm", factor: 10 },
  { from: "km", to: "cm", factor: 100000 },
  { from: "m", to: "km", factor: 0.001 },
  { from: "cm", to: "m", factor: 0.01 },
  { from: "mm", to: "cm", factor: 0.1 },
  { from: "mm", to: "m", factor: 0.001 },
  { from: "dm", to: "cm", factor: 10 },
  { from: "m", to: "dm", factor: 10 },
];

const AREA_CONVERSIONS: UnitConversion[] = [
  { from: "m²", to: "cm²", factor: 10000 },
  { from: "cm²", to: "mm²", factor: 100 },
  { from: "km²", to: "m²", factor: 1000000 },
  { from: "m²", to: "mm²", factor: 1000000 },
  { from: "cm²", to: "m²", factor: 0.0001 },
  { from: "mm²", to: "cm²", factor: 0.01 },
  { from: "ha", to: "m²", factor: 10000 },
  { from: "m²", to: "ha", factor: 0.0001 },
  { from: "km²", to: "ha", factor: 100 },
];

const VOLUME_CONVERSIONS: UnitConversion[] = [
  { from: "m³", to: "dm³", factor: 1000 },
  { from: "dm³", to: "cm³", factor: 1000 },
  { from: "m³", to: "L", factor: 1000 },
  { from: "L", to: "mL", factor: 1000 },
  { from: "dm³", to: "L", factor: 1 },
  { from: "cm³", to: "mL", factor: 1 },
  { from: "L", to: "dm³", factor: 1 },
  { from: "mL", to: "cm³", factor: 1 },
  { from: "cm³", to: "dm³", factor: 0.001 },
  { from: "L", to: "m³", factor: 0.001 },
];

function genUnitQuestion(conversions: UnitConversion[], subLabel: string): Question {
  const conv = randChoice(conversions);

  // Pick a value that gives clean result
  let value: number;
  let result: number;

  if (conv.factor >= 1) {
    // Multiplying: pick a decimal value
    value = randChoice([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 10, 12, 15, 25, 100]);
    if (conv.factor >= 10000) value = randChoice([0.5, 1, 1.5, 2, 2.5, 3, 5]);
    result = value * conv.factor;
  } else {
    // Dividing: pick integer values that give clean decimal results
    const invFactor = 1 / conv.factor;
    value = randInt(1, 20) * invFactor / randChoice([1, 2, 4, 5, 10]);
    value = Math.round(value);
    result = roundTo(value * conv.factor, 6);
  }

  // Clean up floating point
  result = parseFloat(result.toPrecision(10));

  return {
    id: `r4${subLabel}`, block: 4, sub: subLabel, label: `4${subLabel}`,
    display: [`${fmtDec(value)} ${conv.from} = … ${conv.to}`],
    answerType: "decimal",
    answer: fmtDec(result),
  };
}

function gen4a(): Question { return genUnitQuestion(LENGTH_CONVERSIONS, "a"); }
function gen4b(): Question { return genUnitQuestion(AREA_CONVERSIONS, "b"); }
function gen4c(): Question { return genUnitQuestion(VOLUME_CONVERSIONS, "c"); }

// ──── Public API ───────────────────────────────────────────────────

/** Final safety net: verify fraction questions by re-computing from display */
function verifyQuestion(q: Question): Question {
  if (q.block !== 3) return q; // only verify fraction block

  // Extract operands and operators from display
  const operands: [number, number][] = [];
  const operators: string[] = [];
  for (const el of q.display) {
    if (typeof el === "string") {
      const trimmed = el.trim();
      if (trimmed === "+" || trimmed === "−" || trimmed === "×" || trimmed === ":") {
        operators.push(trimmed);
      } else if (trimmed === "=" || trimmed === "") {
        // skip
      } else {
        // Try parse integer
        const n = parseInt(trimmed);
        if (!isNaN(n)) operands.push([n, 1]);
      }
    } else {
      operands.push(qelToFrac(el));
    }
  }

  // For 3a (subtraction): a − b = answer
  if (q.sub === "a" && operands.length === 2 && operators[0] === "−") {
    const [an, ad] = operands[0];
    const [bn, bd] = operands[1];
    const resultN = an * bd - bn * ad;
    const resultD = ad * bd;
    const [rn, rd] = simplify(resultN, resultD);
    const verified = formatFracAnswer(rn, rd);
    if (verified !== q.answer) {
      return { ...q, answer: verified };
    }
  }

  // For 3b (multiplication): a × b × c = answer
  if (q.sub === "b" && operands.length === 3) {
    let n = 1, d = 1;
    for (const [on, od] of operands) { n *= on; d *= od; }
    const [rn, rd] = simplify(n, d);
    const verified = formatFracAnswer(rn, rd);
    if (verified !== q.answer) {
      return { ...q, answer: verified, answerType: rd === 1 ? "integer" : "fraction" };
    }
  }

  // For 3c (addition + division with order of operations): a + b : c = answer
  if (q.sub === "c" && operands.length === 3 && operators[0] === "+" && operators[1] === ":") {
    const [an, ad] = operands[0];
    const [bn, bd] = operands[1];
    const [cn, cd] = operands[2];
    // b : c = (bn/bd) ÷ (cn/cd) = (bn*cd) / (bd*cn)
    const divN = bn * cd;
    const divD = bd * cn;
    // a + div = (an/ad) + (divN/divD)
    const lc = (ad * divD) / gcd(ad, divD);
    const sumN = an * (lc / ad) + divN * (lc / divD);
    const [rn, rd] = simplify(sumN, lc);
    const verified = formatFracAnswer(rn, rd);
    if (verified !== q.answer) {
      return { ...q, answer: verified };
    }
  }

  // For 3d (chain division): a : b : c = answer
  if (q.sub === "d" && operands.length === 3 && operators[0] === ":" && operators[1] === ":") {
    const [an, ad] = operands[0];
    const [bn, bd] = operands[1];
    const [cn, cd] = operands[2];
    // a ÷ b = (an*bd) / (ad*bn)
    // then ÷ c = (an*bd*cd) / (ad*bn*cn)
    const rN = an * bd * cd;
    const rD = ad * bn * cn;
    const [rn, rd] = simplify(rN, rD);
    const verified = formatFracAnswer(rn, rd);
    if (verified !== q.answer) {
      return { ...q, answer: verified, answerType: rd === 1 ? "integer" : "fraction" };
    }
  }

  return q;
}

export function generateBlock(block: 1 | 2 | 3 | 4): Question[] {
  const generators: Record<number, (() => Question)[]> = {
    1: [gen1a, gen1b, gen1c, gen1d],
    2: [gen2a, gen2b, gen2c, gen2d, gen2e, gen2f],
    3: [gen3a, gen3b, gen3c, gen3d],
    4: [gen4a, gen4b, gen4c],
  };
  return generators[block].map((gen) => verifyQuestion(gen()));
}

export function generateFullTest(): Question[] {
  return [
    ...generateBlock(1),
    ...generateBlock(2),
    ...generateBlock(3),
    ...generateBlock(4),
  ];
}

// ──── Answer Checker ───────────────────────────────────────────────

/** Normalize a user-entered number string */
function normalizeNumber(s: string): number | null {
  s = s.trim().replace(",", ".").replace(/\s+/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** Parse a fraction string like "3 1/2", "7/2", "3.5", "3,5" */
function parseFraction(s: string): [number, number] | null {
  s = s.trim();

  // Try "whole num/den" format
  const mixedMatch = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const w = parseInt(mixedMatch[1]);
    const n = parseInt(mixedMatch[2]);
    const d = parseInt(mixedMatch[3]);
    if (d === 0) return null;
    const sign = w < 0 ? -1 : 1;
    return [sign * (Math.abs(w) * d + n), d];
  }

  // Try "num/den" format
  const fracMatch = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const n = parseInt(fracMatch[1]);
    const d = parseInt(fracMatch[2]);
    if (d === 0) return null;
    return [n, d];
  }

  // Try decimal/integer
  const num = normalizeNumber(s);
  if (num !== null) {
    // Convert to fraction: handle up to 4 decimal places
    const places = (s.replace(",", ".").split(".")[1] || "").length;
    const den = Math.pow(10, places);
    return [Math.round(num * den), den];
  }

  return null;
}

export function checkAnswer(userInput: string, question: Question): boolean {
  const input = userInput.trim();
  if (!input) return false;

  if (question.answerType === "integer") {
    const userNum = normalizeNumber(input);
    const correctNum = normalizeNumber(question.answer);
    return userNum !== null && correctNum !== null && userNum === correctNum;
  }

  if (question.answerType === "decimal") {
    const userNum = normalizeNumber(input);
    const correctNum = normalizeNumber(question.answer.replace(",", "."));
    if (userNum === null || correctNum === null) return false;
    // Allow small floating point tolerance
    return Math.abs(userNum - correctNum) < 0.005;
  }

  if (question.answerType === "fraction") {
    // Parse both as fractions and compare
    const userFrac = parseFraction(input);
    const correctFrac = parseFraction(question.answer);
    if (!userFrac || !correctFrac) return false;

    const [un, ud] = simplify(userFrac[0], userFrac[1]);
    const [cn, cd] = simplify(correctFrac[0], correctFrac[1]);
    return un === cn && ud === cd;
  }

  return false;
}
