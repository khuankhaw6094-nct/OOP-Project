"use client";

const GRID = 21;
const CELL = 9;
const MARGIN = 2;

function cellBlack(i: number, j: number): boolean {
  const isFinder =
    (i < 7 && j < 7) || (i < 7 && j >= GRID - 7) || (i >= GRID - 7 && j < 7);
  if (isFinder) {
    const inFinder = j < 7 || i < 7;
    if (inFinder) {
      const localI = i >= GRID - 7 ? i - (GRID - 7) : i;
      const localJ = j >= GRID - 7 ? j - (GRID - 7) : j;
      const ring = localI === 0 || localI === 6 || localJ === 0 || localJ === 6;
      const core =
        localI >= 2 && localI <= 4 && localJ >= 2 && localJ <= 4;
      return ring || core;
    }
    return true;
  }
  return (i * 11 + j * 7 + i * i + j * j) % 9 < 4;
}

export function MockQr() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${GRID + MARGIN * 2}, ${CELL}px)`,
        gap: 1,
        padding: MARGIN,
        background: "#fff",
        borderRadius: 10,
        border: "1px solid var(--border)",
        margin: "0 auto",
      }}
    >
      {Array.from({ length: GRID + MARGIN * 2 }).map((_, row) =>
        Array.from({ length: GRID + MARGIN * 2 }).map((_, col) => {
          const inside = row >= MARGIN && row < MARGIN + GRID && col >= MARGIN && col < MARGIN + GRID;
          const black = inside && cellBlack(row - MARGIN, col - MARGIN);
          return (
            <div
              key={`${row}-${col}`}
              style={{
                width: CELL,
                height: CELL,
                background: black ? "#111" : "#fff",
              }}
            />
          );
        })
      )}
    </div>
  );
}