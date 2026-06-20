"""
HYG v4.2 전처리 스크립트
========================
사용법:
  1. https://github.com/astronexus/HYG-Database 에서 hyg/v4/hyg_v42.csv 다운로드
  2. 이 스크립트와 같은 폴더에 놓기
  3. python preprocess_hyg.py
  4. 생성된 stars.json 을 프로젝트의 src/data/ 에 복사

출력 필드:
  id        - HYG 고유 ID
  proper    - 고유명 (없으면 null)
  hip       - Hipparcos 번호 (없으면 null)
  dist_ly   - 거리 (광년, 소수점 4자리)
  mag       - 실시등급
  absmag    - 절대등급
  con       - 별자리 약어
  spect     - 분광형
  ra        - 적경 (degrees)
  dec       - 적위 (degrees)
  lum       - 광도 (태양 = 1.0)
  ci        - 색지수 B-V
"""

import csv, json, sys
from pathlib import Path

INPUT_FILE  = "hyg_v42.csv"
OUTPUT_FILE = "stars.json"
MAX_LY      = 120.0
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
        print(f"[오류] {INPUT_FILE} 없음.")
        print("https://github.com/astronexus/HYG-Database → hyg/v4/hyg_v42.csv 다운로드 후 재실행")
        sys.exit(1)

    stars, skipped = [], 0
    with open(inp, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            dp = pf(row.get("dist",""))
            if dp is None or dp < 0.01:
                skipped += 1; continue
            dl = dp * PARSEC_TO_LY
            if dl > MAX_LY:
                skipped += 1; continue
            stars.append({
                "id":      int(row["id"]),
                "proper":  row.get("proper","").strip() or None,
                "bf":      row.get("bf","").strip() or None,
                "hip":     pi(row.get("hip","")),
                "dist_ly": round(dl, 4),
                "mag":     pf(row.get("mag","")),
                "absmag":  pf(row.get("absmag","")),
                "con":     row.get("con","").strip() or None,
                "spect":   row.get("spect","").strip() or None,
                "ra":      pf(row.get("ra","")),
                "dec":     pf(row.get("dec","")),
                "lum":     pf(row.get("lum","")),
                "ci":      pf(row.get("ci","")),
            })

    stars.sort(key=lambda s: s["dist_ly"])
    out = Path(OUTPUT_FILE)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(stars, f, ensure_ascii=False, separators=(",",":"))

    print(f"완료: {len(stars)}개 → {OUTPUT_FILE}  ({out.stat().st_size/1024:.1f} KB)")
    print(f"제외: {skipped}개")

if __name__ == "__main__":
    main()
