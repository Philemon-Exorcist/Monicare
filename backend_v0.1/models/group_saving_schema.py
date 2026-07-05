from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, condecimal, conint


# 1. Mirror your PostgreSQL database Enums
class GroupPeriodEnum(str, Enum):
    WEEKLY = "WEEKLY"
    BI_WEEKLY = "BI_WEEKLY"
    MONTHLY = "MONTHLY"


class GroupLifecycleEnum(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    PROPOSED_CHANGES = "PROPOSED_CHANGES"


# 2. Base Properties (Expected from the frontend)
class SavingsGroupBase(BaseModel):
    group_name: str = Field(..., min_length=3, max_length=100, examples=["Akawo Tech Bros Circle"])
    contribution_amount: condecimal(max_digits=15, decimal_places=2) = Field(
        ..., gt=0, examples=[50000.00]
    )
    cycle_period: GroupPeriodEnum = Field(..., examples=["WEEKLY"])
    #group_link: str = Field(..., examples=["https://akawo.app"])


# 3. Payload expected from frontend when CREATING a group
class SavingsGroupCreate(SavingsGroupBase):
    # Enforces a default value of 10 slots if the frontend doesn't pass it
    max_slots: conint(gt=1, le=100) = Field(default=100, description="Defaulting to 10 slots max")


# 4. Payload used when UPDATING group parameters
class SavingsGroupUpdate(BaseModel):
    group_name: Optional[str] = Field(None, min_length=3, max_length=100)
    status: Optional[GroupLifecycleEnum] = None
    current_cycle_round: Optional[conint(gt=0)] = None


class GroupActivationRequest(BaseModel):
    group_id: UUID


# 5. Schema for database reads / API responses (Includes generated metadata)
class SavingsGroupResponse(SavingsGroupBase):
    id: UUID = Field(..., alias="id")  # Matches your DB column name 'id'
    max_slots: int
    creator_id: Optional[UUID]
    status: GroupLifecycleEnum
    current_cycle_round: int
    nomba_sub_account_id: str
    activated_at: Optional[datetime] = None
    created_at: datetime
    
    # 🏦 Group Wallet tracking fields are placed here (Only sent TO the frontend)
    group_wallet_balance: float = Field(default=0.00, description="Current funds sitting in the pool")
    #nomba_group_virtual_account: Optional[str] = Field(None, description="The account number assigned to this group")

    class Config:
        from_attributes = True
        populate_by_name = True  # Allows mapping if your DB returns 'id' but schema uses 'group_id'


# 6. Advanced: Detailed Response including estimated calculations
class SavingsGroupDetailResponse(SavingsGroupResponse):
    total_pool_per_round: float = Field(
        ..., description="Calculated total cash payout distributed per round"
    )
    estimated_lifecycle_duration_days: int = Field(
        ..., description="Total days required to run this complete Esusu loop"
    )


class GroupContributionRequest(BaseModel):
    group_id: UUID = Field(..., description="The unique database identifier of the savings group")
    amount: float = Field(..., gt=0, description="The monetary amount being contributed. Must be greater than 0.")

    model_config = {
        "populate_by_name": True,
    }


class GroupLink(BaseModel):
    link : str
