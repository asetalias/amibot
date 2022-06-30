import { appTemplateRequest, appIndividualRequest } from "./apprequest.js";
import { callAmizoneApi } from "./apicall.js";


export async function runIntegerState(msgbody, db, from ,phoneNumberId, token){

    const currDoc = await db.findOne({ phone: `${from}` });

    switch(Number(msgbody)){

        case 1: {
            console.log("Hello");
            const api = callAmizoneApi(`${currDoc.username}`,`${currDoc.password}`);
            await api.amizoneServiceGetAttendance().then((response) => {
                    console.log("status: ", response.status);
                    console.log("courses: ", JSON.stringify(response.data));
                 })
                .catch((err) => {
                     console.log("something went wrong: ", err);
                });

            break;
               
            }

    }

    await appTemplateRequest(phoneNumberId, token, from, "button");
}