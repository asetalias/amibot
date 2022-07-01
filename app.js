import "dotenv/config";

import * as path from "path";
import AutoLoad from "@fastify/autoload";
import { fileURLToPath } from "url";
import * as database from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 *
 * @param {App.Fastify} fastify
 * @param {Fastify.} opts
 */
export default async function (fastify, opts) {
  // @todo error wrapping, logging
  const [client, dbCollection] = await database.connect();
  fastify.addHook("onClose", () => {
    database.close(client);
  });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: { db: dbCollection, ...opts },
  });
}
