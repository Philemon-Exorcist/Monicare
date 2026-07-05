from pydantic import BaseModel, Field
from uuid import UUID

class ManualFallbackContributionRequest(BaseModel):
    schedule_id: UUID = Field(..., alias="scheduleId", description="The specific overdue schedule row item ID being paid.")
    transaction_pin: str = Field(..., min_length=4, max_length=4, alias="transactionPin")

    model_config = {
        "populate_by_name": True,
    }
