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
  [states.EXPECT_SCHEDULE_DATE, handlers.handleUseDate],
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
  // @todo verify the validity of these types
  ctx.bot.sendMessage(
    ctx.payload.sender,
    "Invalid state detected. Resolving. Try again. Apologies for inconvenience."
  );
  if (updatedState.user?.amizoneCredentials !== null) {
    updatedState.state = states.LOGGED_IN;
  } else {
    updatedState.state = states.NEW_USER;
  }
  return updatedState;
};

export default handleEvent;
