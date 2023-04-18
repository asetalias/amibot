import "dotenv/config";

import * as path from "path";
import AutoLoad from "@fastify/autoload";
import { fileURLToPath } from "url";
import fastifySensible from "@fastify/sensible";
import * as database from "./database.js";
import { FastifyInstance } from "fastify";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function (fastify: FastifyInstance, opts: object) {
  // TODO: handle error and log
  const [client, dbCollection] = await database.connect();

  // Close connection to DB as server closes
  fastify.addHook("onClose", () => {
    database.close(client);
  });

  // This plugins adds some utilities to handle http errors
  fastify.register(fastifySensible, {
    errorHandler: false,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: { db: dbCollection, ...opts },
  });
}
