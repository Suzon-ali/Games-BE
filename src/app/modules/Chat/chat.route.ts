import express from 'express';
import auth from '../../miiddlewares/auth';
import validateRequest from '../../miiddlewares/validateRequest';
import { ChatValidationSchemas } from './chat.validation';
import { ChatControllers } from './chat.controller';

const router = express.Router();

router.post(
  '/create-chat',
  auth('user'),
  validateRequest(ChatValidationSchemas.chatValidationSchema),
  ChatControllers.createChatMessage,
);
router.get('/getAllChats', ChatControllers.getAllChats)

export const ChatRoutes = router;
