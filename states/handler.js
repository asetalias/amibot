import * as handlers from "./state_handlers.js";
import { states } from "./states.js";

/**
 * @type {Map<string, (function(BotHandlerContext): Promise<User>)>}
 */
const handlerMap = new Map([
  [states.NEW_USER, handlers.handleNewUser],
  [states.EXPECT_USERNAME, handlers.handleUsername],
  [states.EXPECT_PASSWORD, handlers.handlePassword],
  [states.LOGGED_IN, handlers.handleLoggedIn],
]);

/**
 *
 * @param {BotHandlerContext} ctx
 * @returns {Promise<User>}
 */
const handleEvent = async (ctx) => {
  if (handlerMap.has(ctx.user.state)) {
    const handler = handlerMap.get(ctx.user.state);
    return handler(ctx);
  }
  // @todo can we do better handling here?
  console.error("invalid user state!");
  const updatedState = structuredClone(ctx.user);
  updatedState.state = states.NEW_USER;
  return updatedState;
};

export default handleEvent;
