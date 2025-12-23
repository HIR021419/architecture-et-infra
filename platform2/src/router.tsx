import { createBrowserRouter } from "react-router-dom";
import ItemListPage from "@/pages/ItemListPage";

export const router = createBrowserRouter([
    {
        path: "*",
        element: <ItemListPage />,
    },
]);
