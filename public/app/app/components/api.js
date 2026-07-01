const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://monicare.onrender.com").replace(/\/$/, "");

function humanizeValidationError(detail) {
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const field = Array.isArray(first?.loc) ? first.loc[first.loc.length - 1] : "field";

    if (first?.type === "string_too_long" && first?.ctx?.max_length) {
      return `${field.toUpperCase()} must be at most ${first.ctx.max_length} characters long.`;
    }

    if (first?.type === "string_too_short" && first?.ctx?.min_length) {
      return `${field.toUpperCase()} must be at least ${first.ctx.min_length} characters long.`;
    }

    if (typeof first?.msg === "string") {
      return `${field.toUpperCase()}: ${first.msg}`;
    }
  }

  if (typeof detail === "string") {
    return detail;
  }

  return "Please check the form fields and try again.";
}

async function request(path, method = "POST", body = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const responseData = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      typeof responseData === "string"
        ? responseData
        : humanizeValidationError(responseData?.detail || responseData?.message || responseData?.error);

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
