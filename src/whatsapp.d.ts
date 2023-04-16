interface Payload {
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
    description: string,
  },
}

interface WhatsappApiClient {}
