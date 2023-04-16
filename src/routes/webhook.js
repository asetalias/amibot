import { getBotUser, updateBotUser } from "../user-store.js";
import botHandler from "../states/base-handler.js";
import { parseWebhookPayload, WhatsappApiClient } from "../whatsapp.js";

const META_API_TOKEN = process.env.WHATSAPP_TOKEN;
const WEBHOOK_VERIFICATION_TOKEN = process.env.VERIFY_TOKEN;

/**
 * @param {App.Fastify} fastify
 * @param {Object} opts
 * @returns {Promise<void>}
 */
export default async function (fastify, opts) {
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

    // If the Whatsapp payload contains none of a text body, button text or an interactive "type", return immediately since we have nothing to do.
    if (
      !payload.textBody &&
      !payload.button.text &&
      !payload.interactive.type
    ) {
      // TODO: Reply to the user with an "invalid message" response
      res.code(200);
      return {};
    }

    const [userExists, user] = await getBotUser(payload.sender, db);

    const context = {
      db,
      bot: new WhatsappApiClient(META_API_TOKEN, payload.botNumberId),
      payload,
      user,
    };

    const updatedUser = await botHandler(context);
    // Update user state if it needs to be reconciled
    if (!userExists || updatedUser.state !== user.state) {
      await updateBotUser(updatedUser, db);
    }
    res.code(200);
    return {};
  });

  // TODO: factor out request verification.
  // TODO: MAJOR: The post endpoint needs webhook verification too!
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
