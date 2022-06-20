/**
 * @param {App.fastify} fastify
 * @param {object} opts
 */
export default async function (fastify, opts) {
  fastify.get("/", async (request, reply) => "this is an example");
}
