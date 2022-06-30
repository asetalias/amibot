
export async function logout(phnNum, db){

    await db.updateOne(
        { phone: `${phnNum}` },
        {
          $set: {
            state: "welcome",
          },
        },
        { upsert: true }
      );
    }