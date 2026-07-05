
from typing import Optional

from pydantic import BaseModel, Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict

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


class NombaTransferRequest(BaseModel):
    payout_ref: str = Field(alias="payoutRef")
    amount: float = Field(alias="amount")
    currency: str = Field(default="NGN", alias="currency")
    bank_code: str = Field(alias="bankCode")  # Standard CBN 3-digit bank code (e.g., "057" for Access Bank)
    account_number: str = Field(alias="accountNumber") # 10-digit NUBAN
    narration: str = Field(default="Monicare Group Payout", alias="narration")

    model_config = {"populate_by_name": True}



class AppSettings(BaseSettings):
    NOMBA_BASE_URL: str
    NOMBA_SANDBOX_URL: str
    NOMBA_LIVE_CLIENT_ID: str = Field(
        validation_alias=AliasChoices("NOMBA_LIVE_CLIENT_ID", "NOMBA_LIVE_ClIENT_ID")
    )
    NOMBA_LIVE_PRIVATE_KEY: str = Field(alias="NOMBA_LIVE_PRIVATE_KEY")
    Main_Account_ID: str
    NOMBA_SUB_ACCOUNT_ID: Optional[str] = None
    NOMBA_WEBHOOK_SECRET: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

settings = AppSettings()





