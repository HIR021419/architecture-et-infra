import { useEffect } from "react";
import { useItemStore } from "@/store/item.store";
import { ItemForm } from "@/components/ItemForm";
import { ItemList } from "@/components/ItemList";

export default function ItemListPage() {
    const { items, fetchItems, addItem, deleteItem, loading } = useItemStore();

    useEffect(() => {
        void fetchItems();
    }, [fetchItems]);

    return (
        <>
            <h1>Shopping List</h1>

            <ItemForm onSubmit={addItem} />

            {loading && <p>Chargement...</p>}

            <ItemList items={items} onDelete={deleteItem} />
        </>
    );
}
