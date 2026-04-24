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

