
from pydantic import BaseModel, Field
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

from pydantic import BaseModel, Field
from typing import Optional

class NombaVirtualAccountRequest(BaseModel):
    account_ref: str = Field(alias="accountRef")
    account_name: str = Field(alias="accountName")
    bvn: Optional[str] = Field(default=None, alias="bvn")
    expiry_date: Optional[str] = Field(default=None, alias="expiryDate")
    expected_amount: Optional[str] = Field(default=None, alias="expectedAmount")

    model_config = {
        "populate_by_name": True
    }

class NombaAccountData(BaseModel):
    account_name: str = Field(alias="accountName")
    account_number: str = Field(alias="bankAccountNumber")  # Maps NUBAN
    bank_name: str = Field(alias="bankName")
    account_ref: str = Field(alias="accountRef")

class NombaVirtualAccountResponse(BaseModel):
    code: str
    description: str
    status: Optional[bool] = None
    data: Optional[NombaAccountData] = None

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
    NOMBA_WEBHOOK_SECRET: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

settings = AppSettings()





