import { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto'; // Utilisation du module natif Node.js

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

// Notez le "export const" au lieu de "exports.handler"
export const handler = async (event) => {
    // Le reste du code est identique, sauf la création de l'ID plus bas
    const method = event.requestContext.http.method;
    const path   = event.requestContext.http.path;

    try {
        if (method === "GET" && path === "/items") {
            return await getItems();
        }

        if (method === "POST" && path === "/items") {
            const body = JSON.parse(event.body);
            return await createItem(body);
        }

        if (method === "DELETE" && path.startsWith("/items/")) {
            const id = event.pathParameters.id;
            return await deleteItem(id);
        }

        if (method === "PUT" && path.startsWith("/items/")) {
            const id   = event.pathParameters.id;
            const body = JSON.parse(event.body);
            return await updateItem(id, body);
        }

        return { statusCode: 400, body: "Route not supported" };
    } catch (err) {
        console.error(err); // Important pour voir l'erreur dans CloudWatch
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};

async function getItems() {
    const result = await client.send(new ScanCommand({
        TableName: TABLE_NAME
    }));

    // Sécurisation : result.Items peut être undefined si la table est vide
    const items = (result.Items || []).map(i => ({
        id: i.id.S,
        name: i.name.S,
        quantity: Number(i.quantity.N)
    }));

    return {
        statusCode: 200,
        body: JSON.stringify(items)
    };
}

async function createItem(data) {
    const id = randomUUID(); // Plus besoin de la librairie externe 'uuid'

    await client.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
            id: { S: id },
            name: { S: data.name },
            quantity: { N: String(data.quantity) }
        }
    }));

    return {
        statusCode: 201,
        body: JSON.stringify({ id })
    };
}

async function deleteItem(id) {
    await client.send(new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: { id: { S: id } }
    }));

    return { statusCode: 204 };
}

async function updateItem(id, data) {
    await client.send(new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { id: { S: id } },
        UpdateExpression: "SET #name = :name, quantity = :qty",
        ExpressionAttributeNames: {
            "#name": "name"
        },
        ExpressionAttributeValues: {
            ":name": { S: data.name },
            ":qty": { N: String(data.quantity) }
        }
    }));

    return {
        statusCode: 200,
        body: JSON.stringify({ updated: true })
    };
}