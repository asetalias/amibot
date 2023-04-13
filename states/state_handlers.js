import * as amizone from "amizone_api";
import { states } from "./states.js";
import {
  renderAmizoneMenu,
  renderAttendance,
  renderCourses,
  renderSemester,
  renderSchedule,
  renderWelcomeMessage,
  renderUsernamePrompt,
  renderPasswordPrompt,
  renderClassScheduleDateList,
  renderFacultyFeedbackInstructions,
  renderFacultyFeedbackConfirmaion,
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
    await ctx.bot.sendMessage(payload.sender, renderWelcomeMessage());
    await ctx.bot.sendMessage(payload.sender, renderUsernamePrompt());
    updatedUser.state = states.EXPECT_USERNAME;
    return updatedUser;
  }
  // TODO: fix this message
  await ctx.bot.sendMessage(
    payload.sender,
    "Start the bot by sending *start* in the chat. 😊"
  );
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
  await ctx.bot.sendMessage(payload.sender, renderPasswordPrompt());
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
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
    return updatedUser;
  }
  await ctx.bot.sendMessage(
    payload.sender,
    "could not validate credentials. please re-enter"
  );
  updatedUser.amizoneCredentials.username = null;
  updatedUser.state = states.EXPECT_USERNAME;
  await ctx.bot.sendMessage(payload.sender, renderUsernamePrompt());
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
  GET_ATTENDANCE: "attendance",
  GET_SCHEDULE: "class schedule",
  GET_COURSES: "courses",
  GET_SEMESTERS: "semesters",
  FILL_FACULTY_FEEDBACK: "fill faculty feedback",
};

/**
 * Map enumerated menu options to handlers that return a boolean to indicate success and a string
 * that is rendered to the client.
 * @type {Map<string, (BotHandlerContext) => Promise<[boolean, string]>>}
 */
const loggedInMessageMap = new Map([
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
    async (_ctx) => [
      true,
      renderClassScheduleDateList(),
      states.EXPECT_SCHEDULE_DATE,
    ],
  ],
  [
    loggedInOptions.GET_COURSES,
    async (ctx) => {
      try {
        const amizoneClient = newAmizoneClient(ctx);
        const semesters = await amizoneClient.amizoneServiceGetSemesters();
        const currentSemester = parseInt(semesters.data.semesters[0].name, 10);
        // @todo Send a response to ask the user about which semester's courses he/she wants
        const courses = await amizoneClient.amizoneServiceGetCourses(
          currentSemester
        );
        return [true, renderCourses(courses.data)];
      } catch (err) {
        return [false, ""];
      }
    },
  ],
  [
    loggedInOptions.GET_SEMESTERS,
    async (ctx) => {
      try {
        const semesters = await newAmizoneClient(
          ctx
        ).amizoneServiceGetSemesters();
        return [true, renderSemester(semesters.data)];
      } catch (err) {
        // catch invalid credential?
        return [false, ""];
      }
    },
  ],
  [
    loggedInOptions.FILL_FACULTY_FEEDBACK,
    async (_ctx) => [
      true,
      renderFacultyFeedbackInstructions(),
      states.EXPECT_FACULTY_FEEDBACK_SPEC,
    ],
  ],
]);

/**
 * @param {BotHandlerContext} ctx
 * TODO: MAJOR: catch errors on sending messages.
 * @returns {Promise<User>}
 */
