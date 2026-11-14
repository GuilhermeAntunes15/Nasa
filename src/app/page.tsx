import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { HeroGlobe } from "@/components/hero-globe";
import { buttonVariants } from "@/components/ui/button";

// Center-pivot fields seen from orbit: [cx, cy, r, fill, slow arm].
const PIVOTS: [number, number, number, string, boolean][] = [
  [175, 190, 52, "#176b57", false],
  [292, 168, 40, "#a8c9b3", true],
  [262, 282, 58, "#176b57", true],
  [150, 306, 38, "#a8c9b3", false],
  [338, 262, 30, "#5ea8d1", false],
];
const GRID = [-120, -60, 0, 60, 120];

function EarthArt() {
  return (
    <svg
      viewBox="0 0 480 480"
      className="art-rise w-full"
    >
      <defs>
        <clipPath id="globe">
          <circle cx="240" cy="240" r="200" />
        </clipPath>
        <radialGradient id="shade" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#081b2c" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="212" fill="none" stroke="#5ea8d1" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="240" cy="240" r="200" fill="#081b2c" />
      <g clipPath="url(#globe)">
        <g stroke="#a8c9b3" strokeOpacity="0.14" fill="none">
          {GRID.map((d) => (
            <path key={`h${d}`} d={`M40 ${240 + d}H440`} />
          ))}
          {GRID.map((d) => (
            <path key={`v${d}`} d={`M${240 + d} 40V440`} />
          ))}
        </g>
        {PIVOTS.map(([cx, cy, r, fill, slow]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={r} fill={fill} />
            <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#081b2c" strokeOpacity="0.28" />
            <g className="art-pivot" data-slow={slow || undefined} style={{ transformOrigin: `${cx}px ${cy}px` }}>
              <path d={`M${cx} ${cy}L${cx + r} ${cy}`} stroke="#f5f4ed" strokeWidth="2" strokeLinecap="round" />
            </g>
            <circle cx={cx} cy={cy} r="3" fill="#f5f4ed" />
          </g>
        ))}
        <circle cx="240" cy="240" r="200" fill="url(#shade)" />
      </g>
      <g transform="translate(240 240) rotate(-24) scale(1 0.36)">
        <circle r="236" fill="none" stroke="#081b2c" strokeOpacity="0.55" strokeDasharray="2 7" strokeLinecap="round" />
        <g className="art-orbit" style={{ transformOrigin: "0px 0px" }}>
          <g transform="translate(236 0) scale(1 2.7)">
            <rect x="-14" y="-2" width="9" height="4" fill="#5ea8d1" stroke="#081b2c" strokeWidth="1" />
            <rect x="5" y="-2" width="9" height="4" fill="#5ea8d1" stroke="#081b2c" strokeWidth="1" />
            <rect x="-5" y="-4" width="10" height="8" rx="1.5" fill="#f5f4ed" stroke="#081b2c" strokeWidth="1.2" />
          </g>
        </g>
      </g>
    </svg>
  );
}

const STEPS = [
  { title: "Choose your farm.", body: "Pick a point on the map and describe your soil, drainage, current sequence and main priority." },
  {
    title: "Load NASA climate data.",
    body: "RotaTerra retrieves daily rainfall and temperature for 2015–2025 from NASA POWER for that point.",
  },
  {
    title: "Compare and test.",
    body: "See three rotations side by side, open “Why this result?” for every number, and test them under hypothetical scenarios.",
  },
];

export default function Home() {
  return (
    <>
      <section aria-labelledby="hero-title" className="grid items-center gap-10 py-4 lg:grid-cols-[1.15fr_0.85fr] lg:py-10">
        <div className="flex flex-col items-start gap-6">
          <p className="eyebrow art-rise">Smarter crop rotations. Stronger farms.</p>
          <h1 id="hero-title" className="art-rise text-5xl font-medium md:text-6xl" data-d="1">
            The future of farming starts with better decisions.
          </h1>
          <p className="art-rise max-w-xl text-lg text-muted-foreground" data-d="2">
            Explore climate-resilient crop rotations using Earth observation data from NASA.
          </p>
          <div className="art-rise flex flex-wrap gap-3" data-d="3">
            <Link href="/explore" className={`${buttonVariants({ size: "lg" })} h-11 gap-2 px-5 text-base`}>
              Explore Your Farm
              <ArrowRightIcon aria-hidden="true" />
            </Link>
            <Link
              href="/science"
              className={`${buttonVariants({ variant: "outline", size: "lg" })} h-11 border-navy! px-5 text-base`}
            >
              Discover the Science
            </Link>
          </div>
        </div>
        <HeroGlobe>
          <EarthArt />
        </HeroGlobe>
      </section>

      <section aria-labelledby="challenge-title" className="grid gap-6 border-t pt-10 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        <h2 id="challenge-title" className="text-3xl font-medium md:text-4xl">
          The challenge
        </h2>
        <div className="flex max-w-2xl flex-col gap-4 text-lg">
          <p>
            Rainfall and temperature change from one season to the next. In the Brazilian Cerrado, a late start of the
            rains or a dry spell after February can decide how a soybean and second-crop system performs, and the
            choice of what follows the soybean shapes how exposed the farm is to that variability.
          </p>
          <p>
            RotaTerra puts eleven years of daily NASA POWER data next to three rotation options for the same field and
            shows, indicator by indicator, how each one relates to water demand, soil cover, crop diversity and
            sensitivity to rainfall deficits.
          </p>
          <p className="text-base text-muted-foreground">
            It is exploratory decision support: transparent rules and published crop parameters, every number
            traceable to its source. It is not a yield forecast, not a weather forecast and not a substitute for local
            agronomic advice.
          </p>
        </div>
      </section>

      <section aria-labelledby="how-title" className="flex flex-col gap-6">
        <h2 id="how-title" className="text-3xl font-medium md:text-4xl">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="panel flex flex-col gap-3">
              <span aria-hidden="true" className="font-heading text-4xl text-forest">
                0{i + 1}
              </span>
              <p>
                <strong className="block text-lg">{s.title}</strong>
                <span className="text-muted-foreground">{s.body}</span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="power-title"
        data-on-navy
        className="grid gap-6 rounded-2xl bg-navy p-6 text-cream md:p-10 lg:grid-cols-[1fr_1.4fr] lg:gap-12"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-sage uppercase">Data source</p>
          <h2 id="power-title" className="text-3xl font-medium md:text-4xl">
            How RotaTerra uses NASA POWER data
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          <p>
            For the point you choose, RotaTerra calls the public NASA POWER Daily API and reads rainfall and air
            temperature (daily mean, maximum and minimum) for 2015–2025. POWER values are gridded estimates derived
            mainly from the MERRA-2 reanalysis, so they describe the surrounding area (~50 km), not your field.
          </p>
          <p>
            Those series feed a documented water-balance and crop-parameter model. Hypothetical scenarios only rescale
            or shift the historical record. No climate projections are used.
          </p>
          <p className="text-sm text-sage">
            RotaTerra is an independent project. It uses NASA open data and is not endorsed by or affiliated with NASA.
          </p>
          <Link
            href="/science"
            className="inline-flex w-fit items-center gap-2 rounded-md font-medium text-cream underline decoration-sky decoration-2 underline-offset-4"
          >
            Read the method <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <p className="text-sm font-medium">Data: NASA POWER</p>
    </>
  );
}
