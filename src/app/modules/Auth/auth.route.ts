import express from 'express';

import validateRequest from '../../miiddlewares/validateRequest';
import { AuthValidationSchemas } from './auth.validation';
import { AuthContollers } from './auth.controller';

const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidationSchemas.loginValidationSchema),
  AuthContollers.loginUser,
);

router.post(
  '/refresh-token',
  //validateRequest(AuthValidationSchemas.refreshTokenValidationSchema),
  AuthContollers.refreshToken,
);

router.post(
  '/forget-password',
  validateRequest(AuthValidationSchemas.forgetPasswordValidationSchema),
  AuthContollers.forgetPassword,
);

router.post(
  '/reset-password',
  validateRequest(AuthValidationSchemas.resetPasswordValidationSchema),
  AuthContollers.resetPassword,
);

export const AuthRoutes = router;
