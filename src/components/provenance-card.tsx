import { DataBadge } from "@/components/data-badge";
import type { Provenance } from "@/lib/types";

export function ProvenanceCard({ provenance: p }: { provenance: Provenance }) {
  const missing = Object.entries(p.missingDays)
    .map(([id, n]) => `${id} ${n}`)
    .join(", ");
  const rows: [string, React.ReactNode][] = [
    ["Source", `${p.source} (community ${p.community})`],
    ["Mode", p.mode === "live" ? "Live NASA POWER response (may be served from a cache; see Retrieved for its age)" : "Saved snapshot (live service unavailable)"],
    ["API version", p.apiVersion ?? "not reported"],
    ["Upstream sources", p.upstreamSources.join(", ") || "not reported"],
    [
      "Grid point",
      `${p.latitude}, ${p.longitude}${p.elevationM === null ? "" : ` (elevation ${p.elevationM.toFixed(0)} m)`}`,
    ],
    ["Period", `${p.startDate} to ${p.endDate} (${p.timeStandard})`],
    ["Parameters", p.parameters.map((x) => `${x.id} — ${x.longName} (${x.units})`).join("; ")],
    ["Missing or out-of-range days", missing],
    ["Retrieved", p.retrievedAt],
    [
      "Request",
      <a key="url" href={p.requestUrl} className="break-all font-medium text-forest underline underline-offset-4" rel="noreferrer" target="_blank">
        {p.requestUrl}
      </a>,
    ],
  ];
  return (
    <section aria-labelledby="provenance-title" className="panel flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="provenance-title" className="text-base font-semibold">
          Data provenance
        </h2>
        <DataBadge category="nasa" />
      </div>
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[12rem_1fr]">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="font-medium">{term}</dt>
            <dd className="text-muted-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground">{p.acknowledgment}</p>
      <p className="font-medium">Data: NASA POWER</p>
    </section>
  );
}
