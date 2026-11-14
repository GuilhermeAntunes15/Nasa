import type { Citation, Crop, CropId, CropSlot, CurrentSequenceId, Rotation } from "./types";

export const CITATIONS: Record<string, Citation> = {
  fao56: {
    id: "fao56",
    short: "FAO-56 (Allen et al., 1998)",
    full: "Allen, R.G., Pereira, L.S., Raes, D. & Smith, M. (1998). Crop evapotranspiration — Guidelines for computing crop water requirements. FAO Irrigation and Drainage Paper 56. Rome: FAO.",
    url: "https://www.fao.org/4/x0490e/x0490e00.htm",
  },
  fao66: {
    id: "fao66",
    short: "FAO-66, ch. 2 (Smith & Steduto, 2012)",
    full: "Smith, M. & Steduto, P. (2012). Yield response to water: the original FAO water production function. In Steduto, P., Hsiao, T.C., Fereres, E. & Raes, D., Crop yield response to water. FAO Irrigation and Drainage Paper 66. Rome: FAO. Table 1: seasonal Ky values from FAO Irrigation and Drainage Paper No. 33.",
    url: "https://www.fao.org/4/i2800e/i2800e02.pdf",
  },
  fao33: {
    id: "fao33",
    short: "FAO-33 (Doorenbos & Kassam, 1979)",
    full: "Doorenbos, J. & Kassam, A.H. (1979). Yield response to water. FAO Irrigation and Drainage Paper 33. Rome: FAO. Ky values as reproduced in FAO-66, chapter 2, Table 1.",
    url: "https://www.fao.org/4/i2800e/i2800e02.pdf",
  },
  "ecocrop-1150": {
    id: "ecocrop-1150",
    short: "FAO ECOCROP: Glycine max",
    full: "FAO ECOCROP database, data sheet 1150: Glycine max.",
    url: "https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=1150",
  },
  "ecocrop-2175": {
    id: "ecocrop-2175",
    short: "FAO ECOCROP: Zea mays",
    full: "FAO ECOCROP database, data sheet 2175: Zea mays.",
    url: "https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=2175",
  },
  "ecocrop-48747": {
    id: "ecocrop-48747",
    short: "FAO ECOCROP: Sorghum bicolor",
    full: "FAO ECOCROP database, data sheet 48747: Sorghum bicolor.",
    url: "https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=48747",
  },
  "ecocrop-8418": {
    id: "ecocrop-8418",
    short: "FAO ECOCROP: Pennisetum glaucum",
    full: "FAO ECOCROP database, data sheet 8418: Pennisetum glaucum.",
    url: "https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=8418",
  },
  "ecocrop-543": {
    id: "ecocrop-543",
    short: "FAO ECOCROP: Brachiaria ruziziensis",
    full: "FAO ECOCROP database, data sheet 543: Brachiaria ruziziensis.",
    url: "https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id=543",
  },
  "ecocrop-model": {
    id: "ecocrop-model",
    short: "Ramirez-Villegas et al. (2013)",
    full: "Ramirez-Villegas, J., Jarvis, A. & Läderach, P. (2013). Empirical approaches for assessing impacts of climate change on agriculture: The EcoCrop model and a case study with grain sorghum. Agricultural and Forest Meteorology 170, 67–78.",
    url: "https://doi.org/10.1016/j.agrformet.2011.09.005",
  },
  "mt-calendar": {
    id: "mt-calendar",
    short: "Sedec/Indea-MT soybean calendar 2026/27 (via CNA)",
    full: "CNA (2026, May 27). Soybean calendar in Mato Grosso keeps the sanitary break from June to September for 2026 (in Portuguese). Joint Normative Instruction Sedec/Indea-MT: sanitary break 8 Jun–6 Sep 2026; soybean sowing window 7 Sep 2026–7 Jan 2027.",
    url: "https://cnabrasil.org.br/noticias/calendario-da-soja-em-mt-mantem-vazio-sanitario-de-junho-a-setembro-para-2026",
  },
  "embrapa-second-crop-maize": {
    id: "embrapa-second-crop-maize",
    short: "Borghi et al. (2023), Embrapa Maize and Sorghum",
    full: "Borghi, E., Magalhães, P.C. & Pereira Filho, I.A. (2023). Ecophysiology of second-crop maize for high yield (in Portuguese). Documentos 273. Sete Lagoas: Embrapa Milho e Sorgo. Reports (citing Kappes et al., 2013) that about 80% of the second-crop maize area in Mato Grosso is sown between 5 January and 20 February.",
    url: "https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1156268/1/Ecofisiologia-do-milho-segunda-safra-para-alta-produtividade.pdf",
  },
  "broch-ceccon-2008": {
    id: "broch-ceccon-2008",
    short: "Broch & Ceccon (2008)",
    full: "Broch, D.L. & Ceccon, G. (2008). Second-crop maize production with crop-livestock integration (in Portuguese). Infobibos, archived in Embrapa Infoteca. Describes maize intercropped with B. ruziziensis (Santa Fé system) and its desiccation before soybean sowing.",
    url: "https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/242418/1/Producao-de-milho-safrinha-com-integracao-lavoura-e-pecuaria.pdf",
  },
};

