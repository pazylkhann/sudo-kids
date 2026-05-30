// Sudoku engine: supports 4x4 (2x2 boxes), 6x6 (2x3 boxes), 9x9 (3x3 boxes).
// Pure functions, deterministic via seeded PRNG.

export type Size = 4 | 6 | 9;
export type Board = number[][]; // 0 = empty
export type Difficulty = "easy" | "medium" | "hard";

export interface BoxDims {
  rows: number;
  cols: number;
}

export const BOX: Record<Size, BoxDims> = {
  4: { rows: 2, cols: 2 },
  6: { rows: 2, cols: 3 },
  9: { rows: 3, cols: 3 },
};

// --- Seeded PRNG (mulberry32) ---
export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function empty(size: Size): Board {
  return Array.from({ length: size }, () => Array(size).fill(0));
}
export function clone(b: Board): Board {
  return b.map((r) => r.slice());
}

export function isValidPlacement(b: Board, r: number, c: number, n: number, size: Size): boolean {
  for (let i = 0; i < size; i++) {
    if (b[r][i] === n && i !== c) return false;
    if (b[i][c] === n && i !== r) return false;
  }
  const { rows: br, cols: bc } = BOX[size];
  const r0 = Math.floor(r / br) * br;
  const c0 = Math.floor(c / bc) * bc;
  for (let i = r0; i < r0 + br; i++) {
    for (let j = c0; j < c0 + bc; j++) {
      if (b[i][j] === n && !(i === r && j === c)) return false;
    }
  }
  return true;
}

// Solver: counts up to 2 solutions for uniqueness check.
export function solve(board: Board, size: Size, limit = 2, rand?: () => number): { count: number; solution: Board | null } {
  const b = clone(board);
  let count = 0;
  let solution: Board | null = null;

  function findEmpty(): [number, number] | null {
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (b[r][c] === 0) return [r, c];
    return null;
  }
  function back(): boolean {
    const pos = findEmpty();
    if (!pos) {
      count++;
      if (!solution) solution = clone(b);
      return count >= limit;
    }
    const [r, c] = pos;
    const nums = rand
      ? shuffle(Array.from({ length: size }, (_, i) => i + 1), rand)
      : Array.from({ length: size }, (_, i) => i + 1);
    for (const n of nums) {
      if (isValidPlacement(b, r, c, n, size)) {
        b[r][c] = n;
        if (back()) return true;
        b[r][c] = 0;
      }
    }
    return false;
  }
  back();
  return { count, solution };
}

export function generateSolution(size: Size, rand: () => number): Board {
  const b = empty(size);
  function fill(): boolean {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (b[r][c] !== 0) continue;
        const nums = shuffle(Array.from({ length: size }, (_, i) => i + 1), rand);
        for (const n of nums) {
          if (isValidPlacement(b, r, c, n, size)) {
            b[r][c] = n;
            if (fill()) return true;
            b[r][c] = 0;
          }
        }
        return false;
      }
    }
    return true;
  }
  fill();
  return b;
}

// Difficulty: number of cells to remove. Keeps unique solution.
const REMOVE_TARGET: Record<Size, Record<Difficulty, number>> = {
  4: { easy: 6, medium: 8, hard: 10 },
  6: { easy: 14, medium: 18, hard: 22 },
  9: { easy: 36, medium: 46, hard: 54 },
};

export interface Puzzle {
  size: Size;
  difficulty: Difficulty;
  seed: string;
  given: Board;
  solution: Board;
}

export function generatePuzzle(size: Size, difficulty: Difficulty, seed: string): Puzzle {
  const rand = rng(hashSeed(seed));
  const solution = generateSolution(size, rand);
  const board = clone(solution);

  const cells = shuffle(
    Array.from({ length: size * size }, (_, i) => i),
    rand
  );

  const target = REMOVE_TARGET[size][difficulty];
  let removed = 0;

  for (const idx of cells) {
    if (removed >= target) break;
    const r = Math.floor(idx / size);
    const c = idx % size;
    const backup = board[r][c];
    if (backup === 0) continue;
    board[r][c] = 0;
    // Ensure unique. Use small sample at higher sizes for speed.
    const { count } = solve(board, size, 2);
    if (count !== 1) {
      board[r][c] = backup;
    } else {
      removed++;
    }
  }

  return { size, difficulty, seed, given: board, solution };
}

