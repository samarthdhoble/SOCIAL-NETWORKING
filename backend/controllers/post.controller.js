import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import Profile from '../models/profile.model.js';
import Post from '../models/posts.model.js';

export const activeCheck = async (req , res) => {
  return res.status(200).json({message : "Server is running smoothly!"});
}



export const createPost = async (req, res) => {

  const { token } = req.body;

  try {
    const user = await User.findOne({token : token})

    if (!user) {
      return res.status(404).json({message : 'User not found!'});
    }

    const post = new Post({
      userId : user._id,
      body : req.body.body,
      media : req.file ? req.file.path : '',
      fileType : req.file ? req.file.mimetype : ''
    });
     
    await post.save();

    return res.status(201).json({message : 'Post created successfully!', post});

  }
  catch(err) {
    return res.status(500).json({message : 'Internal Server Error', error : err.message});
  }

};

