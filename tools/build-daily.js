// tools/build-daily.js
// Node 20+, ESM ("type": "module" v package.json)
import fs from "fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import zlib from "zlib";

// stream-json je CommonJS → default import a až z něj vybereme funkce
import parserPkg from "stream-json/Parser.js";
import pickPkg from "stream-json/filters/Pick.js";
import streamArrayPkg from "stream-json/streamers/StreamArray.js";
const { parser } = parserPkg;
const { pick } = pickPkg;
const { streamArray } = streamArrayPkg;

const SOURCE_URL =
  process.env.MPSV_URL ||
  "https://data.mpsv.cz/od/soubory/volna-mista/volna-mista.json.gz";

const OUTDIR = "./public/data";
const MAX_LAST_OFFERS = 200;

function ensureOutDir() {
  fs.mkdirSync(OUTDIR, { recursive: true });
}

function writePlaceholder(note = "placeholder – build failed") {
  ensureOutDir();
  for (const tag of ["auto", "agri", "gastro"]) {
    const out = {
      summary: { count: 0, median_wage_low: null, tag, note, source: SOURCE_URL },
      top_employers: [],
      last_offers: [],
    };
    fs.writeFileSync(`${OUTDIR}/${tag}.json`, JSON.stringify(out));
  }
  console.log("⚠️ Zapsány placeholder JSONy (deploy proběhne).");
}

function classify(isco) {
  if (!isco) return null;
  const s = String(isco);
  if (s.startsWith("7231")) return "auto";
  if (s.startsWith("611") || s.startsWith("612")) return "agri";
  if (s.startsWith("512") || s.startsWith("5131")) return "gastro";
  return null;
}

function median(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

async function main() {
  console.log("⬇️  Stahuji:", SOURCE_URL);
  const resp = await fetch(SOURCE_URL);
  if (!resp.ok || !resp.body) {
    throw new Error(`Download failed: ${resp.status} ${resp.statusText}`);
  }

  // Rozhodnutí: gzipovat vstup?
  const enc = (resp.headers.get("content-encoding") || "").toLowerCase();
  const ctype = (resp.headers.get("content-type") || "").toLowerCase();
  const isJsonLd = SOURCE_URL.endsWith(".jsonld") || ctype.includes("ld+json");
  const shouldGunzip = !enc && (SOURCE_URL.endsWith(".gz") || ctype.includes("gzip"));

  const webStream = Readable.fromWeb(resp.body);
  const input = shouldGunzip ? webStream.pipe(zlib.createGunzip()) : webStream;

  const buckets = { auto: [], agri: [], gastro: [] };
  const wages = { auto: [], agri: [], gastro: [] };
  const employers = { auto: {}, agri: {}, gastro: {} };

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
    if (r.mzda_od != null) wages[cat].push(Number(r.mzda_od));
    if (r.zamestnavatel) {
      employers[cat][r.zamestnavatel] =
        (employers[cat][r.zamestnavatel] || 0) + 1;
    }
  }

  // Pipeline: pokud je JSON-LD, jdeme do "@graph"; jinak očekáváme root = pole
  if (isJsonLd) {
    await pipeline(
      input,
      parser(),
      pick({ filter: "@graph" }),
      streamArray(),
      async function* (stream) {
        for await (const { value: rec } of stream) {
          const cat = classify(rec?.czIsco ?? rec?.czIscoKod);
          if (cat) push(cat, rec);
        }
      }
    );
  } else {
    await pipeline(
      input,
      parser(),
      streamArray(),
      async function* (stream) {
        for await (const { value: rec } of stream) {
          const cat = classify(rec?.czIsco ?? rec?.czIscoKod);
          if (cat) push(cat, rec);
        }
      }
    );
  }

  ensureOutDir();

  for (const tag of Object.keys(buckets)) {
    const rows = buckets[tag].slice(-MAX_LAST_OFFERS).reverse();
    const topEmployers = Object.entries(employers[tag])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const out = {
      summary: {
        count: rows.length,
        median_wage_low: median(wages[tag]),
        tag,
        source: SOURCE_URL,
      },
      top_employers: topEmployers,
      last_offers: rows,
    };
    fs.writeFileSync(`${OUTDIR}/${tag}.json`, JSON.stringify(out));
  }

  console.log("✅ Build complete for:", Object.keys(buckets));
}

try {
  await main();
} catch (e) {
  console.error("❌ Build failed:", e);
  writePlaceholder(String(e));
  process.exit(0);
}
