#!/usr/bin/env python3
"""Build normalized Indian city + locality seed data from the GeoNames India postal dump.

Source: https://download.geonames.org/export/zip/IN.zip  (CC-BY 4.0, credit geonames.org)

Columns in IN.txt (tab separated):
  0 country, 1 postalcode, 2 place name, 3 admin1 (state), 4 admin1 code,
  5 admin2 (district), 6 admin2 code, 7 admin3 (taluk/city), 8 admin3 code,
  9 latitude, 10 longitude, 11 accuracy

City resolution: prefer admin3 (taluk / sub-district, closest to a real city or town),
fall back to admin2 (district) when admin3 is missing or a placeholder.
Locality resolution: the postal place name, cleaned of postal suffixes.
"""
from __future__ import annotations

import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

PLACEHOLDERS = {"na", "nil", "none", "", "-", "n.a.", "not available"}
POSTAL_SUFFIX = re.compile(
    r"\s*\b(B\.?O|S\.?O|H\.?O|G\.?P\.?O|R\.?M\.?S|M\.?D\.?G|E\.?D\.?S\.?O|Sub Office|Branch Office|Head Office)\b\.?\s*$",
    re.IGNORECASE,
)
PARENTHETICAL = re.compile(r"\s*\([^)]*\)\s*$")


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", normalized).strip("-").lower()
    return re.sub(r"-{2,}", "-", normalized)


def clean_place(value: str) -> str:
    cleaned = POSTAL_SUFFIX.sub("", value.strip())
    cleaned = PARENTHETICAL.sub("", cleaned).strip()
    return re.sub(r"\s{2,}", " ", cleaned)


def is_placeholder(value: str) -> bool:
    return value.strip().lower() in PLACEHOLDERS


def main() -> int:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/ubuntu/india-data/IN.txt")
    out_dir = Path(sys.argv[2] if len(sys.argv) > 2 else "/home/ubuntu/india-data/seed")
    out_dir.mkdir(parents=True, exist_ok=True)

    # city key -> aggregate
    cities: dict[str, dict] = {}
    # (city slug, locality slug) -> aggregate
    localities: dict[tuple[str, str], dict] = {}
    city_points: dict[str, list[tuple[float, float]]] = defaultdict(list)

    with source.open(encoding="utf-8") as handle:
        for line in handle:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 11:
                continue
            pincode, place, state = parts[1].strip(), parts[2].strip(), parts[3].strip()
            district, taluk = parts[5].strip(), parts[7].strip()
            try:
                lat, lng = float(parts[9]), float(parts[10])
            except ValueError:
                continue
            if not state or is_placeholder(state):
                continue

            city_name = taluk if not is_placeholder(taluk) else district
            if is_placeholder(city_name):
                continue
            city_name = clean_place(city_name)
            if not city_name:
                continue

            city_slug = slugify(f"{city_name}-{state}")
            if not city_slug:
                continue
            city = cities.setdefault(
                city_slug,
                {"name": city_name, "slug": city_slug, "state": state, "district": district if not is_placeholder(district) else None},
            )
            city_points[city_slug].append((lat, lng))

            locality_name = clean_place(place)
            if not locality_name or is_placeholder(locality_name):
                continue
            locality_slug = slugify(locality_name)
            if not locality_slug:
                continue
            key = (city_slug, locality_slug)
            entry = localities.get(key)
            if entry is None:
                localities[key] = {
                    "citySlug": city_slug,
                    "name": locality_name,
                    "slug": locality_slug,
                    "pincode": pincode,
                    "latitude": lat,
                    "longitude": lng,
                    "count": 1,
                }
            else:
                entry["count"] += 1

    for slug, points in city_points.items():
        if not points:
            continue
        cities[slug]["latitude"] = round(sum(p[0] for p in points) / len(points), 6)
        cities[slug]["longitude"] = round(sum(p[1] for p in points) / len(points), 6)
        cities[slug]["localityCount"] = 0

    for (city_slug, _), entry in localities.items():
        if city_slug in cities:
            cities[city_slug]["localityCount"] = cities[city_slug].get("localityCount", 0) + 1

    city_rows = sorted(cities.values(), key=lambda c: (c["state"], c["name"]))
    locality_rows = sorted(localities.values(), key=lambda l: (l["citySlug"], l["name"]))

    with (out_dir / "cities.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["name", "slug", "state", "district", "latitude", "longitude", "localityCount"])
        writer.writeheader()
        for row in city_rows:
            writer.writerow({k: row.get(k) for k in writer.fieldnames})

    with (out_dir / "localities.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["citySlug", "name", "slug", "pincode", "latitude", "longitude"])
        writer.writeheader()
        for row in locality_rows:
            writer.writerow({k: row.get(k) for k in writer.fieldnames})

    summary = {
        "source": "GeoNames postal export IN.txt (CC-BY 4.0)",
        "cities": len(city_rows),
        "localities": len(locality_rows),
        "states": len({c["state"] for c in city_rows}),
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
