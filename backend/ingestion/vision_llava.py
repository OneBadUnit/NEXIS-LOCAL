# ============================================================
# LLaVA VISION INGESTION MODULE
# Sends an image to the local LLaVA model via Ollama and
# returns a detailed description. Uses safe temp handling and
# a clean instruction‑first prompt.
# ============================================================

import os
import tempfile
import subprocess


# ------------------------------------------------------------
# MODEL CONFIG
# ------------------------------------------------------------
MODEL_NAME = "llava:34b"   # or "llava:34b-q4" if quantized


# ------------------------------------------------------------
# IMAGE → LLaVA DESCRIPTION
# ------------------------------------------------------------
def analyze_image_with_llava(image_bytes: bytes) -> str:
    """
    Sends an image to the local LLaVA model via Ollama and
    returns the description.
    """

    tmp_dir = tempfile.mkdtemp(prefix="arc_llava_")
    img_path = os.path.join(tmp_dir, "image.png")

    try:
        # Save image
        with open(img_path, "wb") as f:
            f.write(image_bytes)

        # Correct prompt structure: prompt and file passed separately
        cmd = [
            "ollama", "run", MODEL_NAME,
            "Describe this image in detail.",
            f"file={img_path}"
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )

        output = result.stdout.strip()
        return output if output else "No description returned by LLaVA."

    except Exception as e:
        return f"[LLaVA ERROR] {str(e)}"

    finally:
        try:
            os.remove(img_path)
            os.rmdir(tmp_dir)
        except:
            pass
