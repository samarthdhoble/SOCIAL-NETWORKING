import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Profile from '../models/profile.model.js';
import { runInNewContext } from 'vm';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { workerData } from 'worker_threads';
import path from "path";



export const convertUserDataToPDF = async (userProfile) => {
  // ---- Safety guards & fallbacks ----
  const user = userProfile?.userId || {};
  const name = user?.name || 'N/A';
  const username = user?.username || 'N/A';
  const email = user?.email || 'N/A';
  const bio = userProfile?.bio || '';
  const currentPost = userProfile?.currentPost || '';
  const pastWork = Array.isArray(userProfile?.pastWork) ? userProfile.pastWork : [];
  const education = Array.isArray(userProfile?.education) ? userProfile.education : [];

  // fieldOfStudy can be stored as the corrected "fieldOfStudy" or older "filedOfStudy" typo
  const getFieldOfStudy = (edu) => edu?.fieldOfStudy ?? edu?.filedOfStudy ?? '';

  // ---- Prepare output paths ----
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const outputFilename = `${crypto.randomBytes(32).toString('hex')}.pdf`;
  const outputPath = path.join(uploadsDir, outputFilename);

  // ---- Create & pipe PDF ----
  const doc = new PDFDocument({ autoFirstPage: true, margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // ---- Header / Title ----
  doc
    .fontSize(22)
    .text('User Profile', { align: 'center' })
    .moveDown(0.5);

  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke()
    .moveDown(1);

  // ---- Profile Picture (centered) ----
  const pictureFile = (user?.profilePicture && user.profilePicture.trim()) ? user.profilePicture : 'default.jpg';
  const imagePath = path.join(uploadsDir, pictureFile);

  const imageBoxWidth = 120;
  const imageBoxHeight = 120;

  try {
    if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
      // center image
      const xCenter = (doc.page.width - imageBoxWidth) / 2;
      const startY = doc.y; // current Y
      doc.image(imagePath, xCenter, startY, { fit: [imageBoxWidth, imageBoxHeight], align: 'center', valign: 'center' });
      doc.moveDown(6); // add space after image block
    } else {
      doc
        .fontSize(10)
        .fillColor('gray')
        .text('(Profile picture not found)', { align: 'center' })
        .fillColor('black')
        .moveDown(1.5);
    }
  } catch {
    doc
      .fontSize(10)
      .fillColor('gray')
      .text('(Error displaying profile picture)', { align: 'center' })
      .fillColor('black')
      .moveDown(1.5);
  }

  // ---- Helper to render labeled fields ----
  const addField = (label, value) => {
    doc.fontSize(14).font('Helvetica-Bold').text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(value || '—');
  };

  // ---- Basic Info ----
  addField('Name', name);
  addField('Username', username);
  addField('Email', email);
  doc.moveDown(0.5);

  // ---- Bio / Current Post ----
  addField('Bio', bio);
  addField('Current Post', currentPost);
  doc.moveDown(0.5);

  // ---- Experience ----
  doc.fontSize(16).font('Helvetica-Bold').text('Experience');
  doc.moveDown(0.25);
  if (pastWork.length === 0) {
    doc.fontSize(12).font('Helvetica').text('No experience added yet.');
  } else {
    pastWork.forEach((work, i) => {
      const company = work?.company || '';
      const position = work?.position || '';
      const years = work?.years || '';

      doc
        .moveDown(0.35)
        .fontSize(13).font('Helvetica-Bold').text(`${i + 1}. ${company || 'Company'}`)
        .font('Helvetica').fontSize(12)
        .text(`Position: ${position || '—'}`)
        .text(`Years: ${years || '—'}`);
    });
  }
  doc.moveDown(0.75);

  // ---- Education ----
  doc.fontSize(16).font('Helvetica-Bold').text('Education');
  doc.moveDown(0.25);
  if (education.length === 0) {
    doc.fontSize(12).font('Helvetica').text('No education added yet.');
  } else {
    education.forEach((edu, i) => {
      const school = edu?.school || '';
      const degree = edu?.degree || '';
      const fieldOfStudy = getFieldOfStudy(edu) || '';

      doc
        .moveDown(0.35)
        .fontSize(13).font('Helvetica-Bold').text(`${i + 1}. ${school || 'School'}`)
        .font('Helvetica').fontSize(12)
        .text(`Degree: ${degree || '—'}`)
        .text(`Field of Study: ${fieldOfStudy || '—'}`);
    });
  }

  // ---- Footer line ----
  doc.moveDown(1);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();

  // ---- Finalize and wait for file to be written ----
  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Return just the filename so your route can respond with it (and you can build URLs as needed)
  return path.basename(outputPath);
};



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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // IMPORTANT: select +password so bcrypt has the hash
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      // Defensive: handle legacy/bad data cases
      return res.status(500).json({ message: "Account has no password set. Please reset your password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await User.updateOne({ _id: user._id }, { $set: { token } });

    // never return password
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


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
    const { token, name, username, email, password } = req.body;
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Enforce unique username/email
    if (username) {
      const taken = await User.findOne({ username, _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ message: "Username already exists" });
      user.username = username.toLowerCase().trim();
    }
    if (email) {
      const taken = await User.findOne({ email, _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ message: "Email already exists" });
      user.email = email.toLowerCase().trim();
    }
    if (name) user.name = name.trim();
    if (password) user.password = await bcrypt.hash(password, 10); // re-hash

    await user.save();
    return res.status(200).json({ message: "User profile updated successfully", user: {
      _id: user._id, name: user.name, username: user.username, email: user.email, profilePicture: user.profilePicture
    }});
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ token }).select('_id name username email profilePicture');
    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = await Profile
      .findOne({ userId: user._id })
      .populate('userId', 'name username email profilePicture');

    return res.status(200).json({ user, profile });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



export const updateProfileData = async (req, res) => {
  try {
    const { token, bio, currentPost, pastWork, education } = req.body;

    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    if (bio !== undefined) profile.bio = bio;
    if (currentPost !== undefined) profile.currentPost = currentPost;
    if (pastWork !== undefined) profile.pastWork = pastWork;       // validate shape in real code
    if (education !== undefined) profile.education = education;    // validate shape in real code

    await profile.save();
    return res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



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


export const sendConnectionRequest = async (req, res) => {
  const {token , connectionId } = req.body;

  try {

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const connectionUser = await User.findById(connectionId);
    if (!connectionUser) {
      return res.status(404).json({ message: "Connection user not found" });
    }

    const existingRequest =  await connectionUser.connectionRequests.find(request => request.from.toString() === user._id.toString());
    if (existingRequest) {
      return res.status(400).json({ message: "Connection request already sent" });
    }





  }
  catch(err){
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }



}
