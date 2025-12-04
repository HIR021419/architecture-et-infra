import { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuid } from 'uuid';

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
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
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};

async function getItems() {
    const result = await client.send(new ScanCommand({
        TableName: TABLE_NAME
    }));

    const items = result.Items.map(i => ({
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
    const id = uuid();

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

    return {
        statusCode: 204
    };
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
