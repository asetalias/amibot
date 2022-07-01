import { appTemplateRequest, appIndividualRequest } from "./apprequest.js";
import { callAmizoneApi } from "./apicall.js";
import { displayAttendance } from "./attendance.js";

export async function runIntegerState(msgbody, db, from, phoneNumberId, token) {
  const currDoc = await db.findOne({ phone: `${from}` });

  switch (Number(msgbody)) {
    case 1: {
      console.log("Hello");
      const api = callAmizoneApi(`${currDoc.username}`, `${currDoc.password}`);
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
  }

  await appTemplateRequest(phoneNumberId, token, from, "button");
}
