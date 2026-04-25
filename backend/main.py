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

@app.get("/video-info")
@limiter.limit("5/minute")
async def get_video_info(request: Request, url: str):
    import yt_dlp
    def fetch_info():
        ydl_opts = {'quiet': True, 'no_warnings': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            quality_options = []
            for f in formats:
                if f.get('vcodec') != 'none' and f.get('ext') == 'mp4':
                    res = f.get('height', 0)
                    if res:
                        filesize = f.get('filesize') or f.get('filesize_approx')
                        size_str = f"{round(filesize/1024/1024, 1)} MB" if filesize else "Unknown size"
                        quality_options.append({
                            "format_id": f.get('format_id'),
                            "resolution": f"{res}p",
                            "size": size_str,
                            "height": res
                        })
            unique_opts = {}
            for opt in quality_options:
                if opt['resolution'] not in unique_opts or opt['height'] > unique_opts[opt['resolution']]['height']:
                    unique_opts[opt['resolution']] = opt
            sorted_opts = sorted(unique_opts.values(), key=lambda x: x['height'], reverse=True)
            return {"title": info.get('title'), "formats": sorted_opts}
    try:
        data = await run_in_threadpool(fetch_info)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/download-video")
async def download_video_endpoint(url: str, format_id: str):
    import yt_dlp
    import uuid
    def download():
        video_id = str(uuid.uuid4())
        output_path = os.path.join(config.VIDEOS_DIR, f"dl_{video_id}.mp4")
        ydl_opts = {
            'format': f"{format_id}+bestaudio[ext=m4a]/best[ext=mp4]/best",
            'outtmpl': output_path,
            'quiet': True,
            'merge_output_format': 'mp4'
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            if not filename.endswith('.mp4'):
                filename = filename.rsplit('.', 1)[0] + '.mp4'
            return filename, info.get('title', 'video')
            
    try:
        filename, title = await run_in_threadpool(download)
        safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip()
        return FileResponse(filename, filename=f"{safe_title}.mp4", media_type='video/mp4')
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def serve_frontend():
    return FileResponse("../frontend/index.html")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    
