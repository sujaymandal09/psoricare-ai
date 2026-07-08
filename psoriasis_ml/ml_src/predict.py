import argparse
import os
import torch
from PIL import Image
from torchvision import transforms
from model import PsoriasisClassifier

def predict_lesion(image_path, model_path="best_psoriasis_model.pth", classes=None):
    """
    Load a trained checkpoint and predict the class of a single skin photo.
    """
    if classes is None:
        classes = ["non_psoriasis", "psoriasis"]
        
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Define validation transforms
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load Image
    image = Image.open(image_path).convert('RGB')
    tensor = transform(image).unsqueeze(0).to(device)
    
    # Initialize Model & Load Weights
    model = PsoriasisClassifier(num_classes=len(classes), pretrained=False)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    
    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
        confidence, predicted_idx = torch.max(probabilities, 0)
        
    class_prediction = classes[predicted_idx.item()]
    confidence_percentage = confidence.item() * 100
    
    print(f"Predicted Diagnosis: {class_prediction.upper()}")
    print(f"Confidence Score: {confidence_percentage:.2f}%")
    
    return class_prediction, confidence_percentage

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict skin condition from a single image.")
    parser.add_argument("image_path", help="Path to the input image file.")
    parser.add_argument("--model-path", default=None, help="Path to the trained model checkpoint file.")
    parser.add_argument("--classes", nargs="+", default=None, help="List of class names in order.")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = args.model_path or os.path.abspath(os.path.join(script_dir, "..", "best_psoriasis_model.pth"))
    classes = args.classes or ["non_psoriasis", "psoriasis"]

    if not os.path.exists(args.image_path):
        print(f"Error: Image file '{args.image_path}' not found.")
    elif not os.path.exists(model_path):
        print(f"Error: Model file '{model_path}' not found.")
    else:
        predict_lesion(args.image_path, model_path=model_path, classes=classes)
