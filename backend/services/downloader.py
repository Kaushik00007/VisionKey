import os
import yt_dlp
from config import config
from utils.logger import logger

class DownloadError(Exception):
    pass

def download_video(url: str, video_id: str) -> str:
    logger.info(f"Starting download for {url}")
    output_path = os.path.join(config.VIDEOS_DIR, f"{video_id}.mp4")
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4][vcodec^=avc][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][vcodec^=avc]/best',
        'outtmpl': output_path,
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            duration = info.get('duration', 0)
            
            if duration > config.MAX_VIDEO_DURATION:
                raise DownloadError(f"Video is too long ({duration}s). Max allowed is {config.MAX_VIDEO_DURATION}s.")
            
            ydl.download([url])
            logger.info(f"Download complete: {output_path}")
            return output_path
    except DownloadError:
        raise
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise DownloadError(f"Failed to download video: {str(e)}")
