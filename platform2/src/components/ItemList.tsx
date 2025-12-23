import type Item from "@/types/Item";

export function ItemList({
                             items,
                             onDelete,
                         }: {
    items: Item[];
    onDelete: (id: string) => void;
}) {
    return (
        <ul>
            {items.map(i => (
                <li key={i.id}>
                    {i.name} ({i.quantity})
                    <button onClick={() => onDelete(i.id)}>Supprimer</button>
                </li>
            ))}
        </ul>
    );
}
