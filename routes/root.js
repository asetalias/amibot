/**
 *
 * @param {App.fastify} fastify
 * @param {*} opts
 */
export default async function (fastify, opts) {
  fastify.get("/", async (request, reply) => ({ root: true }));
}