const KC_INI_NOTE = "Kc ini is the FAO-56 Table 12 crop-group value; not adjusted for wetting frequency.";

export const CROPS: Record<CropId, Crop> = {
  soybean: {
    id: "soybean",
    name: "Soybean",
    scientificName: "Glycine max",
    family: "Fabaceae",
    functionalGroup: "grain-legume",
    role: "cash",
    stageDays: [16, 29, 49, 21],
    kc: { ini: 0.4, mid: 1.15, end: 0.5 },
    p: 0.5,
    ky: 0.85,
    tempOptC: [20, 33],
    tempAbsC: [10, 38],
    phOpt: [5.5, 6.5],
    phAbs: [4.5, 8.4],
    poorDrainageTolerated: true,
    citations: ["fao56", "fao66", "fao33", "ecocrop-1150"],
    assumptions: [
      "Stage lengths 16/29/49/21 days (115 days): FAO-56 Table 11 'Central USA' proportions (20/35/60/25 = 140 days) scaled to a 115-day cycle.",
      KC_INI_NOTE,
    ],
  },
  maize: {
    id: "maize",
    name: "Second-crop maize",
    scientificName: "Zea mays",
    family: "Poaceae",
    functionalGroup: "grain-cereal",
    role: "cash",
    stageDays: [20, 35, 40, 30],
    kc: { ini: 0.3, mid: 1.2, end: 0.35 },
    p: 0.55,
    ky: 1.25,
    tempOptC: [18, 33],
    tempAbsC: [10, 47],
    phOpt: [5, 7],
    phAbs: [4.5, 8.5],
    poorDrainageTolerated: null,
    citations: ["fao56", "fao66", "fao33", "ecocrop-2175"],
    assumptions: [
      "Stage lengths from FAO-56 Table 11, 'Nigeria (humid)' row.",
      "Kc end 0.35 is the dry-harvest end of the FAO-56 Table 12 range 0.60–0.35.",
      KC_INI_NOTE,
    ],
  },
  sorghum: {
    id: "sorghum",
    name: "Second-crop grain sorghum",
    scientificName: "Sorghum bicolor",
    family: "Poaceae",
    functionalGroup: "grain-cereal",
    role: "cash",
    stageDays: [20, 35, 40, 30],
    kc: { ini: 0.3, mid: 1.05, end: 0.55 },
    p: 0.55,
    ky: 0.9,
    tempOptC: [22, 35],
    tempAbsC: [8, 40],
    phOpt: [5.5, 7.5],
    phAbs: [5, 8],
    poorDrainageTolerated: false,
    citations: ["fao56", "fao66", "fao33", "ecocrop-48747"],
    assumptions: [
      "Stage lengths 20/35/40/30 days from FAO-56 Table 11 ('USA, Pakis., Med.'); the table prints a total of 130 days while the stages add up to 125, and 125 is used.",
      "Kc mid 1.05 is the midpoint of the FAO-56 Table 12 range 1.00–1.10.",
      KC_INI_NOTE,
    ],
  },
  "pearl-millet": {
    id: "pearl-millet",
    name: "Pearl millet (cover)",
    scientificName: "Pennisetum glaucum",
    family: "Poaceae",
    functionalGroup: "cover-grass",
    role: "cover",
    stageDays: [15, 25, 40, 25],
    kc: { ini: 0.3, mid: 1.0, end: 0.3 },
    p: 0.55,
    ky: null,
    tempOptC: [25, 35],
    tempAbsC: [12, 40],
    phOpt: [5, 6.5],
    phAbs: [4.5, 8.3],
    poorDrainageTolerated: false,
    citations: ["fao56", "ecocrop-8418"],
    assumptions: [
      "Stage lengths from FAO-56 Table 11, millet 'Pakistan' row; Kc and p from the FAO-56 'Millet' rows (grain millet used for a cover crop).",
      "No published seasonal Ky for millet in FAO-66 Table 1, so no deficit sensitivity is computed.",
      KC_INI_NOTE,
    ],
  },
  ruzigrass: {
    id: "ruzigrass",
    name: "Ruzigrass",
    scientificName: "Urochloa (Brachiaria) ruziziensis",
    family: "Poaceae",
    functionalGroup: "cover-grass",
    role: "cover",
    stageDays: null,
    kc: { constant: 0.95 },
    p: 0.6,
    ky: null,
    tempOptC: [25, 33],
    tempAbsC: [19, 40],
    phOpt: [5.5, 6.5],
    phAbs: [4.5, 7.5],
    poorDrainageTolerated: false,
    citations: ["fao56", "ecocrop-543", "broch-ceccon-2008"],
    assumptions: [
      "Proxy: constant Kc 0.95, the midpoint of the FAO-56 Table 12 Kc mid range (0.85–1.05) for 'Grazing pasture, rotated grazing'.",
      "Proxy: p 0.60 from the FAO-56 Table 22 'Grazing pasture' row.",
      "Water use while growing under the maize is ignored; the grass is active from the day after the maize harvest until 10 Sep.",
    ],
  },
};

