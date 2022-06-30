import * as mongo from "mongodb";
// const { MongoClient, ServerApiVersion } = require("mongodb");

export default async function connect() {
  const uri =
    "mongodb+srv://amizonedb:Amizone123@cluster0.7m0ey.mongodb.net/?retryWrites=true&w=majority";
  const client = new mongo.MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: mongo.ServerApiVersion.v1,
  });
  try {
    await client.connect();
    const database = client.db("Amizone");
    const db = database.collection("students");
    console.log("Running Database...");
    return [db, client];
  } catch (e) {
    console.log("Check datatbase code");
  }
}

export async function clientClose(client) {
  await client.close();
}
