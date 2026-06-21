"""
AT-HYG v3.3 preprocessing script
Usage:
  1. Download athyg_v33-1.csv and athyg_v33-2.csv from
     https://github.com/astronexus/ATHYG-Database
  2. Combine:  cat athyg_v33-1.csv athyg_v33-2.csv > athyg_v33.csv
     (Windows:  type athyg_v33-1.csv athyg_v33-2.csv > athyg_v33.csv)
  3. Place athyg_v33.csv next to this script
  4. python preprocess_hyg.py
  5. Copy the generated stars.json to src/data/

Output fields per star:
  id, proper, bf, gl, hip, dist_ly, dist_src, mag, absmag, con, spect, ra, dec, ci
"""
import csv, json, sys
from pathlib import Path
from collections import Counter

INPUT_FILE   = "athyg_v33.csv"
OUTPUT_FILE  = "stars.json"
MAX_LY       = 120.0
PARSEC_TO_LY = 3.26156

def pf(v, d=None):
    try: return float(v) if v and v.strip() else d
    except ValueError: return d

def pi(v, d=None):
    try: return int(v) if v and v.strip() else d
    except ValueError: return d

def main():
    inp = Path(INPUT_FILE)
    if not inp.exists():
        print("[error] {} not found.".format(INPUT_FILE))
        sys.exit(1)

    stars, skipped = [], 0
    with open(inp, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            dp = pf(row.get("dist", ""))
            if dp is None or dp < 0.01:
                skipped += 1; continue
            dl = dp * PARSEC_TO_LY
            if dl > MAX_LY:
                skipped += 1; continue

            bayer = row.get("bayer", "").strip()
            flam  = row.get("flam",  "").strip()
            con   = row.get("con",   "").strip() or None
            if bayer and con:
                bf = "{} {}".format(bayer, con)
            elif flam and con:
                bf = "{} {}".format(flam, con)
            else:
                bf = None

            stars.append({
                "id":       int(row["id"]),
                "proper":   row.get("proper",   "").strip() or None,
                "bf":       bf,
                "gl":       row.get("gl",       "").strip() or None,
                "hip":      pi(row.get("hip",   "")),
                "dist_ly":  round(dl, 4),
                "dist_src": row.get("dist_src", "").strip() or None,
                "mag":      pf(row.get("mag",   "")),
                "absmag":   pf(row.get("absmag","")),
                "con":      con,
                "spect":    row.get("spect",    "").strip() or None,
                "ra":       pf(row.get("ra",    "")),
                "dec":      pf(row.get("dec",   "")),
                "ci":       pf(row.get("ci",    "")),
            })

    stars.sort(key=lambda s: s["dist_ly"])
    out = Path(OUTPUT_FILE)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(stars, f, ensure_ascii=False, separators=(",", ":"))

    print("Done: {} stars -> {} ({:.1f} KB)".format(len(stars), OUTPUT_FILE, out.stat().st_size/1024))
    print("Skipped: {}".format(skipped))
    print("\ndist_src distribution:")
    src_counts = Counter(s["dist_src"] for s in stars)
    for src, cnt in src_counts.most_common():
        print("  {:10s}: {}".format(src or "?", cnt))

if __name__ == "__main__":
    main()
