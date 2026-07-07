from typing import Optional

from pydantic import BaseModel, Field, AliasChoices


class NombaMerchantData(BaseModel):
    wallet_id: Optional[str] = Field(default=None, alias="walletId")
    wallet_balance: Optional[float] = Field(default=None, alias="walletBalance")
    user_id: Optional[str] = Field(default=None, alias="userId")

    model_config = {"populate_by_name": True}


class NombaTransactionData(BaseModel):
    alias_account_number: Optional[str] = Field(default=None, alias="aliasAccountNumber")
    fee: Optional[float] = None
    session_id: Optional[str] = Field(default=None, alias="sessionId")
    type: Optional[str] = None
    transaction_id: Optional[str] = Field(default=None, alias="transactionId")
    alias_account_name: Optional[str] = Field(default=None, alias="aliasAccountName")
    response_code: Optional[str] = Field(default=None, alias="responseCode")
    originating_from: Optional[str] = Field(default=None, alias="originatingFrom")
    transaction_amount: float = Field(validation_alias=AliasChoices("transactionAmount", "amount"))
    narration: Optional[str] = None
    time: Optional[str] = None
    alias_account_reference: Optional[str] = Field(default=None, alias="aliasAccountReference")
    alias_account_type: Optional[str] = Field(default=None, alias="aliasAccountType")
    account_reference: Optional[str] = Field(default=None, alias="accountReference")
    payment_reference: Optional[str] = Field(default=None, alias="paymentReference")

    model_config = {"populate_by_name": True}


class NombaCustomerData(BaseModel):
    bank_code: Optional[str] = Field(default=None, alias="bankCode")
    sender_name: Optional[str] = Field(default=None, alias="senderName")
    bank_name: Optional[str] = Field(default=None, alias="bankName")
    account_number: Optional[str] = Field(default=None, alias="accountNumber")

    model_config = {"populate_by_name": True}


class NombaWebhookEventData(BaseModel):
    merchant: Optional[NombaMerchantData] = None
    terminal: Optional[dict] = None
    transaction: Optional[NombaTransactionData] = None
    customer: Optional[NombaCustomerData] = None

    model_config = {"populate_by_name": True}


class NombaWebhookPayload(BaseModel):
    event_type: str = Field(validation_alias=AliasChoices("event_type", "event"))
    request_id: Optional[str] = Field(default=None, alias="requestId")
    message: Optional[str] = None
    data: NombaWebhookEventData

    model_config = {"populate_by_name": True}
