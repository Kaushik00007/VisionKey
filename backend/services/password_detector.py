import re
from utils.logger import logger
from utils.helpers import format_timestamp

def extract_passwords(ocr_results: list) -> list:
    logger.info("Detecting passwords in OCR results")
    
    # Capture everything after the keyword on the same line
    keyword_pattern = re.compile(
        r'(p[a@][s5]{2}w[o0]rd|pass|pwd|code)[\:\-\=\>\|]*(.+)',
        re.IGNORECASE
    )
    fallback_pattern = re.compile(r'\b([A-Z0-9]{6,})\b')

    ocr_results = sorted(ocr_results, key=lambda x: x["timestamp"])
    raw_detections = []

    for item in ocr_results:
        text = item["text"]
        timestamp_sec = item["timestamp"]
        frame = item["frame"]
        formatted_time = format_timestamp(timestamp_sec)

        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue

            # Strip spaces entirely for robust keyword detection (handles 'P A S S W O R D')
            line_no_spaces = line.replace(' ', '')
            
            kw_match = keyword_pattern.search(line_no_spaces)
            if kw_match:
                pwd = kw_match.group(2).strip()
                pwd = re.sub(r'[\.\,\;\:]+$', '', pwd)
                
                if len(pwd) >= 2 and any(c.isalnum() for c in pwd):
                    raw_detections.append({
                        "password": pwd,
                        "timestamp": formatted_time,
                        "frame": frame,
                        "confidence": "high"
                    })
                continue

            matches = fallback_pattern.findall(line)
            for pwd in matches:
                if any(c.isdigit() for c in pwd) and any(c.isalpha() for c in pwd):
                    raw_detections.append({
                        "password": pwd,
                        "timestamp": formatted_time,
                        "frame": frame,
                        "confidence": "medium"
                    })

    # Merge progressive reveals (e.g., '*2**' -> '12**' -> '1234')
    merged_passwords = []
    placeholders = ['*', '?', '_', '-', 'X', 'x']

    for det in raw_detections:
        pwd = det["password"]
        merged = False
        
        for m in merged_passwords:
            # Only attempt to merge if lengths match perfectly
            if len(m["password"]) == len(pwd):
                compatible = True
                new_chars = list(m["password"])
                
                for i in range(len(pwd)):
                    c1 = m["password"][i]
                    c2 = pwd[i]
                    
                    if c1 == c2:
                        continue
                    elif c1 in placeholders:
                        new_chars[i] = c2
                    elif c2 in placeholders:
                        pass # keep c1, which is the resolved character
                    else:
                        compatible = False
                        break
                
                if compatible:
                    m["password"] = "".join(new_chars)
                    m["frame"] = det["frame"] # use latest frame for the complete password
                    m["timestamp"] = det["timestamp"]
                    merged = True
                    break
        
        if not merged:
            merged_passwords.append(det)

    # Filter final results and remove exact duplicates
    seen = set()
    final_detected = []
    
    for m in merged_passwords:
        pwd = m["password"]
        # Skip if password is fully placeholders
        if not any(c.isalnum() for c in pwd):
            continue
            
        if pwd not in seen:
            seen.add(pwd)
            final_detected.append(m)

    logger.info(f"Detected {len(final_detected)} unique passwords")
    return final_detected
