import { DEFAULT_STATE } from "./states/states.js";

/**
 * @param {string} phoneNumber
 * @param {App.Collection} db
 * @returns Promise<[boolean, User]>
 */
export const getBotUser = async (phoneNumber, db) => {
  const userEntry = await db.findOne({ phone: phoneNumber });
  if (userEntry === null) {
    return [
      false,
      {
        phone: phoneNumber,
        state: DEFAULT_STATE,
        amizoneCredentials: { username: null, password: null },
      },
    ];
  }

  const { phone, state, amizoneCredentials } = userEntry;
  const { username, password } = amizoneCredentials ?? {};

  return [
    true,
    {
      phone,
      state,
      amizoneCredentials: {
        username,
        password,
      },
    },
  ];
};

/**
 * @param {User} newState
 * @param {App.Collection} db
 */
export const updateBotUser = async (newState, db) => {
  await db.updateOne(
    { phone: newState.phone },
    {
      $set: newState,
    },
    {
      upsert: true,
    }
  );
};
