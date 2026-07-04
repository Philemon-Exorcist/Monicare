from pydantic import BaseModel, Field


class NombaPaymentData(BaseModel):
    amount: float
    order_reference: str = Field(alias="orderReference")
    account_reference: str = Field(alias="accountRef")
    status: str

    model_config = {
        "populate_by_name": True,
    }


class NombaWebhookPayload(BaseModel):
    event: str
    message: str
    data: NombaPaymentData

    model_config = {
        "populate_by_name": True,
    }
 
