import { FastifyInstance } from "fastify";

export default async function (fastify: FastifyInstance, _opts: any) {
  fastify.get("/", async (_request, _reply) => ({ root: true }));
}
