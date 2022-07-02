import { checkInitialState, initialState } from "../initialstate.js";
import { updateState } from "../updatestate.js";
import { runState } from "../normalstate.js";
import { runIntegerState } from "../integerstate.js";
import { logout } from "../logout.js";
import { runWelcome } from "../welcome.js";
import { appIndividualRequest } from "../apprequest.js";
import { parseWebhookPayload } from "../whatsapp-cloud-api/whatsapp-utils.js";

const META_API_TOKEN = process.env.WHATSAPP_TOKEN;
const WEBHOOK_VERIFICATION_TOKEN = process.env.VERIFY_TOKEN;

/**
 * @param {App.Fastify} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
export default async function (fastify, opts) {
  // Accepts POST requests at /webhook endpoint
  fastify.post("/webhook", async (req, res) => {
    const { /** @type {App.Collection} */ db } = opts;
    if (db === undefined) {
      throw new Error("db not injected!");
    }

    const payload = parseWebhookPayload(req.body);

    if (payload.subject !== "whatsapp_business_account") {
      res.code(404);
      return {};
    }

    if (!payload.textBody && !payload.button) {
      // @todo respond with an "invalid message" response
      res.code(404);
      return {};
    }

    // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    // check if the message is of the type text
    if (await checkInitialState(payload.sender, db))
      // Checking whether the contact is already saved in the database or not
      await initialState(payload.sender, db);

    const currState = await db.findOne({ phone: payload.sender });

    if (currState.state === "buttons" && Number(payload.textBody)) {
      await runIntegerState(
        payload.button.text,
        db,
        payload.sender,
        payload.botNumberId,
        META_API_TOKEN
      ); // Runs the Selection Menu
    } else if (currState.state === "welcome") {
      if (payload.textBody.toLowerCase() === "start") {
        await runWelcome(payload.sender, payload.botNumberId, META_API_TOKEN);
        await updateState(payload.sender, db); // Updates the current state
      } else {
        await appIndividualRequest(
          payload.botNumberId,
          META_API_TOKEN,
          payload.sender,
          `Start the bot using "Start"`
        );
      }
    } else if (currState.state === "buttons" && payload.textBody === "Logout") {
      await logout(payload.sender, db);
      const logOutText = "Logout Successful...";
      await appIndividualRequest(
        payload.botNumberId,
        META_API_TOKEN,
        payload.sender,
        `*${logOutText}*`
      );
    } else {
      await runState(
        payload.textBody,
        db,
        payload.sender,
        payload.botNumberId,
        META_API_TOKEN
      ); // Runs the current state
      await updateState(payload.sender, db); // Updates the current state
    }
    res.code(200);
    return {};
  });

  // Accepts GET requests at the /webhook endpoint. You need this URL to set up webhook initially.
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
