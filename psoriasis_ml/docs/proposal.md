# Research Proposal: Deep Learning-Based Psoriasis and Skin Lesion Classification

## 1. Introduction & Background
Psoriasis is a chronic, non-communicable, painful, and disabling autoimmune skin condition with no cure. It affects over 125 million people globally, causing dry, itchy, and scaly plaques on the skin surface. Due to similarities with other erythematous-squamous diseases (such as eczema, dermatitis, and seborrheic dermatitis), clinical diagnosis can be complex and susceptible to inter-observer variability. 

An automated deep learning system capable of classifying skin lesions can assist primary care providers in conducting early screenings, reducing diagnostic errors, and improving disease management.

## 2. Objectives
- **Standardize Image Preprocessing**: Build robust normalization pipelines (e.g., using contrast adjustments and standardized sizing) to eliminate background variations and lighting discrepancies in clinical photographs.
- **Implement Transfer Learning**: Leverage pretrained deep convolutional neural network (CNN) architectures (ResNet-18) trained on millions of natural images to classify dermatological features.
- **Address Data Scarcity**: Incorporate custom image augmentation techniques (rotation, scaling, color jitter, affine transforms) to enhance the training pipeline and prevent model overfitting.
- **Provide a User-Friendly Validation Interface**: Deliver a web interface allowing practitioners and researchers to verify classification predictions and evaluate confidence rates.

## 3. Methodology
- **Data Collection & Preparation**: Images must be structured into `train` and `val` folders under `psoriasis` and `non_psoriasis` (or other condition types).
- **Preprocessing & Augmentation**:
  - Auto-contrast adjustment via Pillow to highlight lesion boundaries.
  - Sizing to standard $224 \times 224$ pixels to fit ResNet expectations.
  - Multi-axis flipping, rotations, and color perturbations.
- **Model Training**: 
  - Backbone: ResNet-18 (fully connected layer modified for the target classes).
  - Loss function: Cross Entropy Loss.
  - Optimizer: Adam optimizer with learning rate adjustments.
- **Evaluation**: Report metrics including Precision, Recall, F1-Score, and a Confusion Matrix on the validation set.

## 4. Expected Outcomes
- A highly accurate classification model capable of distinguishing Psoriasis from other skin conditions.
- Clear training curves depicting loss stabilization and accuracy improvements.
- An intuitive local web application for instant clinical photo testing.
