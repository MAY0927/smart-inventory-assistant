const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchItems({ search = "", category = "all", signal } = {}) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (category !== "all") params.set("category", category);
  const query = params.toString();
  const response = await fetch(`${API_URL}/items${query ? `?${query}` : ""}`, { signal });
  if (!response.ok) throw new Error(`Unable to load items (${response.status})`);
  return response.json();
}

export async function createItem(item) {
  const response = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error(`Unable to create item (${response.status})`);
  return response.json();
}
