const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8001" : "");

async function request(path, { token, ...options } = {}) {
  if (!API_BASE_URL) {
    throw new Error(
      "The Monicare API URL is not configured. Set NEXT_PUBLIC_API_BASE_URL and restart the frontend."
    );
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Could not reach Monicare's API at ${API_BASE_URL}. Check the backend URL and try again.`
    );
  }

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = responseData?.detail;
    const message =
      responseData?.message ||
      (typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg || item.message).filter(Boolean).join(" ")
          : `Request failed (${response.status}).`);
    throw new Error(message);
  }

  return responseData;
}

function queryString(entries) {
  const query = new URLSearchParams(entries);
  return `?${query.toString()}`;
}

export function submitAuth(payload, mode) {
  const endpoint = mode === "signup" ? "/api/v1/signup" : "/api/v1/login";
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDashboardProfile(token) {
  return request("/api/v1/dashboard", { token });
}

export function setAutoDebitPreference(enabled, token) {
  return request("/api/v1/profile/auto-debit", {
    method: "PATCH",
    token,
    body: JSON.stringify({ enabled }),
  });
}

export function createSavingsGroup(payload, token) {
  return request("/api/v1/create_savings_group", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function activateSavingsGroup(payload, token) {
  return request("/api/v1/activate_group", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getSavingsGroups(token) {
  return request("/api/v1/group_saving/my_savings_groups", { token });
}

export function getSavingsGroupDetail(groupId, token) {
  return request(`/api/v1/group${queryString({ group_id: groupId })}`, {
    token,
  });
}

export function joinGroupViaLink(groupLink, token) {
  return request(
    `/api/v1/group_saving/join_via_link${queryString({ group_link: groupLink })}`,
    { token }
  );
}

export function acceptGroupInvitation(groupLink, token) {
  return request(
    `/api/v1/group_saving/accept_invitation${queryString({ group_link: groupLink })}`,
    { method: "POST", token }
  );
}

export function submitWithdrawal(payload, token) {
  return request("/api/v1/withdrawals/verify-and-proceed", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
