// src/lib/api.ts
/**
 * Central place for backend base URL + tiny fetch helpers.
 * Set VITE_API_BASE in frontend/.env (e.g., http://127.0.0.1:8000)
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  short?: string | null;
  price_cents: number;
  image_url?: string | null;
  created_at: string;
};

export const API = {
  async listProducts(): Promise<ProductDTO[]> {
    const res = await fetch(`${API_BASE}/products`, { credentials: "omit" });
    return json<ProductDTO[]>(res);
  },
  async getProduct(slugOrId: string): Promise<ProductDTO> {
    const res = await fetch(
      `${API_BASE}/products/${encodeURIComponent(slugOrId)}`,
      { credentials: "omit" }
    );
    return json<ProductDTO>(res);
  },
};
