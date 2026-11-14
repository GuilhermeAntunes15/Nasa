import type { Metadata } from "next";
import { InvalidLocationNotice } from "@/components/climate-status";
import { ScenarioControls } from "@/components/scenario-controls";
import { parseState } from "@/lib/state";

export const metadata: Metadata = { title: "Scenario Lab · RotaTerra" };

export default async function ScenariosPage({ searchParams }: PageProps<"/scenarios">) {
  const { farm, scenario } = parseState(await searchParams);
  return (
    <>
      <InvalidLocationNotice />
      <ScenarioControls farm={farm} scenario={scenario} />
    </>
  );
}
