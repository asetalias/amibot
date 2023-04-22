import * as handlers from "./state-handlers.js";
import { BotHandlerContext, User, states } from "./states.js";

const handlerMap: Map<string, (ctx: BotHandlerContext) => Promise<User>> =
  new Map([
    [states.NEW_USER, handlers.handleNewUser],
    [states.EXPECT_USERNAME, handlers.handleExpectUsername],
    [states.EXPECT_PASSWORD, handlers.handleExpectPassword],
    [states.LOGGED_IN, handlers.handleLoggedIn],
    [states.EXPECT_SCHEDULE_DATE, handlers.handleScheduleDateInput],
    [states.EXPECT_FACULTY_FEEDBACK_SPEC, handlers.handleFacultyFeedbackRating],
  ]);

const handle = async (ctx: BotHandlerContext): Promise<User> => {
  const handler = handlerMap.get(ctx.user.state);
  if (handler !== undefined) {
    return handler(ctx);
  }

  // @todo can we do better handling here?
  const updatedState = structuredClone(ctx.user);
  ctx.bot.sendMessage(
    ctx.payload.sender,
    "Invalid state detected. Resolving. Try again. Apologies for inconvenience."
  );
  if (updatedState.amizoneCredentials !== null) {
    updatedState.state = states.LOGGED_IN;
  } else {
    updatedState.state = states.NEW_USER;
  }
  return updatedState;
};

export default handle;
