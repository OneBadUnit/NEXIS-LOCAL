# ============================================================
# ARC-NEXUS - RECONSTRUCTION SCHEMAS
# File: app/schemas/reconstruction.py
# Version: 002 (Aligned with NEXIS System)
# ============================================================

from pydantic import BaseModel
from typing import Literal


# ------------------------------------------------------------
# Types (match backend exactly)
# ------------------------------------------------------------
PresetType = Literal["student", "creator", "explained", "analysis"]
ActionType = Literal["summarize", "extract", "rewrite", "transform", "clean"]


# ------------------------------------------------------------
# ReconstructionRequest
# ------------------------------------------------------------
class ReconstructionRequest(BaseModel):
    text: str
    preset: PresetType
    action: ActionType
    option: str