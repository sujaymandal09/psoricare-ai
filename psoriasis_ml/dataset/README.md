# Psoriasis Model Training Dataset

Place your training and validation images inside this directory structure.

## Directory Structure

```text
dataset/
├── train/
│   ├── psoriasis/          <-- Upload psoriasis training images here
│   └── non_psoriasis/      <-- Upload non-psoriasis training images here
└── val/
    ├── psoriasis/          <-- Upload psoriasis validation images here
    └── non_psoriasis/      <-- Upload non-psoriasis validation images here
```

## How to train the model:
1. Ensure you have installed the dependencies in `/Psoriasis_detection-main/requirements.txt`.
2. Run the training script from the root of the project:
   ```bash
   python src/train.py
   ```
