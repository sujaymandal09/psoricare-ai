# Psoriasis & Skin Lesion Detection (ML)

This folder contains the core Python deep learning model, data preprocessing utilities, and validation scripts to train a ResNet classifier for psoriasis and related skin conditions.

---

## 📂 Repository Structure (updated)

- **`dataset/`**: Image files organized into `train/` and `val/`, with class-specific subfolders.
- **`ml_src/`**: Core machine learning code (renamed from `src` to avoid a conflict with the frontend `src`):
  - `model.py`, `dataset.py`, `preprocessing.py`, `augmentation.py`, `train.py`, `predict.py`, `evaluate.py`, `utils.py`
- **`app/`**: `app.py` – Flask web app to serve the trained model locally.

---

## 🚀 Quick Setup & Run

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. Prepare dataset
Structure your dataset as:
```text
dataset/
├── train/
│   ├── psoriasis/
│   └── non_psoriasis/
└── val/
    ├── psoriasis/
    └── non_psoriasis/
```

### 3. Train the model
Run training from this folder:
```bash
python ml_src/train.py
```

### 4. Evaluate
```bash
python ml_src/evaluate.py
```

### 5. Launch local web app
```bash
python app/app.py
```
Open `http://localhost:5000` in your browser.

---

Notes:
- The ML code has been consolidated under `ml_src/` to avoid a second `src` folder conflict with the frontend.
- This folder will be renamed to `psoriasis_ml` to make its purpose clearer.

If you want me to undo the rename or use a different name, tell me and I will adjust.
