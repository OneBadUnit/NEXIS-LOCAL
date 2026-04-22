# ============================================================
# RECONSTRUCTION SCHEMAS
# Defines the request model for Reconstruction operations.
# Used by the Reconstruction API to validate incoming data.
# ============================================================

from pydantic import BaseModel
from typing import Optional


# ------------------------------------------------------------
# ReconstructionRequest
# Matches the backend Reconstruction endpoint:
#   text:   the input text to process
#   mode:   summarize | rewrite | extract | transform | clean
#   option: specific sub-mode (varies by mode)
# ------------------------------------------------------------
class ReconstructionRequest(BaseModel):
    text: str
    mode: str
    option: Optional[str] = None
