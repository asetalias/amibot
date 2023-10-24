import "dotenv/config";

import * as database from "./database.js";
import { FastifyInstance } from "fastify";
import fastifySensible from "@fastify/sensible";
import root from "./routes/root.js";
import webhook from "./routes/webhook.js";

export default async function (fastify: FastifyInstance) {
  // TODO: handle error and log
  const [client, dbCollection] = await database.connect();

  // Close connection to DB as server closes
  fastify.addHook("onClose", () => {
    database.close(client);
  });

  // This plugins adds some utilities to handle http errors
  fastify.register(fastifySensible.default, {
    errorHandler: false,
  });

  //We are registering routes manually due to fastifyAutoLoad not being compatible with .ts
  
  fastify.register(webhook, {
    db: dbCollection
  });
  fastify.register(root, {
    db: dbCollection
  });
}