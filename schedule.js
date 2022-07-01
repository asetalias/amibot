import { appIndividualRequest } from "./apprequest.js";

export default async function displaySchedule(
  object,
  phoneNumberId,
  token,
  from
) {
  let text = ``;
  for (let i = 0; i < object.records.length; i++) {
    const obj = object.records[i];
    let percent =
      (Number(obj.attendance.attended) / Number(obj.attendance.held)) * 100;
    percent = percent.toFixed(2);
    text += `
Course: ${obj.Course.name} , Course Code:${obj.Course.code}
Attendance: ${obj.attendance.attended}/${obj.attendance.held} (${percent}%)
`;
  }
  await appIndividualRequest(phoneNumberId, token, from, text);
}
