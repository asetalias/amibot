import { appIndividualRequest } from "./apprequest.js";

export async function displayAttendance(object,phoneNumberId,token,from){
  let text = ``; 
  for(let i = 0 ; i < object.records.length; i++){
      const obj = object.records[i];
      let perc = (Number(obj.attendance.attended) / Number(obj.attendance.held))*100;
      perc = perc.toFixed(2);
 text = text + `
Course: ${obj.Course.name} , Course Code:${obj.Course.code}
Attendance: ${obj.attendance.attended}/${obj.attendance.held} (${perc}%)
` ;
    }
    await appIndividualRequest(phoneNumberId, token, from, text);
}