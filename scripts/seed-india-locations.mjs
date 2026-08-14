#!/usr/bin/env node
/**
 * Seed Indian cities and localities from the normalized CSVs produced by
 * scripts/build-india-locations.py (source: GeoNames postal export, CC-BY 4.0).
 *
 * Usage:
 *   node scripts/seed-india-locations.mjs [seedDir]
 *
 * Idempotent: cities are matched on slug, localities on (cityId, slug).
 * Existing rows are left untouched except for filling in missing coordinates.
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

const seedDir = process.argv[2] ?? "/home/ubuntu/india-data/seed";
const BATCH = 1000;

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(import.meta.dirname, "..", ".env");
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const match = /^DATABASE_URL\s*=\s*(.*)$/.exec(line.trim());
    if (match) return match[1].replace(/^['"]|['"]$/g, "");
  }
  throw new Error("DATABASE_URL not found in environment or .env");
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else { quoted = false; }
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function readCsv(file) {
  const rows = [];
  let header = null;
  const rl = createInterface({ input: createReadStream(file, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    if (!header) { header = cells; continue; }
    const row = {};
    header.forEach((key, idx) => { row[key] = cells[idx] ?? ""; });
    rows.push(row);
  }
  return rows;
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const url = loadDatabaseUrl();
  const conn = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: true } });

  const cities = await readCsv(path.join(seedDir, "cities.csv"));
  const localities = await readCsv(path.join(seedDir, "localities.csv"));
  console.log(`Loaded ${cities.length} cities and ${localities.length} localities from ${seedDir}`);

  // ---- cities ----
  let cityInserted = 0;
  for (const group of chunk(cities, BATCH)) {
    const values = group.map(c => [c.name, c.slug, c.state, c.latitude || null, c.longitude || null]);
    const [res] = await conn.query(
      "INSERT INTO cities (name, slug, state, latitude, longitude, isActive) VALUES " +
        values.map(() => "(?,?,?,?,?,1)").join(",") +
        " ON DUPLICATE KEY UPDATE state = COALESCE(cities.state, VALUES(state)), latitude = COALESCE(cities.latitude, VALUES(latitude)), longitude = COALESCE(cities.longitude, VALUES(longitude))",
      values.flat(),
    );
    cityInserted += res.affectedRows ?? 0;
  }
  console.log(`Cities upserted (affected rows): ${cityInserted}`);

  const [cityRows] = await conn.query("SELECT id, slug FROM cities");
  const cityIdBySlug = new Map(cityRows.map(r => [r.slug, r.id]));
  console.log(`Cities in database: ${cityIdBySlug.size}`);

  // ---- localities ----
  const prepared = [];
  let skipped = 0;
  for (const l of localities) {
    const cityId = cityIdBySlug.get(l.citySlug);
    if (!cityId) { skipped += 1; continue; }
    prepared.push([cityId, l.name, l.slug, l.pincode || null, l.latitude || null, l.longitude || null]);
  }
  console.log(`Localities ready: ${prepared.length} (skipped without city: ${skipped})`);

  let localityAffected = 0;
  let done = 0;
  for (const group of chunk(prepared, BATCH)) {
    const [res] = await conn.query(
      "INSERT INTO localities (cityId, name, slug, pincode, latitude, longitude) VALUES " +
        group.map(() => "(?,?,?,?,?,?)").join(",") +
        " ON DUPLICATE KEY UPDATE pincode = COALESCE(localities.pincode, VALUES(pincode)), latitude = COALESCE(localities.latitude, VALUES(latitude)), longitude = COALESCE(localities.longitude, VALUES(longitude))",
      group.flat(),
    );
    localityAffected += res.affectedRows ?? 0;
    done += group.length;
    if (done % 20000 === 0) console.log(`  ...${done}/${prepared.length}`);
  }
  console.log(`Localities upserted (affected rows): ${localityAffected}`);

  const [[cityCount]] = await conn.query("SELECT COUNT(*) AS n FROM cities");
  const [[localityCount]] = await conn.query("SELECT COUNT(*) AS n FROM localities");
  console.log(`FINAL cities=${cityCount.n} localities=${localityCount.n}`);
  await conn.end();
}

main().catch(err => { console.error(err); process.exit(1); });
