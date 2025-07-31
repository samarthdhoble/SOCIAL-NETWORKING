import { Router } from "express";
import { activeCheck } from '../controllers/post.controller.js';
import { register , login } from '../controllers/user.controller.js';


const router = Router();


router.route('/register').post(register);
router.route('/login').post(login);
 
export default router;
