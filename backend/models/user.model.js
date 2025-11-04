import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  active: { 
    type: Boolean, 
    default: true 
  },     // fixed
  password: { 
    type: String, 
    required: true, 
    select: false 
  }, // hide by default
  profilePicture: { 
    type: String, 
    default: 'default.jpg' 
  },
  token: { 
    type: String, 
    default: '' 
  }
}, {
  timestamps: true 
});

const User = mongoose.model('User', userSchema);
export default User;
