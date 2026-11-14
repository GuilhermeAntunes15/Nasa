import type { Metadata } from "next";
import { InvalidLocationNotice } from "@/components/climate-status";
import { RotationComparison } from "@/components/rotation-comparison";
import { parseState } from "@/lib/state";

export const metadata: Metadata = { title: "Rotation Simulator · RotaTerra" };

export default async function SimulatorPage({ searchParams }: PageProps<"/simulator">) {
  const { farm, scenario } = parseState(await searchParams);
  return (
    <>
      <InvalidLocationNotice />
      <RotationComparison farm={farm} scenario={scenario} />
    </>
  );
}
