import torch


def get_whisper_device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"
