import { BotHandlerContext, states, User } from "./states.js";
import {
  renderAmizoneMenu,
  renderQuickAttendanceButtons,
  renderAttendance,
  renderCourses,
  renderSchedule,
  renderWelcomeMessage,
  renderUsernamePrompt,
  renderPasswordPrompt,
  renderClassScheduleDateList,
  renderFacultyFeedbackInstructions,
  renderFacultyFeedbackConfirmation,
  renderExamSchedule,
  renderHelpMessage,
} from "./render-messages.js";
import { firstNonEmpty, newAmizoneClient } from "../utils.js";

// === Utilities ===
const OFFSET_IST = 330;
const MINUTE_TO_MS = 60_000;
const DAY_TO_MINUTE = 24 * 60;
const currentTzOffset = new Date().getTimezoneOffset();

const dateToIST = (date: Date): Date =>
  new Date(date.getTime() + (OFFSET_IST - currentTzOffset) * MINUTE_TO_MS);

const validateAmizoneCredentials = async (
  username: string,
  password: string
): Promise<boolean> => {
  const amizoneClient = newAmizoneClient({ username, password });
  try {
    await amizoneClient.amizoneServiceGetSemesters();
    return true;
  } catch (e) {
    return false;
  }
};

export const handleNewUser = async (ctx: BotHandlerContext): Promise<User> => {
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

export const handleExpectUsername = async (
  ctx: BotHandlerContext
): Promise<User> => {
  const { payload } = ctx;
  const updatedUser = structuredClone(ctx.user);
  updatedUser.state = states.EXPECT_PASSWORD;
  updatedUser.amizoneCredentials.username = payload.textBody;
  await ctx.bot.sendMessage(payload.sender, renderPasswordPrompt());
  return updatedUser;
};

export const handleExpectPassword = async (
  ctx: BotHandlerContext
): Promise<User> => {
  const { payload } = ctx;
  const updatedUser = structuredClone(ctx.user);
  const password = payload.textBody;
  const username = updatedUser.amizoneCredentials.username;
  if (!username) {
    await ctx.bot.sendMessage(
      ctx.payload.sender,
      "unexpectedly, the username is unset. this is a bug in the bot that should be reported.\nEnter username again:"
    );
    updatedUser.state = states.EXPECT_USERNAME;
    return updatedUser;
  }

  const credentialsAreValid = await validateAmizoneCredentials(
    username,
    password
  );
  if (credentialsAreValid) {
    updatedUser.amizoneCredentials.password = password;
    updatedUser.state = states.LOGGED_IN;
    await ctx.bot.sendInteractiveMessage(
      payload.sender,
      renderQuickAttendanceButtons()
    );
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

const AmizoneMenuOptions = {
  GET_ATTENDANCE: "total attendance",
  GET_SCHEDULE: "class schedule",
  GET_COURSES: "course details",
  FILL_FACULTY_FEEDBACK: "fill faculty feedback",
  GET_EXAM_SCHEDULE: "exam schedule",
  GET_HELP: "help", 
};


type StateHandlerFunctionOut = Promise<{
  success: boolean;
  message: string | object | null;
  newState?: string;
}>;
type StateHandlerFunction = (ctx: BotHandlerContext) => StateHandlerFunctionOut;

/**
 * Map enumerated menu options to handlers that return a boolean to indicate success and a string
 * that is rendered to the client.
 */
const amizoneMenuHandlersMap: Map<string, StateHandlerFunction> = new Map([
  [
    AmizoneMenuOptions.GET_ATTENDANCE,
    async (ctx: BotHandlerContext): StateHandlerFunctionOut => {
      try {
        const attendance = await newAmizoneClient(
          ctx.user.amizoneCredentials
        ).amizoneServiceGetAttendance();
        return { success: true, message: renderAttendance(attendance.data) };
      } catch (err) {
        // catch invalid credential?
        return { success: false, message: "" };
      }
    },
  ],
  [
    AmizoneMenuOptions.GET_SCHEDULE,
    async (_ctx: BotHandlerContext): StateHandlerFunctionOut => ({
      success: true,
      message: renderClassScheduleDateList(),
      newState: states.EXPECT_SCHEDULE_DATE,
    }),
  ],
  [
    AmizoneMenuOptions.GET_COURSES,
    async (ctx: BotHandlerContext): StateHandlerFunctionOut => {
      try {
        const amizoneClient = newAmizoneClient(ctx.user.amizoneCredentials);
        const semesters = await amizoneClient.amizoneServiceGetSemesters();
        const currentSemester = semesters.data?.semesters?.[0].name;
        // @todo Send a response to ask the user about which semester's courses he/she wants
        const courses = await amizoneClient.amizoneServiceGetCourses(
          currentSemester ?? "" // TODO: "" is invalid, fix it with an error message instead
        );
        return { success: true, message: renderCourses(courses.data) };
      } catch (err) {
        return { success: false, message: "" };
      }
    },
  ],
  [
    AmizoneMenuOptions.FILL_FACULTY_FEEDBACK,
    async (_ctx): StateHandlerFunctionOut => ({
      success: true,
      message: renderFacultyFeedbackInstructions(),
      newState: states.EXPECT_FACULTY_FEEDBACK_SPEC,
    }),
  ],
  [
    AmizoneMenuOptions.GET_HELP,
    async (): StateHandlerFunctionOut => {
      try {
        
        return { success: true, message: renderHelpMessage() };
      }
      catch (err) {
        return { success: false, message: "" };
      }
    }
  ],
  [
    AmizoneMenuOptions.GET_EXAM_SCHEDULE,
    async (ctx): StateHandlerFunctionOut => {
      try {
        const amizoneClient = newAmizoneClient(ctx.user.amizoneCredentials);
        const examSchedule =
          await amizoneClient.amizoneServiceGetExamSchedule();
        return {
          success: true,
          message: renderExamSchedule(examSchedule.data),
        };
      } catch (err) {
        return { success: false, message: "" };
      }
    }
  ],
]);

/**
 * TODO: MAJOR: catch errors on sending messages.
 */
export const handleLoggedIn = async (ctx: BotHandlerContext): Promise<User> => {
  const { payload } = ctx;
  const inputMessage = firstNonEmpty(
    payload.button.text,
    payload.textBody,
    payload.interactive.title
  ).toLowerCase();
  const updatedUser = structuredClone(ctx.user);

  if (inputMessage === "logout") {
    updatedUser.amizoneCredentials = { username: "", password: "" };
    updatedUser.state = states.NEW_USER;
    await ctx.bot.sendMessage(payload.sender, "Logged Out!");
    return updatedUser;
  } else if (
    payload.interactive.title === "Yesterday's" ||
    payload.interactive.title === "Today's"
  ) {
    // Handle attendance button click
    await handleReplyAttendanceButton(ctx);
    return updatedUser;
  }

  type InputType = {
    [key: string]: string;
  };
  
  const mappings: InputType = {
    "/a": AmizoneMenuOptions.GET_ATTENDANCE,
    "/c":AmizoneMenuOptions.GET_COURSES,
    "/cs": AmizoneMenuOptions.GET_SCHEDULE,
    "/f": AmizoneMenuOptions.FILL_FACULTY_FEEDBACK,
    "/e" : AmizoneMenuOptions.GET_EXAM_SCHEDULE,
    "/h" : AmizoneMenuOptions.GET_HELP,
  };
  
  let inputMessageSlash: string = inputMessage;
  
  if (inputMessage in mappings) {
    inputMessageSlash = mappings[inputMessage];
  }
  

  const messageHandler = amizoneMenuHandlersMap.get(inputMessageSlash);

  if (messageHandler === undefined) {
    // TODO: send a more helpful message...
    await ctx.bot.sendMessage(
      payload.sender,
      "Invalid option selected. Try again?"
    );
    await ctx.bot.sendInteractiveMessage(
      payload.sender,
      renderQuickAttendanceButtons()
    );
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
    return updatedUser;
  }

  const { success, message, newState } = await messageHandler(ctx);
  if (!success) {
    await ctx.bot.sendMessage(
      payload.sender,
      "Unsuccessful. Either Amizone is down or you need to login again (hint: menu has a _logout_ option)"
    );
    await ctx.bot.sendInteractiveMessage(
      payload.sender,
      renderQuickAttendanceButtons()
    );
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
    return updatedUser;
  }

  if (typeof message === "string") {
    await ctx.bot.sendMessage(payload.sender, message);
    await ctx.bot.sendInteractiveMessage(
      payload.sender,
      renderQuickAttendanceButtons()
    );
    await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
  }

  if (typeof message === "object" && message !== null) {
    await ctx.bot.sendInteractiveMessage(payload.sender, message);
  }

  updatedUser.state = newState ?? states.LOGGED_IN;
  return updatedUser;
};

export const handleReplyAttendanceButton = async (
  ctx: BotHandlerContext
): Promise<User> => {
  const { payload } = ctx;
  const updatedUser = structuredClone(ctx.user);

  // Check if the user clicked either "Today's Attendance" or "Yesterday's Attendance"
  if (
    payload.interactive.title === "Today's" ||
    payload.interactive.title === "Yesterday's"
  ) {
    let selectedDate;

    if (payload.interactive.title === "Today's") {
      selectedDate = new Date(dateToIST(new Date()).getTime());
    } else {
      selectedDate = new Date(
        dateToIST(new Date()).getTime() - 1 * DAY_TO_MINUTE * MINUTE_TO_MS
      );
    }

    try {
      // Fetch attendance data for the selected date using your Amizone API client
      const [year, month, day] = [
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        selectedDate.getDate(),
      ];
      const attendance = await newAmizoneClient(
        ctx.user.amizoneCredentials
      ).amizoneServiceGetClassSchedule(year, month, day);

      // Send the attendance data as a message to the user
      if (
        attendance.data.classes !== undefined &&
        attendance.data.classes.length > 0
      ) {
        await ctx.bot.sendMessage(
          payload.sender,
          renderSchedule(attendance.data)
        );
      } else {
        await ctx.bot.sendMessage(payload.sender, "no schedule available.");
      }
      await ctx.bot.sendInteractiveMessage(
        payload.sender,
        renderQuickAttendanceButtons()
      );
      await ctx.bot.sendInteractiveMessage(payload.sender, renderAmizoneMenu());
    } catch (error) {
      // Handle errors (e.g., API request error)
      console.error("Error fetching attendance for the selected date:", error);
    }
  }
  return updatedUser;
};

export const handleScheduleDateInput = async (ctx: BotHandlerContext) => {
  const { payload: whatsappPayload } = ctx;
  const dateInput = firstNonEmpty(
    whatsappPayload.interactive.title,
    whatsappPayload.textBody
  );
  const updatedUser = structuredClone(ctx.user);
  if (!Date.parse(dateInput)) {
    await ctx.bot
      .sendMessage(ctx.payload.sender, "invalid date!")
      .catch((err: any) =>
        console.error("failed to send message to WA: ", err)
      );
    await ctx.bot.sendInteractiveMessage(
      whatsappPayload.sender,
      renderClassScheduleDateList()
    );
    return updatedUser;
  }

  try {
    const date = dateInput.split("-");
    const [year, month, day] = [
      parseInt(date[0], 10),
      parseInt(date[1], 10),
      parseInt(date[2], 10),
    ];
    const schedule = await newAmizoneClient(
      ctx.user.amizoneCredentials
    ).amizoneServiceGetClassSchedule(year, month, day);
    if (
      schedule.data.classes !== undefined &&
      schedule.data.classes.length > 0
    ) {
      await ctx.bot.sendMessage(
        whatsappPayload.sender,
        renderSchedule(schedule.data)
      );
    } else {
      // ?: Could we make the message more informative, like indicating a holiday if its one?
      await ctx.bot.sendMessage(
        whatsappPayload.sender,
        "no schedule available."
      );
    }
    await ctx.bot.sendInteractiveMessage(
      whatsappPayload.sender,
      renderQuickAttendanceButtons()
    );
    await ctx.bot.sendInteractiveMessage(
      whatsappPayload.sender,
      renderAmizoneMenu()
    );
    updatedUser.state = states.LOGGED_IN;
  } catch (err) {
    // ? catch invalid credential
    console.error(`error while processing req: ${err}`);
  }
  return updatedUser;
};

export const handleFacultyFeedbackRating = async (ctx: BotHandlerContext) => {
  const { payload: whatsappPayload } = ctx;
  const message = firstNonEmpty(
    whatsappPayload.interactive.title,
    whatsappPayload.textBody
  );
  const updatedUser = structuredClone(ctx.user);

  if (message.toLowerCase().trim() === "cancel") {
    await ctx.bot.sendMessage(whatsappPayload.sender, "Cancelled.");
    await ctx.bot.sendInteractiveMessage(
      whatsappPayload.sender,
      renderQuickAttendanceButtons()
    );
    await ctx.bot.sendInteractiveMessage(
      whatsappPayload.sender,
      renderAmizoneMenu()
    );
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
      whatsappPayload.sender,
      "Invalid input. Please try again, or type *cancel* to cancel."
    );
    return updatedUser;
  }

  if (rating > 5 || rating < 1) {
    await ctx.bot.sendMessage(
      whatsappPayload.sender,
      "1 <= rating <= 5. Please try again."
    );
    return updatedUser;
  }
  if (queryRating > 3 || queryRating < 1) {
    await ctx.bot.sendMessage(
      whatsappPayload.sender,
      "1 <= queryRating <= 3. Please try again."
    );
    return updatedUser;
  }

  try {
    const feedback = await newAmizoneClient(
      ctx.user.amizoneCredentials
    ).amizoneServiceFillFacultyFeedback({ queryRating, rating, comment });
    if (feedback.data.filledFor === 0) {
      await ctx.bot.sendMessage(
        whatsappPayload.sender,
        "No feedback to fill at the moment"
      );
      await ctx.bot.sendInteractiveMessage(
        whatsappPayload.sender,
        renderQuickAttendanceButtons()
      );
      await ctx.bot.sendInteractiveMessage(
        whatsappPayload.sender,
        renderAmizoneMenu()
      );
      updatedUser.state = states.LOGGED_IN;
      return updatedUser;
    }
    await ctx.bot.sendMessage(
      whatsappPayload.sender,
      // @ts-ignore
      renderFacultyFeedbackConfirmation(feedback.data.filledFor)
    );
    await ctx.bot.sendInteractiveMessage(
      whatsappPayload.sender,
      renderQuickAttendanceButtons()
    );
    await ctx.bot.sendInteractiveMessage(
      whatsappPayload.sender,
      renderAmizoneMenu()
    );
    updatedUser.state = states.LOGGED_IN;
  } catch (err) {
    // ? catch invalid credential
    console.error(`error while processing req: ${err}`);
  }
  return updatedUser;
};
