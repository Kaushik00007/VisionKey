import os
import shutil
from utils.logger import logger

def cleanup_directory(directory_path: str):
    """Safely clear contents of a directory."""
    try:
        if os.path.exists(directory_path):
            shutil.rmtree(directory_path)
        os.makedirs(directory_path, exist_ok=True)
    except Exception as e:
        logger.error(f"Failed to cleanup directory {directory_path}: {e}")

def format_timestamp(seconds: float) -> str:
    """Format seconds into HH:MM:SS format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
