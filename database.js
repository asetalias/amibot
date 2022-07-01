import * as mongo from "mongodb";

const { MONGO_URL, DB_NAME, USER_COLLECTION_NAME } = process.env;

export async function connect() {
  // @todo factor out auth from URl
  const client = new mongo.MongoClient(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: "1",
    keepAlive: true,
  });
  console.log("connecting to database...");
  await client.connect();
  const userCollection = client.db(DB_NAME).collection(USER_COLLECTION_NAME);
  return [client, userCollection];
}

export async function close(client) {
  await client.close();
}
