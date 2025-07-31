import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import Profile from '../models/profile.model.js';

export const activeCheck = async (req , res) => {
  return res.status(200).json({message : "Server is running smoothly!"});
}
