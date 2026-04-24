import uuid
import os
from services.downloader import download_video
from services.frame_extractor import extract_frames
from services.ocr_service import extract_text_from_frames
from services.password_detector import extract_passwords
from utils.logger import logger
from config import config

class PipelineError(Exception):
    pass

def process_video_pipeline(youtube_url: str) -> list:
    video_id = str(uuid.uuid4())
    video_path = None
    
    try:
        logger.info(f"Starting pipeline for URL: {youtube_url} with ID: {video_id}")
        
        # 1. Download
        video_path = download_video(youtube_url, video_id)
        
        # 2. Extract frames
        frames_info = extract_frames(video_path, video_id)
        
        if not frames_info:
            raise PipelineError("No frames were extracted from the video.")
            
        # 3. OCR
        ocr_results = extract_text_from_frames(frames_info)
        
        # 4. Detect passwords
        passwords = extract_passwords(ocr_results)
        
        return passwords
        
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}")
        raise PipelineError(str(e))
    finally:
        # 5. Cleanup video to save space. Keep frames for frontend preview.
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
            logger.info(f"Cleaned up video: {video_path}")
