const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://monicare.onrender.com";

async function request(path, method = "POST", body = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || errorData?.message || "Backend request failed.");
  }

  return response.json();
}

export function login(payload) {
  return request("/api/auth/login", "POST", payload);
}

export function signup(payload) {
  return request("/api/auth/signup", "POST", payload);
}
