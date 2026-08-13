import { getDb } from "../../db";
import { businesses, categories, cities } from "../../../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

export async function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /owner/
Disallow: /dashboard/
Disallow: /business/onboarding
Disallow: /api/

Sitemap: https://justfinds-izng9njy.manus.space/sitemap.xml
`;
}

export async function generateSitemapXml() {
  const db = await getDb();
  const origin = "https://justfinds-izng9njy.manus.space";
  
  const staticUrls = [
    `${origin}/`,
    `${origin}/search`,
    `${origin}/categories`,
    `${origin}/jobs`
  ];

  const businessRows = db ? await db.select({
    slug: businesses.slug,
    updatedAt: businesses.updatedAt,
    categoryName: categories.name,
    cityName: cities.name,
  }).from(businesses)
    .innerJoin(categories, eq(businesses.categoryId, categories.id))
    .innerJoin(cities, eq(businesses.cityId, cities.id))
    .where(eq(businesses.status, "published")) : [];

  const categoryRows = db ? await db.select({ name: categories.name }).from(categories) : [];
  const cityRows = db ? await db.select({ name: cities.name }).from(cities) : [];

  const businessUrls = businessRows.map(row => {
    const catSlug = row.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const citySlug = row.cityName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const lastMod = row.updatedAt ? new Date(row.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    return `  <url>\n    <loc>${origin}/${catSlug}/${citySlug}/${row.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
  });

  const categoryUrls = categoryRows.map(cat => {
    const catSlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `  <url>\n    <loc>${origin}/category/${catSlug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`;
  });

  const cityUrls = cityRows.map(city => {
    const citySlug = city.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `  <url>\n    <loc>${origin}/city/${citySlug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`;
  });

  const allUrls = [
    ...staticUrls.map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`),
    ...categoryUrls,
    ...cityUrls,
    ...businessUrls,
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls.join("\n")}\n</urlset>`;
}
