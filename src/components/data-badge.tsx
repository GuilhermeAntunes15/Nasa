"use client";

import { Popover } from "@base-ui/react/popover";
import { BookOpenIcon, CalculatorIcon, FlaskConicalIcon, InfoIcon, SatelliteIcon, SproutIcon, type LucideIcon } from "lucide-react";
import type { DataCategory } from "@/lib/types";

export const DATA_CATEGORIES: Record<DataCategory, { label: string; description: string }> = {
  nasa: {
    label: "NASA POWER data",
    description:
      "Daily estimates from NASA POWER, based on the MERRA-2 reanalysis, which assimilates satellite and ground observations. Gridded (~50 km), not measured at your farm.",
  },
  farmer: { label: "Farmer-provided", description: "Information you entered about your farm." },
  published: {
    label: "Published crop data",
    description: "Crop parameters from FAO publications and the FAO ECOCROP database, cited in each explanation.",
  },
  model: {
    label: "Model-derived indicator",
    description: "Calculated by the RotaTerra model from the other inputs; see the Science page for every formula.",
  },
  scenario: {
    label: "Hypothetical scenario",
    description: "A rainfall or temperature change you chose to explore. Not a weather forecast or climate projection.",
  },
};

// Each category differs by icon, label and border style, not only by colour.
const STYLE: Record<DataCategory, { icon: LucideIcon; className: string }> = {
  nasa: { icon: SatelliteIcon, className: "border-navy bg-navy text-cream" },
  farmer: { icon: SproutIcon, className: "border-forest bg-white text-forest" },
  published: { icon: BookOpenIcon, className: "border-navy/50 bg-sage/40 text-navy" },
  model: { icon: CalculatorIcon, className: "border-navy bg-white text-navy" },
  scenario: { icon: FlaskConicalIcon, className: "border-dashed border-navy bg-cream text-navy" },
};

const badgeClass = "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

// explain=false renders a plain label (used where the description is already on screen).
export function DataBadge({ category, explain = true }: { category: DataCategory; explain?: boolean }) {
  const { label, description } = DATA_CATEGORIES[category];
  const { icon: Icon, className } = STYLE[category];
  const content = (
    <>
      <Icon aria-hidden="true" className="size-3" />
      {label}
    </>
  );
  if (!explain) {
    return (
      <span data-category={category} className={`${badgeClass} ${className}`}>
        {content}
      </span>
    );
  }
  return (
    <Popover.Root>
      <Popover.Trigger
        data-category={category}
        aria-label={`${label}: what does this mean?`}
        className={`${badgeClass} ${className} cursor-help transition-transform active:scale-95`}
      >
        {content}
        <InfoIcon aria-hidden="true" className="size-3 opacity-70" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} className="z-[60]">
          <Popover.Popup className="max-w-72 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0">
            <Popover.Description>{description}</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function DataLegend() {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {(Object.keys(DATA_CATEGORIES) as DataCategory[]).map((category) => (
        <div key={category} className="flex flex-col gap-1">
          <dt>
            <DataBadge category={category} explain={false} />
          </dt>
          <dd className="text-sm text-muted-foreground">{DATA_CATEGORIES[category].description}</dd>
        </div>
      ))}
    </dl>
  );
}
