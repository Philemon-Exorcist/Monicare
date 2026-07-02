
from pydantic import BaseModel, Field
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict




# ─── PYDANTIC SCHEMAS ───
class NombaVirtualAccountRequest(BaseModel):
    # Matches the current Nomba virtual account docs:
    # required: accountRef, accountName
    # optional: bvn, expiryDate, expectedAmount
    account_ref: str = Field(alias="accountRef", min_length=16, max_length=64)
    account_name: str = Field(alias="accountName", min_length=8, max_length=64)
    bvn: Optional[str] = Field(default=None, min_length=8, max_length=11)
    expiry_date: Optional[str] = Field(default=None, alias="expiryDate")
    expected_amount: Optional[float] = Field(default=None, alias="expectedAmount")

    model_config = {
        "populate_by_name": True
    }


class NombaAccountData(BaseModel):
    account_holder_id: Optional[str] = Field(default=None, alias="accountHolderId")
    account_name: str = Field(alias="accountName")
    account_number: Optional[str] = Field(default=None, alias="bankAccountNumber")  # Maps NUBAN number
    bank_name: str = Field(alias="bankName")
    account_reference: str = Field(alias="accountRef")
    currency: Optional[str] = Field(default="NGN")
    expired: Optional[bool] = Field(default=False)

# ─── THE NEW ROBUST ENVELOPE SCHEMA ───
class NombaVirtualAccountResponse(BaseModel):
    code: str  # "00" means absolute success, other codes mean validation failures
    description: str  # Clear error message string from Nomba engineers
    status: Optional[bool] = None
    data: Optional[NombaAccountData] = None  # Populated only if code == "00"
    
    model_config = {
        "populate_by_name": True
    }


class AppSettings(BaseSettings):
    NOMBA_BASE_URL: str
    NOMBA_SANDBOX_URL: str
    NOMBA_LIVE_CLIENT_ID: str = Field(alias="NOMBA_LIVE_ClIENT_ID")
    NOMBA_LIVE_PRIVATE_KEY: str = Field(alias="NOMBA_LIVE_PRIVATE_KEY")
    Main_Account_ID: str
    NOMBA_SUB_ACCOUNT_ID: str  # Mandatory for sub-account-scoped creation

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

settings = AppSettings()
