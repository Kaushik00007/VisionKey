import pytesseract
import cv2
import numpy as np
import re
import concurrent.futures
from config import config
from utils.logger import logger

def clean_ocr_text(text: str) -> str:
    text = " ".join(text.split())
    text = re.sub(r'[^\w\s\-\=\:\.\,\!\|\@\#\$\%\^\&\*\?]', '', text)
    text = re.sub(r'([A-Za-z])0([A-Za-z])', r'\1O\2', text)
    text = re.sub(r'([A-Za-z])5([A-Za-z])', r'\1S\2', text)
    return text.strip()

def preprocess_image(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Increase contrast
    gray = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)
    # Invert the image so bright text on dark background becomes dark text on bright background
    inverted = cv2.bitwise_not(gray)
    return inverted

def run_multi_pass_ocr(img) -> list:
    results = set()
    for cfg in config.OCR_PSM_CONFIGS:
        try:
            text = pytesseract.image_to_string(img, config=cfg)
            for line in text.split('\n'):
                cleaned = clean_ocr_text(line)
                if cleaned:
                    results.add(cleaned)
        except Exception as e:
            logger.debug(f"OCR failed for config {cfg}: {e}")
    return list(results)

def extract_text_from_frame(frame_info: dict) -> dict:
    image_path = frame_info["path"]
    img = cv2.imread(image_path)
    if img is None:
        return {"text": "", "timestamp": frame_info["timestamp_sec"], "frame": frame_info["relative_path"]}

    h, w, _ = img.shape
    top_region = img[0:int(h * 0.4), 0:w]
    bottom_region = img[int(h * 0.6):h, 0:w]

    top_processed = preprocess_image(top_region)
    bottom_processed = preprocess_image(bottom_region)

    texts = set()
    for region_img in [top_processed, bottom_processed]:
        region_texts = run_multi_pass_ocr(region_img)
        texts.update(region_texts)

    return {
        "text": "\n".join(texts),
        "timestamp": frame_info["timestamp_sec"],
        "frame": frame_info["relative_path"]
    }

def extract_text_from_frames(frames: list) -> list:
    logger.info(f"Starting OCR on {len(frames)} frames")
    results = []
    
    import os
    workers = min(12, (os.cpu_count() or 4) * 2)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_frame = {executor.submit(extract_text_from_frame, frame): frame for frame in frames}
        for future in concurrent.futures.as_completed(future_to_frame):
            try:
                res = future.result()
                if res["text"]:
                    results.append(res)
            except Exception as e:
                logger.error(f"Error processing frame: {e}")
                
    logger.info("OCR complete")
    return results
