import { appTemplateRequest} from "./apprequest.js";

export async function runWelcome(from, phoneNumberId, token) {


      await appTemplateRequest(phoneNumberId, token, from, "credentials"); // Send template credentials asking for the username and pass
      await appTemplateRequest(phoneNumberId, token, from, "username");
  }
