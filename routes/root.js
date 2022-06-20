/**
 * 
 * @param {App.fastify} fastify 
 * @param {*} opts 
 */
export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return { root: true }
  })
}
