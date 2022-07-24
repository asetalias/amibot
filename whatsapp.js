import axios from "axios";
import { renderRelativeDate } from "./utils.js";

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

  async sendList(to) {
    const dates = new Array(5);
    for (let i = 0; i < 5; i += 1) {
      dates[i] = renderRelativeDate(i - 2);
    }

    await this._send(to, "interactive", {
      type: "list",
      header: {
        type: "text",
        text: "Date Selection",
      },
      body: {
        text: "Select the Date",
      },
      action: {
        button: "Options",
        sections: [
          {
            title: "Dates",
            rows: dates.map((dateString, index) => ({
              id: index + 1,
              title: dateString,
            })),
          },
        ],
      },
    });
  }

  /**
   * @param {string} to
   * @param {"text"|"template"|"interactive"} type
   * @param {object} value
   * @returns {Promise<void>}
   * @private
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
        // @todo remove?
        console.log("something went wrong while posting to meta api:", err)
      );
  }
}

/**
 * @param {Object} body
 * @returns {Payload}
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
  const { title: interactiveTitle, description: interactiveDescription } =
    interactiveElement;

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
      description: interactiveDescription ?? "",
    },
    button: {
      payload: buttonPayload ?? "",
      text: buttonText ?? "",
    },
  };
};
