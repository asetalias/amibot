import { test } from "tap";
import Fastify from "fastify";
import support from "../../plugins/support.js";

test("support works standalone", async (t) => {
  const fastify = Fastify();
  fastify.register(support);

  await fastify.ready();
  t.equal(fastify.someSupport(), "hugs");
});

// You can also use plugin with opts in fastify v2
//
// test('support works standalone', (t) => {
//   t.plan(2)
//   const fastify = Fastify()
//   fastify.register(Support)
//
//   fastify.ready((err) => {
//     t.error(err)
//     t.equal(fastify.someSupport(), 'hugs')
//   })
// })
