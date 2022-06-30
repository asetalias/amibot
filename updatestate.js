
export async function updateState(phnNum,db){
    let updatedState;

    const currState = await db.findOne({phone:`${phnNum}`});
  

try{
    switch(currState.state)
    {
        case "welcome" :   updatedState = "username";
                         break;

        case "username"   :   updatedState = "pass";
                         break;
        
        case "pass"   :   updatedState = "buttons";
                         break;
        
    }


    await db.updateOne({phone:`${phnNum}`},
    {
        $set:{
            state: `${updatedState}`
        }
    }, { upsert: true })

    return updatedState;

 
}catch (err) {
    console.error(err);
    throw err;
}
//    finally {
//     client.close(); // closing the client
//   }

}

// Test Call
//updateState(888812888);
