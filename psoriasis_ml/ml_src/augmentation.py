import os
from PIL import Image
from torchvision import transforms

def augment_image(image_path, output_dir, prefix="aug", num_variations=5):
    """
    Generate multiple augmented variations of a single medical image
    to expand training dataset size.
    """
    # Augmentation pipeline
    augment_pipeline = transforms.Compose([
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=30),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.05, 0.05)),
    ])
    
    try:
        img = Image.open(image_path).convert('RGB')
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        os.makedirs(output_dir, exist_ok=True)
        
        # Save original
        img.save(os.path.join(output_dir, f"{base_name}_orig.jpg"), "JPEG")
        
        # Save augmented versions
        for i in range(num_variations):
            augmented_img = augment_pipeline(img)
            aug_name = f"{prefix}_{base_name}_{i}.jpg"
            augmented_img.save(os.path.join(output_dir, aug_name), "JPEG")
            
        print(f"Generated {num_variations} augmented versions for {image_path}")
        return True
    except Exception as e:
        print(f"Error augmenting {image_path}: {e}")
        return False
