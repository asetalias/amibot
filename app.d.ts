// A global namespace for types for an improved developer experience.
import * as Fastify from "fastify";
import * as Mongo from "mongodb"

declare namespace App {
    export interface Fastify extends Fastify.FastifyInstance{}
    export interface Collection extends Mongo.Collection<Mongo.Document>{}
}
