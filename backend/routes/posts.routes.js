import { Router } from "express";
import { activeCheck, createPost } from '../controllers/post.controller.js';
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
export default router;
