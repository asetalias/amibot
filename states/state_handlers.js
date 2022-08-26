import * as amizone from "amizone_api";
import { states } from "./states.js";
import {
  renderAttendance,
  renderOptionsMenu,
  renderSemester,
  renderSchedule,
} from "./render-messages.js";
import { firstNonEmpty } from "../utils.js";

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
    await amizoneClient.amizoneServiceGetSemesters();
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
    await ctx.bot.sendTemplate(payload.sender, "welcome");
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
  await ctx.bot.sendTemplate(payload.sender, "username");
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
  GET_ATTENDANCE: "Attendance",
  GET_SCHEDULE: "Class Schedule",
  GET_COURSES: "Courses",
  GET_SEMESTERS: "Semesters",
  GET_MENU: "Main Menu",
};

/**
 * Map enumerated menu options to handlers that return a boolean to indicate success and a string
 * that is rendered to the client.
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
  [
    loggedInOptions.GET_SCHEDULE,
    async (ctx) =>
      // const schedule = await newAmizoneClient(
      //   ctx
      // ).amizoneServiceGetClassSchedule(2022,7,19); //@todo add date feature
      //  console.log(schedule.data);
      // return [true, renderSchedule(schedule.data)];
      // updatedUser.state = states.USE_DATE;
      // @todo do things the right way: factor out the "list" response.
      [true, "list"],
  ],
  [
    loggedInOptions.GET_SEMESTERS,
    async (ctx) => {
      try {
        const semesters = await newAmizoneClient(
          ctx
        ).amizoneServiceGetSemesters();
        console.log(semesters.data);
        return [true, renderSemester(semesters.data)];
      } catch (err) {
        // catch invalid credential?
        return [false, ""];
      }
    },
  ],
  [loggedInOptions.GET_MENU, async (ctx) => [true, ""]],
]);

/**
 * @param {BotHandlerContext} ctx
 * @todo MAJOR: catch errors on sending messages.
 * @returns {Promise<User>}
 */
export const handleLoggedIn = async (ctx) => {
  const { payload } = ctx;
  const message = firstNonEmpty(payload.button.text, payload.textBody, payload.interactive.title);
  const updatedUser = structuredClone(ctx.user);

  switch (message.toLowerCase()) {
    case "options":
       await ctx.bot.sendOptionList(payload.sender);
      // await ctx.bot.sendMessage(payload.sender,renderOptionsMenu());
      return updatedUser;
    case "logout":
      updatedUser.amizoneCredentials = { username: "", password: "" };
      updatedUser.state = states.NEW_USER;
      await ctx.bot.sendMessage(payload.sender, "Logged Out!");
      return updatedUser;
    default:
      if (optionsMap.has(message)) {
        const [success, text] = await optionsMap.get(message)(ctx);
        if (success) {
          if (text === "list") {
            await ctx.bot.sendDateList(payload.sender);
            updatedUser.state = states.USE_DATE;
          } else {
            await ctx.bot.sendMessage(payload.sender, text);
            await ctx.bot.sendTemplate(ctx.payload.sender, "button");
          }

          return updatedUser;
        }
        await ctx.bot.sendMessage(
          payload.sender,
          "unsuccessful. maybe try logging in again?"
        );
        await ctx.bot.sendTemplate(payload.sender, "username");
        updatedUser.state = states.EXPECT_USERNAME;
        return updatedUser;
      }
      return updatedUser;
  }
  // @todo queries
};

export const handleUseDate = async (ctx) => {
  const { payload } = ctx;
  const message = firstNonEmpty(payload.interactive.title, payload.textBody);
  const updatedUser = structuredClone(ctx.user);
  if (Date.parse(message)) {
    try {
      const date = message.split("-");
      console.log(date[0]);
      const schedule = await newAmizoneClient(
        ctx
      ).amizoneServiceGetClassSchedule(date[0], date[1], date[2]); // @todo add date feature
      console.log("fetched scheduled: ", schedule.data); // @todo remove
      // send message here
      if (schedule.data.classes.length > 0) {
        await ctx.bot.sendMessage(
          payload.sender,
          renderSchedule(schedule.data)
        );
      } else {
        await ctx.bot.sendMessage(payload.sender, "no schedule available.");
      }
      await ctx.bot.sendTemplate(ctx.payload.sender, "button");
      updatedUser.state = states.LOGGED_IN;
    } catch (err) {
      // catch invalid credential?
      console.error(`error while processing req: ${err}`);
    }
    return updatedUser;
  }
  await ctx.bot
    .sendMessage(ctx.payload.sender, "invalid date!")
    .catch((err) => console.error("failed to send message to WA: ", err));
  return updatedUser;
};
