from flask import Flask, request, render_template, send_file, jsonify
from PIL import Image
import io
import os
import tempfile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import pikepdf

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_pdf_from_images(images, quality=85):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    for img_data in images:
        try:
            img = Image.open(io.BytesIO(img_data))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Scale image to fit page
            page_width, page_height = letter
            img_width, img_height = img.size
            
            scale = min(page_width/img_width, page_height/img_height) * 0.9
            new_width = img_width * scale
            new_height = img_height * scale
            
            x = (page_width - new_width) / 2
            y = (page_height - new_height) / 2
            
            # Save image temporarily with specified quality
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                img.save(tmp.name, 'JPEG', quality=quality, optimize=True)
                c.drawImage(tmp.name, x, y, new_width, new_height)
                os.unlink(tmp.name)
            
            c.showPage()
        except Exception as e:
            continue
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

def compress_pdf(pdf_data):
    try:
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as input_file:
            input_file.write(pdf_data)
            input_file.flush()
            
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as output_file:
                with pikepdf.open(input_file.name) as pdf:
                    pdf.save(output_file.name, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
                
                with open(output_file.name, 'rb') as f:
                    compressed_data = f.read()
                
                os.unlink(input_file.name)
                os.unlink(output_file.name)
                
                return compressed_data
    except:
        return pdf_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/estimate-size', methods=['POST'])
def estimate_size():
    try:
        data = request.get_json()
        if not data or 'files' not in data:
            return jsonify({'error': 'No file data provided'}), 400
        
        files_data = data['files']
        quality = int(data.get('quality', 75))
        quality = max(10, min(100, quality))
        
        total_size = 0
        for file_info in files_data:
            # Estimate size based on original file size and quality
            original_size = file_info['size']
            
            # Rough estimation: JPEG compression ratio based on quality
            if quality >= 90:
                compression_ratio = 0.8
            elif quality >= 75:
                compression_ratio = 0.5
            elif quality >= 50:
                compression_ratio = 0.3
            else:
                compression_ratio = 0.15
            
            estimated_compressed_size = original_size * compression_ratio
            total_size += estimated_compressed_size
        
        # Add PDF overhead (approximately 30% of image data)
        estimated_pdf_size = total_size * 1.3
        
        return jsonify({
            'estimated_size': int(estimated_pdf_size),
            'formatted_size': f"{estimated_pdf_size/1024/1024:.1f}MB" if estimated_pdf_size > 1024*1024 else f"{estimated_pdf_size/1024:.0f}KB"
        })
    except Exception as e:
        return jsonify({'error': 'Estimation failed'}), 500

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No files selected'}), 400
    
    # Get quality parameter (default: 85)
    quality = int(request.form.get('quality', 85))
    quality = max(10, min(100, quality))  # Clamp between 10-100
    
    images = []
    for file in files:
        if file and allowed_file(file.filename):
            try:
                img_data = file.read()
                # Validate it's actually an image
                Image.open(io.BytesIO(img_data))
                images.append(img_data)
            except:
                return jsonify({'error': f'Invalid image: {file.filename}'}), 400
        else:
            return jsonify({'error': f'Invalid file type: {file.filename}'}), 400
    
    if not images:
        return jsonify({'error': 'No valid images found'}), 400
    
    try:
        pdf_data = create_pdf_from_images(images, quality)
        compressed_pdf = compress_pdf(pdf_data)
        
        # Save to temp file for download
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(compressed_pdf)
            tmp.flush()
            
            return send_file(tmp.name, as_attachment=True, download_name='compressed_images.pdf', mimetype='application/pdf')
    
    except Exception as e:
        return jsonify({'error': 'Failed to process images'}), 500

if __name__ == '__main__':
    app.run(debug=True)