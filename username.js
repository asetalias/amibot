import connect, { clientClose } from "./database.js";

// Storing database variable(db) and client from database.js so that we can close client

// ! problem 1: can't use await here

export async function storeUsername(user, phnNumber) {
  const variable = await connect();
  const db = variable[0];
  const client = variable[1];

  try {
    await db.updateOne(
      { phone: `${phnNumber}` }, // The function looks for phone num it updates/sets phone number and username even if the data doesnot exists
      {
        $set: {
          phone: `${phnNumber}`,
          username: `${user}`,
        },
      },
      { upsert: true }
    );

    clientClose(client);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
// Test Call
storeUsername(23423, 8234525);
