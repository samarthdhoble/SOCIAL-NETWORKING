import { Router } from "express";
import { activeCheck } from '../controllers/post.controller.js';
import { register , login , uploadProfilePicture , updateUserProfile , getUserAndProfile , updateProfileData , getAllUserProfile, downloadProfile} from '../controllers/user.controller.js';
import multer from 'multer';

const router = Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


const upload = multer({ storage: storage });


router.route('/update_profile_picture')
.post(upload.single('profilePicture') , uploadProfilePicture);

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/user_update').post(updateUserProfile);
router.route('/get_user_and_profile').get(getUserAndProfile);
router.route('/update_profile_data').post(updateProfileData);
router.route('/user/all_user_profiles').get(getAllUserProfile);
router.route('/user/download_resume').get(downloadProfile);
router.route('/send_connection_request')
export default router;