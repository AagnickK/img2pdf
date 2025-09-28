# Images to PDF Converter

A minimal Flask webapp that converts multiple images into a single compressed PDF.

## Features

- Upload multiple images (JPG, JPEG, PNG)
- Drag & drop interface
- Convert to single PDF
- PDF compression for smaller file size
- Dark themed UI
- Progress indication
- Error handling

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the app:
```bash
python app.py
```

3. Open http://localhost:5000 in your browser

## Usage

1. Drag & drop images or click to browse
2. Click "Convert to PDF" 
3. Download the compressed PDF file

## Libraries Used

- **Flask**: Web framework
- **Pillow**: Image processing
- **reportlab**: PDF generation
- **pikepdf**: PDF compression#
