import express from 'express';

import validateRequest from '../../miiddlewares/validateRequest';
import { UserValidationSchemas } from './user.validation';
import { UserControllers } from './user.controller';
import auth from '../../miiddlewares/auth';

const router = express.Router();

router.post(
  '/register',
  validateRequest(UserValidationSchemas.UserCreateSchema),
  UserControllers.createUser,
);
router.get('/mybalance', auth('user'), UserControllers.getMyBalance);
router.post('/logout', auth('user'), UserControllers.logOut);
router.post('/getUserBetStats', UserControllers.getUserBetStats)

export const UserRoutes = router;
