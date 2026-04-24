# VisionKey - OCR Password Extractor

A robust, scalable web application to extract hidden text, passwords, and codes from YouTube videos using advanced OCR and machine learning techniques.

## Features

- **Full Pipeline**: Downloads videos via `yt-dlp`, extracts frames with `OpenCV`, processes OCR with `pytesseract`.
- **Advanced OCR Engine**: Preprocesses frames (grayscale, contrast, adaptive thresholding, denoising) and runs multi-pass region-based OCR.
- **Smart Password Detection**: Regex-based detection to handle OCR noisy data and standard password patterns.
- **Modern UI**: Clean, responsive frontend built with HTML, Tailwind CSS, and vanilla JS.
- **API First**: FastAPI backend fully typed, fast, and structured.

## Local Setup

### Prerequisites

Ensure you have installed:
- Python 3.10+
- `ffmpeg` (required for yt-dlp)
- `tesseract-ocr`

### Installation

1. Clone the repository and move to project directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running Locally

Start the FastAPI server:
```bash
cd backend
python main.py
```

The application will be running at `http://127.0.0.1:8000`. The frontend is served automatically at the root `/`.

## Deployment

### Deploying to Render
1. Connect your GitHub repository to Render.
2. Select **Web Service**.
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Note: Make sure the server has `ffmpeg` and `tesseract-ocr` installed. For Render, you may need a Dockerfile or standard environment setup that includes these apt packages.

### Deploying to Railway
1. Push to GitHub and link to Railway.
2. Railway will automatically detect Python.
3. Configure the Start Command to `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Add the `apt` nixpacks builder to install system packages:
   Add a `nixpacks.toml` at the root:
   ```toml
   [phases.setup]
   aptPkgs = ["ffmpeg", "tesseract-ocr"]
   ```

### Deploying to VPS
1. SSH into VPS.
2. Install dependencies: `sudo apt update && sudo apt install -y python3-pip python3-venv ffmpeg tesseract-ocr`
3. Setup virtual environment, clone repo, and install requirements.
4. Use `systemd` and `gunicorn` (with uvicorn workers) or `pm2` to run the FastAPI app continually.
5. Setup Nginx to reverse proxy port 80/443 to the local `8000` port.
