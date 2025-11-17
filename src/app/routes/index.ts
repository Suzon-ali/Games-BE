import { Router } from 'express';
import { BetRoutes } from '../modules/dice/bet/bet.routes';
import { UserRoutes } from '../modules/User/user.route';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { ChatRoutes } from '../modules/Chat/chat.route';
import { AdminRoutes } from '../modules/User/admin/admin.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/',
    route: BetRoutes,
  },
  {
    path: '/auth',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/chat',
    route: ChatRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
