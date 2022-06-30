import connect from "./database.js";

async function storePass(pass, phnNumber) {
// Storing database variable(db) and client from database.js so that we can close client
const variable = await connect();
const db = variable[0];
const client = variable[1];
  try {
    await db.updateOne(
      { phone: `${phnNumber}` }, // The function looks for phone num it updates/sets phone number and username even if the data doesnot exists
      {
        $set: {
          phone: `${phnNumber}`,
          password: `${pass}`,
        },
      },
      { upsert: true }
    );
    return {}; // returning empty
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    client.close(); // closing the client
  }
}

// Test Call
storePass("Hello.123", 888812888);
