
# this gets the set group saving for a particular user
from fastapi import HTTPException, status,Depends,APIRouter
import logging
from app.auth import verify_user_token
from app.supabase_client import get_supabase_admin




async def view__group_saving(user_id: str, group_id: str) -> dict: 

    # this function to read the group saving details for a particular user when they press the view button, based on group id, 
    # this is for a particular group 
    pass  