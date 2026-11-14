import type { Metadata } from "next";
import { InvalidLocationNotice } from "@/components/climate-status";
import { ClimateCharts } from "@/components/climate-charts";
import { parseState } from "@/lib/state";

export const metadata: Metadata = { title: "Climate Intelligence · RotaTerra" };

export default async function ClimatePage({ searchParams }: PageProps<"/climate">) {
  const { farm } = parseState(await searchParams);
  return (
    <>
      <InvalidLocationNotice />
      <ClimateCharts farm={farm} />
    </>
  );
}
