
import "dotenv/config";
import { checkInitialState,initialState } from "../initialstate.js";
import connect from "../database.js"
import {clientClose} from "../database.js";
import { updateState } from "../updatestate.js";
import { runState } from "../runstate.js";

// Initializing the database variable and the client
const database = await connect();
const db = database[0];
const client = database[1];

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = `EAAPVWvQg1ZAcBABSgZBFehBNFiF11VgNnwaBdqgUw6cI1ZCVsIqYNQLAGTOcK1R6GHbKGOqkHY4XXWbZAZBEKuO1rsFceMiaYZAtUeCZAG9hYZAcCmZBIHIANMs0ZC0XhXZBEXZAXhiwoFtUSrJgj3nVaAvKBNiEZBrs8vWBnK6D0vyvJVfsbvQH8BINZAQdW8otZBWfZCMJKnI3OTZBbOSVz9Jwz5TcLTYCNdjsemuMZD`;
console.log(`whatsapp token is :${token}`);

// @todo setup env
const webhookVerificationToken = process.env.VERIFY_TOKEN;

// Sets server port and logs message on success
export default async function (fastify, opts) {
  // Accepts POST requests at /webhook endpoint
  fastify.post("/webhook", (req, res) => {
    // Check the Incoming webhook message
    console.log(JSON.stringify(req.body, null, 2));

    // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    if (req.body.object) {
      if (
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0] &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0]
      ) {
        const { phone_number_id: phoneNumberId } =
          req.body.entry[0].changes[0].value.metadata;
        const { from } = req.body.entry[0].changes[0].value.messages[0]; // extract the phone number from the webhook payload
        const msgBody =
          req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
      (async () => {  
        
          if(await checkInitialState(from,db)) //Checking whether the contact is already saved in the database or not
            await initialState(from,db);

            await runState(msgBody,db,from,phoneNumberId,token); // Runs the current state
            const updatedState = await updateState(from,db);     // Updates the current state             

       
           
            //await clientClose(client);
        })()

        res.code(200);
      } else {
        // Return a '404 Not Found' if event is not from a WhatsApp API
        res.code(404);
      }
      return {};
    }
  });

  // Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
  // info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
  fastify.get("/webhook", (req, res) => {
    // Parse params from the webhook verification request
    const mode = req.query["hub.mode"];
    const tok = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Check if a token and mode were sent
    if (mode && tok) {
      // Check the mode and token sent are correct
      if (mode === "subscribe" && tok === webhookVerificationToken) {
        // Respond with 200 OK and challenge token from the request
        console.log("WEBHOOK_VERIFIED");
        res.code(200).send(challenge);
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.code(403);
      }
    }
    res.code(403);
    
  });
}
