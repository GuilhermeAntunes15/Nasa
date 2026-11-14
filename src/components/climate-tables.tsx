import { toAnnualPrecip, toMonthly, toMonthlyNormals, windowTotals } from "@/lib/climate";
import type { ClimateDaily } from "@/lib/types";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const SOY_WINDOW = { label: "Soybean window (1 Oct–23 Jan)", from: { month: 10, day: 1 }, to: { month: 1, day: 23 } };
export const SECOND_WINDOW = { label: "Second-crop window (1 Feb–5 Jun)", from: { month: 2, day: 1 }, to: { month: 6, day: 5 } };

export const num = (x: number | null, digits = 0) => (x === null ? "—" : x.toFixed(digits));

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function climateSeries(daily: ClimateDaily) {
  const soy = windowTotals(daily, SOY_WINDOW.from, SOY_WINDOW.to);
  const second = windowTotals(daily, SECOND_WINDOW.from, SECOND_WINDOW.to);
  return {
    annual: toAnnualPrecip(daily).filter((a) => a.precipMm !== null),
    normals: toMonthlyNormals(toMonthly(daily)).map((n) => ({
      ...n,
      name: MONTHS[n.month - 1],
    })),
    seasons: soy.map((s, i) => ({ season: s.season, soybean: s.precipMm, second: second[i]?.precipMm ?? null })),
  };
}

export function windowSentences(seasons: ReturnType<typeof climateSeries>["seasons"]) {
  return [
    { key: "soybean" as const, label: SOY_WINDOW.label },
    { key: "second" as const, label: SECOND_WINDOW.label },
  ].map(({ key, label }) => {
    const rows = seasons.flatMap((s) => (s[key] === null ? [] : [{ season: s.season, mm: s[key] }]));
    if (!rows.length) return `${label}: no complete seasons.`;
    const driest = rows.reduce((d, r) => (r.mm < d.mm ? r : d));
    return `${label}: median rainfall ${median(rows.map((r) => r.mm)).toFixed(0)} mm over ${rows.length} seasons; driest season ${driest.season} with ${driest.mm.toFixed(0)} mm.`;
  });
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div>
      <p aria-hidden="true" className="mb-1 text-sm font-medium break-after-avoid">
        {caption}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b">
              {columns.map((c) => (
                <th key={c} scope="col" className="px-2 py-1 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])} className="border-b last:border-0">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="px-2 py-1 font-normal">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="px-2 py-1">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function climateTables(series: ReturnType<typeof climateSeries>) {
  return {
    annual: {
      caption: "Annual rainfall, complete years (mm/yr)",
      columns: ["Year", "Rainfall (mm/yr)"],
      rows: series.annual.map((a) => [a.year, num(a.precipMm)]),
    },
    monthlyPrecip: {
      caption: "Monthly rainfall climatology, 2015–2025 (mm/month)",
      columns: ["Month", "Mean", "Min", "Max", "Years"],
      rows: series.normals.map((n) => [n.name, num(n.precipMeanMm), num(n.precipMinMm), num(n.precipMaxMm), n.yearsUsed]),
    },
    temperature: {
      caption: "Monthly temperature, 2015–2025 (°C)",
      columns: ["Month", "Mean T2M", "Mean Tmax", "Mean Tmin", "Highest Tmax", "Lowest Tmin"],
      rows: series.normals.map((n) => [
        n.name,
        num(n.t2mMean, 1),
        num(n.tmaxMean, 1),
        num(n.tminMean, 1),
        num(n.tmaxHighest, 1),
        num(n.tminLowest, 1),
      ]),
    },
    seasons: {
      caption: "Rainfall in the crop windows per agricultural season (mm)",
      columns: ["Season", SOY_WINDOW.label, SECOND_WINDOW.label],
      rows: series.seasons.map((s) => [s.season, num(s.soybean), num(s.second)]),
    },
  };
}
