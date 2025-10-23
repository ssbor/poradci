// tools/build-daily.js
import fs from "fs";
import { pipeline } from "node:stream/promises";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";
import zlib from "zlib";

const SOURCE_URL = process.env.MPSV_URL || "https://data.mpsv.cz/od/soubory/volna-mista/volna-mista.json.gz";
const OUTDIR = "./public/data";
fs.mkdirSync(OUTDIR, { recursive: true });

const resp = await fetch(SOURCE_URL);
if (!resp.ok) {
  throw new Error(`Download failed: ${resp.status} ${resp.statusText}`);
}
const gunzip = zlib.createGunzip();

const buckets = { auto: [], agri: [], gastro: [] };
const wages = { auto: [], agri: [], gastro: [] };
const employers = { auto: {}, agri: {}, gastro: {} };

function classify(isco) {
  if (!isco) return null;
  const s = String(isco);
  if (s.startsWith("7231")) return "auto";
  if (s.startsWith("611") || s.startsWith("612")) return "agri";
  if (s.startsWith("512") || s.startsWith("5131")) return "gastro";
  return null;
}

function push(cat, rec) {
  const r = {
    kraj: rec.krajKod ?? rec.krajKód ?? "",
    okres: rec.okresKod ?? rec.okresKód ?? "",
    profese: rec.profeseNazev ?? rec.profeseNázev ?? rec.nazevPozice ?? "",
    cz_isco: rec.czIsco ?? rec.czIscoKod ?? "",
    mzda_od: rec.mzdaOd ?? null,
    mzda_do: rec.mzdaDo ?? null,
    zamestnavatel: rec.zamestnavatelNazev ?? rec.organizaceNazev ?? "",
    datum: rec.datumAktualizace ?? rec.platneOd ?? rec.zverejneno ?? "",
  };
  buckets[cat].push(r);
  if (r.mzda_od) wages[cat].push(Number(r.mzda_od));
  if (r.zamestnavatel) {
    employers[cat][r.zamestnavatel] = (employers[cat][r.zamestnavatel] || 0) + 1;
  }
}

function median(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

await pipeline(
  resp.body.pipe(gunzip),
  parser(),
  streamArray(),
  async function* (stream) {
    for await (const { value: rec } of stream) {
      const cat = classify(rec?.czIsco ?? rec?.czIscoKod);
      if (cat) push(cat, rec);
    }
  }
);

for (const tag of Object.keys(buckets)) {
  const rows = buckets[tag].slice(-200).reverse();
  const topEmployers = Object.entries(employers[tag])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const out = {
    summary: {
      count: rows.length,
      median_wage_low: median(wages[tag]),
      tag,
      source: SOURCE_URL
    },
    top_employers: topEmployers,
    last_offers: rows,
  };

  fs.writeFileSync(`${OUTDIR}/${tag}.json`, JSON.stringify(out));
}
console.log("✅ Build complete for:", Object.keys(buckets));
