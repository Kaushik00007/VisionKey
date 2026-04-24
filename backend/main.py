from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
import os

from services.pipeline import process_video_pipeline, PipelineError
from utils.logger import logger
from config import config

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="VisionKey OCR API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for UI and extracted frames
os.makedirs(config.FRAMES_DIR, exist_ok=True)
os.makedirs("../frontend", exist_ok=True)

app.mount("/temp_data/frames", StaticFiles(directory="temp_data/frames"), name="frames")
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

class AnalyzeRequest(BaseModel):
    youtube_url: HttpUrl

from fastapi.concurrency import run_in_threadpool

@app.post("/analyze")
@limiter.limit("5/minute")
async def analyze_video(request: Request, body: AnalyzeRequest):
    try:
        url_str = str(body.youtube_url)
        logger.info(f"Received request for URL: {url_str}")
        
        # Run the synchronous pipeline in a threadpool so it doesn't freeze the server
        results = await run_in_threadpool(process_video_pipeline, url_str)
        
        return {
            "status": "success",
            "results": results
        }
    except PipelineError as e:
        logger.error(f"Analyze endpoint error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during processing.")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def serve_frontend():
    return FileResponse("../frontend/index.html")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)