"""
AT-HYG v3.3 preprocessing script
Usage:
  1. Download athyg_v33-1.csv and athyg_v33-2.csv from
     https://github.com/astronexus/ATHYG-Database
  2. Combine:  cat athyg_v33-1.csv athyg_v33-2.csv > athyg_v33.csv
     (Windows:  type athyg_v33-1.csv athyg_v33-2.csv > athyg_v33.csv)
  3. (Optional) python fetch_spect_simbad.py  -> generates spect_supplement.json
  4. Place athyg_v33.csv next to this script
  5. python preprocess_hyg.py
  6. Copy the generated stars.json to src/data/

Output fields per star:
  id, proper, bf, gl, hip, dist_ly, dist_src, mag, absmag, con, spect, ra, dec, ci
"""
import csv, json, sys
from pathlib import Path
from collections import Counter

INPUT_FILE   = "athyg_v33.csv"
OUTPUT_FILE  = "stars.json"
SUPPLEMENT   = "spect_supplement.json"
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

    # spect 보충 데이터 로드 (있으면)
    supp = {}
    supp_path = Path(SUPPLEMENT)
    if supp_path.exists():
        with open(supp_path, encoding="utf-8") as f:
            supp = json.load(f)
        print("supplement loaded: {} entries".format(len(supp)))

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

            gl   = row.get("gl", "").strip() or None
            spect = row.get("spect", "").strip() or None

            # supplement에서 분광형 보완
            if not spect and gl and gl in supp:
                spect = supp[gl]

            stars.append({
                "id":       int(row["id"]),
                "proper":   row.get("proper",   "").strip() or None,
                "bf":       bf,
                "gl":       gl,
                "hip":      pi(row.get("hip",   "")),
                "dist_ly":  round(dl, 4),
                "dist_src": row.get("dist_src", "").strip() or None,
                "mag":      pf(row.get("mag",   "")),
                "absmag":   pf(row.get("absmag","")),
                "con":      con,
                "spect":    spect,
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

    src_counts = Counter(s["dist_src"] for s in stars)
    print("\ndist_src distribution:")
    for src, cnt in src_counts.most_common():
        print("  {:10s}: {}".format(src or "?", cnt))

    supp_applied = sum(1 for s in stars if s.get("spect") and s.get("gl") and s["gl"] in supp)
    if supp:
        print("\nsupplement applied: {}개".format(supp_applied))

if __name__ == "__main__":
    main()
