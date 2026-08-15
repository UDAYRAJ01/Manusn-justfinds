#!/usr/bin/env node
/**
 * Imports the user-provided Just Finds category master list as:
 * main category -> subcategory -> service/business type.
 *
 * Usage: node scripts/seed-category-taxonomy.mjs
 * The importer is idempotent and preserves existing category records.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const ROOT = path.resolve(import.meta.dirname, "..");
const MASTER_PATH = path.join(ROOT, "category-master-list-source.md");

const SUBCATEGORY_HEADINGS = {
  Healthcare: ["Hospitals", "Doctors & Clinics", "Fertility & Women's Health", "Diagnostics", "Pharmacy & Medical", "Home Healthcare", "Ambulance"],
  "Food & Restaurants": ["Restaurants", "Cuisine", "Fast Food", "Cafes & Beverages", "Bakery & Sweets", "Food Services"],
  "Home Services": ["Home Repair", "Cleaning", "AC & Appliances", "Home Improvement", "Security", "Moving", "Home Care"],
  Education: ["Schools", "Colleges", "Coaching", "Tuition", "Skill Development", "Arts & Activities", "Career"],
  "Jobs & Employment": ["Job Types", "Industry Jobs", "Job Portals & Agencies", "Career Services"],
  "Hotels & Travel": ["Hotels", "Stay", "Travel", "Transport", "Travel Support"],
  "Beauty & Personal Care": ["Salons", "Beauty", "Skin", "Spa", "Nail & Tattoo", "Wedding Beauty"],
  "Real Estate & Property": ["Residential", "Commercial", "Property Services", "Rental", "Builders", "Property Project", "Property Finance"],
  "Professional Services": ["Business", "Finance", "Digital", "Creative", "Architecture", "Documentation"],
  "Repair & Maintenance": ["Mobile & Computer", "Home Appliances", "Electronics", "Vehicle", "General"],
  "Legal Services": ["Lawyers", "Legal Services", "Business Legal", "Dispute Resolution"],
  "Fitness & Sports": ["Fitness", "Yoga & Wellness", "Sports Academies", "Martial Arts", "Sports Facilities", "Sports Stores"],
};

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 130);
}

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envRaw = readFileSync(path.join(ROOT, ".env"), "utf8");
  const match = envRaw.split("\n").map(line => /^DATABASE_URL\s*=\s*(.+)$/.exec(line.trim())).find(Boolean);
  if (!match) throw new Error("DATABASE_URL not found");
  return match[1].replace(/^['"]|['"]$/g, "");
}

function cleanCategoryName(value) {
  return value.replace(/^\d+\.\s*/, "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function parseMasterList() {
  const parsed = [];
  let category = null;
  let subcategory = null;
  for (const rawLine of readFileSync(MASTER_PATH, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("JUST FINDS") || line.startsWith("Isko database") || line.startsWith("MAIN CATEGORY") || line.startsWith("↓") || line.startsWith("└") || line.startsWith("├") || line.startsWith("Aur:")) continue;
    if (line.startsWith("🔥 Just Finds") || line.startsWith("Example:")) break;
    if (/^\d+\.\s+/.test(line)) {
      const name = cleanCategoryName(line);
      if (SUBCATEGORY_HEADINGS[name]) {
        category = { name, subcategories: [] };
        parsed.push(category);
        subcategory = null;
      }
      continue;
    }
    if (!category) continue;
    if (SUBCATEGORY_HEADINGS[category.name].includes(line)) {
      subcategory = { name: line, types: [] };
      category.subcategories.push(subcategory);
      continue;
    }
    if (subcategory) subcategory.types.push(line);
  }
  return parsed;
}

async function main() {
  const taxonomy = parseMasterList();
  if (taxonomy.length !== 12) throw new Error(`Expected 12 main categories; parsed ${taxonomy.length}`);
  const connection = await mysql.createConnection({ uri: loadDatabaseUrl(), ssl: { rejectUnauthorized: true } });
  try {
    for (let categoryOrder = 0; categoryOrder < taxonomy.length; categoryOrder += 1) {
      const category = taxonomy[categoryOrder];
      const categorySlug = slugify(category.name);
      await connection.query(
        "INSERT INTO categories (name, slug, description, sortOrder, isActive, status) VALUES (?, ?, ?, ?, 1, 'active') ON DUPLICATE KEY UPDATE name = VALUES(name), sortOrder = VALUES(sortOrder), isActive = 1, status = 'active'",
        [category.name, categorySlug, `${category.name} listings on Just Finds`, categoryOrder + 1],
      );
      const [[categoryRow]] = await connection.query("SELECT id FROM categories WHERE slug = ?", [categorySlug]);
      for (let subOrder = 0; subOrder < category.subcategories.length; subOrder += 1) {
        const subcategory = category.subcategories[subOrder];
        const subcategorySlug = slugify(subcategory.name);
        await connection.query(
          "INSERT INTO subcategories (categoryId, name, slug, description, sortOrder, isActive, status) VALUES (?, ?, ?, ?, ?, 1, 'active') ON DUPLICATE KEY UPDATE name = VALUES(name), sortOrder = VALUES(sortOrder), isActive = 1, status = 'active'",
          [categoryRow.id, subcategory.name, subcategorySlug, `${subcategory.name} under ${category.name}`, subOrder + 1],
        );
        const [[subcategoryRow]] = await connection.query("SELECT id FROM subcategories WHERE categoryId = ? AND slug = ?", [categoryRow.id, subcategorySlug]);
        for (let typeOrder = 0; typeOrder < subcategory.types.length; typeOrder += 1) {
          const type = subcategory.types[typeOrder];
          await connection.query(
            "INSERT INTO business_types (subcategoryId, name, slug, description, sortOrder, isActive, status) VALUES (?, ?, ?, ?, ?, 1, 'active') ON DUPLICATE KEY UPDATE name = VALUES(name), sortOrder = VALUES(sortOrder), isActive = 1, status = 'active'",
            [subcategoryRow.id, type, slugify(type), `${type} listings under ${subcategory.name}`, typeOrder + 1],
          );
        }
      }
    }
    const [[categoryCount]] = await connection.query("SELECT COUNT(*) AS count FROM categories WHERE isActive = 1");
    const [[subcategoryCount]] = await connection.query("SELECT COUNT(*) AS count FROM subcategories WHERE isActive = 1");
    const [[typeCount]] = await connection.query("SELECT COUNT(*) AS count FROM business_types WHERE isActive = 1");
    console.log(JSON.stringify({ categories: categoryCount.count, subcategories: subcategoryCount.count, businessTypes: typeCount.count }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch(error => { console.error(error); process.exit(1); });
