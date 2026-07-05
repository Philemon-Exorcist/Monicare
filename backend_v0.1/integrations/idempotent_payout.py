

import hashlib

def generate_deterministic_payout_ref(user_uuid: str, action_type: str, timestamp_context: int) -> str:
    """
    Generates a repeatable, mathematically unique string reference key.
    If the exact same parameters are passed twice, it returns the exact same string,
    enabling Nomba and Supabase unique constraints to block duplicate cash outflows.
    """
    # Combine static context factors to lock the unique reference profile
    raw_payload_string = f"MONICARE_PAYOUT_{user_uuid}_{action_type}_{timestamp_context}"
    
    # Generate a clean, 32-character hexadecimal MD5 hash signature string
    hashed_signature = hashlib.md5(raw_payload_string.encode("utf-8")).hexdigest()
    
    # Return formatted string compliant with banking grid switch naming lengths
    return f"MONI_PAY_{hashed_signature.upper()[:20]}"
