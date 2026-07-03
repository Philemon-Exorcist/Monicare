import os
from urllib.parse import urljoin

#DEFAULT_FRONTEND_BASE_URL = "https://monicare.onrender.com"
DEFAULT_FRONTEND_BASE_URL = "monicare-theta.vercel.app"  # Local development override


def generate_group_link(group_id: str, base_url: str | None = None) -> str:
    """Generate a stable group invite URL from the group UUID."""
    if not group_id:
        raise ValueError("group_id is required to generate a group link.")

    if not isinstance(group_id, str):
        group_id = str(group_id)

    url_base = (base_url or os.getenv("GROUP_LINK_BASE_URL") or DEFAULT_FRONTEND_BASE_URL).rstrip("/")
    return urljoin(url_base + "/", f"group/{group_id}")
