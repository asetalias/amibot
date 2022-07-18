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
  async sendTemplate(to, template, language = "en") { // Changed from en_us to en
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

  async sendList(to){
    const date = new Date();
    let date0 = getDate(date);
    date.setDate(date.getDate() + 1);
    let date1 = getDate(date);
    date.setDate(date.getDate() + 1);
    let date2 = getDate(date);
    date.setDate(date.getDate() + 1);
    let date3 = getDate(date);

    await this._send(to,"interactive",{
      
        type: "list",
        header: {
            type: "text",
            text: "Date Selection"
        },
        body: {
            text: "Select the Date"
        },
        action: {
            button: "Options",
            sections: [
                {
                    title: "Dates",
                    rows: [
                        {
                            id: "1",
                            title: `${date0[2]}-${date0[1]}-${date0[0]}`,
                        },
                        {
                            id: "2",
                            title: `${date1[2]}-${date1[1]}-${date1[0]}`,
                        },
                        {
                            id: "3",
                            title: `${date2[2]}-${date2[1]}-${date2[0]}`,
                        },
                        {
                            id: "4",
                            title: `${date3[2]}-${date3[1]}-${date3[0]}`,
                        }
                    ]
                },
            ]
        }
    });
  }

  /**
   * @param {string} to
   * @param {"text"|"template"} type
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
    { from: sender, type: eventType, text: textObject, button: buttonObject },
  ] = arraySafe(messages);
  const { body: textBody } = objectSafe(textObject);
  const { payload: buttonPayload, text: buttonText } = objectSafe(buttonObject);

  return {
    subject,
    originService,
    botNumberId,
    sender,
    eventType,
    textBody,
    button: {
      payload: buttonPayload,
      text: buttonText,
    },
  };
};

function getDate(date){
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  return[day,month,year]
}