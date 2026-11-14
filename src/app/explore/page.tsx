import type { Metadata } from "next";
import { InvalidLocationNotice } from "@/components/climate-status";
import { FarmForm } from "@/components/farm-form";
import { parseState } from "@/lib/state";

export const metadata: Metadata = { title: "Farm Explorer · RotaTerra" };

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const { farm, scenario } = parseState(await searchParams);
  return (
    <>
      <InvalidLocationNotice />
      <FarmForm farm={farm} scenario={scenario} />
    </>
  );
}
