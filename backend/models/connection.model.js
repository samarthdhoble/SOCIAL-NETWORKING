import mongoose from "mongoose";

const connectionRequest = new mongoose.Schema({
  userId :{
    type : mongoose.Schema.types.ObjectId,
    ref : 'User'
  },
  connectionId: {
    type : mongoose.Schema.types.ObjectId,
    ref : 'User'
  },
  status_accepted :{
    type : Boolean,
    default : null
  }

});


const ConnectionRequest = mongoose.model('ConnectionRequest' , connectionRequest)

export default ConnectionRequest;