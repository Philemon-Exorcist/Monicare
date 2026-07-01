const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://monicare.onrender.com").replace(/\/$/, "");

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
    throw new Error(responseData?.detail || responseData?.message || responseData || "Backend request failed.");
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
