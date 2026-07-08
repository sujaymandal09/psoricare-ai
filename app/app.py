import os
import sys
from flask import Flask, request, jsonify, render_template_string

# Add src to system path to import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from predict import predict_lesion

app = Flask(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# A simple modern web interface served inline
INDEX_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Psoriasis & Skin Lesion Detection System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col items-center justify-center p-6">
    <div class="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h1 class="text-2xl font-bold text-slate-800 text-center mb-2">Skin Lesion Screening System</h1>
        <p class="text-sm text-slate-500 text-center mb-8">Upload a clear photo of the skin lesion to analyze for Psoriasis and other conditions.</p>
        
        <form action="/predict" method="post" enctype="multipart/form-data" class="space-y-6">
            <div class="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-blue-400 transition cursor-pointer text-center relative">
                <input type="file" name="image" id="fileInput" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required onchange="updateFileName()">
                <div class="space-y-2">
                    <svg class="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <p class="text-sm text-slate-600 font-medium" id="fileName">Select an image or drag & drop</p>
                    <p class="text-xs text-slate-400">PNG, JPG or JPEG up to 10MB</p>
                </div>
            </div>
            
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-blue-200">
                Analyze Skin Image
            </button>
        </form>
    </div>

    <script>
        function updateFileName() {
            const input = document.getElementById('fileInput');
            const label = document.getElementById('fileName');
            if (input.files && input.files.length > 0) {
                label.textContent = input.files[0].name;
            }
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(INDEX_HTML)

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
        
    if file:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        
        # Check if model exists
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../best_psoriasis_model.pth'))
        if not os.path.exists(model_path):
            return jsonify({
                "status": "error",
                "message": "Model weights 'best_psoriasis_model.pth' not found. Please train your model first using python src/train.py"
            }), 400
            
        try:
            classes = ["psoriasis", "non_psoriasis"]
            prediction, confidence = predict_lesion(filepath, model_path=model_path, classes=classes)
            return jsonify({
                "status": "success",
                "prediction": prediction,
                "confidence": f"{confidence:.2f}%"
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