export const handleLoggedIn = async (ctx) => {
  const { payload } = ctx;
  const message = firstNonEmpty(
    payload.button.text,
    payload.textBody,
    payload.interactive.title
  ).toLowerCase();
  const updatedUser = structuredClone(ctx.user);

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage === "logout") {
    updatedUser.amizoneCredentials = { username: "", password: "" };
    updatedUser.state = states.NEW_USER;
    await ctx.bot.sendMessage(payload.sender, "Logged Out!");
    return updatedUser;
  }

  if (!loggedInMessageMap.has(normalizedMessage)) {
    // TODO: send a more helpful message...
    await ctx.bot.sendMessage(
      payload.sender,
      "Invalid option selected. Try again?"
    );
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
    return updatedUser;
  }

  const [success, output, newState] = await loggedInMessageMap.get(
    normalizedMessage
  )(ctx);
  if (!success) {
    await ctx.bot.sendMessage(
      payload.sender,
      "Unsuccessful. Either Amizone is down or you need to login again (hint: menu has a _logout_ option)"
    );
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
    return updatedUser;
  }

  if (typeof output === "string") {
    await ctx.bot.sendMessage(payload.sender, output);
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
  }

  if (typeof output === "object") {
    await ctx.bot.sendInteractiveMessage(payload.sender, output);
  }

  updatedUser.state = newState ?? states.LOGGED_IN;
  return updatedUser;
};

export const handleExpectScheduleDate = async (ctx) => {
  const { payload } = ctx;
  const message = firstNonEmpty(payload.interactive.title, payload.textBody);
  const updatedUser = structuredClone(ctx.user);
  if (Date.parse(message)) {
    try {
      const date = message.split("-");
      const schedule = await newAmizoneClient(
        ctx
      ).amizoneServiceGetClassSchedule(date[0], date[1], date[2]); // @todo add date feature
      if (schedule.data.classes.length > 0) {
        await ctx.bot.sendMessage(
          payload.sender,
          renderSchedule(schedule.data)
        );
      } else {
        // ? could we make this message more useful
        await ctx.bot.sendMessage(payload.sender, "no schedule available.");
      }
      await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
      updatedUser.state = states.LOGGED_IN;
    } catch (err) {
      // ? catch invalid credential
      console.error(`error while processing req: ${err}`);
    }
    return updatedUser;
  }
  await ctx.bot
    .sendMessage(ctx.payload.sender, "invalid date!")
    .catch((err) => console.error("failed to send message to WA: ", err));
  await ctx.bot.sendDateList(payload.sender);
  return updatedUser;
};

export const handleExpectFacultyFeedbackSpec = async (ctx) => {
  const { payload } = ctx;
  /** @type {String} */
  const message = firstNonEmpty(payload.interactive.title, payload.textBody);
  const updatedUser = structuredClone(ctx.user);

  if (message.toLowerCase().trim() === "cancel") {
    await ctx.bot.sendMessage(payload.sender, "Cancelled.");
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
    updatedUser.state = states.LOGGED_IN;
    return updatedUser;
  }

  const [ratingStr, queryRatingStr, ...commentParts] = message.split(" ");
  const comment = commentParts.join(" ").trim();
  const [rating, queryRating] = [
    parseInt(ratingStr, 10),
    parseInt(queryRatingStr, 10),
  ];
  if (
    Number.isNaN(rating) ||
    Number.isNaN(queryRating) ||
    comment.length === 0
  ) {
    await ctx.bot.sendMessage(
      payload.sender,
      "Invalid input. Please try again."
    );
    return updatedUser;
  }

  if (rating > 5 || rating < 1) {
    await ctx.bot.sendMessage(
      payload.sender,
      "1 <= rating <= 5. Please try again."
    );
    return updatedUser;
  }
  if (queryRating > 3 || queryRating < 1) {
    await ctx.bot.sendMessage(
      payload.sender,
      "1 <= queryRating <= 3. Please try again."
    );
    return updatedUser;
  }

  try {
    const feedback = await newAmizoneClient(
      ctx
    ).amizoneServiceFillFacultyFeedback(rating, queryRating, comment);
    if (feedback.data.filledFor === 0) {
      await ctx.bot.sendMessage(
        payload.sender,
        "No feedback to fill at the moment"
      );
      await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
      updatedUser.state = states.LOGGED_IN;
      return updatedUser;
    }
    await ctx.bot.sendMessage(
      payload.sender,
      renderFacultyFeedbackConfirmaion(feedback.data.filledFor)
    );
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
    updatedUser.state = states.LOGGED_IN;
  } catch (err) {
    // ? catch invalid credential
    console.error(`error while processing req: ${err}`);
  }
  return updatedUser;
};
