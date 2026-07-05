from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID


class BankLookupRequest(BaseModel):
    account_number: str = Field(..., max_length=10, min_length=10, alias="accountNumber")
    bank_code: str = Field(..., alias="bankCode") # -- e.g., "058" for GTBank

    model_config = {"populate_by_name": True}


class BankLookupResponse(BaseModel):
    account_number: str = Field(alias="accountNumber")
    account_name: str = Field(alias="accountName")
    bank_code: str = Field(alias="bankCode")

    model_config = {"populate_by_name": True}


class WithdrawalVerificationRequest(BaseModel):
    account_number: str = Field(..., max_length=10, min_length=10, alias="accountNumber")
    bank_code: str = Field(..., alias="bankCode")
    amount: float = Field(..., gt=0)
    transaction_pin: Optional[str] = Field(default=None, alias="transactionPin")

    model_config = {"populate_by_name": True}

class WithdrawalExecutionRequest(BaseModel):
    verification_token: str = Field(..., alias="verificationToken")

    model_config = {"populate_by_name": True}

