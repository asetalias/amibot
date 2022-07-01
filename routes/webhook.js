import { checkInitialState, initialState } from "../initialstate.js";
import { updateState } from "../updatestate.js";
import { runState } from "../normalstate.js";
import { runIntegerState } from "../integerstate.js";
import { logout } from "../logout.js";
import { runWelcome } from "../welcome.js";
import { appIndividualRequest } from "../apprequest.js";

const META_API_TOKEN = process.env.WHATSAPP_TOKEN;
const WEBHOOK_VERIFICATION_TOKEN = process.env.VERIFY_TOKEN;

/**
 * @param {App.Fastify} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
export default async function (fastify, opts) {
  // Accepts POST requests at /webhook endpoint
  fastify.post("/webhook", (req, res) => {
    const { /** @type {App.Collection} */ db } = opts;
    if (db === undefined) {
      throw new Error("db not injected!");
    }

    const { type } = req.body.entry[0].changes[0].value.messages[0]; // extracts the type of the message

    // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    if (req.body.object) {
      // check if the message is of the type text
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

        let msgBody;
        if (type === "text")
          msgBody = req.body.entry[0].changes[0].value.messages[0].text.body;
        // extract the message text from the webhook payload
        else if (type === "button")
          msgBody = req.body.entry[0].changes[0].value.messages[0].button.text; // extract the button text from the webhook payload

        (async () => {
          if (await checkInitialState(from, db))
            // Checking whether the contact is already saved in the database or not
            await initialState(from, db);

          const currState = await db.findOne({ phone: `${from}` });

          if (currState.state === "buttons" && Number(msgBody)) {
            await runIntegerState(
              msgBody,
              db,
              from,
              phoneNumberId,
              META_API_TOKEN
            ); // Runs the Selection Menu
          } else if (currState.state === "welcome") {
            if (msgBody.toLowerCase() === "start") {
              await runWelcome(from, phoneNumberId, META_API_TOKEN);
              await updateState(from, db); // Updates the current state
            } else {
              appIndividualRequest(
                phoneNumberId,
                META_API_TOKEN,
                from,
                `Start the bot using "Start"`
              );
            }
          } else if (currState.state === "buttons" && msgBody === "Logout") {
            await logout(from, db);
            const logOutText = "Logout Successful...";
            await appIndividualRequest(
              phoneNumberId,
              META_API_TOKEN,
              from,
              `*${logOutText}*`
            );
          } else {
            await runState(msgBody, db, from, phoneNumberId, META_API_TOKEN); // Runs the current state
            await updateState(from, db); // Updates the current state
          }
        })();

        res.code(200);
      } else {
        // Return a '404 Not Found' if event is not from a WhatsApp API
        res.code(404);
      }
    }
    return {};
  });

  // Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
  // info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
  fastify.get("/webhook", (req, res) => {
    // Parse params from the webhook verification request
    const queryMode = req.query["hub.mode"];
    const queryToken = req.query["hub.verify_token"];
    const queryChallenge = req.query["hub.challenge"];

    // Check if a token and mode were sent
    if (queryMode && queryToken) {
      // Check the mode and token sent are correct
      if (
        queryMode === "subscribe" &&
        queryToken === WEBHOOK_VERIFICATION_TOKEN
      ) {
        // Respond with 200 OK and challenge token from the request
        console.log("WEBHOOK_VERIFIED");
        res.code(200).send(queryChallenge);
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.code(403);
      }
    }
    res.code(403);
  });
}
