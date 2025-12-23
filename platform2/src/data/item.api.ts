import type Item from "@/types/Item";

const API_URL = import.meta.env.VITE_API_URL;

export async function getItems(): Promise<Item[]> {
    const res = await fetch(`${API_URL}/items`);
    if (!res.ok) throw new Error("GET /items failed");
    return res.json();
}

export async function createItem(data: Omit<Item, "id">) {
    const res = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("POST /items failed");
    return res.json();
}

export async function updateItem(id: string, data: Omit<Item, "id">) {
    const res = await fetch(`${API_URL}/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("PUT /items failed");
}

export async function deleteItem(id: string) {
    const res = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("DELETE /items failed");
}
