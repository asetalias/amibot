import { test } from "tap";
import helper from "../helper.js";

test("default root route", async (t) => {
  const app = await helper.build(t);

  const res = await app.inject({
    url: "/",
  });
  t.same(JSON.parse(res.payload), { root: true });
});

// inject callback style:
//
// test('default root route', (t) => {
//   t.plan(2)
//   const app = await build(t)
//
//   app.inject({
//     url: '/'
//   }, (err, res) => {
//     t.error(err)
//     t.same(JSON.parse(res.payload), { root: true })
//   })
// })
