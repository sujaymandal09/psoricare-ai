import argparse
import os
import random
from predict import predict_lesion


def sample_images(data_dir, classes, num_samples=5):
    images = []
    for cls in classes:
        cls_dir = os.path.join(data_dir, cls)
        if os.path.isdir(cls_dir):
            cls_images = [os.path.join(cls_dir, f) for f in os.listdir(cls_dir)
                          if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))]
            images.extend([(img, cls) for img in cls_images])
    random.shuffle(images)
    return images[:num_samples]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict sample images using the trained psoriasis model.")
    parser.add_argument("--image-path", default=None, help="Optional single image to predict.")
    parser.add_argument("--model-path", default=None, help="Path to the trained model checkpoint.")
    parser.add_argument("--dataset-dir", default=None, help="Path to the validation dataset directory.")
    parser.add_argument("--num-samples", type=int, default=5, help="Number of random validation images to predict.")
    parser.add_argument("--classes", nargs="+", default=None, help="Ordered class names for the model.")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = args.model_path or os.path.abspath(os.path.join(script_dir, "..", "best_psoriasis_model.pth"))
    dataset_dir = args.dataset_dir or os.path.abspath(os.path.join(script_dir, "..", "dataset", "val"))
    classes = args.classes or ["non_psoriasis", "psoriasis"]

    if not os.path.exists(model_path):
        print(f"Error: Model file '{model_path}' not found.")
        raise SystemExit(1)

    if args.image_path:
        if not os.path.exists(args.image_path):
            print(f"Error: Image file '{args.image_path}' not found.")
            raise SystemExit(1)
        print(f"Predicting single image: {args.image_path}")
        predict_lesion(args.image_path, model_path=model_path, classes=classes)
    else:
        if not os.path.isdir(dataset_dir):
            print(f"Error: Validation dataset directory '{dataset_dir}' not found.")
            raise SystemExit(1)

        sample_list = sample_images(dataset_dir, classes, num_samples=args.num_samples)
        if not sample_list:
            print(f"No images found in validation dataset at '{dataset_dir}'.")
            raise SystemExit(1)

        print(f"Predicting {len(sample_list)} sample images from {dataset_dir}")
        correct = 0
        for image_path, true_label in sample_list:
            predicted_label, confidence = predict_lesion(image_path, model_path=model_path, classes=classes)
            is_correct = predicted_label == true_label
            if is_correct:
                correct += 1
            print(f"TRUE: {true_label}  PREDICTED: {predicted_label}  CONFIDENCE: {confidence:.2f}%  {'OK' if is_correct else 'WRONG'}")
            print("-" * 80)

        accuracy = correct / len(sample_list) * 100
        print(f"Sample accuracy: {correct}/{len(sample_list)} = {accuracy:.2f}%")