const SOYBEAN: CropSlot = { cropId: "soybean", sow: { month: 10, day: 1 } };
const secondCrop = (cropId: CropId): CropSlot => ({ cropId, sow: { month: 2, day: 1 } });
const RUZIGRASS: CropSlot = {
  cropId: "ruzigrass",
  sow: { month: 2, day: 1 },
  end: { month: 9, day: 10 },
  note: "Established with the maize; takes over after the maize harvest and is desiccated before soybean sowing.",
};

export const CURRENT_SEQUENCES: Record<CurrentSequenceId, { label: string; slots: CropSlot[] }> = {
  "soy-maize": { label: "Soybean → second-crop maize", slots: [SOYBEAN, secondCrop("maize")] },
  "soy-sorghum": { label: "Soybean → second-crop sorghum", slots: [SOYBEAN, secondCrop("sorghum")] },
  "soy-millet": { label: "Soybean → pearl millet (cover)", slots: [SOYBEAN, secondCrop("pearl-millet")] },
  "soy-fallow": { label: "Soybean → fallow", slots: [SOYBEAN] },
};

export function currentRotation(id: CurrentSequenceId): Rotation {
  const { label, slots } = CURRENT_SEQUENCES[id];
  return { id: "current", name: "Current", intent: `Your current sequence: ${label}.`, years: [slots] };
}

export const ALT_A: Rotation = {
  id: "alt-a",
  name: "Alternative A — Soil cover & water",
  intent: "Soybean, then second-crop maize intercropped with ruzigrass that keeps the soil covered until the next season (Santa Fé system).",
  years: [[SOYBEAN, secondCrop("maize"), RUZIGRASS]],
};

export const ALT_B: Rotation = {
  id: "alt-b",
  name: "Alternative B — Diversification",
  intent: "Two-year rotation: soybean → second-crop sorghum, then soybean → second-crop maize with ruzigrass.",
  years: [
    [SOYBEAN, secondCrop("sorghum")],
    [SOYBEAN, secondCrop("maize"), RUZIGRASS],
  ],
};
