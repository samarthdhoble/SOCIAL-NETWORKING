import { Router } from "express";
import { activeCheck, createPost, deletePost, getAllPosts } from '../controllers/post.controller.js';
import multer from 'multer';

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


const upload = multer({ storage: storage });



router.route('/').get(activeCheck);
router.route('/createpost').post(upload.single('media'), createPost);
router.route('/allposts').get(getAllPosts);
router.route('/delete_post').delete(deletePost);
export default router;
