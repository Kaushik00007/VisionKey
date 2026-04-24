import os
from pydantic import BaseModel

class Config(BaseModel):
    MAX_VIDEO_DURATION: int = 600  # 10 minutes max to avoid abuse
    FPS: float = 0.5               # Extract 1 frame every 2 seconds for speed
    
    # Base paths
    OUTPUT_DIR: str = os.path.join(os.getcwd(), "temp_data")
    VIDEOS_DIR: str = os.path.join(os.getcwd(), "temp_data", "videos")
    FRAMES_DIR: str = os.path.join(os.getcwd(), "temp_data", "frames")
    
    # OCR configs (Optimized for speed: removed redundant passes, psm 11 is best for scattered text)
    OCR_PSM_CONFIGS: list = ['--psm 11']
    
    def setup_dirs(self):
        """Ensure necessary temp directories exist."""
        os.makedirs(self.VIDEOS_DIR, exist_ok=True)
        os.makedirs(self.FRAMES_DIR, exist_ok=True)

config = Config()
config.setup_dirs()
