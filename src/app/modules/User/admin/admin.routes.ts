import auth from '../../../miiddlewares/auth';
import { UserControllers } from '../user.controller';
import express from 'express';

const router = express.Router();

router.get('/getAllUsers', auth('admin'), UserControllers.getAllUsers);
router.get('/getUserById/:userId', auth('admin'), UserControllers.getUserById);
router.put('/addCashbackToUser', auth('admin'), UserControllers.addCashback);

export const AdminRoutes = router;
