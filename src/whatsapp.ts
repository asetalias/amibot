import axios, { AxiosInstance } from "axios";

const API_VERSION = "v12.0";
const API_BASE_URL = `https://graph.facebook.com`;

export interface WhatsappPayload {
  subject: string;
  originService: string;
  eventType: string;
  sender: string;
  botNumberId: string;
  textBody: string;
  button: {
    text: string;
    payload: string;
  };
  interactive: {
    type: string,
    title: string,
    interactiveId: string,
  },
}

export class WhatsappApiClient {
  _apiKey: String;
  _from: String;
  _axios: AxiosInstance;

  constructor(apiKey: string, from: string, config: { axios: AxiosInstance } | null = null) {
    this._apiKey = apiKey;
    this._from = from;
    this._axios = (() => {
      if (config == null || !(config.axios instanceof axios.Axios)) {
        return axios.create({});
      }
      return config.axios;
    })();
  }

  async sendTemplate(to: string, template: string, language: string = "en"): Promise<void> {
    // Changed from en_us to en
    await this._send(to, "template", {
      name: template,
      language: {
        code: language,
      },
    });
  }

  async sendMessage(to: string, message: string): Promise<void> {
    await this._send(to, "text", {
      body: message,
    });
  }

  async sendInteractiveMessage(to: string, payload: object) {
    await this._send(to, "interactive", payload);
  }

  /**
   * TODO: improve error handling flow
   * @private
   */
  async _send(to: string, type: "text" | "template" | "interactive", value: object): Promise<void> {
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
 * TODO(refactor): replace destructuring with optional-chaining to make the code more readable.
 */
export const parseWebhookPayload = (body: any): WhatsappPayload => {
  // Ensure we don't try to destructure non-arrays as arrays.
  const arraySafe = (val: any) => (Array.isArray(val) ? val : [{}]);

  const subject = body?.object;
  const events = body?.entry;
  const changes = events?.[0]?.changes;
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
  const textBody = textObject?.body;
  const buttonPayload = buttonObject?.payload;
  const buttonText = buttonObject?.text;
  const interactiveType = interactiveObject?.type;
  const buttonReply = interactiveObject?.button_reply;
  const listReply = interactiveObject?.list_reply;

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