export function dailySeed(date: string): string {
  return `daily-${date}`;
}

export function conflicts(board: Board, size: Size): Set<string> {
  const bad = new Set<string>();
  // rows & cols
  for (let i = 0; i < size; i++) {
    const rowMap = new Map<number, number[]>();
    const colMap = new Map<number, number[]>();
    for (let j = 0; j < size; j++) {
      const rv = board[i][j];
      if (rv) (rowMap.get(rv) ?? rowMap.set(rv, []).get(rv)!).push(j);
      const cv = board[j][i];
      if (cv) (colMap.get(cv) ?? colMap.set(cv, []).get(cv)!).push(j);
    }
    for (const [, idxs] of rowMap) if (idxs.length > 1) for (const j of idxs) bad.add(`${i},${j}`);
    for (const [, idxs] of colMap) if (idxs.length > 1) for (const j of idxs) bad.add(`${j},${i}`);
  }
  const { rows: br, cols: bc } = BOX[size];
  for (let R = 0; R < size; R += br) {
    for (let C = 0; C < size; C += bc) {
      const map = new Map<number, [number, number][]>();
      for (let r = R; r < R + br; r++) for (let c = C; c < C + bc; c++) {
        const v = board[r][c];
        if (v) (map.get(v) ?? map.set(v, []).get(v)!).push([r, c]);
      }
      for (const [, cells] of map) if (cells.length > 1) for (const [r, c] of cells) bad.add(`${r},${c}`);
    }
  }
  return bad;
}

export function isComplete(board: Board, size: Size): boolean {
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!board[r][c]) return false;
  return conflicts(board, size).size === 0;
}

export function candidates(board: Board, r: number, c: number, size: Size): number[] {
  if (board[r][c] !== 0) return [];
  const out: number[] = [];
  for (let n = 1; n <= size; n++) if (isValidPlacement(board, r, c, n, size)) out.push(n);
  return out;
}

// Find a logical next-step hint: cell with single candidate (naked single).
export interface Hint {
  r: number;
  c: number;
  value: number;
  technique: "naked-single" | "hidden-single" | "guess";
}

export function findHint(board: Board, size: Size): Hint | null {
  // 1. Naked single
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== 0) continue;
      const cs = candidates(board, r, c, size);
      if (cs.length === 1) return { r, c, value: cs[0], technique: "naked-single" };
    }
  }
  // 2. Hidden single in row/col/box
  // For each unit, for each number, if only one cell can hold it -> hint.
  const units: [number, number][][] = [];
  for (let i = 0; i < size; i++) units.push(Array.from({ length: size }, (_, j) => [i, j]));
  for (let i = 0; i < size; i++) units.push(Array.from({ length: size }, (_, j) => [j, i]));
  const { rows: br, cols: bc } = BOX[size];
  for (let R = 0; R < size; R += br) for (let C = 0; C < size; C += bc) {
    const u: [number, number][] = [];
    for (let r = R; r < R + br; r++) for (let c = C; c < C + bc; c++) u.push([r, c]);
    units.push(u);
  }
  for (const unit of units) {
    for (let n = 1; n <= size; n++) {
      const places: [number, number][] = [];
      let alreadyPlaced = false;
      for (const [r, c] of unit) {
        if (board[r][c] === n) { alreadyPlaced = true; break; }
        if (board[r][c] === 0 && isValidPlacement(board, r, c, n, size)) places.push([r, c]);
      }
      if (alreadyPlaced) continue;
      if (places.length === 1) return { r: places[0][0], c: places[0][1], value: n, technique: "hidden-single" };
    }
  }
  // 3. Fallback: solve and reveal any empty cell.
  const { solution } = solve(board, size, 1);
  if (solution) {
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++)
      if (board[r][c] === 0) return { r, c, value: solution[r][c], technique: "guess" };
  }
  return null;
}
