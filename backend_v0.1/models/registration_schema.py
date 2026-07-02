

import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date, datetime

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
        Normalizes common Nigerian phone formats and validates the final digits.
        """
        cleaned_phone = str(value).strip()
        normalized_phone = re.sub(r"[\s\-\.\(\)]", "", cleaned_phone)

        if normalized_phone.startswith("+"):
            normalized_phone = normalized_phone[1:]

        if not normalized_phone.isdigit():
            raise ValueError(
                "Phone number must contain only digits after removing spaces, dashes, and parentheses."
            )

        local_regex = r"^0[789][01]\d{8}$"
        intl_regex = r"^234[789][01]\d{8}$"

        if re.fullmatch(local_regex, normalized_phone):
            return normalized_phone

        if re.fullmatch(intl_regex, normalized_phone):
            return normalized_phone

        raise ValueError(
            "Invalid Nigerian phone number format. Use 080..., 070..., 090... or +234/234 variants."
        )


class UserLoginCredentials(BaseModel):
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
        cleaned_phone = str(value).strip()
        normalized_phone = re.sub(r"[\s\-\.\(\)]", "", cleaned_phone)

        if normalized_phone.startswith("+"):
            normalized_phone = normalized_phone[1:]

        if not normalized_phone.isdigit():
            raise ValueError(
                "Phone number must contain only digits after removing spaces, dashes, and parentheses."
            )

        local_regex = r"^0[789][01]\d{8}$"
        intl_regex = r"^234[789][01]\d{8}$"

        if re.fullmatch(local_regex, normalized_phone):
            return normalized_phone

        if re.fullmatch(intl_regex, normalized_phone):
            return normalized_phone

        raise ValueError(
            "Invalid Nigerian phone number format. Use 080..., 070..., 090... or +234/234 variants."
        )


class UserSignUpPayload(UserAuthCredentials):
    first_name: str = Field(..., min_length=2, max_length=50)
    middle_name: str | None = Field(default=None, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    bvn: str = Field(..., min_length=11, max_length=11)
    nin: str | None = Field(default=None, min_length=11, max_length=11)
    dob: str = Field(..., description="User date of birth in MM/DD/YYYY format")

    @field_validator("dob")
    @classmethod
    def validate_dob(cls, value: str) -> str:
        """Accepts the frontend's date input plus MM/DD/YYYY strings and validates the age."""
        if not isinstance(value, str):
            value = str(value)

        cleaned_value = value.strip()

        try:
            parsed_date = datetime.strptime(cleaned_value, "%Y-%m-%d").date()
        except ValueError:
            try:
                parsed_date = datetime.strptime(cleaned_value, "%m/%d/%Y").date()
            except ValueError as exc:
                raise ValueError("Date of birth must be in YYYY-MM-DD or MM/DD/YYYY format.") from exc

        today = date.today()
        age = today.year - parsed_date.year - ((today.month, today.day) < (parsed_date.month, parsed_date.day))
        if age < 18:
            raise ValueError("You must be at least 18 years old to sign up.")
        return cleaned_value

    @field_validator("bvn", "nin")
    @classmethod
    def validate_numeric_ids(cls, v: str | None) -> str | None:
        if v is None:
            return v

        cleaned_value = re.sub(r"[\s\-\.\(\)]", "", str(v).strip())
        if not cleaned_value.isdigit():
            raise ValueError("Identity numbers must contain only digits.")
        if len(cleaned_value) != 11:
            raise ValueError("Identity numbers must be exactly 11 digits long.")
        return cleaned_value
    

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
        cleaned_value = str(value).strip()
        
        # 2. Regular Expression: Allows only letters, spaces, hyphens, and apostrophes
        # This completely filters out characters like ;, --, =, <, > used in hacking attacks
        name_regex = r"^[a-zA-Z\s\-']+$"
        if not re.match(name_regex, cleaned_value):
            raise ValueError(
                "Names must only contain standard alphabetic letters, spaces, hyphens, or apostrophes."
            )
            
        return cleaned_value
    


