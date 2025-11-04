import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  school: { 
    type: String, 
    default: '' 
  },
  degree: { 
    type: String, 
    default: '' 
  },
  fieldOfStudy: { 
    type: String, 
    default: '' 
  } // fixed
}, { 
  _id: false 
});

const workSchema = new mongoose.Schema({
  company: { 
    type: String, 
    default: '' 
  },
  position: { 
    type: String, 
    default: '' 
  },
  years: { 
    type: String, 
    default: '' 
  }
}, {
   _id: false 
  }
);

const profileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true 
  }, // Types (capital T)
  bio: { 
    type: String, 
    default: '' 
  },
  currentPost: { 
    type: String, 
    default: '' 
  },
  pastWork: { 
    type: [workSchema], 
    default: [] 
  },
  education: { 
    type: [educationSchema], 
    default: [] 
  }
}, { 
  timestamps: true 
}
);

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
