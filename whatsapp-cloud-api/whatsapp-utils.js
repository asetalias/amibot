/**
 * @param {Object} body
 * @returns {{button: {payload: string, text: string}, sender: string, subject, textBody: string, originService: string, botNumberId: string, eventType: string}}
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
