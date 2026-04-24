import re
from utils.logger import logger
from utils.helpers import format_timestamp

def extract_passwords(ocr_results: list) -> list:
    logger.info("Detecting passwords in OCR results")
    detected = []
    seen_passwords = set()

    keyword_pattern = re.compile(
        r'\b(?:p[a@][s5]{2}w[o0]rd|pass|pwd|code)\b\s*[\:\-\=\>\|]*\s*([A-Za-z0-9\@\#\$\%\^\&\*\!\?\_\+]+)',
        re.IGNORECASE
    )

    fallback_pattern = re.compile(r'\b([A-Z0-9]{6,})\b')

    # Sort results by timestamp to keep chronological order
    ocr_results = sorted(ocr_results, key=lambda x: x["timestamp"])

    for item in ocr_results:
        text = item["text"]
        timestamp_sec = item["timestamp"]
        frame = item["frame"]
        formatted_time = format_timestamp(timestamp_sec)

        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue

            kw_match = keyword_pattern.search(line)
            if kw_match:
                pwd = kw_match.group(1).strip()
                pwd = re.sub(r'[\.\,\;\:]+$', '', pwd)
                
                if len(pwd) >= 3 and pwd not in seen_passwords:
                    detected.append({
                        "password": pwd,
                        "timestamp": formatted_time,
                        "frame": frame,
                        "confidence": "high"
                    })
                    seen_passwords.add(pwd)
                continue

            matches = fallback_pattern.findall(line)
            for pwd in matches:
                if any(c.isdigit() for c in pwd) and any(c.isalpha() for c in pwd):
                    if pwd not in seen_passwords:
                        detected.append({
                            "password": pwd,
                            "timestamp": formatted_time,
                            "frame": frame,
                            "confidence": "medium"
                        })
                        seen_passwords.add(pwd)

    logger.info(f"Detected {len(detected)} unique passwords")
    return detected