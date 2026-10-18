// Small dense linear algebra for the in-browser demos (matrices of a few hundred
// entries per side at most). Row-major number[][]; no external dependencies.

export type Mat = number[][];

export function zeros(r: number, c: number): Mat {
  return Array.from({ length: r }, () => new Array<number>(c).fill(0));
}

export function eye(n: number): Mat {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m[i]![i] = 1;
  return m;
}

export function transpose(a: Mat): Mat {
  return a[0]!.map((_, j) => a.map((row) => row[j]!));
}

export function matmul(a: Mat, b: Mat): Mat {
  const n = a.length;
  const k = b.length;
  const m = b[0]!.length;
  const out = zeros(n, m);
  for (let i = 0; i < n; i++) {
    const ai = a[i]!;
    const oi = out[i]!;
    for (let p = 0; p < k; p++) {
      const v = ai[p]!;
      if (v === 0) continue;
      const bp = b[p]!;
      for (let j = 0; j < m; j++) oi[j]! += v * bp[j]!;
    }
  }
  return out;
}

export function matvec(a: Mat, x: number[]): number[] {
  return a.map((row) => row.reduce((s, v, j) => s + v * x[j]!, 0));
}

export function add(a: Mat, b: Mat, scaleB = 1): Mat {
  return a.map((row, i) => row.map((v, j) => v + scaleB * b[i]![j]!));
}

/** Inverse by Gauss–Jordan elimination with partial pivoting. */
export function inverse(a: Mat): Mat {
  const n = a.length;
  const m = a.map((row, i) => [...row, ...eye(n)[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r]![c]!) > Math.abs(m[p]![c]!)) p = r;
    if (Math.abs(m[p]![c]!) < 1e-12) throw new Error("Singular matrix");
    [m[c], m[p]] = [m[p]!, m[c]!];
    const piv = m[c]![c]!;
    for (let j = 0; j < 2 * n; j++) m[c]![j]! /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r]![c]!;
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) m[r]![j]! -= f * m[c]![j]!;
    }
  }
  return m.map((row) => row.slice(n));
}

/** Ridge regression: W minimising |X W − Y|² + λ|W|², with X rows as samples. */
export function ridge(X: Mat, Y: Mat, lambda: number): Mat {
  const Xt = transpose(X);
  const XtX = matmul(Xt, X);
  for (let i = 0; i < XtX.length; i++) XtX[i]![i]! += lambda;
  return matmul(inverse(XtX), matmul(Xt, Y));
}

/** Eigen-decomposition of a symmetric matrix (cyclic Jacobi). Eigenvalues descending; vectors as columns. */
export function symEig(a: Mat, sweeps = 60): { values: number[]; vectors: Mat } {
  const n = a.length;
  const A = a.map((r) => [...r]);
  const V = eye(n);
  for (let s = 0; s < sweeps; s++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p]![q]! ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = A[p]![q]!;
        if (Math.abs(apq) < 1e-15) continue;
        const theta = (A[q]![q]! - A[p]![p]!) / (2 * apq);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const sn = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k]![p]!;
          const akq = A[k]![q]!;
          A[k]![p] = c * akp - sn * akq;
          A[k]![q] = sn * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p]![k]!;
          const aqk = A[q]![k]!;
          A[p]![k] = c * apk - sn * aqk;
          A[q]![k] = sn * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k]![p]!;
          const vkq = V[k]![q]!;
          V[k]![p] = c * vkp - sn * vkq;
          V[k]![q] = sn * vkp + c * vkq;
        }
      }
    }
  }
  const order = A.map((r, i) => [r[i]!, i] as const).sort((x, y) => y[0] - x[0]);
  return { values: order.map(([v]) => v), vectors: V.map((row) => order.map(([, i]) => row[i]!)) };
}

export function columnMeans(X: Mat): number[] {
  const m = new Array<number>(X[0]!.length).fill(0);
  for (const row of X) row.forEach((v, j) => (m[j]! += v / X.length));
  return m;
}

export function centre(X: Mat, means = columnMeans(X)): Mat {
  return X.map((row) => row.map((v, j) => v - means[j]!));
}

/** Coefficient of determination, averaged over output columns. */
export function r2(truth: Mat, pred: Mat): number {
  const k = truth[0]!.length;
  let total = 0;
  for (let j = 0; j < k; j++) {
    const mean = truth.reduce((s, r) => s + r[j]!, 0) / truth.length;
    let ssRes = 0;
    let ssTot = 0;
    truth.forEach((r, i) => {
      ssRes += (r[j]! - pred[i]![j]!) ** 2;
      ssTot += (r[j]! - mean) ** 2;
    });
    total += 1 - ssRes / ssTot;
  }
  return total / k;
}
