import * as mongo from "mongodb";

export async function connect() {
  const uri =
    "mongodb+srv://amizonedb:Amizone123@cluster0.7m0ey.mongodb.net/?retryWrites=true&w=majority";
  const client = new mongo.MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: mongo.ServerApiVersion.v1,
  });
  await client.connect();
  const userCollection = client.db("Amizone").collection("students");
  console.log("Running Database...");
  return [client, userCollection];
}

export async function close(client) {
  await client.close();
}
