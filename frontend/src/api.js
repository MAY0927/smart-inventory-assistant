const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
let accessToken = sessionStorage.getItem("stow_access_token") || "";

export function setAccessToken(token) {
  accessToken = token || "";
  if (accessToken) sessionStorage.setItem("stow_access_token", accessToken);
  else sessionStorage.removeItem("stow_access_token");
}

function authHeaders(extra = {}) {
  return { ...extra, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) };
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: authHeaders(options.headers) });
  if (response.status === 401) window.dispatchEvent(new Event("stow:unauthorized"));
  return response;
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Incorrect email or password.");
  const data = await response.json();
  setAccessToken(data.access_token);
  return data.user;
}

export async function fetchItems({ search = "", category = "all", signal } = {}) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (category !== "all") params.set("category", category);
  const query = params.toString();
  const response = await request(`${API_URL}/items${query ? `?${query}` : ""}`, { signal });
  if (!response.ok) throw new Error(`Unable to load items (${response.status})`);
  return response.json();
}

export async function createItem(item) {
  const response = await request(`${API_URL}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error(`Unable to create item (${response.status})`);
  return response.json();
}

export async function updateItem(id, item) {
  const response = await request(`${API_URL}/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error(`Unable to update item (${response.status})`);
  return response.json();
}

export async function deleteItem(id) {
  const response = await request(`${API_URL}/items/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Unable to delete item (${response.status})`);
}

export async function evaluatePurchase(candidate) {
  const response = await request(`${API_URL}/purchase-evaluations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(candidate),
  });
  if (!response.ok) throw new Error(`Unable to evaluate purchase (${response.status})`);
  return response.json();
}

export async function analyzeItemImage(image) {
  const body = new FormData();
  body.append("image", image);
  const response = await request(`${API_URL}/image-intake/analyze`, {
    method: "POST",
    body,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Unable to analyze image (${response.status})`);
  }
  return response.json();
}
