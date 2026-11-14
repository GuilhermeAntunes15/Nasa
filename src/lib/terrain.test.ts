import { describe, expect, it } from "vitest";
import snapshot from "../../data/power-snapshot.json";
import { toMonthly } from "./climate";
import { parsePowerResponse } from "./power";
import { clampView, project, RAIN_STOPS, rainColor, terrainGrid, terrainScene, VIEW_RADIUS } from "./terrain";

const real = toMonthly(
  parsePowerResponse(snapshot.response, {
    requestUrl: snapshot.requestUrl,
    retrievedAt: snapshot.retrievedAt,
    mode: "snapshot",
  }).daily,
);

const fixture = [
  ...Array.from({ length: 12 }, (_, i) => ({ year: 2020, month: i + 1, precipMm: i === 2 ? null : i === 5 ? 0 : 10 * (i + 1) })),
  ...Array.from({ length: 11 }, (_, i) => ({ year: 2021, month: i + 1, precipMm: i === 0 ? 150 : 50 })),
];

const kinds = (faces: ReturnType<typeof terrainScene>["faces"], cell: number) =>
  faces.filter((f) => f.cell === cell).map((f) => f.kind);

describe("terrainGrid", () => {
  it("builds a row-major year × month grid that keeps nulls and zeros", () => {
    const grid = terrainGrid(fixture);
    expect(grid.years).toEqual([2020, 2021]);
    expect(grid.cells).toHaveLength(24);
    expect(grid.cells[13]).toEqual({ year: 2021, month: 2, precipMm: 50 });
    expect(grid.cells[2].precipMm).toBeNull();
    expect(grid.cells[5].precipMm).toBe(0);
    expect(grid.cells[23]).toEqual({ year: 2021, month: 12, precipMm: null });
    expect(grid.gaps).toBe(2);
    expect(grid.maxMm).toBe(150);
    expect(grid.wettest).toEqual({ year: 2021, month: 1, precipMm: 150 });
  });

  it("covers 2015–2025 in the snapshot", () => {
    const grid = terrainGrid(real);
    expect(grid.years[0]).toBe(2015);
    expect(grid.years.at(-1)).toBe(2025);
    expect(grid.cells).toHaveLength(132);
    expect(grid.maxMm).toBe(Math.max(...real.flatMap((m) => (m.precipMm === null ? [] : [m.precipMm]))));
  });
});

describe("project", () => {
  it("rotates by yaw and tilts by pitch", () => {
    const check = (p: ReturnType<typeof project>, x: number, y: number, v: number) => {
      expect(p.x).toBeCloseTo(x, 10);
      expect(p.y).toBeCloseTo(y, 10);
      expect(p.v).toBeCloseTo(v, 10);
    };
    check(project([1, 0, 0], { yaw: 0, pitch: 90 }), 1, 0, 0);
    check(project([0, 1, 0], { yaw: 0, pitch: 90 }), 0, -1, 1);
    check(project([0, 0, 1], { yaw: 0, pitch: 0 }), 0, -1, 0);
    check(project([1, 0, 0], { yaw: 90, pitch: 0 }), 0, 0, 1);
  });
});

describe("clampView", () => {
  it("wraps yaw into [-180, 180) and clamps pitch", () => {
    expect(clampView({ yaw: 190, pitch: 35 }).yaw).toBe(-170);
    expect(clampView({ yaw: -190, pitch: 35 }).yaw).toBe(170);
    expect(clampView({ yaw: 180, pitch: 35 }).yaw).toBe(-180);
    expect(clampView({ yaw: 0, pitch: 5 }).pitch).toBe(10);
    expect(clampView({ yaw: 0, pitch: 95 }).pitch).toBe(80);
  });
});

describe("rainColor", () => {
  it("hits the four stops exactly and clamps the input", () => {
    expect([0, 1 / 3, 2 / 3, 1].map((t) => rainColor(t))).toEqual([...RAIN_STOPS]);
    expect(rainColor(-1)).toBe(RAIN_STOPS[0]);
    expect(rainColor(2)).toBe(RAIN_STOPS[3]);
    expect(rainColor(NaN)).toBe(RAIN_STOPS[0]);
    expect(rainColor(0.2, 1)).toBe("#081b2c");
  });
});

describe("terrainScene", () => {
  it("draws far rows first and each top after its sides", () => {
    const { faces } = terrainScene(terrainGrid(real), { yaw: 0, pitch: 35 });
    expect(faces[0].cell).toBeLessThan(12);
    expect(faces.at(-1)).toMatchObject({ cell: 131, kind: "top" });
    const seen = new Set<number>();
    for (const f of faces) {
      expect(seen.has(f.cell)).toBe(false);
      if (f.kind === "top" || f.kind === "gap") seen.add(f.cell);
    }
  });

  it("shows only the faces that point at the viewer", () => {
    const grid = terrainGrid(fixture);
    for (const yaw of [-30, 150]) {
      const { faces } = terrainScene(grid, { yaw, pitch: 35 });
      expect(kinds(faces, 0).sort()).toEqual(["side-x", "side-y", "top"]);
      expect(kinds(faces, 5)).toEqual(["top"]);
      expect(kinds(faces, 2)).toEqual(["gap"]);
      expect(faces.find((f) => f.cell === 2)?.fill).toBeNull();
    }
    for (const yaw of [0, 90, -180]) {
      const { faces } = terrainScene(grid, { yaw, pitch: 35 });
      expect(kinds(faces, 0)).toHaveLength(2);
      expect(kinds(faces, 0)).toContain("top");
    }
  });

  it("stays inside the view box at every angle", () => {
    const grid = terrainGrid(real);
    const limit = VIEW_RADIUS - 1;
    for (let yaw = -180; yaw <= 180; yaw += 15) {
      for (const pitch of [10, 45, 80]) {
        const scene = terrainScene(grid, { yaw, pitch });
        const coords = [scene.floor, ...scene.faces.map((f) => f.points)]
          .flatMap((p) => p.split(/[ ,]/).map(Number))
          .concat([...scene.monthTicks, ...scene.yearTicks].flatMap((t) => [t.x, t.y]));
        for (const n of coords) {
          expect(Number.isFinite(n)).toBe(true);
          expect(Math.abs(n)).toBeLessThanOrEqual(limit);
        }
      }
    }
    const zeros = terrainScene(terrainGrid(real.map((m) => ({ ...m, precipMm: 0 }))), { yaw: 30, pitch: 35 });
    expect(JSON.stringify(zeros)).not.toContain("NaN");
  });
});
