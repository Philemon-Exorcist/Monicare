const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://monicare.onrender.com").replace(/\/$/, "");

function humanizeValidationError(detail) {
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail.map((entry) => {
      const field = Array.isArray(entry?.loc) ? entry.loc[entry.loc.length - 1] : entry?.field || "field";

      if (typeof entry?.message === "string") {
        return entry.message;
      }

      if (entry?.type === "string_too_long" && entry?.ctx?.max_length) {
        return `${field.toUpperCase()} must be at most ${entry.ctx.max_length} characters long.`;
      }

      if (entry?.type === "string_too_short" && entry?.ctx?.min_length) {
        return `${field.toUpperCase()} must be at least ${entry.ctx.min_length} characters long.`;
      }

      if (entry?.type === "value_error" && typeof entry?.msg === "string") {
        return `${field.toUpperCase()}: ${entry.msg.replace(/^Value error,\s*/i, "")}`;
      }

      if (typeof entry?.msg === "string") {
        return `${field.toUpperCase()}: ${entry.msg}`;
      }

      return `${field.toUpperCase()} is invalid.`;
    });

    return messages.join(" ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return "Please check the form fields and try again.";
}

async function request(path, method = "POST", body = {}, token) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: method === "GET" ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const responseData = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      typeof responseData === "string"
        ? responseData
        : responseData?.message ||
          humanizeValidationError(responseData?.errors || responseData?.detail || responseData?.error);

    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return responseData ?? {};
}

export function login(payload) {
  return request("/api/v1/login", "POST", payload);
}

export function signup(payload) {
  return request("/api/v1/signup", "POST", payload);
}

export function submitAuth(payload, mode) {
  const endpoint = mode === "signup" ? "/api/v1/signup" : "/api/v1/login";
  return request(endpoint, "POST", payload);
}

export function getDashboardProfile(token) {
  return request("/api/v1/dashboard", "GET", {}, token);
}

export function getSavingsGroups(token) {
  return request("/api/v1/group_saving/my_savings_groups", "GET", {}, token);
}

export function createSavingsGroup(payload, token) {
  return request("/api/v1/create_savings_group", "POST", payload, token);
}

export function activateSavingsGroup(payload, token) {
  return request("/api/v1/activate_group", "POST", payload, token);
}

export function joinGroupViaLink(groupLink, token) {
  return request(`/api/v1/group_saving/join_via_link?group_link=${encodeURIComponent(groupLink)}`, "GET", {}, token);
}

export function acceptGroupInvitation(groupLink, token) {
  return request(`/api/v1/group_saving/accept_invitation?group_link=${encodeURIComponent(groupLink)}`, "POST", {}, token);
}

export function submitWithdrawal(payload, token) {
  return request("/api/v1/withdrawals/verify-and-proceed", "POST", payload, token);
}

export function getAutoDebitPreference(token) {
  return request("/api/v1/dashboard", "GET", {}, token).then((response) => response?.data?.auto_debit_enabled ?? false);
}

export function setAutoDebitPreference(enabled, token) {
  return request("/api/v1/profile/auto-debit", "PATCH", { enabled }, token);
}

export async function getSavingsGroupDetail(groupId, token) {
  return request(`/api/v1/group/?group_id=${encodeURIComponent(groupId)}`, "GET", {}, token);
}
