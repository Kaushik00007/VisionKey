import cv2
import os
from config import config
from utils.logger import logger

class ExtractionError(Exception):
    pass

def extract_frames(video_path: str, video_id: str) -> list:
    logger.info(f"Extracting frames from {video_path}")
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ExtractionError(f"Cannot open video file: {video_path}")
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0 # fallback
        
    frame_interval = int(fps / config.FPS)
    if frame_interval < 1:
        frame_interval = 1
        
    frames_info = []
    count = 0
    extracted_count = 0
    
    video_frames_dir = os.path.join(config.FRAMES_DIR, video_id)
    os.makedirs(video_frames_dir, exist_ok=True)
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            if count % frame_interval == 0:
                timestamp_sec = count / fps
                frame_filename = f"frame_{int(timestamp_sec)}.jpg"
                frame_path = os.path.join(video_frames_dir, frame_filename)
                
                cv2.imwrite(frame_path, frame)
                
                # We return the relative path for the frontend (served via static files)
                relative_path = f"temp_data/frames/{video_id}/{frame_filename}"
                
                frames_info.append({
                    "path": frame_path,
                    "relative_path": relative_path,
                    "timestamp_sec": timestamp_sec
                })
                extracted_count += 1
                
            count += 1
    finally:
        cap.release()
        
    logger.info(f"Extracted {extracted_count} frames")
    return frames_info