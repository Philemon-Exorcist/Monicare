
from pydantic import BaseModel, Field
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# ─── WHAT YOU SEND TO NOMBA ───
class NombaVirtualAccountRequest(BaseModel):
    account_name: str = Field(alias="accountName") # Maps Python snake_case to Nomba's camelCase
    email: str
    signing_bank: str = Field(default="WEMA", alias="signingBank")
    account_reference: str = Field(alias="accountReference")

    # This configuration configuration allows Pydantic to read both camelCase and snake_case keys
    model_config = {
        "populate_by_name": True
    }


# ─── INTERNAL METADATA INSIDE NOMBA'S RESPONSE ───
class NombaAccountData(BaseModel):
    account_name: str = Field(alias="accountName")
    account_number: str = Field(alias="accountNumber")
    bank_name: str = Field(alias="bankName")
    account_reference: str = Field(alias="accountReference")


# ─── WHAT NOMBA RETURNS TO YOU ───
class NombaVirtualAccountResponse(BaseModel):
    status: str
    message: str
    data: NombaAccountData
    
    model_config = {
        "populate_by_name": True
    }


class AppSettings(BaseSettings):
    # Enforces that these strings must be present in your .env file
    NOMBA_BASE_URL : str
    NOMBA_LIVE_ClIENT_ID : str
    NOMBA_LIVE_PRIVATE_KEY : str
    Main_Account_ID : str
    NOMBA_SUB_ACCOUNT_ID : str | None = None
    
    # Automatically reads from the root .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Initialize a single, reusable instance of your settings
settings = AppSettings()
