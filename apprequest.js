import axios from "axios";

export async function appTemplateRequest(phnId, tkn, from, tempName) {
  await axios({
    method: "POST", // method: "POST", // Required, HTTP method, a string, e.g. POST, GET
    url: `https://graph.facebook.com/v12.0/${phnId}/messages`,

    headers: {
      Authorization: `Bearer ${tkn}`,
      "Content-Type": " application/json",
    },
    data: {
      messaging_product: "whatsapp",
      to: from,
      type: "template",
      template: {
        name: `${tempName}`,
        language: {
          code: "en",
        },
      },
    },
  }).catch((err) =>
    console.log(`error in posting request to meta api: ${err}`)
  );
}

export function appIndividualRequest(phoneNumberId, token, from, text) {
  const url = axios({
    method: "POST", // method: "POST", // Required, HTTP method, a string, e.g. POST, GET
    url: `https://graph.facebook.com/v12.0/${phoneNumberId}/messages`,

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": " application/json",
    },
    data: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "text",
      text: {
        body: `${text}`,
      },
    },
  }).catch((err) =>
    console.log(`error in posting request to meta api: ${err}`)
  );
}
