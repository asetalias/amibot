import axios from "axios";

const API_VERSION = "v12.0";
const API_BASE_URL = `https://graph.facebook.com`;

export class WhatsappApiClient {
  /**
   * @param {string} apiKey
   * @param {string} from
   * @param {Object} config
   */
  constructor(apiKey, from, config = null) {
    this._apiKey = apiKey;
    this._from = from;
    this._axios = (() => {
      if (config == null || !(config.axios instanceof axios.Axios)) {
        return axios.create({});
      }
      return config.axios;
    })();
  }

  /**
   * @param {string} to
   * @param {string} template
   * @param {string} language
   * @returns {Promise<void>}
   */
  async sendTemplate(to, template, language = "en") {
    // Changed from en_us to en
    await this._send(to, "template", {
      name: template,
      language: {
        code: language,
      },
    });
  }

  /**
   * @param {string} to
   * @param {string} message
   * @returns {Promise<void>}
   */
  async sendMessage(to, message) {
    await this._send(to, "text", {
      body: message,
    });
  }

  /**
   *
   * @param {string} to
   * @param {object} payload
   */
  async sendInteractiveMessage(to, payload) {
    await this._send(to, "interactive", payload);
  }

  /**
   * @param {string} to
   * @param {"text"|"template"|"interactive"} type
   * @param {object} value
   * @returns {Promise<void>}
   * @private
   *
   * TODO: improve error handling flow
   */
  async _send(to, type, value) {
    await this._axios
      .post(
        `${API_BASE_URL}/${API_VERSION}/${this._from}/messages`,
        {
          messaging_product: "whatsapp",
          to: to,
          type: type,
          [type]: JSON.stringify(value),
        },
        {
          headers: {
            Authorization: `Bearer ${this._apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )
      .catch((err) =>
        // TODO: remove this console log
        console.log("something went wrong while posting to meta api:", err)
      );
  }
}

/**
 * @param {Object} body
 * @returns {Payload}
 *
 * TODO(refactor): replace destructuring with optional-chaining to make the code more readable.
 */
export const parseWebhookPayload = (body) => {
  // Ensure we don't try to destructure non-arrays as arrays.
  const arraySafe = (val) => (Array.isArray(val) ? val : [{}]);
  const objectSafe = (val) => (val !== undefined ? val : {});

  const { object: subject, entry: events } = body;
  const [{ changes }] = arraySafe(events);
  const [
    {
      value: {
        messaging_product: originService,
        messages,
        metadata: { phone_number_id: botNumberId },
      },
    },
  ] = arraySafe(changes);
  const [
    {
      from: sender,
      type: eventType,
      text: textObject,
      button: buttonObject,
      interactive: interactiveObject,
    },
  ] = arraySafe(messages);
  const { body: textBody } = objectSafe(textObject);
  const { payload: buttonPayload, text: buttonText } = objectSafe(buttonObject);
  const {
    type: interactiveType,
    button_reply: buttonReply,
    list_reply: listReply,
  } = objectSafe(interactiveObject);

  const interactiveElement = (() => {
    if (interactiveType === "button_reply") {
      return buttonReply;
    }
    if (interactiveType === "button") {
      return buttonReply;
    }
    if (interactiveType === "list_reply") {
      return listReply;
    }
    if (eventType === "interactive") {
      console.error(
        "invalid interactive element in payload: ",
        interactiveType
      );
    }
    return {};
  })();
  const { title: interactiveTitle, id: interactiveId } = interactiveElement;

  return {
    subject,
    originService,
    eventType,
    botNumberId,
    sender,
    textBody: textBody ?? "",
    interactive: {
      type: interactiveType ?? "",
      title: interactiveTitle ?? "",
      interactiveId: interactiveId ?? "",
    },
    button: {
      payload: buttonPayload ?? "",
      text: buttonText ?? "",
    },
  };
};
