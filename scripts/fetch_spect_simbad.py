"""
SIMBAD에서 분광형 보충 데이터 수집
====================================
사용법:
  1. pip install requests
  2. python scripts/fetch_spect_simbad.py
  3. 생성된 spect_supplement.json 을 scripts/ 폴더에 그대로 두기
  4. preprocess_hyg.py 재실행 → stars.json 자동 merge

SIMBAD TAP API로 gl 번호 기준 분광형 일괄 조회
"""

import json, time, sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("pip install requests 후 재실행")
    sys.exit(1)

STARS_JSON   = Path(__file__).parent.parent / "src" / "data" / "stars.json"
OUTPUT_FILE  = Path(__file__).parent / "spect_supplement.json"
TAP_URL      = "https://simbad.cds.unistra.fr/simbad/tap/sync"
BATCH_SIZE   = 150
DELAY_SEC    = 1.0  # 요청 간격 (서버 부하 방지)

def query_simbad(gl_ids: list[str]) -> dict[str, str]:
    """gl_ids 목록으로 SIMBAD 조회 → {gl_id: spect_type} 반환"""
    # SIMBAD는 'Gl ' 과 'GJ ' 둘 다 인식
    escaped = ", ".join(f"'{g}'" for g in gl_ids)
    adql = f"""
SELECT i.id, b.sp_type
FROM ident i
JOIN basic b ON b.oid = i.oidref
WHERE i.id IN ({escaped})
  AND b.sp_type IS NOT NULL
"""
    resp = requests.get(TAP_URL, params={
        "REQUEST": "doQuery",
        "LANG":    "ADQL",
        "FORMAT":  "json",
        "QUERY":   adql,
    }, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    result = {}
    rows = data.get("data", [])
    for row in rows:
        gl_id, sp = row[0], row[1]
        if gl_id and sp:
            result[gl_id.strip()] = sp.strip()
    return result


def main():
    with open(STARS_JSON, encoding="utf-8") as f:
        stars = json.load(f)

    # spect 없고 gl 있는 별 목록
    targets = [s["gl"] for s in stars if not s.get("spect") and s.get("gl")]
    print(f"조회 대상: {len(targets)}개 (gl 있고 spect 없음)")

    # 기존 supplement 로드 (재실행 시 이어하기)
    supplement = {}
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, encoding="utf-8") as f:
            supplement = json.load(f)
        print(f"기존 supplement: {len(supplement)}개 로드")

    already_done = set(supplement.keys())
    remaining = [g for g in targets if g not in already_done]
    print(f"남은 조회: {len(remaining)}개\n")

    for i in range(0, len(remaining), BATCH_SIZE):
        batch = remaining[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(remaining) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"배치 {batch_num}/{total_batches} ({len(batch)}개)...", end=" ", flush=True)
        try:
            found = query_simbad(batch)
            supplement.update(found)
            print(f"분광형 획득: {len(found)}개")
        except Exception as e:
            print(f"오류: {e}")

        # 중간 저장 (중단해도 이어하기 가능)
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(supplement, f, ensure_ascii=False, indent=2)

        if i + BATCH_SIZE < len(remaining):
            time.sleep(DELAY_SEC)

    print(f"\n완료: {len(supplement)}개 분광형 수집 → {OUTPUT_FILE}")

    # 적용 현황 미리보기
    matched = sum(1 for s in stars
                  if not s.get("spect") and s.get("gl") and s["gl"] in supplement)
    print(f"stars.json 적용 예정: {matched}개 (preprocess_hyg.py 재실행 필요)")


if __name__ == "__main__":
    main()
