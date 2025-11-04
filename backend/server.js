import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import postRoutes from './routes/posts.routes.js';
import userRoutes from './routes/user.routes.js';



dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('uploads')); 


app.use(cors());


const start = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGO_ATLAS_URL);

    console.log('✅ Connected to MongoDB Atlas (Cirqle DB)');

    app.listen(9080, () => {
      console.log('🚀 Server is running on port 9080');
    });
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
  }
};


app.use(userRoutes);
app.use(postRoutes)

start();



