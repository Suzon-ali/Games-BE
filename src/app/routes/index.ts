import { Router } from 'express';
import { BetRoutes } from '../modules/dice/bet/bet.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/',
    route: BetRoutes,
  },
 
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;