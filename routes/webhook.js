import axios from "axios";
import "dotenv/config";

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = `EAAPVWvQg1ZAcBADTARGDG4UpNXyEKksjtGAeJWfozbsdyYuj8DZC1tQZCUFK50RbVNVEGwkfIi9Q5snK1ZCJ4ZBENZCcRbtf3usFlNUklFKlNIvSPtkAyXD0jfokaZCq7AeMrlDeRYXaEn6ZAyZASV0rD16BkFyl9stqbBNuOBgxd8RNPSfuyxfnHRi5hFZBR4SpPi6qGTJ0ZASwO1IfIYhGJx5crZAMfHZB8wQMZD`;
console.log(`Token is:${token}`);

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
        const url = axios({
          method: "POST", // method: "POST", // Required, HTTP method, a string, e.g. POST, GET
          url: `https://graph.facebook.com/v12.0/${phoneNumberId}/messages`,

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": " application/json",
          },
          data: {
            messaging_product: "whatsapp",
            to: from,
            type: "template",
            template: {
              name: "hello_world",
              language: {
                code: "en_US",
              },
            },
          },
        }).catch((err) =>
          console.log(`error in posting request to meta api: ${err}`)
        );
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
    // return {};
  });
}
