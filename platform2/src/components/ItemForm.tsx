import { useState } from "react";

export function ItemForm({
                             onSubmit,
                         }: {
    onSubmit: (name: string, quantity: number) => void;
}) {
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState(1);

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                onSubmit(name, quantity);
                setName("");
                setQuantity(1);
            }}
        >
            <input required value={name} onChange={e => setName(e.target.value)} />
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(+e.target.value)} />
            <button>Ajouter</button>
        </form>
    );
}
