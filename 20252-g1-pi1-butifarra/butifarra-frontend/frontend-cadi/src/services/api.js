const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch(path, options = {}) {
  const { headers: customHeaders = {}, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
    ...rest,
  });

  return response;
}

export default apiFetch;
