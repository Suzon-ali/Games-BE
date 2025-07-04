import { Router } from 'express';
import { BetControllers } from './bet.controller';
import { BetValidationSchemas } from './bet.validation';
import validateRequest from '../../../miiddlewares/validateRequest';
import { getNextSeedHash } from '../fairness/seed.controller';

const router = Router();

router.post(
  '/bets',
  validateRequest(BetValidationSchemas.betValidationSchema),
  BetControllers.handleBet,
);

router.get('/next-seed', getNextSeedHash);
router.get('/bets', BetControllers.getAllBets);
router.post('/verify', BetControllers.verifyBet)


export const BetRoutes = router;
