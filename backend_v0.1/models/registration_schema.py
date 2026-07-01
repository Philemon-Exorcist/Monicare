

import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date

class UserAuthCredentials(BaseModel):
    phone_no: str = Field(..., description="Nigerian phone number string")
    password: str
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return value

    @field_validator("phone_no")
    @classmethod
    def validate_nigerian_phone(cls, value: str) -> str:
        """
        Security Guard: Strips white spaces, enforces numeric integrity,
        and validates against standard Nigerian telecommunication formats (11 digits).
        """
        # 1. Clean accidental white spaces
        cleaned_phone = value.strip()

        local_regex = r"^0[789][01]\d{8}$"
        intl_regex = r"^234[789][01]\d{8}$"

        if re.match(local_regex, cleaned_phone):
            if len(cleaned_phone) != 11:
                raise ValueError("Local Nigerian phone number must be exactly 11 digits.")
            return cleaned_phone
            
        elif re.match(intl_regex, cleaned_phone):
            if len(cleaned_phone) != 13:
                raise ValueError("International Nigerian phone number must be exactly 13 digits.")
            return cleaned_phone
            
        else:
            raise ValueError(
                "Invalid Nigerian phone number format. Must be an 11-digit number starting with 0 or 13-digit starting with 234."
            )


class UserSignUpPayload(UserAuthCredentials):
    # The secure, authentic user UUID generated directly by Supabase Auth
    user_id: str = Field(
        ..., 
        description="The unique authenticated UUID string from Supabase Auth"
    )
    first_name: str = Field(..., min_length=2, max_length=50)
    middle_name: str | None = Field(default=None, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    bvn: str = Field(..., min_length=11, max_length=11)
    nin: str | None = Field(default=None, min_length=11, max_length=11)
    dob: date = Field(..., description="User date of birth in YYYY-MM-DD format")


    @field_validator("dob")
    @classmethod
    def validate_age_limit(cls, value: date) -> date:
        """Security Guard: Enforces that the user must be at least 18 years old to save money."""
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise ValueError("You must be at least 18 years old to sign up.")
        return value

    
    @field_validator("bvn", "nin")
    @classmethod
    def validate_numeric_ids(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError("Identity numbers must contain only digits.")
        return v
    

    @field_validator("first_name", "middle_name", "last_name")
    @classmethod
    def sanitize_and_validate_names(cls, value: str | None) -> str | None:
        """
        Security Guard: Strips accidental whitespace, blocks common code 
        injection symbols, and limits names to alphabetic alphabetic characters.
        """
        if value is None:
            return value
            
        # 1. Clean accidental lead/trail spaces
        cleaned_value = value.strip()
        
        # 2. Regular Expression: Allows only letters, spaces, hyphens, and apostrophes
        # This completely filters out characters like ;, --, =, <, > used in hacking attacks
        name_regex = r"^[a-zA-Z\s\-']+$"
        if not re.match(name_regex, cleaned_value):
            raise ValueError(
                "Names must only contain standard alphabetic letters, spaces, hyphens, or apostrophes."
            )
            
        return cleaned_value
    




