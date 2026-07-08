import os
from PIL import Image, ImageOps

def resize_and_normalize_image(image_path, output_path, size=(224, 224)):
    """
    Load an image, apply autocontrast for brightness correction,
    resize it to the target dimensions, and save the result.
    """
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if grayscale or RGBA
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Apply autocontrast to normalize light variations in medical images
            img = ImageOps.autocontrast(img)
            
            # Resize image with high-quality resampling
            img_resized = img.resize(size, Image.Resampling.LANCZOS)
            
            # Save the processed image
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            img_resized.save(output_path, "JPEG", quality=95)
            print(f"Preprocessed and saved: {output_path}")
            return True
    except Exception as e:
        print(f"Error preprocessing {image_path}: {e}")
        return False

def preprocess_directory(input_dir, output_dir, size=(224, 224)):
    """
    Iterate over a directory of class subfolders, preprocess all images,
    and replicate the folder structure in the output directory.
    """
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                input_path = os.path.join(root, file)
                
                # Get relative path to maintain class folder names
                rel_path = os.path.relpath(input_path, input_dir)
                output_path = os.path.join(output_dir, rel_path)
                
                resize_and_normalize_image(input_path, output_path, size)
