from pydantic import BaseModel

class ReconstructionRequest(BaseModel):
    text: str
    mode: str
    option: str | None = None
