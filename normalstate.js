import { appTemplateRequest, appIndividualRequest } from "./apprequest.js";

export async function runState(msgbody, db, from, phoneNumberId, token) {
  const currState = await db.findOne({ phone: `${from}` });

  switch (currState.state) {
    // case "welcome": {
    //   await appTemplateRequest(phoneNumberId, token, from, "credentials"); // Send template credentials asking for the username and pass
    //   await appTemplateRequest(phoneNumberId, token, from, "username");
    //   break;
    // }

    case "username": {
      await db.updateOne(
        { phone: from },
        {
          $set: {
            username: msgbody,
          },
        },
        { upsert: true }
      );
      await appTemplateRequest(phoneNumberId, token, from, "password");
      break;
    }

    case "pass": {
      await db.updateOne(
        { phone: `${from}` },
        {
          $set: {
            password: msgbody,
          },
        },
        { upsert: true }
      );
      // @todo Verify the credentials
      // @todo Display confirmation msg
      await appTemplateRequest(phoneNumberId, token, from, "button");
      break;
    }

    case "buttons":
      if (msgbody === "Options") {
        // @todo Replace it with a template
        const optionText = "Option Menu";
        const text = `*${optionText}*

1. Attendance
2. Class Schedule
3. Courses
4. Main Menu`;
        await appIndividualRequest(phoneNumberId, token, from, text);
      }
      break;

    default:
      console.error("invalid user state!");
  }
}
