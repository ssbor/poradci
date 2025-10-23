// tools/build-daily.js
// Node 20+, ESM ("type": "module" v package.json)

import fs from "fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import zlib from "zlib";

// stream-json je CJS: importujeme ".js" entry a destrukturalizujeme z defaultu
import parserPkg from "stream-json/Parser.js";
import pickPkg from "stream-json/filters/Pick.js";
import streamArrayPkg from "stream-json/streamers/StreamArray.js";
const { parser } = parserPkg;
const { pick } = pickPkg;
const { streamArray } = streamArrayPkg;

const SOURCE_URL =
  process.env.MPSV_URL ||
  "https://data.mpsv.cz/od/soubory/volna-mista/volna-mista.json";

const OUTDIR = "./public/data";
const MAX_LAST_OFFERS = 200;

function ensureOutDir() {
  fs.mkdirSync(OUTDIR, { recursive: true });
}

function writePlaceholder(note = "placeholder – build failed") {
  ensureOutDir();
  for (const tag of ["auto", "agri", "gastro"]) {
    const out = {
      summary: {
        count: 0,
        median_wage_low: null,
        tag,
        note,
        source: SOURCE_URL,
        built_at: new Date().toISOString()
      },
      top_employers: [],
      last_offers: []
    };
    fs.writeFileSync(`${OUTDIR}/${tag}.json`, JSON.stringify(out));
  }
  console.log("⚠️ Zapsány placeholder JSONy (deploy proběhne).");
}

