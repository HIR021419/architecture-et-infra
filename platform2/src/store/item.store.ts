import { create } from "zustand";
import type Item from "@/types/Item";
import * as api from "@/data/item.api";

interface ItemState {
    items: Item[];
    loading: boolean;
    error?: string;

    fetchItems: () => Promise<void>;
    addItem: (name: string, quantity: number) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

export const useItemStore = create<ItemState>((set, get) => ({
    items: [],
    loading: false,

    fetchItems: async () => {
        set({ loading: true, error: undefined });
        try {
            const items = await api.getItems();
            set({ items, loading: false });
        } catch (e: unknown) {
            if (e && e instanceof Error)
                set({ error: e.message, loading: false });
        }
    },

    addItem: async (name, quantity) => {
        const tempId = crypto.randomUUID();

        // Optimistic insert
        set(state => ({
            items: [...state.items, { id: tempId, name, quantity }],
        }));

        try {
            const { id } = await api.createItem({ name, quantity });

            // Reconciliation
            set(state => ({
                items: state.items.map(i =>
                    i.id === tempId ? { ...i, id } : i
                ),
            }));
        } catch {
            // Rollback
            set(state => ({
                items: state.items.filter(i => i.id !== tempId),
            }));
        }
    },

    deleteItem: async (id) => {
        const snapshot = get().items;

        // Optimistic delete
        set(state => ({
            items: state.items.filter(i => i.id !== id),
        }));

        try {
            await api.deleteItem(id);
        } catch {
            // Rollback
            set({ items: snapshot });
        }
    },
}));
