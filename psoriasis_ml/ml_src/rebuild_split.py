"""
Rebuilds dataset/train and dataset/val as a proper, leak-free stratified split.

Fixes two problems found in the existing dataset/train + dataset/val:
  1. train/ and val/ contained the exact same files per class (100% overlap) -
     validation accuracy was meaningless because the model was evaluated on
     data it had already seen during training.
  2. No duplicate-content check - the same image can exist under two
     filenames and end up split across train/val, leaking through pixel
     content even if filenames differ.

This script:
  - Pools ALL images from train/ + val/ per class (since they were duplicates,
    this recovers your original full image set without double-counting).
  - Hashes each image's pixel content (not just filename) to drop exact
    duplicates.
  - Does a stratified split (same train/val ratio per class) with a fixed
    seed for reproducibility.
  - Writes the result to a NEW directory (dataset_clean/) rather than
    overwriting your existing dataset/, so nothing is destroyed - review the
    output, then swap it in.

Usage:
    python rebuild_split.py --source ../dataset --output ../dataset_clean --val-ratio 0.2
"""

import argparse
import hashlib
import os
import random
import shutil
from collections import defaultdict


def file_hash(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def collect_pool(source_dir: str, class_name: str) -> dict:
    """Collect all unique-content images for a class across train/ and val/."""
    seen_hashes = {}
    for split in ("train", "val"):
        folder = os.path.join(source_dir, split, class_name)
        if not os.path.isdir(folder):
            continue
        for fname in sorted(os.listdir(folder)):
            if not fname.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                continue
            path = os.path.join(folder, fname)
            h = file_hash(path)
            if h not in seen_hashes:
                seen_hashes[h] = path  # keep first occurrence
    return seen_hashes


def main():
    parser = argparse.ArgumentParser(description="Rebuild a leak-free stratified train/val split.")
    parser.add_argument("--source", default="../dataset", help="Existing dataset root (with train/ and val/)")
    parser.add_argument("--output", default="../dataset_clean", help="Output dataset root to create")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Fraction of each class held out for validation")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)

    classes = sorted(
        d for d in os.listdir(os.path.join(args.source, "train"))
        if os.path.isdir(os.path.join(args.source, "train", d))
    )
    print(f"Classes found: {classes}\n")

    if os.path.exists(args.output):
        print(f"Output directory {args.output} already exists - refusing to overwrite. Delete it or pick a new --output.")
        return

    summary = {}
    for cls in classes:
        pool = collect_pool(args.source, cls)
        paths = list(pool.values())
        random.shuffle(paths)

        n_val = max(1, int(len(paths) * args.val_ratio))
        val_paths = paths[:n_val]
        train_paths = paths[n_val:]

        for split_name, split_paths in (("train", train_paths), ("val", val_paths)):
            out_dir = os.path.join(args.output, split_name, cls)
            os.makedirs(out_dir, exist_ok=True)
            for src_path in split_paths:
                shutil.copy2(src_path, os.path.join(out_dir, os.path.basename(src_path)))

        summary[cls] = {
            "unique_images": len(paths),
            "train": len(train_paths),
            "val": len(val_paths),
        }

    print("Rebuild complete. Summary:")
    for cls, stats in summary.items():
        print(f"  {cls}: {stats['unique_images']} unique images -> {stats['train']} train / {stats['val']} val")

    print(f"\nNew dataset written to: {args.output}")
    print("Review it, then point train.py at this directory (or replace dataset/ with it) once satisfied.")


if __name__ == "__main__":
    main()