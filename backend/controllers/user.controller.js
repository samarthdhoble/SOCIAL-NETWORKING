import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Profile from '../models/profile.model.js';


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