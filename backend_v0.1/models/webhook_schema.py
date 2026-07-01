from pydantic import BaseModel, Field

class NombaPaymentData(BaseModel):
    amount: float
    order_reference: str = Field(alias="orderReference")
    account_reference: str = Field(alias="accountReference") # Contains 'USER_REF_uuid'
    status: str

class NombaWebhookPayload(BaseModel):
    event: str # e.g., "virtual_account.payment_received"
    message: str
    data: NombaPaymentData
