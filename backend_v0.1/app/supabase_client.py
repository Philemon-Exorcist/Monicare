
# Initializing the supabase client
import os
import base64
import json
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions

load_dotenv()


def _get_supabase_config() -> tuple[str, str]:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_service_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env or the environment."
        )

    parsed_url = urlparse(supabase_url)
    if parsed_url.scheme not in ("http", "https") or not parsed_url.netloc:
        raise RuntimeError(
            "SUPABASE_URL must be a valid URL, e.g. https://<project-ref>.supabase.co"
        )

    if parsed_url.netloc.lower() == "supabase.co":
        raise RuntimeError(
            "SUPABASE_URL appears invalid. Use your project-specific Supabase URL like https://<project-ref>.supabase.co"
        )

    def _get_supabase_key_role(key: str) -> str | None:
        try:
            payload = key.split(".")[1]
            payload += "=" * (-len(payload) % 4)
            decoded = base64.urlsafe_b64decode(payload.encode("utf-8"))
            claims = json.loads(decoded)
            return claims.get("role")
        except Exception:
            return None

    supabase_key_role = _get_supabase_key_role(supabase_service_key)
    if supabase_key_role != "service_role":
        raise RuntimeError(
            "SUPABASE_SERVICE_KEY must be the Supabase service_role secret key, not the anon/public key."
        )

    project_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    return project_url, supabase_service_key


def get_supabase_admin() -> Client:
    """
    Spins up a clean, completely independent administrative client instance.
    This safely prevents user session token contamination on concurrent threads.
    """
    project_url, service_key = _get_supabase_config()
    return create_client(
        project_url,
        service_key,
        options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False,
        ),
    )




