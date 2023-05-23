import * as mongo from "mongodb";
import getConfig from "./config.js";

export async function connect(): Promise<
  [mongo.MongoClient, mongo.Collection<mongo.Document>]
> {
  const config = getConfig();
  const client = new mongo.MongoClient(config.mongoUrl, {
    serverApi: "1",
    keepAlive: true,
    retryWrites: true,
  });
  console.log("connecting to database...");
  await client.connect();
  const userCollection = client
    .db(config.dbName)
    .collection(config.userCollectionName);
  return [client, userCollection];
}

export async function close(client: mongo.MongoClient) {
  await client.close();
}
