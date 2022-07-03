import * as amizone from "amizone_api";
import { states } from "./states.js";
import { renderAttendance, renderOptionsMenu } from "./render-messages.js";

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>}
 */
const validateAmizoneCredentials = async (username, password) => {
  const amizoneClient = new amizone.AmizoneServiceApi(
    new amizone.Configuration({
      username,
      password,
    })
  );
  try {
    await amizoneClient.amizoneServiceGetAttendance();
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * @param {Context} ctx
 * @returns {Promise<User>}
 */
export const handleNewUser = async (ctx) => {
  const { payload } = ctx;
  const updatedUser = structuredClone(ctx.user);
  const message = payload.textBody;
  if (message?.toLowerCase() === "start") {
    await ctx.bot.sendTemplate(payload.sender, "credentials");
    await ctx.bot.sendTemplate(payload.sender, "username");
    updatedUser.state = states.EXPECT_USERNAME;
    return updatedUser;
  }
  await ctx.bot.sendMessage(payload.sender, "Start the ctx.bot using *start*");
  return updatedUser;
};

/**
 * @param {Context} ctx
 * @returns {Promise<User>}
 */
export const handleUsername = async (ctx) => {
  const { payload } = ctx;
  const updatedUser = structuredClone(ctx.user);
  updatedUser.state = states.EXPECT_PASSWORD;
  updatedUser.amizoneCredentials.username = payload.textBody;
  await ctx.bot.sendTemplate(payload.sender, "password");
  return updatedUser;
};

/**
 * @param {Context} ctx
 * @returns {Promise<User>}
 */
export const handlePassword = async (ctx) => {
  const { payload } = ctx;
  const updatedUser = structuredClone(ctx.user);
  const password = payload.textBody;
  const credentialsAreValid = await validateAmizoneCredentials(
    updatedUser.amizoneCredentials.username,
    password
  );
  if (credentialsAreValid) {
    updatedUser.amizoneCredentials.password = password;
    updatedUser.state = states.LOGGED_IN;
    // @todo update template name
    await ctx.bot.sendTemplate(payload.sender, "button");
    return updatedUser;
  }
  await ctx.bot.sendMessage(
    payload.sender,
    "could not validate credentials. please re-enter"
  );
  updatedUser.amizoneCredentials.username = null;
  updatedUser.state = states.EXPECT_USERNAME;
  return updatedUser;
};

/**
 * @param {BotHandlerContext} ctx
 * @returns AmizoneServiceApi
 */
const newAmizoneClient = (ctx) => {
  const { username, password } = ctx.user.amizoneCredentials;
  return new amizone.AmizoneServiceApi(
    new amizone.Configuration({
      username,
      password,
    })
  );
};

const loggedInOptions = {
  GET_ATTENDANCE: "1",
};

/**
 * @type {Map<string, (BotHandlerContext) => Promise<[boolean, string]>>}
 */
const optionsMap = new Map([
  [
    loggedInOptions.GET_ATTENDANCE,
    async (ctx) => {
      try {
        const attendance = await newAmizoneClient(
          ctx
        ).amizoneServiceGetAttendance();
        return [true, renderAttendance(attendance.data)];
      } catch (err) {
        // catch invalid credential?
        return [false, ""];
      }
    },
  ],
]);

/**
 * @param {BotHandlerContext} ctx
 * @todo MAJOR: catch errors on sending messages.
 * @returns {Promise<User>}
 */
export const handleLoggedIn = async (ctx) => {
  const { payload } = ctx;
  const message = payload.button.text ?? payload.textBody;
  const updatedUser = structuredClone(ctx.user);

  switch (message.toLowerCase()) {
    case "options":
      await ctx.bot.sendMessage(payload.sender, renderOptionsMenu());
      return updatedUser;
    case "logout":
      updatedUser.amizoneCredentials = { username: "", password: "" };
      updatedUser.state = states.NEW_USER;
      await ctx.bot.sendMessage(payload.sender, "logged out!");
      return updatedUser;
    default:
      if (optionsMap.has(message)) {
        const [success, text] = await optionsMap.get(message)(ctx);
        if (success) {
          await ctx.bot.sendMessage(payload.sender, text);
          return updatedUser;
        }
        await ctx.bot.sendMessage(
          payload.sender,
          "unsuccessful. maybe try logging in again?"
        );
      }
      return updatedUser;
  }
  // @todo queries
};