function median(arr) {
  if (!arr.length) return null;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function classifyByIsco(isco) {
  if (!isco) return null;
  const s = String(isco).replace(/\D/g, "");
  // Uprav prefixy podle potřeby:
  if (/^7231/.test(s)) return "auto";
  if (/^61[12]/.test(s)) return "agri";
  if (/^(512|5131)/.test(s)) return "gastro";
  return null;
}

// ——— Normalizace jedné položky podle schématu 'volna-mista' ———
function normalizeFromMpsvJson(rec) {
  const profese = rec?.pozadovanaProfese?.cs ?? "";
  const isco = rec?.profeseCzIsco?.id ?? "";
  const zam = rec?.zamestnavatel?.nazev ?? "";
  const mzda_od = rec?.mesicniMzdaOd ?? null;
  const mzda_do = rec?.mesicniMzdaDo ?? null;

  // Lokalita – zkusíme okres (kód), případně obec, nebo volný text
  const okres =
    rec?.mistoVykonuPrace?.okresy?.[0]?.id ??
    rec?.mistoVykonuPrace?.obec?.id ??
    rec?.mistoVykonuPrace?.adresaText ??
    "";

  const datum =
    rec?.datumZmeny ??
    rec?.datumVlozeni ??
    rec?.terminZahajeniPracovnihoPomeru ??
    rec?.expirace ??
    "";

  return {
    kraj: "", // (volitelné) – pokud budeš chtít, doplníme mapování kód→název
    okres: String(okres || ""),
    profese: String(profese || ""),
    cz_isco: String(isco || ""),
    mzda_od: mzda_od != null ? Number(mzda_od) : null,
    mzda_do: mzda_do != null ? Number(mzda_do) : null,
    zamestnavatel: String(zam || ""),
    datum: String(datum || "")
  };
}

// JSON-LD fallback – kdybys používal .jsonld se schema.org JobPosting
function normalizeFromJsonLd(rec) {
  const profese =
    rec?.profeseNazev ??
    rec?.title ??
    rec?.name ??
    "";
  const isco = rec?.czIsco ?? rec?.czIscoKod ?? rec?.occupationalCategory ?? "";
  let zam = rec?.zamestnavatelNazev ?? rec?.hiringOrganization ?? "";
  if (zam && typeof zam === "object") zam = zam.name ?? "";
  const mzda_od =
    rec?.mzdaOd ?? rec?.baseSalary?.value?.minValue ?? rec?.baseSalary?.minValue ?? null;
  const mzda_do =
    rec?.mzdaDo ?? rec?.baseSalary?.value?.maxValue ?? rec?.baseSalary?.maxValue ?? null;

  const kraj =
    rec?.krajKod ?? rec?.krajKód ?? rec?.jobLocation?.address?.addressRegion ?? "";
  const okres =
    rec?.okresKod ?? rec?.okresKód ?? rec?.jobLocation?.address?.addressLocality ?? "";

  const datum =
    rec?.datumAktualizace ??
    rec?.datePosted ??
    rec?.validFrom ??
    "";

  return {
    kraj: String(kraj || ""),
    okres: String(okres || ""),
    profese: String(profese || ""),
    cz_isco: String(isco || "").replace(/\D/g, ""),
    mzda_od: mzda_od != null ? Number(mzda_od) : null,
    mzda_do: mzda_do != null ? Number(mzda_do) : null,
    zamestnavatel: String(zam || ""),
    datum: String(datum || "")
  };
}

async function main() {
  console.log("⬇️ Stahuji:", SOURCE_URL);
  const resp = await fetch(SOURCE_URL);
  if (!resp.ok || !resp.body) {
    throw new Error(`Download failed: ${resp.status} ${resp.statusText}`);
  }

  const enc = (resp.headers.get("content-encoding") || "").toLowerCase();
  const ctype = (resp.headers.get("content-type") || "").toLowerCase();
  const isJsonLd = SOURCE_URL.endsWith(".jsonld") || ctype.includes("ld+json");
  const looksGz = SOURCE_URL.endsWith(".gz") || ctype.includes("gzip");
  // Pokud server poslal už rozbalené (enc != ''), gunzip NEpoužijeme.
  const shouldGunzip = !enc && looksGz;

  const web = Readable.fromWeb(resp.body);
  const input = shouldGunzip ? web.pipe(zlib.createGunzip()) : web;

  const buckets = { auto: [], agri: [], gastro: [] };
  const wages = { auto: [], agri: [], gastro: [] };
  const employers = { auto: {}, agri: {}, gastro: {} };
  const sample = [];

  function ingest(norm) {
    const cat = classifyByIsco(norm.cz_isco);
    if (!cat) return;
    buckets[cat].push(norm);
    if (norm.mzda_od != null) wages[cat].push(Number(norm.mzda_od));
    if (norm.zamestnavatel)
      employers[cat][norm.zamestnavatel] =
        (employers[cat][norm.zamestnavatel] || 0) + 1;
  }

  async function* sink(stream) {
    for await (const { value: rec } of stream) {
      const norm = isJsonLd ? normalizeFromJsonLd(rec) : normalizeFromMpsvJson(rec);
      if (sample.length < 50) sample.push(norm);
      ingest(norm);
    }
  }

  // JSON (.json / .json.gz): root je objekt → pole je v "polozky"
  // JSON-LD (.jsonld): root objekt → pole je v "@graph"
  if (isJsonLd) {
    await pipeline(input, parser(), pick({ filter: "@graph" }), streamArray(), sink);
  } else {
    await pipeline(input, parser(), pick({ filter: "polozky" }), streamArray(), sink);
  }

  ensureOutDir();
  fs.writeFileSync(`${OUTDIR}/_sample.json`, JSON.stringify(sample, null, 2));

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
        built_at: new Date().toISOString()
      },
      top_employers: topEmployers,
      last_offers: rows
    };
    fs.writeFileSync(`${OUTDIR}/${tag}.json`, JSON.stringify(out));
  }

  console.log("✅ Build complete:", {
    auto: buckets.auto.length,
    agri: buckets.agri.length,
    gastro: buckets.gastro.length
  });
}

try {
  await main();
} catch (e) {
  console.error("❌ Build failed:", e);
  writePlaceholder(String(e));
  process.exit(0);
}
