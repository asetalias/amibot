import { Collection } from "mongodb";
import { DEFAULT_STATE, User } from "./states/states.js";

export const getBotUser = async (phoneNumber: String, db: Collection): Promise<[boolean, User]> => {
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

export const updateBotUser = async (newState: User, db: Collection) => {
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
