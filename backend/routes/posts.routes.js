import { Router } from "express";
import { activeCheck, commentPost, createPost, delete_comment_of_user, deletePost, get_comments_by_post, getAllPosts, increment_likes } from '../controllers/post.controller.js';
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
router.route('/comment').post(commentPost);
router.route('/get_comments').post(get_comments_by_post);
router.route('/delete_comment').post(delete_comment_of_user);
router.route('/increment_post_like').post(increment_likes); // to be implemented


export default router;
