from pydantic import BaseModel, Field

class KYCVerifyRequest(BaseModel):
    bvn: str = Field(..., min_length=11, max_length=11)
    nin: str | None = Field(default=None, min_length=11, max_length=11)
    first_name: str
    last_name: str

class KYCVerifyResponse(BaseModel):
    is_verified: bool
    match_message: str
    official_dob: str | None = None
