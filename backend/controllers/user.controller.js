import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Profile from '../models/profile.model.js';
import { runInNewContext } from 'vm';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { workerData } from 'worker_threads';



const convertUserDataToPDF = async (userProfile) => {

  const doc = new PDFDocument();


  const outputPath = crypto.randomBytes(32).toString('hex') + '.pdf';


  const stream = fs.createWriteStream("uploads/" + outputPath);


  doc.pipe(stream);


  let pictureFile = userProfile?.userId?.profilePicture;
  if (!pictureFile || pictureFile === "") {
    pictureFile = "default.jpg";
  }
  const imagePath = 'uploads/' + pictureFile;

  // Set desired max width and height for the image in the PDF
  const fitDimensions = [120, 120]; // adjust as needed

  try {
    if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
      doc.image(imagePath, {
        fit: fitDimensions,
        align: 'center',
        valign: 'center'
      });
    } else {
      doc.text('Profile picture not found');
    }
  } catch (err) {
    doc.text('Error displaying profile picture');
  }



  doc.fontSize(20).text(`Name: ${userProfile.userId.name}`);

  doc.moveDown();
  doc.fontSize(16).text(`Username: ${userProfile.userId.username}`);

  doc.moveDown();
  doc.fontSize(16).text(`Email: ${userProfile.userId.email}`);

  doc.moveDown();
  doc.fontSize(16).text(`Bio: ${userProfile.bio}`);

  doc.moveDown();
  doc.fontSize(16).text(`Current Post: ${userProfile.currentPost}`);

  doc.moveDown();
  doc.fontSize(16).text(`Experience:`, { align: 'left' });

  userProfile.pastWork.forEach((work, index) => {
    doc.moveDown();
    doc.fontSize(14).text(`Company Name : ${work.company}`);
    doc.fontSize(14).text(`Position : ${work.position}`);
    doc.fontSize(14).text(`Years : ${work.years}`);
    doc.moveDown();
  });

  doc.fontSize(16).text(`Education:`, { align: 'left' });
  userProfile.education.forEach((edu, index) => {
    doc.moveDown();
    doc.fontSize(14).text(`School : ${edu.school}`);
    doc.fontSize(14).text(`Degree : ${edu.degree}`);
    doc.fontSize(14).text(`Field Of Study : ${edu.filedOfStudy}`);
    doc.moveDown();
  });


  doc.end();

  return outputPath;
}


// Controller for user registration and login
export const register = async (req , res) => {
  try {
    const {name , email , password , username } = req.body;

    if (!name || !email || !password || !username) {
      return res.status(400).json({message: "All fields are required"});
    }


    const user = await User.findOne({email});

    if (user) {
      return res.status(400).json({message: "User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      username
    })

    await newUser.save();

    const profile = new Profile({
      userId: newUser._id,
      bio: '',
      currentPost: '',
      pastWork: [],
      education: []
    });

    await profile.save();

    return res.status(201).json({
      message: "User registered successfully " + newUser.name,
    });


  } catch (error) {
    return res.status(500).json({message: "Internal Server Error", error: error.message});
  }
}

export const login = async (req , res) => {
  try {
    const {email , password} = req.body;

    if (!email || !password) {
      return res.status(400).json({message: "Email and password are required"});
    }

    const user = await User.findOne({
      email
    })

    if (!user){
      return res.status(404).json({message: "User not found"});
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({message: "Invalid credentials"});
    }

    const token = crypto.randomBytes(32).toString('hex');

    await User.updateOne(
      { _id: user._id },
      { $set: { token } }
    )

    return res.status(200).json({
      message: "Login successful",
      token: token,
    });



  } catch (error) {
    return res.status(500).json({message: "Internal Server Error", error: error.message});
  }
}


export const uploadProfilePicture = async (req, res) => {
  
  try {
    const { token } = req.body;

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    user.profilePicture = req.file.filename;
    await user.save();  
    
    return res.status(200).json({ message: "Profile picture updated successfully", profilePicture: user.profilePicture });


  } catch (error ){
    console.error("Upload error:", error);
    return res.status(500).json({
      message: "Something went wrong during upload",
      error: error.message,
    });

  }
};


export const updateUserProfile = async (req, res) => {

  try {
    const {token, ...newUserData} = req.body;

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }   

    const {username , email} = newUserData;
  
    const existingUser = await User.findOne({ username });

    if (existingUser && existingUser._id.toString() !== user._id.toString()) { 
      return res.status(400).json({ message: "Username already exists" });
    } 

    Object.assign(user, newUserData);
    await user.save();
  

    return res.status(200).json({ message: "User profile updated successfully", user });


  } catch(error) {
    return res.status(500).json({message: "Internal Server Error", error: error.message});  
  }
}


export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.body;

    console.log("Received token:", token);

    const user = await User.findOne({ token:token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = await Profile.findOne({ userId: user._id }).populate('userId', 'name username email profilePicture');

    return res.status(200).json({
      user: user,
      profile: userProfile
    });

  } catch (error) {
    console.error("Error in getUserAndProfile:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const updateProfileData = async (req , res) => {

  try {
    const { token , ...newProfileData } = req.body;

    const userProfile = await User.findOne({ token });

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile_to_update = await Profile.findOne({ userId: userProfile._id });

    if (!profile_to_update) {
      return res.status(404).json({ message: "Profile not found" });
    }

    Object.assign(profile_to_update, newProfileData);
    await profile_to_update.save();

    return res.status(200).json({ message: "Profile updated successfully", profile: profile_to_update });



  } catch (error) { 
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}


export const getAllUserProfile = async (req, res) => {
  try {
    const profiles = await Profile.find().populate('userId', 'name username email profilePicture');

    return res.status(200).json({ profiles });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}



export const downloadProfile = async (req, res) => {

  const user_id = req.query.id;


  const userProfile = await Profile.findOne({ userId: user_id }).populate('userId', 'name username email profilePicture');
  if (!userProfile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  let outputPath = await convertUserDataToPDF(userProfile);

  return res.status(200).json({ message: "Profile downloaded successfully : " , outputPath });
}