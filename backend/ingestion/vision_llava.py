# backend/ingestion/vision_llava.py

import subprocess
import tempfile
import os

MODEL_NAME = "llava:34b"   # or "llava:34b-q4" if you pulled the quantized version

def analyze_image_with_llava(image_bytes: bytes) -> str:
    """
    Sends an image to the local LLaVA model via Ollama and returns the description.
    """

    # Save image temporarily
    tmp_dir = tempfile.mkdtemp(prefix="arc_llava_")
    img_path = os.path.join(tmp_dir, "image.png")

    with open(img_path, "wb") as f:
        f.write(image_bytes)

    # Run LLaVA
    cmd = [
        "ollama", "run", MODEL_NAME,
        f"Describe this image in detail. file={img_path}"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    # Cleanup
    try:
        os.remove(img_path)
        os.rmdir(tmp_dir)
    except:
        pass

    return result.stdout.strip() if result.stdout.strip() else "No description returned by LLaVA."
