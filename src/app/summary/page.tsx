import type { Metadata } from "next";
import { InvalidLocationNotice } from "@/components/climate-status";
import { parseState } from "@/lib/state";
import { SummaryView } from "./summary-view";

export const metadata: Metadata = { title: "Decision Summary · RotaTerra" };

export default async function SummaryPage({ searchParams }: PageProps<"/summary">) {
  const { farm, scenario } = parseState(await searchParams);
  return (
    <>
      <InvalidLocationNotice />
      <SummaryView farm={farm} scenario={scenario} />
    </>
  );
}
