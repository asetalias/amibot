// A global namespace for types for an improved developer experience.
import * as Fastify from "fastify";

interface fastify extends Fastify.FastifyInstance {};

export as namespace App;
