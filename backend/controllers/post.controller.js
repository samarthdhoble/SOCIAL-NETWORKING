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


export const getAllPosts = async (req, res) => {

  try { 
    const posts = await Post.find().populate('userId', 'name username email profilePicture').sort({createdAt : -1});
    return res.status(200).json({posts});
  } catch(err) {
    return res.status(500).json({message : 'Internal Server Error', error : err.message});
  } 

};



export const deletePost = async (req, res) => {

  const { token , post_id } = req.body;

  try {
    const user = await User.findOne({token : token}).select('_id');


    if (!user) {
      return res.status(404).json({message : 'User not found!'});
    } 

    const post = await Post.findOne({_id : post_id});

    if (!post) {
      return res.status(404).json({message : 'Post not found!'});
    }

    if (post.userId.toString() !== user._id.toString()) {
      return res.status(403).json({message : 'You are not authorized to delete this post!'});
    }

    await Post.deleteOne({_id : post_id});

    return res.status(200).json({message : 'Post deleted successfully!'});

  }
  catch(err) {
    return res.status(500).json({message : 'Internal Server Error', error : err.message});
  }
}


