const mongoose =require("mongoose")


async function connectToDB() {

    // console.log("URI",process.env.MONGO_URI)
    try{
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("connected to database")
    }catch(err){
      console.log(err)
    }

}


module.exports = connectToDB
