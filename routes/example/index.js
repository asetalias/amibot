/**
 * @param {App.fastify} fastify
 * @param {object} opts
 */
export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return 'this is an example'
  })
}
