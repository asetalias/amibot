import { getUser, updateUser } from "../persist.js";
import handler from "../states/handler.js";
import { parseWebhookPayload, WhatsappApiClient } from "../whatsapp.js";

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
    
    // TODO: remove
    console.log(`payload: ${JSON.stringify(payload)}`);

    if (payload.subject !== "whatsapp_business_account") {
      res.code(404);
      return {};
    }

    if (
      !payload.textBody &&
      !payload.button.text &&
      !payload.interactive.type
    ) {
      // @todo respond with an "invalid message" response
      res.code(200);
      return {};
    }

    const [exists, user] = await getUser(payload.sender, db);
    if (!exists) {
      console.log("new user!"); // @todo remove log
    }

    const context = {
      db,
      bot: new WhatsappApiClient(META_API_TOKEN, payload.botNumberId),
      payload,
      user,
    };

    const updatedUser = await handler(context);
    if (!exists || updatedUser.state !== user.state) {
      await updateUser(updatedUser, db);
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
        return;
      } 
        // Responds with '403 Forbidden' if verify tokens do not match
        res.code(403);
      
    }
    res.code(403);
  });

  return {};
}
