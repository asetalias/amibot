import { appTemplateRequest, appIndividualRequest } from "./apprequest.js";
import { callAmizoneApi } from "./apicall.js";
import displayAttendance from "./attendance.js";
import { runState } from "./normalstate.js";

export async function runIntegerState(msgbody, db, from, phoneNumberId, token) {
  let errorMsg = 0;
  const currDoc = await db.findOne({ phone: `${from}` });
  const api = callAmizoneApi(`${currDoc.username}`, `${currDoc.password}`);

  switch (Number(msgbody)) {
    case 1: {
      try {
        const attendanceResponse = await api.amizoneServiceGetAttendance();
        console.log("status: ", attendanceResponse.status);
        await displayAttendance(
          attendanceResponse.data,
          phoneNumberId,
          token,
          from
        );
      } catch (err) {
        console.log("something went wrong: ", err);
      }

      break;
    }
    /*
    case 2 :{
      try {
        const scheduleResponse = await api.amizoneServiceGetClassSchedule();
        console.log("status: ", scheduleResponse.status);
        await displaySchedule(
          scheduleResponse.data,
          phoneNumberId,
          token,
          from
        );
      } catch (err) {
        console.log("something went wrong: ", err);
      }
      break;

    }
  */

    case 4:
      break;

    default: {
      const text = "Select the correct option!";
      await appIndividualRequest(phoneNumberId, token, from, `*${text}*`);
      await runState("Options", db, from, phoneNumberId, token);
      errorMsg = 1;
    }
  }

  if (errorMsg == 0)
    await appTemplateRequest(phoneNumberId, token, from, "button");
}
