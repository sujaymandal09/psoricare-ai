"""
Dataset domain-mismatch auditor.

Flags images that look like dermoscopy shots (circular dark vignette from a
dermatoscope) rather than plain clinical photos. Use this to find the
non_psoriasis images that were sourced from a mismatched (dermoscopic)
dataset, per the finding that non_psoriasis/ and psoriasis/ come from
different photographic domains.

This is a heuristic, not a certainty test: it flags LIKELY mismatches for a
human to review, not a fact. Always eyeball a sample of flagged images before
deleting anything.

Usage:
    python dataset_audit.py ../dataset/train/non_psoriasis
    python dataset_audit.py ../dataset/train/non_psoriasis --move-to ../dataset/quarantine
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image


def corner_vignette_score(image: Image.Image) -> float:
    """
    Returns a 0-1 score estimating how likely this image has a dermatoscope-style
    circular vignette: dark corners relative to the center.
    Higher = more likely to be a dermoscopy image.
    """
    img = image.convert("L").resize((200, 200))
    arr = np.asarray(img, dtype=np.float32)

    corner_size = 30
    corners = [
        arr[:corner_size, :corner_size],
        arr[:corner_size, -corner_size:],
        arr[-corner_size:, :corner_size],
        arr[-corner_size:, -corner_size:],
    ]
    corner_mean = np.mean([c.mean() for c in corners])

    center = arr[70:130, 70:130]
    center_mean = center.mean()

    if center_mean < 1e-6:
        return 0.0

    # Dermoscopy vignettes: corners much darker than center.
    darkness_ratio = max(0.0, (center_mean - corner_mean) / center_mean)
    return float(min(1.0, darkness_ratio * 1.5))


def scan_folder(folder: str, threshold: float = 0.35):
    results = []
    for fname in sorted(os.listdir(folder)):
        if not fname.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            continue
        path = os.path.join(folder, fname)
        try:
            with Image.open(path) as img:
                score = corner_vignette_score(img)
        except Exception as e:
            print(f"  [skip] {fname}: unreadable ({e})")
            continue
        results.append((fname, score))

    flagged = [r for r in results if r[1] >= threshold]
    return results, flagged


def main():
    parser = argparse.ArgumentParser(description="Flag likely dermoscopy-style images in a folder.")
    parser.add_argument("folder", help="Folder of images to scan")
    parser.add_argument("--threshold", type=float, default=0.35, help="Flag score threshold (0-1, default 0.35)")
    parser.add_argument("--move-to", default=None, help="If set, move flagged images into this folder instead of just listing them")
    args = parser.parse_args()

    if not os.path.isdir(args.folder):
        print(f"Not a folder: {args.folder}")
        sys.exit(1)

    results, flagged = scan_folder(args.folder, args.threshold)

    print(f"Scanned {len(results)} images in {args.folder}")
    print(f"Flagged {len(flagged)} as likely dermoscopy-style (threshold={args.threshold})")
    print(f"That's {100 * len(flagged) / max(1, len(results)):.1f}% of the folder.\n")

    if flagged:
        print("Sample of flagged files (highest scores first):")
        for fname, score in sorted(flagged, key=lambda x: -x[1])[:15]:
            print(f"  {score:.2f}  {fname}")

    if args.move_to and flagged:
        os.makedirs(args.move_to, exist_ok=True)
        for fname, _ in flagged:
            src = os.path.join(args.folder, fname)
            dst = os.path.join(args.move_to, fname)
            os.rename(src, dst)
        print(f"\nMoved {len(flagged)} flagged files to {args.move_to}")
    elif flagged:
        print("\nRun again with --move-to <folder> to quarantine these automatically.")
        print("IMPORTANT: spot-check a sample before trusting this heuristic on your full dataset.")


if __name__ == "__main__":
    main()