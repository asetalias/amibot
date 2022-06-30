
export async function checkInitialState(phnNum,db){
    const exists = await db.findOne({phone: `${phnNum}`});

    if(exists)
       return false;  // Returns false if the database with corresponding contact number exists
    else 
       return true; // Returns true if the database with corresponding contact number does not exits
}

export async function initialState(phnNum,db){

    await db.updateOne({phone:`${phnNum}`},{
    
    $set:{
        phone : `${phnNum}`,            // Creating a new document with phone number and state(welcome) field 
        state : "welcome" //default
    }
    }, { upsert: true })

}

// Test Call
// (async () => {
//     await initialState(9643393772);
// })()

